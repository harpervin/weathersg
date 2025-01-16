import matplotlib.pyplot as plt 
from windSpeedByDateScatterPlot import getAllWindSpeedData
from helper_functions import import_dictionaries

district_map, zone_color_map = import_dictionaries()

def calculateAverageWindSpeedByRegion(all_data):
    stations = all_data["stations"]
    readings = all_data["readings"]

    # Map station IDs to their regions
    station_to_region = {}
    for station in stations:
        station_name = station["name"]
        for region, station_list in district_map.items():
            if station_name in station_list:
                station_to_region[station["id"]] = region
                break

    # Initialize data structure for region totals
    region_totals = {region: 0 for region in district_map.keys()}
    region_counts = {region: 0 for region in district_map.keys()}

    # Sum windspeed values for each region
    for reading in readings:
        for station_data in reading["data"]:
            station_id = station_data["stationId"]
            windspeed = station_data["value"]
            region = station_to_region.get(station_id)

            if region:
                region_totals[region] += windspeed
                region_counts[region] += 1

    # Calculate average windspeed for each region
    region_averages = {
        region: (region_totals[region] / region_counts[region] if region_counts[region] > 0 else 0)
        for region in district_map.keys()
    }

    return region_averages

# Plot the average windspeed by region
def plotAverageWindSpeed(region_averages, date):
    regions = list(region_averages.keys())
    avg_windspeeds = list(region_averages.values())
    colors = [zone_color_map[region] for region in regions]

    plt.figure(figsize=(10, 6))
    bars = plt.bar(regions, avg_windspeeds, color=colors)

    # Add labels and title
    plt.xlabel("Regions")
    plt.ylabel("Average Windspeed (knots)")
    plt.title(f"Average Windspeed by Region on {date}")

    # Annotate bar heights
    for bar, avg_windspeed in zip(bars, avg_windspeeds):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05,
                 f"{avg_windspeed:.1f}", ha="center", va="bottom")

    plt.tight_layout()

# Calculate total windspeed by region
def calculateTotalWindSpeedByRegion(all_data, district_map):
    stations = all_data["stations"]
    readings = all_data["readings"]

    # Map station names to regions
    station_to_region = {}
    for station in stations:
        station_name = station["name"]
        for region, station_list in district_map.items():
            if station_name in station_list:
                station_to_region[station["id"]] = region
                break

    # Initialize data structure for region totals
    region_totals = {region: 0 for region in district_map.keys()}

    # Sum windspeed values for each region
    for reading in readings:
        for station_data in reading["data"]:
            station_id = station_data["stationId"]
            windspeed = station_data["value"]
            region = station_to_region.get(station_id)

            if region:
                region_totals[region] += windspeed

    return region_totals

# Plot total windspeed by region
def plotTotalWindSpeed(region_totals, zone_color_map, date):
    regions = list(region_totals.keys())
    total_windspeeds = list(region_totals.values())
    colors = [zone_color_map[region] for region in regions]

    plt.figure(figsize=(10, 6))
    bars = plt.bar(regions, total_windspeeds, color=colors)

    # Add labels and title
    plt.xlabel("Regions")
    plt.ylabel("Total Windspeed (knots)")
    plt.title(f"Total Windspeed by Region on {date}")

    # Annotate bar heights
    for bar, total_windspeed in zip(bars, total_windspeeds):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.1,
                 f"{total_windspeed:.1f}", ha="center", va="bottom")

    plt.tight_layout()
    # plt.show()

# Main program
if __name__ == "__main__":
    # Specify date for windspeed data
    date = "2024-11-29"
    all_data = getAllWindSpeedData(date)

    # Calculate average windspeed by region
    region_averages = calculateAverageWindSpeedByRegion(all_data)

    # Calculate total windspeed by region
    region_totals = calculateTotalWindSpeedByRegion(all_data, district_map)

    # Plot the average windspeed by region
    plotAverageWindSpeed(region_averages, date)
    plotTotalWindSpeed(region_totals, zone_color_map, date)
    plt.show()
