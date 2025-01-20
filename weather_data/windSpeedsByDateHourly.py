from helper_functions import getTotalDataHourly, sumValuesForEveryEntry, getAverageDataHourly, getAverageValuesForEveryTimestamp, plot_weather_hourly, convert_to_datetime
from collections import defaultdict


if __name__ == "__main__":
    # Specify the date for data
    date = "2024-11-29"

    # Get Average Hourly Wind Speed
    avg_hourly_wspeed_data = getAverageDataHourly(data_type='wind-speed', date=date)
    averaged_wspeed_data = getAverageValuesForEveryTimestamp(weather_data=avg_hourly_wspeed_data, output_dict=defaultdict(float))
    formatted_wspeed_data = convert_to_datetime(aggregated_data=averaged_wspeed_data)

    # Get Total Hourly Wind Speed
    total_hourly_wspeed_data = getTotalDataHourly(data_type='wind-speed', date=date)
    averaged_wspeed_data = sumValuesForEveryEntry(weather_data=total_hourly_wspeed_data, output_dict=defaultdict(float))
    formatted_wspeed_data = convert_to_datetime(aggregated_data=averaged_wspeed_data)

    # Plot Average Hourly Wind Speed
    plot_weather_hourly(title="Average Hourly Air Wind Speed", measurement=avg_hourly_wspeed_data['readingUnit'], date=date, hourly_data=formatted_wspeed_data)

    # Plot Total Hourly Wind Speed
    plot_weather_hourly(title="Total Hourly Air Wind Speed", measurement=total_hourly_wspeed_data['readingUnit'], date=date, hourly_data=formatted_wspeed_data)
