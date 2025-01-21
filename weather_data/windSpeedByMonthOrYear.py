import json
import os
from calendar import monthrange

import matplotlib.pyplot as plt

from helper_functions import store_daily_weather


def plotweatherByMonth(
    title: str,
    measurement: str,
    year,
    month,
    output_file,
    weather_type: str,
    data_format: str,
    station_json_path: str,
):
    # Store and fetch monthly weather data
    monthly_weather = store_daily_weather(
        year, month, output_file, weather_type, data_format, station_json_path
    )

    # Prepare data for plotting
    days = list(monthly_weather.keys())
    average_weather = list(monthly_weather.values())

    # Plot the bar chart for monthly weather
    plt.figure(figsize=(12, 6))
    bars = plt.bar(days, average_weather, color="lightgreen")

    # Add labels and title
    plt.xlabel("Date")
    plt.ylabel(measurement)
    plt.title(f"{title} in {year}-{month:02d}")

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha="right")

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add weather values on top of the bars
    for bar, value in zip(bars, average_weather):
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height(),
            f"{value:.1f}",
            ha="center",
            va="bottom",
        )

    # Show the plot
    plt.show()


def plotweatherByYear(
    title: str,
    measurement: str,
    year,
    output_file,
    weather_type,
    data_format,
    station_json_path,
):
    # Fetch yearly weather data
    yearly_weather = {}
    for month in range(1, 13):
        monthly_data = store_daily_weather(
            year, month, output_file, weather_type, data_format, station_json_path
        )
        average_weather = (
            sum(monthly_data.values()) / len(monthly_data) if monthly_data else 0
        )
        yearly_weather[f"{year}-{month:02d}"] = average_weather

    # Prepare data for plotting
    months = list(yearly_weather.keys())
    average_weather = list(yearly_weather.values())

    # Plot the bar chart for yearly weather
    plt.figure(figsize=(10, 6))
    bars = plt.bar(months, average_weather, color="darkgreen")

    # Add labels and title
    plt.xlabel("Month")
    plt.ylabel(measurement)
    plt.title(f"{title} in {year}")

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha="right")

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add weather values on top of the bars
    for bar, value in zip(bars, average_weather):
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

    # Plot Monthly / Yearly Total
    # plotweatherByMonth("Total Relative Wind Speeds", "knots", 2023, 1, "daily_total_windspeed_data.json", "wind-speed", "total")
    plotweatherByYear(
        title="Average Wind Speeds",
        measurement="knots",
        year=2023,
        output_file="daily_average_windspeed_data.json",
        weather_type="wind-speed",
        data_format="average",
        station_json_path="wind_stations.json",
    )

    # Plot Monthly / Yearly Average
    # plotweatherByMonth("Average Relative Wind Speed", "knots", 2023, 1, "daily_average_windspeed_data.json", "wind-speed", "average")
    # plotweatherByYear("Average Relative Wind Speed", "knots", 2024, "daily_average_windspeed_data.json", "wind-speed", "average")
