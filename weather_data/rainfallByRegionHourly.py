from datetime import datetime
import numpy as np
import matplotlib.pyplot as plt
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

def plot_hourly_rainfall(aggregated_rainfall, region):
    timestamps = sorted(aggregated_rainfall.keys())
    rainfall_values = [aggregated_rainfall[ts].get(region, 0) for ts in timestamps]

    plt.figure(figsize=(12, 6))
    plt.plot(timestamps, rainfall_values, label="Rainfall (mm)", marker="x", color="blue")
    plt.title(f"Hourly Rainfall Trends for {region}")
    plt.xlabel("Time")
    plt.ylabel("Rainfall (mm)")
    plt.legend()
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()

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

    # Get Hourly Rainfall
    hourly_rainfall_data = getTotalDataHourly('rainfall', date)
    aggregated_rainfall_data = formatTotalHourlyDataByRegion(hourly_rainfall_data, district_map)
    aggregated_rainfall_data = convert_to_datetime(aggregated_rainfall_data)

    # Calculate hourly average rainfall
    hourly_avg_rainfall = calculate_hourly_averages(aggregated_rainfall_data)
    peak_rainfall = max(hourly_avg_rainfall, key=hourly_avg_rainfall.get)
    print(f"Peak Rainfall: {hourly_avg_rainfall[peak_rainfall]} at {peak_rainfall}")

    # Plot rainfall trends for all regions
    for region in district_map.keys():
        plot_hourly_rainfall(aggregated_rainfall_data, region)

    plt.show()

    # Example for detecting extreme rainfall events
    # extreme_rainfalls = detect_extreme_events(aggregated_rainfall_data, threshold=20)  # Example threshold
    # print("Extreme Rainfall Events:", extreme_rainfalls)
