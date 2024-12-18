import json
import requests
from datetime import datetime
from collections import defaultdict
import os
from calendar import monthrange


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
        with open(output_file, 'w') as json_file:
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

        if data["data"] is None:
            return None
        # Check if 1st page does not contain a pagination token - means missing data
        if not pagination_token and not data["data"].get("paginationToken"):
            complete_data = False
            partial_data_dates.append(date)

        # Collect readings from the current response
        all_stations.extend(data["data"]["stations"])
        all_readings.extend(data["data"]["readings"])

        # Check if there's a next page
        pagination_token = data["data"].get("paginationToken")
        if not pagination_token:
            break

    return {
        "stations": all_stations,
        "readings": all_readings,
        "complete_data": complete_data,
        "partial_data_dates": partial_data_dates
    }


def getDataFromStorage(output_file):
    # Load existing data if the file exists
    if os.path.exists(output_file):
        with open(output_file, 'r') as file:
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
        hour = datetime.strptime(timestamp.split(
            "+")[0], "%Y-%m-%dT%H:%M:%S").strftime("%Y-%m-%d %H:00")

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
            aggregated_data.append(
                {"stationId": station_id, "value": total_value})

        formatted_readings.append({
            "timestamp": hour,
            "data": aggregated_data
        })

    # Return the structured data with hourly aggregation
    return {
        "stations": data["data"]["stations"],
        "readings": formatted_readings
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
    hourly_data = defaultdict(
        lambda: defaultdict(lambda: [0, 0]))  # [sum, count]

    for entry in all_readings:
        timestamp = entry["timestamp"]
        hour = datetime.strptime(timestamp.split(
            "+")[0], "%Y-%m-%dT%H:%M:%S").strftime("%Y-%m-%d %H:00")

        for data_point in entry["data"]:
            station_id = data_point["stationId"]
            value = data_point["value"]
            # Add value and increment count for the hourly total at the station
            hourly_data[hour][station_id][0] += value  # Sum
            hourly_data[hour][station_id][1] += 1       # Count

    # Calculate averages and format the hourly data
    formatted_readings = []
    for hour, stations in sorted(hourly_data.items()):
        aggregated_data = []
        for station_id, (total_value, count) in stations.items():
            average_value = total_value / count if count > 0 else 0
            aggregated_data.append(
                {"stationId": station_id, "value": average_value})

        formatted_readings.append({
            "timestamp": hour,
            "data": aggregated_data
        })

    # Return the structured data with hourly averages
    return {
        "stations": data["data"]["stations"],
        "readings": formatted_readings
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
    return {timestamp: dict(region_totals) for timestamp, region_totals in hourly_region_totals.items()}


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
    with open(file1, 'r') as f1, open(file2, 'r') as f2:
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
    with open(output_file, 'w') as output:
        json.dump(merged_data, output, indent=4)

    print(f"Merged JSON saved to {output_file}")


def sumValuesForEveryStation(weather_data, output_dict):
    readings = weather_data['readings']
    # get total rainfall on that day
    for entry in readings:
        all_station_readings = entry['data']
        for station in all_station_readings:
            station_id = station['stationId']
            station_value = station['value']
            output_dict[station_id][1] += station_value
    return output_dict


def sumValuesForEveryEntry(weather_data: dict, output_dict: dict):
    readings = weather_data['readings']
    for entry in readings:
        timestamp = entry['timestamp']
        all_station_readings = entry['data']
        for station in all_station_readings:
            output_dict[timestamp] += station['value']
    return output_dict


def averageValuesInDict(weather_data: dict, output_dict: dict):
    readings = weather_data['readings']
    station_counts = {station_id: 0 for station_id in output_dict.keys()}

    # Get average humidity on that day
    for entry in readings:
        all_station_readings = entry['data']
        for station in all_station_readings:
            station_id = station['stationId']
            station_value = station['value']
            if station_id in output_dict:
                output_dict[station_id][1] += station_value
                station_counts[station_id] += 1

    # Calculate average humidity per station
    for station_id, total in output_dict.items():
        count = station_counts[station_id]
        if count > 0:
            output_dict[station_id][1] = total[1] / count

    return output_dict


def averageValueForEveryEntry(weather_data: dict, output_dict: dict):
    return


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
        with open(station_json_path, 'r') as file:
            station_data = json.load(file)

        # Initialize the output dictionary with data from the station JSON
        output_dict = {station['id']: [station['name'], 0]
                       for station in station_data}

    # Extend the output dictionary with stations from rainfall data if not already present
    for station in weather_data['stations']:
        station_id = station['id']
        if station_id not in output_dict:
            output_dict[station_id] = [station['name'], 0]

    return output_dict


def cleanupStationNames(stations_list: list, output_dict: dict):
    # Prepare lists for locations and rainfall values
    locations = []
    rainfall_values = []

    for reading in output_dict.values():

        if reading[0][0] == 'S' and reading[0][1].isdigit():
            flag = 0
            for station_object in stations_list:
                if station_object['id'] == reading[0]:
                    flag = 1
                    locations.append(station_object['name'])
                    break
            if flag == 0:
                continue
        else:
            locations.append(reading[0])
        rainfall_values.append(reading[1])
    return locations, rainfall_values
