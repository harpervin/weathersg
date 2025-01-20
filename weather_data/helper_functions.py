import json
import os
from calendar import monthrange
from collections import defaultdict
from datetime import datetime, timedelta

import matplotlib.pyplot as plt
import requests


def convert_to_datetime(aggregated_data):
    return {
        datetime.strptime(ts, "%Y-%m-%d %H:%M"): data
        for ts, data in aggregated_data.items()
    }

# Function to import dictionaries from the JSON file
def import_dictionaries(file_path="sg_districts_and_colors.json"):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["district_map"], data["zone_color_map"]


# Import the dictionaries
district_map, zone_color_map = import_dictionaries()


def createStationsJsonFromResponse(data_type, date, output_file):
    """
    Fetch station data from the API and save it to a JSON file.

    Args:
        data_type (str): The type of data to fetch (e.g., "rainfall", "wind-speed").
        date (str): The date for which to fetch data (YYYY-MM-DD).
        output_file (str): The output JSON file name.

    Returns:
        str: File name of the saved JSON containing station information, or error message if failed.
    """
    url = f"https://api-open.data.gov.sg/v2/real-time/api/{data_type}?date={date}"

    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()

        # Validate response and ensure station data is present
        if "data" not in data or not data["data"] or "stations" not in data["data"]:
            print("No station data found in the response.")
            return None

        # Extract station information
        stations = data["data"]["stations"]

        # Save stations to the output file
        with open(output_file, "w") as json_file:
            json.dump(stations, json_file, indent=4)
        print(f"Station data saved to {output_file}.")
        return output_file

    except requests.exceptions.RequestException as e:
        print(f"Error fetching station data: {e}")
        return None
    except json.JSONDecodeError:
        print("Error decoding JSON response.")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None


def getDataTypeFromDate(data_type, date):
    """
    Fetch data from API.

    Args:
        data_type (str): The type of data to fetch (e.g. "rainfall", "wind-speed").
        date (str): The date for which to fetch data (YYYY-MM-DD).

    Returns:
        dict: A dictionary containing stations metadata and hourly aggregated readings.
    """

    url = f"https://api-open.data.gov.sg/v2/real-time/api/{data_type}?date={date}"
    all_readings = []
    all_stations = []
    pagination_token = None
    complete_data = True
    partial_data_dates = []

    while True:
        # Make the request with paginationToken if it exists
        params = {"paginationToken": pagination_token} if pagination_token else {}
        response = requests.get(url, params=params)
        data = response.json()

        if data.get("data") is None:
            return None
        # Check if 1st page does not contain a pagination token - means missing data
        if not pagination_token and not data["data"].get("paginationToken"):
            complete_data = False
            partial_data_dates.append(date)

        # Collect readings from the current response
        all_stations.extend(data["data"]["stations"])
        all_readings.extend(data["data"]["readings"])
        readingUnit = data["data"]["readingUnit"]

        # Check if there's a next page
        pagination_token = data["data"].get("paginationToken")
        if not pagination_token:
            break

    return {
        "stations": all_stations,
        "readings": all_readings,
        "complete_data": complete_data,
        "partial_data_dates": partial_data_dates,
        "readingUnit": readingUnit,
    }


def getDataFromStorage(output_file):
    # Load existing data if the file exists
    if os.path.exists(output_file):
        with open(output_file, "r") as file:
            all_data = json.load(file)
    else:
        all_data = {}
    return all_data


# Fetches Total weather data for a specific date - at 1 hour intervals


