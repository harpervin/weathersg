import requests
import matplotlib.pyplot as plt
from helper_functions import getDataTypeFromDate, import_dictionaries, sumValuesForEveryStation, createOutputDict, cleanupStationNames
import json

'''
Helper Functions
'''


def getStationsJson():
    # Create the URL to get station list
    locations_url = f"https://api.data.gov.sg/v1/environment/rainfall"
    # Fetch locations list from the API
    locations_response = requests.get(locations_url)
    locations_list = locations_response.json()['metadata']['stations']
    return locations_list


def createOutputDict(station_json_path, rainfall_data):
    """
    Merge station data from JSON and rainfall data to create an output dictionary.

    Args:
        station_json_path (str): Path to the station JSON file.
        rainfall_data (dict): Rainfall data containing station IDs and readings.

    Returns:
        dict: Dictionary with station IDs as keys and a list of [station name, total rainfall] as values.
    """
    # Load the station JSON data
    with open(station_json_path, 'r') as file:
        station_data = json.load(file)

    # Initialize the output dictionary with data from the station JSON
    output_dict = {station['id']: [station['name'], 0] for station in station_data}

    # Extend the output dictionary with stations from rainfall data if not already present
    for station in rainfall_data['stations']:
        station_id = station['id']
        if station_id not in output_dict:
            output_dict[station_id] = [station['name'], 0]

    return output_dict


def updateRainfallDict(rainfall_data, output_dict):
    readings = rainfall_data['readings']
    # get total rainfall on that day
    for entry in readings:
        all_station_readings = entry['data']
        for station in all_station_readings:
            station_id = station['stationId']
            station_value = station['value']
            output_dict[station_id][1] += station_value
    return output_dict


def cleanupStationNames(output_dict):
    # Prepare lists for locations and rainfall values
    locations = []
    rainfall_values = []

    for reading in output_dict.values():

        if reading[0][0] == 'S' and reading[0][1].isdigit():
            flag = 0
            for station_object in getStationsJson():
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


def cleanupStationNamesWithTimestamps(output_dict):
    locations = []
    rainfall_values = []
    timestamps = []
    for station, data in output_dict.items():
        locations.append(data["location"])
        rainfall_values.append(data["value"])
        timestamps.append(data["timestamp"])
    return locations, rainfall_values, timestamps


if __name__ == '__main__':
    # Import district map and zone color map
    district_map, zone_color_map = import_dictionaries()

    # Run helper functions to get rainfall data and prepare for plotting
    date = '2022-11-28'  # Define the desired date in YYYY-MM-DD format

    rainfall_data = getDataTypeFromDate('rainfall', date)
    if rainfall_data is None:
        print("No data available for the specified date.")
        exit()
    if not rainfall_data["complete_data"]:
        print(f"Only partial data found on these dates - {rainfall_data['partial_data_dates']}")    
    
    output_dict = sumValuesForEveryStation(
        rainfall_data, createOutputDict("rainfall_stations.json", rainfall_data))
    locations, rainfall_values = cleanupStationNames(output_dict)

    '''
    Plotting Rainfall Data
    1. Unsorted Locations
    2. Sorted by Regions
    '''

    '''
    # Plot the bar chart with station names and predefined colors
    plt.figure(figsize=(12, 8))
    bars = plt.bar(locations, rainfall_values)

    # Add labels and title
    plt.xlabel('Locations')
    plt.ylabel('Rainfall (mm)')
    plt.title(f'Rainfall by location on {date}')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')
    # Adjust the layout to prevent label cut-off
    plt.tight_layout()

    # Set y-axis limits based on data range
    plt.gca().set_ylim(0, max(rainfall_values) + 10)

    # Add a legend with station names
    plt.legend(bars, locations, title="Stations",
               bbox_to_anchor=(1, 1), loc='upper left', prop={'size': 5.2})
    plt.subplots_adjust(right=0.85)  # Adjust this as needed (default is 1.0)
    '''

    
    # Prepare lists for zones, locations, and rainfall values
    zone_locations = []
    zone_rainfall = []
    zone_colors = []

    # Sort data by zones and organize for plotting
    for zone, district_locations in district_map.items():
        for location in district_locations:
            if location not in locations:
                continue  # Skip to the next location if not found in the list
            rainfall_index = locations.index(location)
            zone_locations.append(location)
            zone_rainfall.append(rainfall_values[rainfall_index])
            zone_colors.append(zone_color_map[zone])

    # Plot the bar chart sorted by zones with color coding
    plt.figure(figsize=(14, 7))
    bars = plt.bar(zone_locations, zone_rainfall, color=zone_colors)

    # Add labels and title
    plt.xlabel('Locations')
    plt.ylabel('Rainfall (mm)')
    plt.title(f'Rainfall by Location on {date}, Sorted by Zone')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Set y-axis limits based on data range
    plt.gca().set_ylim(0, max(zone_rainfall) + 10)

    # Add a legend for zones
    legend_elements = [plt.Line2D(
        [0], [0], color=zone_color_map[zone], lw=4, label=zone) for zone in district_map.keys()]
    plt.legend(handles=legend_elements, title="Zones",
               bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.subplots_adjust(right=0.8)  # Adjust this as needed (default is 1.0)

    # Show the plot
    plt.show()
    