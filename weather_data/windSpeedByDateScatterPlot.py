import requests
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import geopandas as gpd
from shapely.geometry import Point
import os


# Helper function to fetch all windspeed data for a date
def getAllWindSpeedData(date):
    url = f"https://api-open.data.gov.sg/v2/real-time/api/wind-speed?date={date}"
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


# Helper function to process windspeed data by time
def createWindSpeedDictByTime(all_data):
    readings = all_data["readings"]
    windspeed_by_time = []
    for reading in readings:
        time = reading["timestamp"][11:19]  # Extract time (HH:MM:SS)
        station_readings = {data["stationId"]: data["value"]
                            for data in reading["data"]}
        windspeed_by_time.append((time, station_readings))
    return sorted(windspeed_by_time, key=lambda x: x[0])  # Sort by time


# Main program
if __name__ == "__main__":
    # Specify date for windspeed data
    date = "2024-12-03"
    all_data = getAllWindSpeedData(date)

    # Process windspeed data
    stations = all_data["stations"]
    windspeed_by_time = createWindSpeedDictByTime(all_data)

    # Prepare station metadata
    coordinates = {station["id"]: (station["location"]["longitude"], station["location"]["latitude"])
                   for station in stations}
    station_names = {station["id"]: station["name"] for station in stations}

    # Load Singapore GeoJSON map
    file_path = os.path.join(os.path.dirname(
        __file__), "singapore-boundary.geojson")
    singapore_map = gpd.read_file(file_path)

    # Animated Windspeed Over Time
    # Increase figure size for better layout
    fig, ax = plt.subplots(figsize=(12, 12))
    singapore_map.plot(ax=ax, color="lightgrey", edgecolor="black")

    # Adjust map extent to zoom out
    ax.set_xlim(103.5, 104.1)  # Adjust longitude range
    ax.set_ylim(1.15, 1.5)  # Adjust latitude range

    time_text = ax.text(0.02, 0.95, "", transform=ax.transAxes,
                        fontsize=12, weight="bold")
    text_annotations = {}  # Persistent text annotations for windspeed
    location_annotations = {}  # Persistent text annotations for location names

    # Initialize text annotations
    for station_id, (lon, lat) in coordinates.items():
        text_annotations[station_id] = ax.text(
            lon, lat, "", fontsize=10, ha="center", color="blue", weight="bold")
        location_annotations[station_id] = ax.text(lon, lat + 0.007,  # Slightly above windspeed text
                                                   station_names[station_id], fontsize=10, ha="center", color="green", weight="bold")

    def update(frame):
        time, station_readings = windspeed_by_time[frame]

        # Update windspeed annotations
        for station_id, text in text_annotations.items():
            if station_id in station_readings:
                windspeed = station_readings[station_id]
                text.set_text(f"{windspeed:.1f} knots")
            else:
                text.set_text("")  # Clear text if no data for the station

        # Update time label
        time_text.set_text(f"Time: {time}")
        return list(text_annotations.values()) + [time_text] + list(location_annotations.values())

    ani = FuncAnimation(fig, update, frames=len(
        windspeed_by_time), interval=50, blit=True)

    # Customize and show the plot
    plt.title(f"Animated Windspeed in Singapore ({date})", fontsize=16)
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.grid(True)
    plt.tight_layout()  # Adjust layout for better spacing
    plt.show()
