import requests
import matplotlib.pyplot as plt
from helper_functions import getDataTypeFromDate, import_dictionaries, getAverageValuesForEveryStation, createOutputDict, cleanupStationNames
import json

'''
Helper Functions
'''

def plotAverageHumidityByDate(locations, humidity_values, district_map, zone_color_map):
    
    # Plotting Humidity Data
    # 1. Sorted by Zones


    # Prepare lists for zones, locations, and humidity values
    zone_locations = []
    zone_humidity = []
    zone_colors = []

    # Sort data by zones and organize for plotting
    for zone, district_locations in district_map.items():
        for location in district_locations:
            if location not in locations:
                continue  # Skip to the next location if not found in the list
            humidity_index = locations.index(location)
            zone_locations.append(location)
            zone_humidity.append(humidity_values[humidity_index])
            zone_colors.append(zone_color_map[zone])

    # Plot the bar chart sorted by zones with color coding
    plt.figure(figsize=(14, 7))
    bars = plt.bar(zone_locations, zone_humidity, color=zone_colors)

    # Add labels and title
    plt.xlabel('Locations')
    plt.ylabel('Average Relative Humidity (%)')
    plt.title(f'Average Relative Humidity by Location on {date}, Sorted by Zone')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Set y-axis limits based on data range
    plt.gca().set_ylim(0, max(zone_humidity) + 10)

    # Add a legend for zones
    legend_elements = [plt.Line2D(
        [0], [0], color=zone_color_map[zone], lw=4, label=zone) for zone in district_map.keys()]
    plt.legend(handles=legend_elements, title="Zones",
               bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.subplots_adjust(right=0.8)  # Adjust this as needed (default is 1.0)

    # Show the plot
    plt.show()

if __name__ == '__main__':
    # Import district map and zone color map
    district_map, zone_color_map = import_dictionaries()

    # Run helper functions to get humidity data and prepare for plotting
    date = '2023-11-29'  # Define the desired date in YYYY-MM-DD format
    humidity_data = getDataTypeFromDate('relative-humidity', date)

    if humidity_data is None:
        print("No data available for the specified date.")
        exit()
    if not humidity_data["complete_data"]:
        print(f"Only partial data found on these dates - {humidity_data['partial_data_dates']}")   
    output_dict = getAverageValuesForEveryStation(
        humidity_data, createOutputDict("humidity_stations.json", humidity_data))
    locations, humidity_values = cleanupStationNames(humidity_data['stations'], output_dict)

    plotAverageHumidityByDate(locations, humidity_values, district_map, zone_color_map)