def getTotalDataHourly(data_type, date):
    """
    Fetch windspeed data and aggregate within each hour.

    Args:
        data_type (str): The type of data to fetch (e.g. "rainfall", "wind-speed").
        date (str): The date for which to fetch windspeed data (YYYY-MM-DD).

    Returns:
        dict: A dictionary containing stations metadata and hourly aggregated readings.
    """

    url = f"https://api-open.data.gov.sg/v2/real-time/api/{data_type}?date={date}"
    all_readings = []
    pagination_token = None

    while True:
        # Make the request with paginationToken if it exists
        params = {"paginationToken": pagination_token} if pagination_token else {}
        response = requests.get(url, params=params)
        data = response.json()

        # Collect readings from the current response
        all_readings.extend(data["data"]["readings"])

        # Check if there's a next page
        pagination_token = data["data"].get("paginationToken")
        if not pagination_token:
            break

    # Group readings by hour and station
    # Use float for direct summing
    hourly_data = defaultdict(lambda: defaultdict(float))

    for entry in all_readings:
        timestamp = entry["timestamp"]
        hour = datetime.strptime(timestamp.split("+")[0], "%Y-%m-%dT%H:%M:%S").strftime(
            "%Y-%m-%d %H:00"
        )

        for data_point in entry["data"]:
            station_id = data_point["stationId"]
            value = data_point["value"]
            # Add value directly to the hourly total for the station
            hourly_data[hour][station_id] += value

    # Summarize the hourly data
    formatted_readings = []
    for hour, stations in sorted(hourly_data.items()):
        aggregated_data = []
        for station_id, total_value in stations.items():
            aggregated_data.append({"stationId": station_id, "value": total_value})

        formatted_readings.append({"timestamp": hour, "data": aggregated_data})

    # Return the structured data with hourly aggregation
    return {
        "stations": data["data"]["stations"],
        "readings": formatted_readings,
        "readingUnit": data["data"]["readingUnit"],
    }


# Fetches Average weather data for a specific date - at 1 hour intervals


def getAverageDataHourly(data_type, date):
    """
    Fetch weather data and calculate hourly averages.

    Args:
        data_type (str): The type of data to fetch (e.g. "rainfall", "wind-speed").
        date (str): The date for which to fetch weather data (YYYY-MM-DD).

    Returns:
        dict: A dictionary containing stations metadata and hourly aggregated readings.
    """

    url = f"https://api-open.data.gov.sg/v2/real-time/api/{data_type}?date={date}"
    all_readings = []
    pagination_token = None

    while True:
        # Make the request with paginationToken if it exists
        params = {"paginationToken": pagination_token} if pagination_token else {}
        response = requests.get(url, params=params)
        data = response.json()

        # Collect readings from the current response
        all_readings.extend(data["data"]["readings"])

        # Check if there's a next page
        pagination_token = data["data"].get("paginationToken")
        if not pagination_token:
            break

    # Group readings by hour and station
    hourly_data = defaultdict(lambda: defaultdict(lambda: [0, 0]))  # [sum, count]

    for entry in all_readings:
        timestamp = entry["timestamp"]
        hour = datetime.strptime(timestamp.split("+")[0], "%Y-%m-%dT%H:%M:%S").strftime(
            "%Y-%m-%d %H:00"
        )

        for data_point in entry["data"]:
            station_id = data_point["stationId"]
            value = data_point["value"]
            # Add value and increment count for the hourly total at the station
            hourly_data[hour][station_id][0] += value  # Sum
            hourly_data[hour][station_id][1] += 1  # Count

    # Calculate averages and format the hourly data
    formatted_readings = []
    for hour, stations in sorted(hourly_data.items()):
        aggregated_data = []
        for station_id, (total_value, count) in stations.items():
            average_value = total_value / count if count > 0 else 0
            aggregated_data.append({"stationId": station_id, "value": average_value})

        formatted_readings.append({"timestamp": hour, "data": aggregated_data})

    # Return the structured data with hourly averages
    return {
        "stations": data["data"]["stations"],
        "readings": formatted_readings,
        "readingUnit": data["data"]["readingUnit"],
    }


