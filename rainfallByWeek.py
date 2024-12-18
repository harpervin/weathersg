import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from helper_functions import getDataTypeFromDate, sumValuesForEveryStation, createOutputDict, getDataFromStorage
import json

def fetch_weekly_rainfall(start_date, storage_json_path):
    """
    Fetch and aggregate total rainfall for one week.

    Args:
        start_date (str): Start date in YYYY-MM-DD format (Monday).

    Returns:
        dict: A dictionary containing daily total rainfall.
    """
    weekly_rainfall = {}
    for i in range(7):  # Loop for 7 days (Monday to Sunday)
        date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=i)).strftime("%Y-%m-%d")
        print(f"Fetching data for {date}...")
        storage_data = getDataFromStorage(storage_json_path)
        if date in storage_data:
            print(f"Data for {date} already exists. Skipping...")
            total_rainfall = storage_data[date]
        else:
            rainfall_data = getDataTypeFromDate('rainfall', date)
            output_dict = sumValuesForEveryStation(rainfall_data, createOutputDict("rainfall_stations.json", rainfall_data))

            # Aggregate total rainfall for the day
            total_rainfall = sum([data[1] for data in output_dict.values()])
        
            storage_data[date] = total_rainfall
            # Save the updated data to the JSON file
            with open(storage_json_path, 'w') as file:
                json.dump(storage_data, file, indent=4)

        weekly_rainfall[date] = total_rainfall

    return weekly_rainfall


if __name__ == '__main__':
    # Define start date (Monday of the week)
    start_date = "2021-11-25"  # Example start date (YYYY-MM-DD)

    # Fetch weekly rainfall data
    weekly_rainfall = fetch_weekly_rainfall(start_date, 'daily_total_rainfall_data.json')

    # Prepare data for plotting
    days = list(weekly_rainfall.keys())
    total_rainfall = list(weekly_rainfall.values())

    # Plot the bar chart for weekly rainfall
    plt.figure(figsize=(10, 6))
    bars = plt.bar(days, total_rainfall, color="skyblue")

    # Add labels and title
    plt.xlabel('Date')
    plt.ylabel('Total Rainfall (mm)')
    plt.title(f'Total Rainfall from {days[0]} to {days[-1]}')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Add rainfall values on top of the bars
    for bar, value in zip(bars, total_rainfall):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(), f'{value:.1f}', ha='center', va='bottom')

    # Show the plot
    plt.show()