import requests
import sqlite3
import math
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
# Number of threads for parallel API calls
MAX_THREADS = 10

# Database setup
db_file = "weather_data.db"
conn = sqlite3.connect(db_file, check_same_thread=False)  # Allow multi-threaded DB access
cursor = conn.cursor()

# API Endpoints
api_urls = {
    "wind_speed": "https://api-open.data.gov.sg/v2/real-time/api/wind-speed?date=",
    "wind_direction": "https://api-open.data.gov.sg/v2/real-time/api/wind-direction?date=",
    "relative_humidity": "https://api-open.data.gov.sg/v2/real-time/api/relative-humidity?date=",
    "rainfall": "https://api-open.data.gov.sg/v2/real-time/api/rainfall?date=",
    "air_temperature": "https://api-open.data.gov.sg/v2/real-time/api/air-temperature?date="
}

# Create tables for each weather parameter
for param in api_urls.keys():
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS {param} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            timestamp TEXT,
            station_id TEXT,
            value REAL,
            UNIQUE(date, timestamp, station_id)
        )
    ''')

# Create table for combined wind data
cursor.execute(f'''
    CREATE TABLE IF NOT EXISTS wind_combined (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        timestamp TEXT,
        station_id TEXT,
        name TEXT,
        latitude REAL,
        longitude REAL,
        speed REAL,
        direction REAL,
        u REAL,
        v REAL,
        UNIQUE(timestamp, station_id)
    )
''')

conn.commit()

def data_exists_for_date(param, date):
    """Check if data for a given parameter and date already exists in the database."""
    cursor.execute(f"SELECT COUNT(*) FROM {param} WHERE date = ?", (date,))
    return cursor.fetchone()[0] > 0  # Returns True if data exists

def fetch_data(param, date):
    """Fetch API data for a given parameter and date, handling pagination."""
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
                break  # No more pages to fetch

        except Exception as e:
            print(f"Error fetching {param} for {date}: {e}")
            break

    return param, date, all_readings

def store_weather_data(param, date, readings):
    """Store weather data in the SQLite database."""
    if not readings:
        return

    for reading in readings:
        timestamp = reading.get("timestamp")
        for entry in reading.get("data", []):
            station_id = entry.get("stationId")
            value = entry.get("value")

            cursor.execute(f"""
                INSERT OR IGNORE INTO {param} (date, timestamp, station_id, value) 
                VALUES (?, ?, ?, ?)
            """, (date, timestamp, station_id, value))

    conn.commit()

# Load station mappings from JSON
with open("wind_stations.json", "r") as f:
    station_mappings = {station["id"]: station for station in json.load(f)}

def store_combined_wind_data(date, wind_speed_data, wind_direction_data, cursor, conn):
    """Store combined wind speed, wind direction, and U/V components for each timestamp."""
    if not wind_speed_data or not wind_direction_data:
        print(f"Skipping {date}, missing wind data.")
        return

    # Extract readings list (contains multiple timestamps)
    wind_speed_readings = wind_speed_data if isinstance(wind_speed_data, list) else []
    wind_direction_readings = wind_direction_data if isinstance(wind_direction_data, list) else []

    # Collect all readings grouped by timestamp
    speed_readings = {}
    direction_readings = {}


    print(wind_speed_readings)

    for entry in wind_speed_readings:
        timestamp = entry.get("timestamp")
        for data_point in entry.get("data", []):
            station_id = data_point["stationId"]
            if timestamp not in speed_readings:
                speed_readings[timestamp] = {}
            speed_readings[timestamp][station_id] = data_point["value"]

    for entry in wind_direction_readings:
        timestamp = entry.get("timestamp")
        for data_point in entry.get("data", []):
            station_id = data_point["stationId"]
            if timestamp not in direction_readings:
                direction_readings[timestamp] = {}
            direction_readings[timestamp][station_id] = data_point["value"]

    # Process wind speed & direction for each timestamp
    for timestamp in speed_readings.keys():
        for station_id, station_info in station_mappings.items():
            name = station_info["name"]
            latitude = station_info["location"]["latitude"]
            longitude = station_info["location"]["longitude"]

            # Get wind speed and direction (default to 0 if missing)
            speed = speed_readings.get(timestamp, {}).get(station_id, 0)
            direction = direction_readings.get(timestamp, {}).get(station_id, 0)

            # Adjust direction and compute U and V components
            new_direction = (direction + 180) % 360
            radians = (new_direction * math.pi) / 180  # Convert degrees to radians
            u = speed * math.sin(radians)
            v = speed * math.cos(radians)

            cursor.execute("""
                INSERT OR IGNORE INTO wind_combined (date, timestamp, station_id, name, latitude, longitude, speed, direction, u, v) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (date, timestamp, station_id, name, latitude, longitude, speed, new_direction, u, v))

    conn.commit()



def fetch_and_store_data(start_year, end_year):
    """Fetch and store data using multi-threading for fast API calls."""
    start_date = datetime(start_year, 2, 14)
    end_date = datetime(end_year, 2, 14)

    tasks = []
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        current_date = start_date
        while current_date <= end_date:
            formatted_date = current_date.strftime("%Y-%m-%d")

            for param in api_urls.keys():
                if data_exists_for_date(param, formatted_date):
                    print(f"Skipping {param} for {formatted_date}, data already exists.")
                else:
                    tasks.append(executor.submit(fetch_data, param, formatted_date))

            current_date += timedelta(days=1)

        # Process API responses as they complete
        results = {}
        for future in as_completed(tasks):
            param, date, readings = future.result()
            if readings:
                store_weather_data(param, date, readings)
                results.setdefault(date, {})[param] = readings

        # Process combined wind data
        for date, datasets in results.items():
            wind_speed_data = datasets.get("wind_speed")
            wind_direction_data = datasets.get("wind_direction")

            if wind_speed_data and wind_direction_data:
                store_combined_wind_data(date, wind_speed_data, wind_direction_data, cursor, conn)

    print(f"All weather data stored in {db_file}")

# Run the function (multi-threaded)
fetch_and_store_data(2025, 2025)

# Close the connection
conn.close()