def formatTotalHourlyDataByRegion(hourly_data, district_map):
    """
    Map station IDs to regions and calculate hourly total windspeeds by region.

    Args:
        hourly_data (dict): The output from `getAllWindSpeedDataHourly`.
        district_map (dict): Mapping of regions to station names.

    Returns:
        dict: A dictionary with timestamps as keys and total windspeed by region.
    """

    # Create a mapping from station_id to region using district_map and station metadata
    station_to_region = {}
    for region, station_names in district_map.items():
        for station in hourly_data["stations"]:
            if station["name"] in station_names:
                station_to_region[station["id"]] = region

    # Aggregate data by hour and region
    # {hour: {region: total_windspeed}}
    hourly_region_totals = defaultdict(lambda: defaultdict(float))

    for reading in hourly_data["readings"]:
        timestamp = reading["timestamp"]
        for data_point in reading["data"]:
            station_id = data_point["stationId"]
            value = data_point["value"]
            region = station_to_region.get(station_id, "Unknown")
            hourly_region_totals[timestamp][region] += value

    # Convert defaultdict to a regular dictionary for better readability
    return {
        timestamp: dict(region_totals)
        for timestamp, region_totals in hourly_region_totals.items()
    }


def formatAverageHourlyDataByRegion(hourly_data, district_map):
    """
    Map station IDs to regions and calculate hourly average values by region.

    Args:
        hourly_data (dict): The output from `getAllDataHourly`.
        district_map (dict): Mapping of regions to station names.

    Returns:
        dict: A dictionary with timestamps as keys and average values by region.
    """

    # Create a mapping from station_id to region using district_map and station metadata
    station_to_region = {}
    for region, station_names in district_map.items():
        for station in hourly_data["stations"]:
            if station["name"] in station_names:
                station_to_region[station["id"]] = region

    # Aggregate data by hour and region
    # {hour: {region: [sum, count]}}
    hourly_region_totals = defaultdict(lambda: defaultdict(lambda: [0, 0]))

    for reading in hourly_data["readings"]:
        timestamp = reading["timestamp"]
        for data_point in reading["data"]:
            station_id = data_point["stationId"]
            value = data_point["value"]
            region = station_to_region.get(station_id, "Unknown")
            hourly_region_totals[timestamp][region][0] += value
            hourly_region_totals[timestamp][region][1] += 1

    # Calculate averages and convert defaultdict to a regular dictionary
    return {
        timestamp: {region: (total / count if count > 0 else 0)
                    for region, (total, count) in region_totals.items()}
        for timestamp, region_totals in hourly_region_totals.items()
    }



def merge_json_remove_duplicates(file1, file2, output_file, unique_key="id"):
    """
    Merge two JSON files, remove duplicates based on a unique key, and save the result.

    Args:
        file1 (str): Path to the first JSON file.
        file2 (str): Path to the second JSON file.
        output_file (str): Path to save the merged JSON file.
        unique_key (str): The key used to identify unique entries.

    Returns:
        None
    """
    # Load JSON data
    with open(file1, "r") as f1, open(file2, "r") as f2:
        json1 = json.load(f1)  # Load as list
        json2 = json.load(f2)  # Load as list

    # Create a dictionary to track unique entries
    unique_entries = {entry[unique_key]: entry for entry in json1}

    # Merge the second JSON file
    for entry in json2:
        unique_entries[entry[unique_key]] = entry

    # Convert back to a list
    merged_data = list(unique_entries.values())

    # Save to the output file
    with open(output_file, "w") as output:
        json.dump(merged_data, output, indent=4)

    print(f"Merged JSON saved to {output_file}")


def sumValuesForEveryStation(weather_data, output_dict):
    readings = weather_data["readings"]
    # get total rainfall on that day
    for entry in readings:
        all_station_readings = entry["data"]
        for station in all_station_readings:
            station_id = station["stationId"]
            station_value = station["value"]
            output_dict[station_id][1] += station_value
    return output_dict


def sumValuesForEveryEntry(weather_data: dict, output_dict: dict):
    readings = weather_data["readings"]
    for entry in readings:
        timestamp = entry["timestamp"]
        all_station_readings = entry["data"]
        for station in all_station_readings:
            output_dict[timestamp] += station["value"]
    return output_dict


