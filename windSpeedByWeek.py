from helper_functions import fetch_weekly_weather, plot_weekly_weather


if __name__ == '__main__':
    # Define start date (Monday of the week)
    start_date = "2024-11-25"  # Example start date (YYYY-MM-DD)

    # Fetch Total Weekly Wind Speed data
    total_weekly_weather, readingUnit = fetch_weekly_weather(
        start_date, 'daily_total_windspeed_data.json', 'wind_stations.json', 'wind-speed', 'total')
    
    # Fetch Total Weekly Wind Speed data
    average_weekly_weather, readingUnit = fetch_weekly_weather(
        start_date, 'daily_average_windspeed_data.json', 'wind_stations.json', 'wind-speed', 'average')

    plot_weekly_weather(title="Total Wind Speed", readingUnit=readingUnit,
                        date=start_date, weather_data=total_weekly_weather)
    plot_weekly_weather(title="Average Wind Speed", readingUnit=readingUnit,
                        date=start_date, weather_data=average_weekly_weather)
