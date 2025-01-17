import os
import json
import requests
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

# ----------------------------
# 1) Import your helper funcs
# ----------------------------
from helper_functions import (
    getDataTypeFromDate,       # Already defined, uses pagination
    sumValuesForEveryStation,  # Adds daily data into your rolling output dict
    # station_json + weather_data -> station_id:[name,0]
    createOutputDict,
    cleanupStationNames,        # returns [locations],[rain_values]
    import_dictionaries
)

# ----------------------------
# 2) Cache Read/Write Helpers
# ----------------------------


def load_daily_cache(cache_filename):
    """
    Loads the JSON file that stores daily data in the form:
    {
      "YYYY-MM-DD": {
        "station_id": <float_total_for_that_day>,
        ...
      },
      ...
    }
    Returns a dict, or empty if file not found.
    """
    if not os.path.exists(cache_filename):
        return {}
    with open(cache_filename, 'r') as f:
        return json.load(f)


def save_daily_cache(cache, cache_filename):
    """
    Saves 'cache' (a dict) to the specified JSON file.
    """
    with open(cache_filename, 'w') as f:
        json.dump(cache, f, indent=2)

# ----------------------------
# 3) Get or Load Daily Data
# ----------------------------


def get_or_load_daily_data(date_str, cache, cache_filename):
    """
    Returns a dict of { stationId: float_daily_value } for the given date_str.

    - Checks if date_str is already in the 'cache' (daily_rainfall_by_location_{year}.json).
    - If found, returns it directly (avoiding a new API call).
    - Otherwise, calls getDataTypeFromDate("rainfall", date_str), sums up that day's data,
      stores the result in the cache, writes to file, and returns it.
    - If no data from the API, store an empty dict for that date_str so we don't repeatedly call.
    """
    if date_str in cache:
        # Already cached -> no new API call
        print(f"[CACHE-HIT] Daily data for {date_str}")
        return cache[date_str]

    print(f"[CACHE-MISS] Fetching daily data for {date_str} from API...")
    # Call your existing helper function
    weather_data = getDataTypeFromDate("rainfall", date_str)
    if not weather_data or "stations" not in weather_data:
        # Store an empty dict to skip future calls for this date
        cache[date_str] = {}
        save_daily_cache(cache, cache_filename)
        return {}

    # We have a day's worth of data -> sum it by station
    # We'll replicate some logic of sumValuesForEveryStation, but for just a single day.
    # Or you can adapt your function directly. For clarity, let's do it inline:
    daily_dict = {}
    readings = weather_data.get("readings", [])
    for hour_entry in readings:
        for st_reading in hour_entry.get("data", []):
            st_id = st_reading["stationId"]
            st_val = st_reading["value"]
            daily_dict[st_id] = daily_dict.get(st_id, 0.0) + st_val

    # Store in cache
    cache[date_str] = daily_dict
    save_daily_cache(cache, cache_filename)
    return daily_dict


