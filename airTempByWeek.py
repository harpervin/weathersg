import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from helper_functions import getDataTypeFromDate, getDataFromStorage, createOutputDict, averageValuesInDict
import json

def fetch_weekly_temperature(start_date, storage_json_path):
    """
    Fetch and aggregate average air temperature for one week.

    Args:
        start_date (str): Start date in YYYY-MM-DD format (Monday).
        storage_json_path (str): Path to JSON file for storing fetched data.

    Returns:
        dict: A dictionary containing daily average temperature.
    """
    weekly_temperature = {}
    for i in range(7):  # Loop for 7 days (Monday to Sunday)
        date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=i)).strftime("%Y-%m-%d")
        print(f"Fetching data for {date}...")
        
        storage_data = getDataFromStorage(storage_json_path)
        if date in storage_data:
            print(f"Data for {date} already exists. Skipping...")
            average_temperature = storage_data[date]
        else:
            temperature_data = getDataTypeFromDate('air-temperature', date)
            output_dict = averageValuesInDict(temperature_data, createOutputDict("temperature_stations.json", temperature_data))

            # Calculate average temperature for the day
            total_temperature = sum([data[1] for data in output_dict.values()])
            num_stations = len(output_dict)
            average_temperature = total_temperature / num_stations if num_stations > 0 else 0
        
            storage_data[date] = average_temperature
            # Save the updated data to the JSON file
            with open(storage_json_path, 'w') as file:
                json.dump(storage_data, file, indent=4)

        weekly_temperature[date] = average_temperature

    return weekly_temperature

if __name__ == '__main__':
    # Define start date (Monday of the week)
    start_date = "2024-11-25"  # Example start date (YYYY-MM-DD)

    # Fetch weekly air temperature data
    weekly_temperature = fetch_weekly_temperature(start_date, 'daily_average_temperature_data.json')

    # Prepare data for plotting
    days = list(weekly_temperature.keys())
    average_temperature = list(weekly_temperature.values())

    # Plot the bar chart for weekly air temperature
    plt.figure(figsize=(10, 6))
    bars = plt.bar(days, average_temperature, color="lightskyblue")

    # Add labels and title
    plt.xlabel('Date')
    plt.ylabel('Average Air Temperature (°C)')
    plt.title(f'Average Air Temperature from {days[0]} to {days[-1]}')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add temperature values on top of the bars
    for bar, value in zip(bars, average_temperature):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(), f'{value:.1f}', ha='center', va='bottom')

    # Show the plot
    plt.show()
