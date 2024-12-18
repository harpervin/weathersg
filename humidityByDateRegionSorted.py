import matplotlib.pyplot as plt
from helper_functions import getDataTypeFromDate, createOutputDict, averageValuesInDict, import_dictionaries

def calculateAverageHumidityByRegion(date, district_map):
    """
    Calculate average humidity by region for a specific date.

    Args:
        date (str): The date in YYYY-MM-DD format.
        district_map (dict): Dictionary mapping regions to locations.

    Returns:
        dict: A dictionary with region names as keys and average humidity as values.
    """
    humidity_data = getDataTypeFromDate('relative-humidity', date)
    if humidity_data is None:
        print(f"No data available for {date}.")
        return {}

    output_dict = averageValuesInDict(humidity_data, createOutputDict("humidity_stations.json", humidity_data))
    locations = [data[0] for data in output_dict.values()]
    humidity_values = [data[1] for data in output_dict.values()]

    # Prepare a dictionary to store total humidity and count by region
    region_totals = {region: [0, 0] for region in district_map.keys()}  # [total_humidity, station_count]

    # Aggregate humidity values by region
    for zone, district_locations in district_map.items():
        for location in district_locations:
            if location in locations:
                humidity_index = locations.index(location)
                region_totals[zone][0] += humidity_values[humidity_index]
                region_totals[zone][1] += 1

    # Calculate average humidity for each region
    region_averages = {
        region: (totals[0] / totals[1] if totals[1] > 0 else 0)
        for region, totals in region_totals.items()
    }

    return region_averages

def plotAverageHumidityByRegion(date, district_map, zone_color_map):
    """
    Plot average humidity by region for a specific date.

    Args:
        date (str): The date in YYYY-MM-DD format.
        district_map (dict): Dictionary mapping regions to locations.
        zone_color_map (dict): Dictionary mapping regions to colors.
    """
    region_averages = calculateAverageHumidityByRegion(date, district_map)

    # Prepare data for plotting
    regions = list(region_averages.keys())
    average_humidity = list(region_averages.values())
    region_colors = [zone_color_map[region] for region in regions]

    # Plot the bar chart for average humidity by region
    plt.figure(figsize=(10, 6))
    bars = plt.bar(regions, average_humidity, color=region_colors)

    # Add labels and title
    plt.xlabel('Regions')
    plt.ylabel('Average Relative Humidity (%)')
    plt.title(f'Average Relative Humidity by Region on {date}')

    # Annotate bar heights
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width() / 2, height + 1,
                 f'{height:.1f}', ha='center', va='bottom')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()
    plt.show()

if __name__ == '__main__':
    district_map, zone_color_map = import_dictionaries()

    # Define the desired date in YYYY-MM-DD format
    date = '2024-11-29'

    # Plot average humidity by region
    plotAverageHumidityByRegion(date, district_map, zone_color_map)