def getAverageValuesForEveryStation(weather_data: dict, output_dict: dict):
    readings = weather_data["readings"]
    station_counts = {station_id: 0 for station_id in output_dict.keys()}

    # Get average humidity on that day
    for entry in readings:
        all_station_readings = entry["data"]
        for station in all_station_readings:
            station_id = station["stationId"]
            station_value = station["value"]
            if station_id in output_dict:
                output_dict[station_id][1] += station_value
                station_counts[station_id] += 1

    # Calculate average humidity per station
    for station_id, total in output_dict.items():
        count = station_counts[station_id]
        if count > 0:
            output_dict[station_id][1] = total[1] / count

    return output_dict


def getAverageValuesForEveryTimestamp(weather_data: dict, output_dict: dict):

    readings = weather_data["readings"]

    # Get average humidity on that day
    for entry in readings:
        timestamp = entry["timestamp"]
        all_station_readings = entry["data"]
        station_count = len(all_station_readings)
        total_humidity = 0
        for station in all_station_readings:

            total_humidity += station["value"]
        output_dict[timestamp] = total_humidity / station_count

    return output_dict


def createOutputDict(station_json_path: str, weather_data: dict):
    """
    Merge station data from JSON and rainfall data to create an output dictionary.

    Args:
        station_json_path (str): Path to the station JSON file.
        rainfall_data (dict): Rainfall data containing station IDs and readings.

    Returns:
        dict: Dictionary with station IDs as keys and a list of [station name, total rainfall] as values.
    """
    output_dict = {}
    if station_json_path and os.path.exists(station_json_path):
        # Load the station JSON data
        with open(station_json_path, "r") as file:
            station_data = json.load(file)

        # Initialize the output dictionary with data from the station JSON
        output_dict = {station["id"]: [station["name"], 0] for station in station_data}

    # Extend the output dictionary with stations from rainfall data if not already present
    for station in weather_data["stations"]:
        station_id = station["id"]
        if station_id not in output_dict:
            output_dict[station_id] = [station["name"], 0]

    return output_dict


def cleanupStationNames(stations_list: list, output_dict: dict):
    # Prepare lists for locations and rainfall values
    locations = []
    rainfall_values = []

    for reading in output_dict.values():

        if reading[0][0] == "S" and reading[0][1].isdigit():
            flag = 0
            for station_object in stations_list:
                if station_object["id"] == reading[0]:
                    flag = 1
                    locations.append(station_object["name"])
                    break
            if flag == 0:
                continue
        else:
            locations.append(reading[0])
        rainfall_values.append(reading[1])
    return locations, rainfall_values


def plot_weather_hourly(title: str, measurement: str, date: str, hourly_data: dict):
    import matplotlib.dates as mdates

    timestamps = sorted(hourly_data.keys())
    rainfall_values = [hourly_data[ts] for ts in timestamps]

    plt.figure(figsize=(12, 6))
    plt.plot(
        timestamps,
        rainfall_values,
        label=f"{title} ({measurement})",
        marker="x",
        color="blue",
    )
    plt.title(f"{title} ({measurement}) in Singapore - {date}")
    plt.xlabel("Time")
    plt.ylabel(f"{measurement}")
    plt.legend()
    plt.grid(True)

    # Get the current axes
    ax = plt.gca()

    # Set a custom date format on the x-axis
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M:%S"))

    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()


def convert_to_datetime(aggregated_data):
    return {
        datetime.strptime(ts, "%Y-%m-%d %H:%M"): data
        for ts, data in aggregated_data.items()
    }


# def fetch_weekly_weather(start_date: str, storage_json_path: str, station_json_path: str, weather_type: str, data_format: str):
#     """
#     Fetch and aggregate total weather for one week.

#     Args:
#         start_date (str): Start date in YYYY-MM-DD format (Monday).

#     Returns:
#         dict: A dictionary containing daily total weather.
#     """
#     weekly_weather = {}
#     for i in range(7):  # Loop for 7 days (Monday to Sunday)
#         date = (datetime.strptime(start_date, "%Y-%m-%d") +
#                 timedelta(days=i)).strftime("%Y-%m-%d")
#         print(f"Fetching data for {date}...")
#         storage_data = getDataFromStorage(storage_json_path)

#         readingUnit = storage_data["readingUnit"]

