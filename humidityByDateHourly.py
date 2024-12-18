from datetime import datetime
import numpy as np
import matplotlib.pyplot as plt
from helper_functions import import_dictionaries, getAverageDataHourly, sumValuesForEveryEntry
from collections import defaultdict


def convert_to_datetime(aggregated_data):
    return {
        datetime.strptime(ts, "%Y-%m-%d %H:%M"): data
        for ts, data in aggregated_data.items()
    }


def plot_total_hourly_rainfall(total_rainfall):
    timestamps = sorted(total_rainfall.keys())
    rainfall_values = [total_rainfall[ts] for ts in timestamps]

    plt.figure(figsize=(12, 6))
    plt.plot(timestamps, rainfall_values, label="Total Rainfall (mm)", marker="x", color="blue")
    plt.title("Total Hourly Rainfall Trends in Singapore")
    plt.xlabel("Time")
    plt.ylabel("Total Rainfall (mm)")
    plt.legend()
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()

if __name__ == "__main__":
    # Specify the date for data
    date = "2024-11-29"

    # Get Hourly Rainfall
    hourly_humidity_data = getAverageDataHourly('relative-humidity', date)
    averaged_humidity_data = averageValueForEveryEntry(hourly_humidity_data, defaultdict(float))
    formatted_humidity_data = convert_to_datetime(averaged_humidity_data)

    # Plot total hourly rainfall
    plot_total_hourly_rainfall(formatted_rainfall_data)

    plt.show()

    # Example for detecting extreme rainfall events
    # extreme_rainfalls = [(ts, val) for ts, val in total_hourly_rainfall.items() if val > 20]  # Example threshold
    # print("Extreme Rainfall Events:", extreme_rainfalls)
