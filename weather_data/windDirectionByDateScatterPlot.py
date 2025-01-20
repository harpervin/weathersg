import requests
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import geopandas as gpd
import numpy as np
import os


# Helper function to fetch all wind direction data for a date
def getAllWindDirectionData(date):
    url = f"https://api-open.data.gov.sg/v2/real-time/api/wind-direction?date={date}"
    all_readings = []
    pagination_token = None

    while True:
        # Make the request with paginationToken if it exists
        params = {"paginationToken": pagination_token} if pagination_token else {}
        response = requests.get(url, params=params)
        data = response.json()

        # Collect readings from the current response
        all_readings.extend(data["data"]["readings"])

        # Check if there's a next page
        pagination_token = data["data"].get("paginationToken")
        if not pagination_token:
            break

    return {
        "stations": data["data"]["stations"],
        "readings": all_readings
    }


# Helper function to process wind direction data by time
def createWindDirectionDictByTime(all_data):
    readings = all_data["readings"]
    wind_direction_by_time = []
    for reading in readings:
        time = reading["timestamp"][11:19]  # Extract time (HH:MM:SS)
        station_readings = {data["stationId"]: data["value"]
                            for data in reading["data"]}
        wind_direction_by_time.append((time, station_readings))
    return sorted(wind_direction_by_time, key=lambda x: x[0])  # Sort by time


# Main program
if __name__ == "__main__":
    # Specify date for wind direction data
    date = "2024-12-03"
    all_data = getAllWindDirectionData(date)

    # Process wind direction data
    stations = all_data["stations"]
    wind_direction_by_time = createWindDirectionDictByTime(all_data)

    # Prepare station metadata
    coordinates = {station["id"]: (station["location"]["longitude"], station["location"]["latitude"])
                   for station in stations}
    station_names = {station["id"]: station["name"] for station in stations}

    # Load Singapore GeoJSON map
    file_path = os.path.join(os.path.dirname(
        __file__), "singapore-boundary.geojson")
    try:
        singapore_map = gpd.read_file(file_path)
    except FileNotFoundError:
        print("GeoJSON file not found. Please ensure it is in the same directory as the script.")
        exit()

    # Animated Wind Direction Over Time
    # Increase figure size for better layout
    fig, ax = plt.subplots(figsize=(12, 12))
    singapore_map.plot(ax=ax, color="lightgrey", edgecolor="black")

    # Adjust map extent to zoom out
    ax.set_xlim(103.6, 104.1)  # Adjust longitude range
    ax.set_ylim(1.2, 1.5)  # Adjust latitude range

    time_text = ax.text(0.02, 0.95, "", transform=ax.transAxes,
                        fontsize=12, weight="bold")

    quiver = None  # Define this at the beginning of the script

    def update(frame):
        global quiver
        time, station_readings = wind_direction_by_time[frame]

        # Clear previous arrows
        if quiver:
            quiver.remove()

        # Add arrows for the current frame
        lons, lats, u, v = [], [], [], []
        for station_id, wind_dir in station_readings.items():
            if station_id in coordinates:
                lon, lat = coordinates[station_id]
                # Convert wind direction degrees to vector components
                rad = np.deg2rad(wind_dir)
                u.append(0.01 * np.sin(rad))  # Normalize length (scale factor)
                v.append(0.01 * np.cos(rad))  # Normalize length (scale factor)
                lons.append(lon)
                lats.append(lat)

        # Plot arrows using quiver
        quiver = ax.quiver(lons, lats, u, v, angles='xy', scale_units='xy',
                        scale=1, color='blue', width=0.002)

        # Update time label
        time_text.set_text(f"Time: {time}")
        return [time_text]


    ani = FuncAnimation(fig, update, frames=len(
        wind_direction_by_time), interval=50, blit=False)

    # Customize and show the plot
    plt.title(f"Animated Wind Direction in Singapore ({date})", fontsize=16)
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.grid(True)
    plt.tight_layout()  # Adjust layout for better spacing
    plt.show()