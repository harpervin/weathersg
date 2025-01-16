import json
import os
import matplotlib.pyplot as plt
from helper_functions import getDataTypeFromDate, createOutputDict, getAverageValuesForEveryStation
from calendar import monthrange


def store_daily_humidity(year, month, output_file):
    """
    Fetch and store average relative humidity for each day in a month in a JSON file.

    Args:
        year (int): Year of the data.
        month (int): Month of the data (1-12).
        output_file (str): Path to the JSON file where data will be stored.

    Returns:
        dict: A dictionary containing daily average humidity for the month.
    """

    # Get the number of days in the month
    num_days = monthrange(year, month)[1]

    # Load existing data if the file exists
    if os.path.exists(output_file):
        with open(output_file, 'r') as file:
            all_data = json.load(file)
    else:
        all_data = {}

    monthly_humidity = {}
    for day in range(1, num_days + 1):
        date = f"{year}-{month:02d}-{day:02d}"
        print(f"Fetching data for {date}...")

        if date in all_data:
            print(f"Data for {date} already exists. Skipping...")
            monthly_humidity[date] = all_data[date]
            continue
        else:
            # Fetch humidity data for the date
            humidity_data = getDataTypeFromDate('relative-humidity', date)
            if humidity_data is None:
                print(f"No data available for {date}.")
                continue

            output_dict = getAverageValuesForEveryStation(humidity_data, createOutputDict(
                "humidity_stations.json", humidity_data))

            # Aggregate average humidity for the day
            total_humidity = sum([data[1] for data in output_dict.values()])
            num_stations = len(output_dict)
            average_humidity = total_humidity / num_stations if num_stations > 0 else 0
            monthly_humidity[date] = average_humidity

            # Store the result in the overall data
            all_data[date] = average_humidity

            # Save the updated data to the JSON file
            with open(output_file, 'w') as file:
                json.dump(all_data, file, indent=4)

    return monthly_humidity


def plotHumidityByMonth(year, month, output_file):
    # Store and fetch monthly humidity data
    monthly_humidity = store_daily_humidity(year, month, output_file)

    # Prepare data for plotting
    days = list(monthly_humidity.keys())
    average_humidity = list(monthly_humidity.values())

    # Plot the bar chart for monthly humidity
    plt.figure(figsize=(12, 6))
    bars = plt.bar(days, average_humidity, color="lightgreen")

    # Add labels and title
    plt.xlabel('Date')
    plt.ylabel('Average Relative Humidity (%)')
    plt.title(f'Average Relative Humidity in {year}-{month:02d}')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add humidity values on top of the bars
    for bar, value in zip(bars, average_humidity):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(),
                 f'{value:.1f}', ha='center', va='bottom')

    # Show the plot
    plt.show()


def plotHumidityByYear(year, output_file):
    # Fetch yearly humidity data
    yearly_humidity = {}
    for month in range(1, 13):
        monthly_data = store_daily_humidity(year, month, output_file)
        average_humidity = sum(monthly_data.values()) / \
            len(monthly_data) if monthly_data else 0
        yearly_humidity[f"{year}-{month:02d}"] = average_humidity

    # Prepare data for plotting
    months = list(yearly_humidity.keys())
    average_humidity = list(yearly_humidity.values())

    # Plot the bar chart for yearly humidity
    plt.figure(figsize=(10, 6))
    bars = plt.bar(months, average_humidity, color="darkgreen")

    # Add labels and title
    plt.xlabel('Month')
    plt.ylabel('Average Relative Humidity (%)')
    plt.title(f'Average Relative Humidity in {year}')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add humidity values on top of the bars
    for bar, value in zip(bars, average_humidity):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(),
                 f'{value:.1f}', ha='center', va='bottom')

    # Show the plot
    plt.show()


if __name__ == '__main__':
    OUTPUT_FILE = "daily_average_humidity_data.json"
    # plotHumidityByMonth(2023, 1, OUTPUT_FILE)
    plotHumidityByYear(2023, OUTPUT_FILE)
