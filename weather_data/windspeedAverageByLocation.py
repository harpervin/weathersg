import json
import os
from datetime import datetime, timedelta

import matplotlib.pyplot as plt

# ----------------------------
# 1) Import your helper funcs
# ----------------------------
from helper_functions import cleanupStationNames  # returns [locations],[rain_values]
from helper_functions import getDataTypeFromDate  # Already defined, uses pagination
from helper_functions import (
    createOutputDict,
    get_or_load_daily_average_data,
    import_dictionaries,
    load_daily_cache,
)

# ----------------------------
# 4) Main Logic Example
# ----------------------------
if __name__ == "__main__":
    district_map, zone_color_map = import_dictionaries()

    year = 2024
    start_date = datetime(year, 1, 1)
    end_date = datetime(year, 12, 31)
    day_delta = timedelta(days=1)

    data_type = "wind-speed"  # Change to "rainfall" or any other type dynamically
    daily_cache = load_daily_cache(f"daily_{data_type}_by_location_{year}.json")

    initial_data = getDataTypeFromDate(data_type, start_date.strftime("%Y-%m-%d"))
    if not initial_data:
        initial_data = {"stations": []}

    yearly_output_dict = createOutputDict(f"{data_type}_stations.json", initial_data)

    station_day_counts = {st_id: 0 for st_id in yearly_output_dict.keys()}

    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        daily_dict = get_or_load_daily_average_data(
            date_str,
            daily_cache,
            f"daily_{data_type}_by_location_{year}.json",
            data_type,
        )

        for st_id, day_avg in daily_dict.items():
            if st_id not in yearly_output_dict:
                yearly_output_dict[st_id] = [st_id, 0.0]
                station_day_counts[st_id] = 0
            yearly_output_dict[st_id][1] += day_avg
            station_day_counts[st_id] += 1

        current_date += day_delta

    for st_id, values in yearly_output_dict.items():
        total_value = values[1]
        count = station_day_counts.get(st_id, 0)
        values[1] = total_value / count if count > 0 else 0

    if os.path.exists(f"{data_type}_stations.json"):
        with open(f"{data_type}_stations.json", "r") as f:
            stations_list = json.load(f)
    else:
        stations_list = []

    locations, average_values = cleanupStationNames(stations_list, yearly_output_dict)

    location_to_avg_value = dict(zip(locations, average_values))

    zone_locations = []
    zone_avg_values = []
    zone_colors = []

    for zone_name, district_locations in district_map.items():
        for loc in district_locations:
            if loc not in location_to_avg_value:
                continue
            zone_locations.append(loc)
            zone_avg_values.append(location_to_avg_value[loc])
            zone_colors.append(zone_color_map.get(zone_name, "gray"))

    combined = list(zip(zone_locations, zone_avg_values, zone_colors))
    combined.sort(key=lambda x: x[1], reverse=True)
    zone_locations = [x[0] for x in combined]
    zone_avg_values = [x[1] for x in combined]
    zone_colors = [x[2] for x in combined]

    # Plot 1: Average wind speed per location
    plt.figure(figsize=(12, 6))
    bars = plt.bar(zone_locations, zone_avg_values, color=zone_colors)

    plt.xlabel("Locations")
    plt.ylabel(f"Average {data_type.capitalize()} (m/s)")
    plt.title(
        f"Average {data_type.capitalize()} from {start_date.date()} to {end_date.date()} (Sorted by Zone)"
    )

    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    if zone_avg_values:
        plt.ylim([0, max(zone_avg_values) + 1])

    legend_elements = [
        plt.Line2D([0], [0], color=zone_color_map[z], lw=4, label=z)
        for z in district_map.keys()
        if z in zone_color_map
    ]
    plt.legend(
        handles=legend_elements,
        title="Zones",
        bbox_to_anchor=(1.05, 1),
        loc="upper left",
    )
    plt.subplots_adjust(right=0.8)


    # Plot 2: Average wind speed per region
    region_averages = {}
    for zone_name, district_locations in district_map.items():
        total_wind_speed = 0.0
        count = 0
        for loc in district_locations:
            if loc in location_to_avg_value:
                total_wind_speed += location_to_avg_value[loc]
                count += 1
        region_averages[zone_name] = total_wind_speed / count if count > 0 else 0

    sorted_regions = sorted(region_averages.items(), key=lambda x: x[1], reverse=True)
    region_names = [x[0] for x in sorted_regions]
    region_avg_speeds = [x[1] for x in sorted_regions]
    region_colors = [zone_color_map.get(region, "gray") for region in region_names]

    plt.figure(figsize=(10, 6))
    plt.bar(region_names, region_avg_speeds, color=region_colors)

    plt.xlabel("Regions")
    plt.ylabel("Average Wind Speed (m/s)")
    plt.title(f"Average Wind Speed by Region\n({start_date.date()} to {end_date.date()})")

    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    # Add legend
    legend_elements = [
        plt.Line2D([0], [0], color=zone_color_map[z], lw=4, label=z)
        for z in region_names
        if z in zone_color_map
    ]
    if legend_elements:
        plt.legend(
            handles=legend_elements, title="Zones", bbox_to_anchor=(1.05, 1), loc="upper left"
        )
        plt.subplots_adjust(right=0.8)

    plt.show()
