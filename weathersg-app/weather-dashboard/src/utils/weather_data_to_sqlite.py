import requests
import math
import pandas as pd
import json
import duckdb
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

# Number of threads for parallel API calls
MAX_THREADS = 10

# API Endpoints
api_urls = {
    "wind_speed": "https://api-open.data.gov.sg/v2/real-time/api/wind-speed?date=",
    "wind_direction": "https://api-open.data.gov.sg/v2/real-time/api/wind-direction?date=",
    "relative_humidity": "https://api-open.data.gov.sg/v2/real-time/api/relative-humidity?date=",
    "rainfall": "https://api-open.data.gov.sg/v2/real-time/api/rainfall?date=",
    "air_temperature": "https://api-open.data.gov.sg/v2/real-time/api/air-temperature?date="
}

# Initialize DuckDB connection
db_conn = duckdb.connect("weather_data.duckdb")

def table_exists(param):
    """Check if a table exists in DuckDB."""
    param = param.lower()  # Force lowercase to match DuckDB's storage
    result = db_conn.execute("""
        SELECT COUNT(*) FROM information_schema.tables WHERE lower(table_name) = ?
    """, (param,)).fetchone()

    return result is not None and result[0] > 0  # Ensure fetchone() is valid



def data_exists(param, date):
    """Check if data already exists in the database for the given parameter and date."""
    if not table_exists(param):
        return False  # Table does not exist yet
    try:
        result = db_conn.execute(f"SELECT COUNT(*) FROM {param} WHERE date = ?", (date,)).fetchone()
        return result[0] > 0
    except duckdb.CatalogException:
        return False

def fetch_data(param, date):
    """Fetch API data for a given parameter and date, handling pagination."""
    if data_exists(param, date):
        return param, date, None  # Skip fetching if data already exists

    base_url = api_urls[param] + date
    all_readings = []
    pagination_token = None

    while True:
        url = base_url if not pagination_token else f"{base_url}&paginationToken={pagination_token}"
        try:
            print(f"Fetching {param} data for {date} with paginationToken: {pagination_token}")
            response = requests.get(url)
            if response.status_code != 200:
                print(f"Failed to fetch {param} for {date}: {response.status_code}")
                return param, date, None
            
            data = response.json()
            readings = data.get("data", {}).get("readings", [])
            all_readings.extend(readings)

            # Check for pagination token
            pagination_token = data.get("data", {}).get("paginationToken")
            if not pagination_token:
                break

        except Exception as e:
            print(f"Error fetching {param} for {date}: {e}")
            break

    return param, date, all_readings

# Load station mappings from JSON
with open("wind_stations.json", "r") as f:
    station_mappings = {station["id"]: station for station in json.load(f)}

def store_weather_data_duckdb(param, date, readings):
    """Store weather data in separate DuckDB tables."""
    if not readings:
        return

    data_list = []
    for reading in readings:
        timestamp = reading.get("timestamp")
        for entry in reading.get("data", []):
            data_list.append({
                "date": date,
                "timestamp": timestamp,
                "station_id": entry.get("stationId"),
                "value": entry.get("value")
            })
    
    df = pd.DataFrame(data_list)
    db_conn.execute(f"""
        CREATE TABLE IF NOT EXISTS {param} (
            date STRING,
            timestamp STRING,
            station_id STRING,
            value FLOAT
        )
    """)
    db_conn.execute(f"INSERT INTO {param} SELECT * FROM df")
    print(f"Saved {param} data for {date} to DuckDB.")

def store_wind_combined_data(date, wind_speed_readings, wind_direction_readings):
    """Store combined wind speed, direction, and computed U/V components in a new DuckDB table."""
    if not wind_speed_readings or not wind_direction_readings:
        return

    data_list = []
    for reading in wind_speed_readings:
        timestamp = reading.get("timestamp")
        for entry in reading.get("data", []):
            station_id = entry.get("stationId")
            speed = entry.get("value")
            direction_entry = next((d for d in wind_direction_readings if d.get("timestamp") == timestamp), None)
            direction = next((d.get("value") for d in direction_entry.get("data", []) if d.get("stationId") == station_id), None) if direction_entry else None
            
            if speed is not None and direction is not None:
                new_direction = (direction + 180) % 360
                radians = (new_direction * math.pi) / 180
                u = speed * math.sin(radians)
                v = speed * math.cos(radians)
                
                data_list.append({
                    "date": date,
                    "timestamp": timestamp,
                    "station_id": station_id,
                    "speed": speed,
                    "direction": new_direction,
                    "u": u,
                    "v": v
                })
    
    df = pd.DataFrame(data_list)
    db_conn.execute("""
        CREATE TABLE IF NOT EXISTS wind_combined (
            date STRING,
            timestamp STRING,
            station_id STRING,
            speed FLOAT,
            direction FLOAT,
            u FLOAT,
            v FLOAT
        )
    """)
    db_conn.execute("INSERT INTO wind_combined SELECT * FROM df")
    print(f"Saved combined wind data for {date} to DuckDB.")

def fetch_and_store_data():
    """Fetch and store weather data for the defined year range."""
    start_date = datetime(START_YEAR, 1, 1)
    end_date = datetime(END_YEAR, 1, 1)
    tasks = []
    results = {}

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        current_date = start_date
        while current_date <= end_date:
            formatted_date = current_date.strftime("%Y-%m-%d")
            if any(data_exists(param, formatted_date) for param in api_urls.keys()):
                print(f"Skipping {formatted_date}, data already exists for all parameters.")
            else:
                for param in api_urls.keys():
                    tasks.append(executor.submit(fetch_data, param, formatted_date))
            current_date += timedelta(days=1)

        for future in as_completed(tasks):
            param, date, readings = future.result()
            if readings:
                store_weather_data_duckdb(param, date, readings)
                results.setdefault(date, {})[param] = readings
                store_wind_combined_data(date, results.get(date, {}).get("wind_speed"), results.get(date, {}).get("wind_direction"))
    
    print("All weather data stored in DuckDB.")

MAX_THREADS = 10
START_YEAR = 2021
END_YEAR = 2021

fetch_and_store_data()

db_conn.close()