#         if date in storage_data:
#             print(f"Data for {date} already exists. Skipping...")
#             total_weather = storage_data[date]

#         elif data_format == "total":
#             weather_data = getDataTypeFromDate(weather_type, date)

#             output_dict = sumValuesForEveryStation(
#                 weather_data, createOutputDict(station_json_path, weather_data))

#             # Aggregate total weather for the day
#             total_weather = sum([data[1] for data in output_dict.values()])
#             storage_data[date] = total_weather

#         elif data_format == "average":
#             weather_data = getDataTypeFromDate(weather_type, date)

#             output_dict = getAverageValuesForEveryStation(
#                 weather_data, createOutputDict("temperature_stations.json", weather_data))

#             # Calculate average temperature for the day
#             total_weather = sum([data[1] for data in output_dict.values()])
#             num_stations = len(output_dict)
#             average_weather = total_weather / num_stations if num_stations > 0 else 0

#             storage_data[date] = average_weather

#         # Save the updated data to the JSON file
#         with open(storage_json_path, 'w') as file:
#             json.dump(storage_data, file, indent=4)

#         weekly_weather[date] = total_weather
#     return weekly_weather, readingUnit


def fetch_weekly_weather(
    start_date: str,
    storage_json_path: str,
    station_json_path: str,
    weather_type: str,
    data_format: str,
):
    """
    Fetch and aggregate weather data for one week.

    Args:
        start_date (str): Start date in YYYY-MM-DD format (Monday).
        storage_json_path (str): Path to the storage JSON file.
        station_json_path (str): Path to the station JSON file.
        weather_type (str): Type of weather data (e.g., "rainfall", "temperature").
        data_format (str): Data format, either "total" or "average".

    Returns:
        tuple: A dictionary containing daily weather data and the reading unit.
    """
    # Initialize weekly weather storage
    weekly_weather = {}

    # Load storage data if it exists
    try:
        with open(storage_json_path, "r") as file:
            storage_data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        storage_data = {}

    # Extract reading unit if available
    readingUnit = storage_data.get("readingUnit", "N/A")

    # Process data for each day in the week
    for i in range(7):  # Loop for 7 days (Monday to Sunday)
        date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=i)).strftime(
            "%Y-%m-%d"
        )
        print(f"Fetching data for {date}...")

        # Use cached data if available
        if date in storage_data:
            print(f"Data for {date} already exists. Skipping...")
            weekly_weather[date] = storage_data[date]
            continue

        # Fetch new data if not cached
        weather_data = getDataTypeFromDate(weather_type, date)

        if data_format == "total":
            output_dict = sumValuesForEveryStation(
                weather_data, createOutputDict(station_json_path, weather_data)
            )
            total_weather = sum([data[1] for data in output_dict.values()])
            storage_data[date] = total_weather
            weekly_weather[date] = total_weather

        elif data_format == "average":
            output_dict = getAverageValuesForEveryStation(
                weather_data, createOutputDict(station_json_path, weather_data)
            )
            total_weather = sum([data[1] for data in output_dict.values()])
            num_stations = len(output_dict)
            average_weather = total_weather / num_stations if num_stations > 0 else 0
            storage_data[date] = average_weather
            weekly_weather[date] = average_weather

        # Update the storage data file
        with open(storage_json_path, "w") as file:
            json.dump(storage_data, file, indent=4)

    return weekly_weather, readingUnit


def plot_weekly_weather(title: str, readingUnit: str, date: str, weather_data: dict):
    # Prepare data for plotting
    days = list(weather_data.keys())
    total_weather = list(weather_data.values())

    # Plot the bar chart for weekly weather
    plt.figure(figsize=(10, 6))
    bars = plt.bar(days, total_weather, color="skyblue")

    # Add labels and title
    plt.xlabel("Date")
    plt.ylabel(readingUnit)
    plt.title(f"{title} from {days[0]} to {days[-1]}")

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha="right")

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add weather values on top of the bars
    for bar, value in zip(bars, total_weather):
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height(),
            f"{value:.1f}",
            ha="center",
            va="bottom",
        )

    # Show the plot
    plt.show()


