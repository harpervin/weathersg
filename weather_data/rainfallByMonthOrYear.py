import json
import os
from calendar import monthrange

import matplotlib.pyplot as plt

from helper_functions import (
    createOutputDict,
    getDataTypeFromDate,
    sumValuesForEveryStation,
)


def store_daily_rainfall(year, month, output_file):
    """
    Fetch and store total rainfall for each day in a month in a JSON file.

    Args:
        year (int): Year of the data.
        month (int): Month of the data (1-12).
        output_file (str): Path to the JSON file where data will be stored.

    Returns:
        dict: A dictionary containing daily total rainfall for the month.
    """

    num_days = monthrange(year, month)[1]  # Get the number of days in the month

    # Load existing data if the file exists
    if os.path.exists(output_file):
        with open(output_file, "r") as file:
            all_data = json.load(file)
    else:
        all_data = {}

    monthly_rainfall = {}
    for day in range(1, num_days + 1):
        date = f"{year}-{month:02d}-{day:02d}"
        print(f"Fetching data for {date}...")

        if date in all_data:
            print(f"Data for {date} already exists. Skipping...")
            monthly_rainfall[date] = all_data[date]
            continue
        else:
            # Fetch rainfall data for the date
            rainfall_data = getDataTypeFromDate("rainfall", date)
            if rainfall_data is None:
                print(f"No data available for {date}.")
                continue

            output_dict = sumValuesForEveryStation(
                rainfall_data, createOutputDict("rainfall_stations.json", rainfall_data)
            )

            # Aggregate total rainfall for the day
            total_rainfall = sum([data[1] for data in output_dict.values()])
            monthly_rainfall[date] = total_rainfall

            # Store the result in the overall data
            all_data[date] = total_rainfall

            # Save the updated data to the JSON file
            with open(output_file, "w") as file:
                json.dump(all_data, file, indent=4)

    return monthly_rainfall


def plotRainfallByMonth(year, month, output_file):
    # Store and fetch monthly rainfall data
    monthly_rainfall = store_daily_rainfall(year, month, output_file)

    # Prepare data for plotting
    days = list(monthly_rainfall.keys())
    total_rainfall = list(monthly_rainfall.values())

    # Plot the bar chart for monthly rainfall
    plt.figure(figsize=(12, 6))
    bars = plt.bar(days, total_rainfall, color="steelblue")

    # Add labels and title
    plt.xlabel("Date")
    plt.ylabel("Total Rainfall (mm)")
    plt.title(f"Total Rainfall in {year}-{month:02d}")

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha="right")

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add rainfall values on top of the bars
    for bar, value in zip(bars, total_rainfall):
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height(),
            f"{value:.1f}",
            ha="center",
            va="bottom",
        )

    # Show the plot
    plt.show()


def plotRainfallByYear(year, output_file):
    # Fetch yearly rainfall data
    yearly_rainfall = {}
    for month in range(1, 13):
        monthly_data = store_daily_rainfall(year, month, output_file)
        total_rainfall = sum(monthly_data.values())
        yearly_rainfall[f"{year}-{month:02d}"] = total_rainfall

    # Prepare data for plotting
    months = list(yearly_rainfall.keys())
    total_rainfall = list(yearly_rainfall.values())

    # Plot the bar chart for yearly rainfall
    plt.figure(figsize=(10, 6))
    bars = plt.bar(months, total_rainfall, color="darkblue")

    # Add labels and title
    plt.xlabel("Month")
    plt.ylabel("Total Rainfall (mm)")
    plt.title(f"Total Rainfall in {year}")

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha="right")

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add rainfall values on top of the bars
    for bar, value in zip(bars, total_rainfall):
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height(),
            f"{value:.1f}",
            ha="center",
            va="bottom",
        )

    # Show the plot
    plt.show()


if __name__ == "__main__":
    OUTPUT_FILE = "daily_total_rainfall_data.json"
    # plotRainfallByMonth(2023, 1, OUTPUT_FILE)
    plotRainfallByYear(2024, OUTPUT_FILE)
