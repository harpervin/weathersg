from helper_functions import getAverageDataHourly, getAverageValuesForEveryTimestamp, plot_weather_hourly, convert_to_datetime
from collections import defaultdict


if __name__ == "__main__":
    # Specify the date for data
    date = "2024-11-29"

    # Get Hourly Rainfall
    hourly_humidity_data = getAverageDataHourly(data_type='relative-humidity', date=date)
    averaged_humidity_data = getAverageValuesForEveryTimestamp(weather_data=hourly_humidity_data, output_dict=defaultdict(float))
    formatted_humidity_data = convert_to_datetime(aggregated_data=averaged_humidity_data)

    # Plot total hourly rainfall
    plot_weather_hourly(title="Average Hourly Humidity", measurement=hourly_humidity_data['readingUnit'], date=date, hourly_data=formatted_humidity_data)