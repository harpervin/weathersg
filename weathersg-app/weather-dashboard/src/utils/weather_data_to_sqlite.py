import requests
import math
import pandas as pd
import json
import sqlite3
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

# Load station mappings from JSON
with open("wind_stations.json", "r") as f:
    station_mappings = {station["id"]: station for station in json.load(f)}

def get_db_connection(year):
    """Return a SQLite connection for the given year."""
    return sqlite3.connect(f"weather_{year}.db")

def table_exists(conn, param):
    """Check if a table exists in SQLite."""
    cursor = conn.cursor()
    cursor.execute("SELECT count(name) FROM sqlite_master WHERE type='table' AND name=?", (param,))
    return cursor.fetchone()[0] > 0

def data_exists(year, param, date):
    """Check if data exists for a given parameter and date in the specified year's database."""
    conn = get_db_connection(year)
    if not table_exists(conn, param):
        conn.close()
        return False  # If table doesn't exist, assume data does not exist

    cursor = conn.cursor()
    cursor.execute(f"SELECT COUNT(*) FROM {param} WHERE date = ?", (date,))
    result = cursor.fetchone()
    conn.close()
    return result[0] > 0 if result else False

def format_timestamp(timestamp):
    """Convert timestamp to 'YYYY-MM-DD HH:MM:SS' format."""
    return datetime.strptime(timestamp[:19], "%Y-%m-%dT%H:%M:%S").strftime("%Y-%m-%d %H:%M:%S")

def fetch_data(param, date):
    """Fetch API data for a given parameter and date, handling pagination."""
    year = date.split("-")[0]  # Extract year
    if data_exists(year, param, date):
        return param, date, None  # Skip if data exists

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

def store_weather_data_sqlite(year, param, date, readings):
    """Store weather data in separate SQLite tables per year."""
    if not readings:
        return

    conn = get_db_connection(year)
    cursor = conn.cursor()

    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {param} (
            date TEXT,
            timestamp TEXT, -- Stored in 'YYYY-MM-DD HH:MM:SS' format
            stationId TEXT,
            value REAL,
            PRIMARY KEY (date, timestamp, stationId)
        )
    """)

    data_list = [(date, format_timestamp(reading["timestamp"]), entry["stationId"], entry["value"])  # Ensure timestamp format
                 for reading in readings for entry in reading.get("data", [])]

    cursor.executemany(f"INSERT OR IGNORE INTO {param} VALUES (?, ?, ?, ?)", data_list)
    conn.commit()
    conn.close()

def store_wind_combined_data(year, date, wind_speed_readings, wind_direction_readings):
    """Store combined wind speed, direction, and computed U/V components in a new SQLite table."""
    if not wind_speed_readings or not wind_direction_readings:
        return

    conn = get_db_connection(year)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS wind_combined (
            date DATE,
            timestamp DATETIME, -- Stored in 'YYYY-MM-DD HH:MM:SS' format
            stationId TEXT,
            speed REAL,
            direction REAL,
            u REAL,
            v REAL,
            PRIMARY KEY (date, timestamp, stationId)
        )
    """)

    data_list = []
    for reading in wind_speed_readings:
        timestamp = format_timestamp(reading["timestamp"])  # Convert timestamp format
        for entry in reading["data"]:
            station_id = entry["stationId"]
            speed = entry["value"]
            direction_entry = next((d for d in wind_direction_readings if d["timestamp"] == timestamp), None)
            direction = next((d["value"] for d in direction_entry["data"] if d["stationId"] == station_id), None) if direction_entry else None

            if speed is not None and direction is not None:
                new_direction = (direction + 180) % 360
                radians = (new_direction * math.pi) / 180
                u = speed * math.sin(radians)
                v = speed * math.cos(radians)

                data_list.append((date, timestamp, station_id, speed, new_direction, u, v))

    cursor.executemany("INSERT OR IGNORE INTO wind_combined VALUES (?, ?, ?, ?, ?, ?, ?)", data_list)
    conn.commit()
    conn.close()

def fetch_and_store_data():
    """Fetch and store weather data for the defined year range."""
    start_date = datetime(START_YEAR, 1, 1)
    end_date = datetime(END_YEAR, 12, 31)
    tasks = []
    results = {}

    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        current_date = start_date
        while current_date <= end_date:
            formatted_date = current_date.strftime("%Y-%m-%d")
            year = current_date.year
            if all(data_exists(year, param, formatted_date) for param in api_urls.keys()):
                print(f"Skipping {formatted_date}, data already exists.")
            else:
                for param in api_urls.keys():
                    tasks.append(executor.submit(fetch_data, param, formatted_date))
            current_date += timedelta(days=1)

        for future in as_completed(tasks):
            param, date, readings = future.result()
            if readings:
                year = date.split("-")[0]
                store_weather_data_sqlite(year, param, date, readings)
                results.setdefault(date, {})[param] = readings
                store_wind_combined_data(year, date, results.get(date, {}).get("wind_speed"), results.get(date, {}).get("wind_direction"))

    print("All weather data stored in SQLite.")

MAX_THREADS = 10
START_YEAR = 2021
END_YEAR = 2021

fetch_and_store_data()
