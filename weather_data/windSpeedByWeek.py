from helper_functions import fetch_weekly_weather, plot_weekly_weather

if __name__ == "__main__":
    # Define start date (Monday of the week)
    start_date = "2024-11-25"  # Example start date (YYYY-MM-DD)

    # Fetch Total Weekly Wind Speed data
    total_weekly_weather, readingUnit = fetch_weekly_weather(
        start_date=start_date,
        storage_json_path="daily_total_windspeed_data.json",
        storage_json_path="wind_stations.json",
        weather_type="wind-speed",
        data_format="total",
    )

    # Fetch Total Weekly Wind Speed data
    average_weekly_weather, readingUnit = fetch_weekly_weather(
        start_date=start_date,
        storage_json_path="daily_average_windspeed_data.json",
        station_json_path="wind_stations.json",
        weather_type="wind-speed",
        data_format="average",
    )

    plot_weekly_weather(
        title="Total Wind Speed",
        readingUnit=readingUnit,
        date=start_date,
        weather_data=total_weekly_weather,
    )
    plot_weekly_weather(
        title="Average Wind Speed",
        readingUnit=readingUnit,
        date=start_date,
        weather_data=average_weekly_weather,
    )
