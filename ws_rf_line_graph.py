import matplotlib.pyplot as plt
import numpy as np


def plotWindspeedAndRainfall(windspeed_totals, rainfall_totals, zone_color_map, windspeed_type):
    """
    Plot windspeed and rainfall as line graphs for comparison, with regions as the x-axis.

    Args:
        windspeed_totals (dict): Total or average windspeed by region.
        rainfall_totals (dict): Total rainfall by region.
        zone_color_map (dict): Color map for each region.
        windspeed_type (str): Type of windspeed (e.g., 'Total', 'Average').
    """
    # Prepare data
    regions = list(windspeed_totals.keys())
    windspeed_values = [windspeed_totals[region] for region in regions]
    rainfall_values = [rainfall_totals[region] for region in regions]

    # Plot line graphs
    plt.figure(figsize=(10, 6))
    plt.plot(regions, windspeed_values, label=f"{windspeed_type} Windspeed (knots)", marker="o", color="blue")
    plt.plot(regions, rainfall_values, label="Rainfall (mm)", marker="x", color="green")

    # Add labels, title, and legend
    plt.xlabel("Regions")
    plt.ylabel("Values")
    plt.title(f"Comparison of {windspeed_type} Windspeed and Rainfall Across Regions")
    plt.legend()
    plt.grid(True)

    # Rotate x-axis labels for better visibility
    plt.xticks(rotation=45)
    plt.tight_layout()


if __name__ == "__main__":
    # Specify the date for data
    date = "2024-11-29"

    # Import district map and zone color map
    from helper_functions import import_dictionaries

    district_map, zone_color_map = import_dictionaries()

    # Fetch windspeed and rainfall data
    from rainfallByDateRegionSorted import calculateTotalRainfallByRegion
    from windspeedByRegion import (
        calculateAverageWindSpeedByRegion,
        calculateTotalWindSpeedByRegion,
        getAllWindSpeedData,
    )

    all_windspeeds_data = getAllWindSpeedData(date)

    windspeed_region_totals = calculateTotalWindSpeedByRegion(
        all_windspeeds_data, district_map
    )
    windspeed_region_averages = calculateAverageWindSpeedByRegion(all_windspeeds_data)
    rainfall_region_totals = calculateTotalRainfallByRegion(date, district_map)

    # Plot windspeed and rainfall comparison
    plotWindspeedAndRainfall(
        windspeed_region_totals, rainfall_region_totals, zone_color_map, "Total"
    )
    plotWindspeedAndRainfall(
        windspeed_region_averages, rainfall_region_totals, zone_color_map, "Average"
    )
    plt.show()
