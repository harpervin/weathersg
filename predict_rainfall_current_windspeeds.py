from datetime import datetime
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import pearsonr
from helper_functions import import_dictionaries, getTotalDataHourly, formatTotalHourlyDataByRegion

def convert_to_datetime(aggregated_data):
    return {
        datetime.strptime(ts, "%Y-%m-%d %H:%M"): data
        for ts, data in aggregated_data.items()
    }


def calculate_hourly_averages(aggregated_data):
    hourly_averages = {}
    for timestamp, region_data in aggregated_data.items():
        hourly_averages[timestamp] = np.mean(list(region_data.values()))
    return hourly_averages


def plot_hourly_trends(aggregated_windspeed, aggregated_rainfall, region):
    timestamps = sorted(aggregated_windspeed.keys())
    windspeed_values = [aggregated_windspeed[ts].get(region, 0) for ts in timestamps]
    rainfall_values = [aggregated_rainfall[ts].get(region, 0) for ts in timestamps]

    plt.figure(figsize=(12, 6))
    plt.plot(timestamps, windspeed_values, label="Windspeed (knots)", marker="o")
    plt.plot(timestamps, rainfall_values, label="Rainfall (mm)", marker="x")
    plt.title(f"Hourly Trends for {region}")
    plt.xlabel("Time")
    plt.ylabel("Values")
    plt.legend()
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()


def calculate_correlations(windspeed_data, rainfall_data):
    correlations = {}
    for region in district_map.keys():
        windspeed_values = [windspeed_data[ts].get(region, 0) for ts in windspeed_data.keys()]
        rainfall_values = [rainfall_data[ts].get(region, 0) for ts in rainfall_data.keys()]
        if len(windspeed_values) > 1 and len(rainfall_values) > 1:
            correlations[region], _ = pearsonr(windspeed_values, rainfall_values)
    return correlations

def detect_extreme_events(aggregated_data, threshold):
    extreme_events = []
    for timestamp, regions in aggregated_data.items():
        for region, value in regions.items():
            if value > threshold:
                extreme_events.append((timestamp, region, value))
    return extreme_events


if __name__ == "__main__":
    # Specify the date for data
    date = "2024-11-29"

    # Import district map and zone color map
    district_map, zone_color_map = import_dictionaries()

    # Get Hourly Windspeeds
    hourly_windspeed_data = getTotalDataHourly('wind-speed', date)
    aggregated_windspeed_data = formatTotalHourlyDataByRegion(hourly_windspeed_data, district_map)
    
    # # Get Hourly Rainfall
    hourly_rainfall_data = getTotalDataHourly('rainfall', date)
    aggregated_rainfall_data = formatTotalHourlyDataByRegion(hourly_rainfall_data, district_map)

    aggregated_windspeed_data = convert_to_datetime(aggregated_windspeed_data)
    aggregated_rainfall_data = convert_to_datetime(aggregated_rainfall_data)

    hourly_avg_windspeed = calculate_hourly_averages(aggregated_windspeed_data)
    hourly_avg_rainfall = calculate_hourly_averages(aggregated_rainfall_data)

    peak_windspeed = max(hourly_avg_windspeed, key=hourly_avg_windspeed.get)
    peak_rainfall = max(hourly_avg_rainfall, key=hourly_avg_rainfall.get)
    print(f"Peak Windspeed: {hourly_avg_windspeed[peak_windspeed]} at {peak_windspeed}")
    print(f"Peak Rainfall: {hourly_avg_rainfall[peak_rainfall]} at {peak_rainfall}")

    region_correlations = calculate_correlations(aggregated_windspeed_data, aggregated_rainfall_data)
    for region, corr in region_correlations.items():
        print(f"Region: {region}, Correlation: {corr:.2f}")

    for region in district_map.keys():
        plot_hourly_trends(aggregated_windspeed_data, aggregated_rainfall_data, region)
    plt.show()



    # extreme_windspeeds = detect_extreme_events(aggregated_windspeed_data, threshold=50)  # Example threshold
    # extreme_rainfalls = detect_extreme_events(aggregated_rainfall_data, threshold=20)  # Example threshold

    # print("Extreme Windspeed Events:", extreme_windspeeds)
    # print("Extreme Rainfall Events:", extreme_rainfalls)