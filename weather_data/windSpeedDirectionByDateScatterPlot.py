import requests
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import geopandas as gpd
import numpy as np
import os


# Helper function to fetch all data for a given endpoint
def getAllData(endpoint, date):
    url = f"https://api-open.data.gov.sg/v2/real-time/api/{endpoint}?date={date}"
    all_readings = []
    pagination_token = None

    while True:
        params = {"paginationToken": pagination_token} if pagination_token else {}
        response = requests.get(url, params=params)
        data = response.json()
        all_readings.extend(data["data"]["readings"])
        pagination_token = data["data"].get("paginationToken")
        if not pagination_token:
            break

    return {
        "stations": data["data"]["stations"],
        "readings": all_readings
    }


# Helper function to process data by time
def createDictByTime(all_data):
    readings = all_data["readings"]
    data_by_time = []
    for reading in readings:
        time = reading["timestamp"][11:19]  # Extract time (HH:MM:SS)
        station_readings = {data["stationId"]: data["value"]
                            for data in reading["data"]}
        data_by_time.append((time, station_readings))
    return sorted(data_by_time, key=lambda x: x[0])  # Sort by time


# Main program
if __name__ == "__main__":
    # Specify date for the data
    date = "2024-12-03"
    wind_speed_data = getAllData("wind-speed", date)
    wind_direction_data = getAllData("wind-direction", date)

    # Process data
    stations = wind_speed_data["stations"]
    wind_speed_by_time = createDictByTime(wind_speed_data)
    wind_direction_by_time = createDictByTime(wind_direction_data)

    # Prepare station metadata
    coordinates = {station["id"]: (station["location"]["longitude"], station["location"]["latitude"])
                   for station in stations}
    station_names = {station["id"]: station["name"] for station in stations}

    # Load Singapore GeoJSON map
    file_path = os.path.join(os.path.dirname(
        __file__), "singapore-boundary.geojson")
    singapore_map = gpd.read_file(file_path)

    # Increase figure size for better layout
    fig, ax = plt.subplots(figsize=(12, 12))
    singapore_map.plot(ax=ax, color="lightgrey", edgecolor="black")

    ax.set_xlim(103.5, 104.1)
    ax.set_ylim(1.15, 1.5)

    time_text = ax.text(0.02, 0.95, "", transform=ax.transAxes,
                        fontsize=12, weight="bold")
    text_annotations = {}
    location_annotations = {}
    quiver = None

    for station_id, (lon, lat) in coordinates.items():
        text_annotations[station_id] = ax.text(
            lon, lat, "", fontsize=10, ha="center", color="blue", weight="bold")
        location_annotations[station_id] = ax.text(
            lon, lat + 0.007, station_names[station_id], fontsize=10, ha="center", color="green", weight="bold")

    def update(frame):
        global quiver
        if quiver:
            quiver.remove()

        time = wind_speed_by_time[frame][0]
        wind_speeds = wind_speed_by_time[frame][1]
        wind_directions = wind_direction_by_time[frame][1]

        lons, lats, u, v = [], [], [], []
        for station_id in wind_speeds.keys():
            if station_id in coordinates:
                lon, lat = coordinates[station_id]
                wind_speed = wind_speeds[station_id]
                wind_direction = wind_directions.get(station_id, 0)

                # Update annotations
                text_annotations[station_id].set_text(
                    f"{wind_speed:.1f} knots")

                # Calculate arrow vectors for wind direction
                rad = np.deg2rad(wind_direction)
                u.append(0.01 * np.sin(rad))  # Scale factor
                v.append(0.01 * np.cos(rad))  # Scale factor
                lons.append(lon)
                lats.append(lat - 0.007)

        quiver = ax.quiver(lons, lats, u, v, angles='xy', scale_units='xy', scale=1,
                           color='red', width=0.002)

        time_text.set_text(f"Time: {time}")
        return list(text_annotations.values()) + [time_text] + list(location_annotations.values())

    ani = FuncAnimation(fig, update, frames=len(
        wind_speed_by_time), interval=50, blit=False)

    plt.title(
        f"Animated Wind Speed and Direction in Singapore ({date})", fontsize=16)
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.grid(True)
    plt.tight_layout()
    plt.show()
