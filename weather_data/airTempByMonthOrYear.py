import json
import os
import matplotlib.pyplot as plt
from helper_functions import getDataTypeFromDate, createOutputDict, getAverageValuesForEveryStation
from calendar import monthrange

def store_daily_temperature(year, month, output_file):
    """
    Fetch and store average air temperature for each day in a month in a JSON file.

    Args:
        year (int): Year of the data.
        month (int): Month of the data (1-12).
        output_file (str): Path to the JSON file where data will be stored.

    Returns:
        dict: A dictionary containing daily average temperature for the month.
    """

    num_days = monthrange(year, month)[1]  # Get the number of days in the month

    # Load existing data if the file exists
    if os.path.exists(output_file):
        with open(output_file, 'r') as file:
            all_data = json.load(file)
    else:
        all_data = {}

    monthly_temperature = {}
    for day in range(1, num_days + 1):
        date = f"{year}-{month:02d}-{day:02d}"
        print(f"Fetching data for {date}...")

        if date in all_data:
            print(f"Data for {date} already exists. Skipping...")
            monthly_temperature[date] = all_data[date]
            continue
        else:
            # Fetch temperature data for the date
            temperature_data = getDataTypeFromDate('air-temperature', date)
            if temperature_data is None:
                print(f"No data available for {date}.")
                continue

            output_dict = getAverageValuesForEveryStation(temperature_data, createOutputDict("temperature_stations.json", temperature_data))

            # Aggregate average temperature for the day
            total_temperature = sum([data[1] for data in output_dict.values()])
            num_stations = len(output_dict)
            average_temperature = total_temperature / num_stations if num_stations > 0 else 0
            monthly_temperature[date] = average_temperature

            # Store the result in the overall data
            all_data[date] = average_temperature

            # Save the updated data to the JSON file
            with open(output_file, 'w') as file:
                json.dump(all_data, file, indent=4)

    return monthly_temperature

def plotTemperatureByMonth(year, month, output_file):
    # Store and fetch monthly temperature data
    monthly_temperature = store_daily_temperature(year, month, output_file)

    # Prepare data for plotting
    days = list(monthly_temperature.keys())
    average_temperature = list(monthly_temperature.values())

    # Plot the bar chart for monthly temperature
    plt.figure(figsize=(12, 6))
    bars = plt.bar(days, average_temperature, color="lightskyblue")

    # Add labels and title
    plt.xlabel('Date')
    plt.ylabel('Average Air Temperature (°C)')
    plt.title(f'Average Air Temperature in {year}-{month:02d}')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add temperature values on top of the bars
    for bar, value in zip(bars, average_temperature):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(), f'{value:.1f}', ha='center', va='bottom')

    # Show the plot
    plt.show()

def plotTemperatureByYear(year, output_file):
    # Fetch yearly temperature data
    yearly_temperature = {}
    for month in range(1, 13):
        monthly_data = store_daily_temperature(year, month, output_file)
        average_temperature = sum(monthly_data.values()) / len(monthly_data) if monthly_data else 0
        yearly_temperature[f"{year}-{month:02d}"] = average_temperature

    # Prepare data for plotting
    months = list(yearly_temperature.keys())
    average_temperature = list(yearly_temperature.values())

    # Plot the bar chart for yearly temperature
    plt.figure(figsize=(10, 6))
    bars = plt.bar(months, average_temperature, color="deepskyblue")

    # Add labels and title
    plt.xlabel('Month')
    plt.ylabel('Average Air Temperature (°C)')
    plt.title(f'Average Air Temperature in {year}')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add temperature values on top of the bars
    for bar, value in zip(bars, average_temperature):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(), f'{value:.1f}', ha='center', va='bottom')

    # Show the plot
    plt.show()

if __name__ == '__main__':  
    OUTPUT_FILE = "daily_average_temperature_data.json"
    #plotTemperatureByMonth(2024, 1, OUTPUT_FILE)
    plotTemperatureByYear(2024, OUTPUT_FILE)
