import matplotlib.pyplot as plt
from windspeedByRegion import calculateAverageWindSpeedByRegion, calculateTotalWindSpeedByRegion, plotAverageWindSpeed, plotTotalWindSpeed
from helper_functions import import_dictionaries, getDataTypeFromDate, sumValuesForEveryStation, createOutputDict, cleanupStationNames


def calculateTotalRainfallByRegion(date, district_map):
    rainfall_data = sumValuesForEveryStation('rainfall', date)
    output_dict = sumValuesForEveryStation(
        rainfall_data, createOutputDict("rainfall_stations.json", rainfall_data))
    locations, rainfall_values = cleanupStationNames(rainfall_data['stations'], output_dict)

    # Prepare a dictionary to store total rainfall by region
    region_totals = {region: 0 for region in district_map.keys()}

    # Aggregate rainfall values by region
    for zone, district_locations in district_map.items():
        for location in district_locations:
            if location in locations:
                rainfall_index = locations.index(location)
                region_totals[zone] += rainfall_values[rainfall_index]
    return region_totals

def plotRainfallByDateRegionSorted(regions: list, total_rainfall: list, district_map: dict, zone_color_map: dict):
    # Plot the bar chart for total rainfall by region
    plt.figure(figsize=(10, 6))
    bars = plt.bar(regions, total_rainfall, color=region_colors)

    # Add labels and title
    plt.xlabel('Regions')
    plt.ylabel('Total Rainfall (mm)')
    plt.title(f'Total Rainfall by Region on {date}')

    # Annotate bar heights
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, height + 1,
                 f'{height:.1f}', ha='center', va='bottom')

if __name__ == '__main__':
    district_map, zone_color_map = import_dictionaries()

    # Run helper functions to get rainfall data and prepare for plotting
    date = '2024-11-29'  # Define the desired date in YYYY-MM-DD format
    rainfall_region_totals = calculateTotalRainfallByRegion(date, district_map)
    # Prepare data for plotting
    regions = list(rainfall_region_totals.keys())
    total_rainfall = list(rainfall_region_totals.values())
    region_colors = [zone_color_map[region] for region in regions]

    '''
    Plotting total rainfall
    '''

    plotRainfallByDateRegionSorted(regions, total_rainfall, district_map, zone_color_map)

    '''
    Plotting total and average windspeeds
    '''

    # Show the plot
    plt.tight_layout()

    # Specify date for windspeed data
    all_data = getDataTypeFromDate('wind-speed', date)

    # Calculate average windspeed by region
    region_averages = calculateAverageWindSpeedByRegion(all_data)

    # Calculate total windspeed by region
    region_totals = calculateTotalWindSpeedByRegion(all_data, district_map)

    # Plot the average windspeed by region
    # plotAverageWindSpeed(region_averages, date)
    # plotTotalWindSpeed(region_totals, zone_color_map, date)

    plt.show()
