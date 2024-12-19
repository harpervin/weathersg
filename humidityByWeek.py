import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from helper_functions import getDataTypeFromDate, getDataFromStorage, createOutputDict, getAverageValuesForEveryStation
import json

def fetch_weekly_humidity(start_date, storage_json_path):
    """
    Fetch and aggregate average relative humidity for one week.

    Args:
        start_date (str): Start date in YYYY-MM-DD format (Monday).

    Returns:
        dict: A dictionary containing daily average humidity.
    """
    weekly_humidity = {}
    for i in range(7):  # Loop for 7 days (Monday to Sunday)
        date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=i)).strftime("%Y-%m-%d")
        print(f"Fetching data for {date}...")
        
        storage_data = getDataFromStorage(storage_json_path)
        if date in storage_data:
            print(f"Data for {date} already exists. Skipping...")
            average_humidity = storage_data[date]
        else:
            humidity_data = getDataTypeFromDate('relative-humidity', date)
            output_dict = getAverageValuesForEveryStation(humidity_data, createOutputDict("humidity_stations.json", humidity_data))

            # Calculate average humidity for the day
            total_humidity = sum([data[1] for data in output_dict.values()])
            num_stations = len(output_dict)
            average_humidity = total_humidity / num_stations if num_stations > 0 else 0
        
            storage_data[date] = average_humidity
            # Save the updated data to the JSON file
            with open(storage_json_path, 'w') as file:
                json.dump(storage_data, file, indent=4)

        weekly_humidity[date] = average_humidity

    return weekly_humidity

if __name__ == '__main__':
    # Define start date (Monday of the week)
    start_date = "2024-11-25"  # Example start date (YYYY-MM-DD)

    # Fetch weekly humidity data
    weekly_humidity = fetch_weekly_humidity(start_date, 'daily_average_humidity_data.json')

    # Prepare data for plotting
    days = list(weekly_humidity.keys())
    average_humidity = list(weekly_humidity.values())

    # Plot the bar chart for weekly humidity
    plt.figure(figsize=(10, 6))
    bars = plt.bar(days, average_humidity, color="lightgreen")

    # Add labels and title
    plt.xlabel('Date')
    plt.ylabel('Average Relative Humidity (%)')
    plt.title(f'Average Relative Humidity from {days[0]} to {days[-1]}')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add humidity values on top of the bars
    for bar, value in zip(bars, average_humidity):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(), f'{value:.1f}', ha='center', va='bottom')

    # Show the plot
    plt.show()