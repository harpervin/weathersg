from helper_functions import getAverageDataHourly, getAverageValuesForEveryTimestamp, plot_weather_hourly, convert_to_datetime
from collections import defaultdict


if __name__ == "__main__":
    # Specify the date for data
    date = "2024-11-29"

    # Get Hourly Rainfall
    hourly_temp_data = getAverageDataHourly(data_type='air-temperature', date=date)
    averaged_temp_data = getAverageValuesForEveryTimestamp(weather_data=hourly_temp_data, output_dict=defaultdict(float))
    formatted_temp_data = convert_to_datetime(aggregated_data=averaged_temp_data)

    # Plot total hourly rainfall
    plot_weather_hourly(title="Average Hourly Air Temperature", measurement=hourly_temp_data['readingUnit'], date=date, hourly_data=formatted_temp_data)

