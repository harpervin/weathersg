import matplotlib.pyplot as plt
from helper_functions import getDataTypeFromDate, getAverageValuesForEveryStation, sumValuesForEveryStation, createOutputDict, cleanupStationNames, import_dictionaries

'''
Helper Functions
'''

def plotWeatherByDateLocationSorted(title:str, readingUnit: str, date: str, locations, temperature_values, district_map, zone_color_map):
    # Plotting Air Temperature Data
    # 1. Sorted by Zones

    # Prepare lists for zones, locations, and temperature values
    zone_locations = []
    zone_temperature = []
    zone_colors = []

    # Sort data by zones and organize for plotting
    for zone, district_locations in district_map.items():
        for location in district_locations:
            if location not in locations:
                continue  # Skip to the next location if not found in the list
            temperature_index = locations.index(location)
            zone_locations.append(location)
            zone_temperature.append(temperature_values[temperature_index])
            zone_colors.append(zone_color_map[zone])

    # Plot the bar chart sorted by zones with color coding
    plt.figure(figsize=(14, 7))
    bars = plt.bar(zone_locations, zone_temperature, color=zone_colors)

    # Add labels and title
    plt.xlabel('Locations')
    plt.ylabel(readingUnit)
    plt.title(f'{title} by Location on {date}, Sorted by Zone')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Set y-axis limits based on data range
    plt.gca().set_ylim(0, max(zone_temperature) + 2)

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

    # Run helper functions to get air temperature data and prepare for plotting
    date = '2024-11-29'  # Define the desired date in YYYY-MM-DD format
    wspeed_data = getDataTypeFromDate('wind-speed', date)

    # Error Handling for missing Data
    if wspeed_data is None:
        print("No data available for the specified date.")
        exit()
    if not wspeed_data["complete_data"]:
        print(f"Only partial data found on these dates - {wspeed_data['partial_data_dates']}")   

    # Preparing Average Wind Speeds data object
    avg_ws_output_dict = getAverageValuesForEveryStation(
        wspeed_data, createOutputDict("wind_stations.json", wspeed_data))
    avg_ws_locations, avg_ws_values = cleanupStationNames(wspeed_data['stations'], avg_ws_output_dict)

    # Preparing Total Wind Speeds data object
    total_ws_output_dict = sumValuesForEveryStation(
        wspeed_data, createOutputDict("wind_stations.json", wspeed_data))
    total_ws_locations, total_ws_values = cleanupStationNames(wspeed_data['stations'], total_ws_output_dict)

    plotWeatherByDateLocationSorted("Average Wind Speed", wspeed_data["readingUnit"], date, avg_ws_locations, avg_ws_values, district_map, zone_color_map)
    plotWeatherByDateLocationSorted("Total Wind Speed", wspeed_data["readingUnit"], date, total_ws_locations, total_ws_values, district_map, zone_color_map)
