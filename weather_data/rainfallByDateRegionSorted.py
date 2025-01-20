import matplotlib.pyplot as plt

from helper_functions import (
    cleanupStationNames,
    createOutputDict,
    getAverageValuesForEveryStation,
    getDataTypeFromDate,
    import_dictionaries,
    sumValuesForEveryStation,
)
from windspeedByRegion import (
    calculateAverageWindSpeedByRegion,
    calculateTotalWindSpeedByRegion,
    plotAverageWindSpeed,
    plotTotalWindSpeed,
)


def calculateTotalRainfallByRegion(date, district_map):
    rainfall_data = getDataTypeFromDate("rainfall", date)
    if rainfall_data is None:
        print("No data available for the specified date.")
        exit()
    if not rainfall_data["complete_data"]:
        print(
            f"Only partial data found on these dates - {rainfall_data['partial_data_dates']}"
        )
    output_dict = sumValuesForEveryStation(
        rainfall_data, createOutputDict("rainfall_stations.json", rainfall_data)
    )
    locations, rainfall_values = cleanupStationNames(
        rainfall_data["stations"], output_dict
    )

    # Prepare a dictionary to store total rainfall by region
    region_totals = {region: 0 for region in district_map.keys()}

    # Aggregate rainfall values by region
    for zone, district_locations in district_map.items():
        for location in district_locations:
            if location in locations:
                rainfall_index = locations.index(location)
                region_totals[zone] += rainfall_values[rainfall_index]
    return region_totals


def calculateAverageRainfallByRegion(date, district_map):
    """
    Calculate the average rainfall by region for a specified date.

    Args:
        date (str): The date in 'YYYY-MM-DD' format.
        district_map (dict): A mapping of regions to station names.

    Returns:
        dict: A dictionary with regions as keys and average rainfall values as values.
    """
    # Fetch rainfall data for the given date
    rainfall_data = getDataTypeFromDate("rainfall", date)
    if rainfall_data is None:
        print("No data available for the specified date.")
        exit()
    if not rainfall_data["complete_data"]:
        print(
            f"Only partial data found on these dates - {rainfall_data['partial_data_dates']}"
        )

    # Create an output dictionary to store rainfall values and counts
    output_dict = createOutputDict("rainfall_stations.json", rainfall_data)

    # Use the helper function to get average values for each station
    station_averages = getAverageValuesForEveryStation(rainfall_data, output_dict)

    # Prepare dictionaries to store totals and counts
    region_totals = {region: 0 for region in district_map.keys()}
    region_counts = {region: 0 for region in district_map.keys()}

    # Iterate through the district map and aggregate rainfall data
    for region, station_names in district_map.items():
        for station_name in station_names:
            # Check if the station is in station_averages
            for station_id, station_data in station_averages.items():
                if station_data[0] == station_name:  # Compare station name
                    region_totals[region] += station_data[1]  # Add rainfall value
                    region_counts[region] += 1

    # Calculate averages for each region
    region_averages = {
        region: (region_totals[region] / region_counts[region] if region_counts[region] > 0 else 0)
        for region in district_map.keys()
    }

    return region_averages


def plotRainfallByDateRegionSorted(
    regions: list, total_rainfall: list, district_map: dict, zone_color_map: dict
):
    # Plot the bar chart for total rainfall by region
    plt.figure(figsize=(10, 6))
    bars = plt.bar(regions, total_rainfall, color=region_colors)

    # Add labels and title
    plt.xlabel("Regions")
    plt.ylabel("Total Rainfall (mm)")
    plt.title(f"Total Rainfall by Region on {date}")

    # Annotate bar heights
    for bar in bars:
        height = bar.get_height()
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            height + 1,
            f"{height:.1f}",
            ha="center",
            va="bottom",
        )


if __name__ == "__main__":
    district_map, zone_color_map = import_dictionaries()

    # Run helper functions to get rainfall data and prepare for plotting
    date = "2025-01-11"  # Define the desired date in YYYY-MM-DD format
    
    #rainfall_region_totals = calculateTotalRainfallByRegion(date, district_map)
    rainfall_region_totals = calculateAverageRainfallByRegion(date, district_map)



    print(rainfall_region_totals)
    # Prepare data for plotting
    regions = list(rainfall_region_totals.keys())
    total_rainfall = list(rainfall_region_totals.values())
    region_colors = [zone_color_map[region] for region in regions]

    """
    Plotting total rainfall
    """

    plotRainfallByDateRegionSorted(
        regions, total_rainfall, district_map, zone_color_map
    )

    """
    Plotting total and average windspeeds
    """

    # Show the plot
    plt.tight_layout()

    # Specify date for windspeed data
    all_data = getDataTypeFromDate("wind-speed", date)

    # Calculate average windspeed by region
    region_averages = calculateAverageWindSpeedByRegion(all_data)

    # Calculate total windspeed by region
    region_totals = calculateTotalWindSpeedByRegion(all_data, district_map)

    # Plot the average windspeed by region
    # plotAverageWindSpeed(region_averages, date)
    # plotTotalWindSpeed(region_totals, zone_color_map, date)

    plt.show()
