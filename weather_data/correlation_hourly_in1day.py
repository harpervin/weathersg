from datetime import datetime

import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import pearsonr

from helper_functions import *


def calculate_hourly_averages(aggregated_data):
    hourly_averages = {}
    for timestamp, region_data in aggregated_data.items():
        hourly_averages[timestamp] = np.mean(list(region_data.values()))
    return hourly_averages


def plot_hourly_trends(avg_ws, total_ws, avg_rf, at, rh, total_rf, region):
    timestamps = sorted(avg_ws.keys())
    avg_ws = [avg_ws[ts].get(region, 0) for ts in timestamps]
    total_ws = [total_ws[ts].get(region, 0) for ts in timestamps]
    avg_rf = [avg_rf[ts].get(region, 0) for ts in timestamps]
    total_rf = [total_rf[ts].get(region, 0) for ts in timestamps]
    at_values = [at[ts].get(region, 0) for ts in timestamps]
    rh_values = [rh[ts].get(region, 0) for ts in timestamps]

    plt.figure(figsize=(12, 6))
    plt.plot(timestamps, avg_ws, label="Average Windspeeds (knots)", marker="o")
    plt.plot(timestamps, total_ws, label="Total Windspeeds (knots)", marker="o")
    plt.plot(timestamps, avg_rf, label="Average Rainfall (mm)", marker="x")
    plt.plot(timestamps, total_rf, label="Total Rainfall (mm)", marker="x")
    plt.plot(timestamps, at_values, label="Air Temperature (deg C)", marker="x")
    plt.plot(timestamps, rh_values, label="Humidity (%)", marker="x")
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
        windspeed_values = [
            windspeed_data[ts].get(region, 0) for ts in windspeed_data.keys()
        ]
        rainfall_values = [
            rainfall_data[ts].get(region, 0) for ts in rainfall_data.keys()
        ]
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
    date = "2025-01-11"

    # Import district map and zone color map
    district_map, zone_color_map = import_dictionaries()

    # Get Hourly Humidity
    hourly_humidity_data = getAverageDataHourly("relative-humidity", date)
    aggregated_humidity_data = formatAverageHourlyDataByRegion(
        hourly_humidity_data, district_map
    )

    # Get Average Hourly Rainfall
    hourly_arf_data = getAverageDataHourly("rainfall", date)
    aggregated_arf_data = formatAverageHourlyDataByRegion(hourly_arf_data, district_map)

    # Get Total Hourly Rainfall
    hourly_trf_data = getTotalDataHourly("rainfall", date)
    aggregated_trf_data = formatTotalHourlyDataByRegion(hourly_trf_data, district_map)

    # Get Hourly Wind Speeds
    hourly_ws_data = getAverageDataHourly("wind-speed", date)
    avg_ws_data = formatAverageHourlyDataByRegion(hourly_ws_data, district_map)
    
    # Get Total Hourly Wind Speeds
    total_ws_data = getTotalDataHourly("wind-speed", date)
    aggregated_ws_data = formatTotalHourlyDataByRegion(total_ws_data, district_map)

    # Get Hourly Air Temperature
    hourly_at_data = getAverageDataHourly("air-temperature", date)
    aggregated_at_data = formatAverageHourlyDataByRegion(hourly_at_data, district_map)

    aggregated_humidity_data = convert_to_datetime(aggregated_humidity_data)
    aggregated_arf_data = convert_to_datetime(aggregated_arf_data)
    aggregated_trf_data = convert_to_datetime(aggregated_trf_data)
    aggregated_ws_data = convert_to_datetime(aggregated_ws_data)
    avg_ws_data = convert_to_datetime(avg_ws_data)
    aggregated_at_data = convert_to_datetime(aggregated_at_data)

    # hourly_avg_windspeed = calculate_hourly_averages(aggregated_windspeed_data)
    # hourly_avg_rainfall = calculate_hourly_averages(aggregated_rainfall_data)

    # peak_windspeed = max(hourly_avg_windspeed, key=hourly_avg_windspeed.get)
    # peak_rainfall = max(hourly_avg_rainfall, key=hourly_avg_rainfall.get)
    # print(f"Peak Windspeed: {hourly_avg_windspeed[peak_windspeed]} at {peak_windspeed}")
    # print(f"Peak Rainfall: {hourly_avg_rainfall[peak_rainfall]} at {peak_rainfall}")

    at_correlations = calculate_correlations(aggregated_at_data, aggregated_arf_data)
    print("Correlations between Average Air Temperature and Average Rainfall:")
    for region, corr in at_correlations.items():
        print(f"Region: {region}, Correlation: {corr:.2f}")

    rh_correlations = calculate_correlations(
        aggregated_humidity_data, aggregated_arf_data
    )
    print("Correlations between Average Humidity and Average Rainfall:")
    for region, corr in rh_correlations.items():
        print(f"Region: {region}, Correlation: {corr:.2f}")

    ws_correlations = calculate_correlations(avg_ws_data, aggregated_arf_data)
    print("Correlations between Average Wind Speeds and Average Rainfall:")
    for region, corr in ws_correlations.items():
        print(f"Region: {region}, Correlation: {corr:.2f}")

    total_ws_correlations = calculate_correlations(aggregated_ws_data, aggregated_trf_data)
    print("Correlations between Total Wind Speeds and Total Rainfall:")
    for region, corr in ws_correlations.items():
        print(f"Region: {region}, Correlation: {corr:.2f}")

    for region in district_map.keys():
        plot_hourly_trends(
            avg_ws_data,
            aggregated_ws_data,
            aggregated_arf_data,
            aggregated_at_data,
            aggregated_humidity_data,
            aggregated_trf_data,
            region,
        )
    plt.show()

    # extreme_windspeeds = detect_extreme_events(aggregated_windspeed_data, threshold=50)  # Example threshold
    # extreme_rainfalls = detect_extreme_events(aggregated_rainfall_data, threshold=20)  # Example threshold

    # print("Extreme Windspeed Events:", extreme_windspeeds)
    # print("Extreme Rainfall Events:", extreme_rainfalls)