def store_daily_weather(year, month, output_file, weather_type: str, data_format: str, station_json_path: str):
    """
    Fetch and store average relative weather for each day in a month in a JSON file.

    Args:
        year (int): Year of the data.
        month (int): Month of the data (1-12).
        output_file (str): Path to the JSON file where data will be stored.

    Returns:
        dict: A dictionary containing daily average weather for the month.
    """

    # Get the number of days in the month
    num_days = monthrange(year, month)[1]
    # Load existing data if the file exists
    if os.path.exists(output_file):
        with open(output_file, "r") as file:
            all_data = json.load(file)
    else:
        all_data = {}

    monthly_weather = {}
    for day in range(1, num_days + 1):
        date = f"{year}-{month:02d}-{day:02d}"
        print(f"Fetching data for {date}...")

        if date in all_data:
            print(f"Data for {date} already exists. Skipping...")
            monthly_weather[date] = all_data[date]
            continue
        elif data_format == "average":
            # Fetch weather data for the date
            weather_data = getDataTypeFromDate(weather_type, date)
            if weather_data is None:
                print(f"No data available for {date}.")
                continue

            output_dict = getAverageValuesForEveryStation(
                weather_data, createOutputDict(station_json_path, weather_data)
            )

            # Aggregate average weather for the day
            total_weather = sum([data[1] for data in output_dict.values()])
            num_stations = len(output_dict)
            average_weather = total_weather / num_stations if num_stations > 0 else 0
            monthly_weather[date] = average_weather
            all_data[date] = average_weather

        elif data_format == "total":
            # Fetch rainfall data for the date
            weather_data = getDataTypeFromDate(weather_type, date)
            if weather_data is None:
                print(f"No data available for {date}.")
                continue
            output_dict = sumValuesForEveryStation(
                weather_data, createOutputDict(station_json_path, weather_data)
            )

            # Aggregate total rainfall for the day
            total_weather = sum([data[1] for data in output_dict.values()])
            monthly_weather[date] = total_weather
            all_data[date] = total_weather

        # Save the updated data to the JSON file
        with open(output_file, "w") as file:
            json.dump(all_data, file, indent=4)

    return monthly_weather


# ----------------------------
# Cache Read/Write Helpers
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


def get_or_load_daily_total_data(date_str, cache, cache_filename, weather_type: str):
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
    weather_data = getDataTypeFromDate(weather_type, date_str)
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
    for entry in readings:
        for station_reading in entry.get("data", []):
            station_id = station_reading["stationId"]
            station_val = station_reading["value"]
            daily_dict[station_id] = daily_dict.get(station_id, 0.0) + station_val

    # Store in cache
    cache[date_str] = daily_dict
    save_daily_cache(cache, cache_filename)
    return daily_dict

# ----------------------------
# 3) Get or Load Daily Data
# ----------------------------

def get_or_load_daily_average_data(date_str, cache, cache_filename, data_type):
    if date_str in cache:
        print(f"[CACHE-HIT] Daily data for {date_str}")
        return cache[date_str]

    print(f"[CACHE-MISS] Fetching daily data for {date_str} from API...")
    weather_data = getDataTypeFromDate(data_type, date_str)
    if not weather_data or "readings" not in weather_data:
        cache[date_str] = {}
        save_daily_cache(cache, cache_filename)
        return {}

    daily_dict = {}
    station_counts = {}
    readings = weather_data.get("readings", [])
    for entry in readings:
        for station_reading in entry.get("data", []):
            station_id = station_reading["stationId"]
            station_val = station_reading["value"]
            if station_id not in daily_dict:
                daily_dict[station_id] = 0.0
                station_counts[station_id] = 0
            daily_dict[station_id] += station_val
            station_counts[station_id] += 1

    # Calculate daily averages for each station
    for station_id in daily_dict:
        daily_dict[station_id] /= station_counts[station_id]

    cache[date_str] = daily_dict
    save_daily_cache(cache, cache_filename)
    return daily_dict