# ----------------------------
# 4) Main Logic Example
# ----------------------------
if __name__ == "__main__":
    district_map, zone_color_map = import_dictionaries()
    # 4.1) Pick your date range
    # Here we do a full year's example, but the same logic
    # works for 1 day, 1 month, etc. Just choose start/end dates accordingly.
    year = 2024
    start_date = datetime(year, 1, 1)
    end_date = datetime(year, 12, 31)
    day_delta = timedelta(days=1)

    # 4.2) Load or initialize our daily cache
    daily_cache = load_daily_cache(f"daily_rainfall_by_location_{year}.json")

    # 4.3) Create an overall "yearly" accumulation dict:
    #      station_id -> [station_name, total_rainfall_for_the_range]
    # We must seed it with some weather_data so createOutputDict has "stations" info.
    # Let's just pick the first day in the range (or skip if no data).
    initial_data = getDataTypeFromDate(
        "rainfall", start_date.strftime("%Y-%m-%d"))
    if not initial_data:
        initial_data = {"stations": []}  # fallback

    # This merges station data from "rainfall_stations.json" plus the first day's stations
    yearly_output_dict = createOutputDict(
        "rainfall_stations.json", initial_data)

    # 4.4) For each date in the range, get daily data from the cache or API
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        # Retrieve from cache or API
        daily_dict = get_or_load_daily_data(
            date_str, daily_cache, f"daily_rainfall_by_location_{year}.json")
        # daily_dict is { stationId: daily_rain_value }

        # Accumulate into yearly_output_dict
        for st_id, day_val in daily_dict.items():
            if st_id not in yearly_output_dict:
                # If it's not in the dict, add a default [station_id, 0]
                # or if you want to guess a name, that's up to you
                yearly_output_dict[st_id] = [st_id, 0.0]
            yearly_output_dict[st_id][1] += day_val

        current_date += day_delta

    # 4.5) Convert station codes to proper names, get parallel lists
    # We do NOT call your older station cleanup function that checks "S" + digit,
    # because we have "cleanupStationNames(stations_list, output_dict)" which uses:
    #   for reading in output_dict.values(): ...
    #   ...
    # But it requires a list of station objects => 'stations_list'
    # So let's retrieve that from "rainfall_stations.json" or from an API call
    if os.path.exists("rainfall_stations.json"):
        with open("rainfall_stations.json", "r") as f:
            # a list of dicts with "id" and "name"
            stations_list = json.load(f)
    else:
        # fallback if file not found
        stations_list = []

    # Now run your provided function:
    locations, rainfall_values = cleanupStationNames(
        stations_list, yearly_output_dict)

    # Convert to a dict for quick lookups: location -> rainfall
    location_to_rainfall = dict(zip(locations, rainfall_values))

    zone_locations = []
    zone_rainfall = []
    zone_colors = []

    # Go zone by zone, so the bar chart is grouped by zone
    for zone_name, district_locations in district_map.items():
        for loc in district_locations:
            # Only add if we actually have data for this location
            if loc not in location_to_rainfall:
                continue
            zone_locations.append(loc)
            zone_rainfall.append(location_to_rainfall[loc])
            zone_colors.append(zone_color_map.get(zone_name, "gray"))

    # (Optional) Sort bars by descending rainfall
    combined = list(zip(zone_locations, zone_rainfall, zone_colors))
    combined.sort(key=lambda x: x[1], reverse=True)
    zone_locations = [x[0] for x in combined]
    zone_rainfall = [x[1] for x in combined]
    zone_colors = [x[2] for x in combined]

    # ------------------------------------------------------------------
    # 6) Plot the final bar chart
    # ------------------------------------------------------------------
    plt.figure(figsize=(12, 6))
    bars = plt.bar(zone_locations, zone_rainfall, color=zone_colors)

    plt.xlabel("Locations")
    plt.ylabel("Total Rainfall (mm)")
    plt.title(
        f"Rainfall from {start_date.date()} to {end_date.date()} (Sorted by Zone)")

    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    if zone_rainfall:
        plt.ylim([0, max(zone_rainfall) + 10])

    # Create a legend for zones
    # (Only includes zones that exist in zone_color_map)
    legend_elements = [
        plt.Line2D([0], [0], color=zone_color_map[z], lw=4, label=z)
        for z in district_map.keys()
        if z in zone_color_map
    ]
    plt.legend(handles=legend_elements, title="Zones",
               bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.subplots_adjust(right=0.8)

    # Sum for each zone
    zone_sums = {}
    for zone_name, district_locations in district_map.items():
        total_for_zone = 0.0
        for loc in district_locations:
            if loc in location_to_rainfall:
                total_for_zone += location_to_rainfall[loc]
        zone_sums[zone_name] = total_for_zone

    # Sort zones by descending sum
    sorted_zones = sorted(zone_sums.items(), key=lambda x: x[1], reverse=True)
    zone_names = [x[0] for x in sorted_zones]
    zone_values = [x[1] for x in sorted_zones]
    zone_bar_colors = [zone_color_map.get(z, "gray") for z in zone_names]

    # Plot
    plt.figure(figsize=(8, 5))
    plt.bar(zone_names, zone_values, color=zone_bar_colors)

    plt.xlabel("Regions")
    plt.ylabel("Total Rainfall (mm)")
    plt.title(
        f"Total Rainfall by Region\n({start_date.date()} to {end_date.date()})")

    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    if zone_values:
        plt.ylim([0, max(zone_values) + 10])

    # Optional: region-based legend (though each bar is unique anyway)
    # Could just show each region's color:
    legend_elements = [
        plt.Line2D([0], [0], color=zone_color_map[z], lw=4, label=z)
        for z in zone_names
        if z in zone_color_map
    ]
    if legend_elements:
        plt.legend(handles=legend_elements, title="Zones",
                   bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.subplots_adjust(right=0.8)

    plt.show()

    # Done! If you re-run, it uses the daily cache and
    # shows a color-coded bar chart sorted by total rainfall.
