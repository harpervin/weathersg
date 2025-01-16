import requests
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import geopandas as gpd
from shapely.geometry import Point
import os


# Helper functions
def getRainfallByDateJson(date):
    url = f"https://api.data.gov.sg/v1/environment/rainfall?date={date}"
    response = requests.get(url)
    return response.json()


def getStationsJson():
    url = "https://api.data.gov.sg/v1/environment/rainfall"
    response = requests.get(url)
    return response.json()['metadata']['stations']


def createRainfallDictByTime(rainfall_data):
    items = rainfall_data['items']
    rainfall_by_time = []
    for timestamp in items:
        time = timestamp['timestamp'][11:19]  # Extract time (HH:MM:SS)
        station_readings = {reading['station_id']: reading['value']
                            for reading in timestamp['readings']}
        rainfall_by_time.append((time, station_readings))
    return rainfall_by_time


def createTotalRainfallDict(rainfall_data):
    items = rainfall_data['items']
    station_rainfall = {}
    for timestamp in items:
        for reading in timestamp['readings']:
            station_id = reading['station_id']
            station_rainfall[station_id] = station_rainfall.get(
                station_id, 0) + reading['value']
    return station_rainfall


# Main program
if __name__ == "__main__":
    # Load station and rainfall data
    date = "2025-01-11"
    rainfall_data = getRainfallByDateJson(date)
    stations = getStationsJson()
    rainfall_by_time = createRainfallDictByTime(rainfall_data)
    total_rainfall = createTotalRainfallDict(rainfall_data)

    # Prepare station coordinates and metadata
    coordinates = {station['id']: (station['location']['longitude'], station['location']['latitude'])
                   for station in stations}
    station_names = {station['id']: station['name'] for station in stations}

    # Load Singapore GeoJSON map
    file_path = os.path.join(os.path.dirname(
        __file__), "singapore-boundary.geojson")
    singapore_map = gpd.read_file(file_path)

    # User choice for visualization
    print("Choose visualization mode:")
    print("1. View Total Rainfall")
    print("2. View Animated Rainfall Over Time")
    choice = input("Enter your choice (1 or 2): ")

    if choice == "1":
        # Total Rainfall Plot
        coordinates_list = []
        rainfall_values = []
        for station_id, rainfall in total_rainfall.items():
            if station_id in coordinates:
                lon, lat = coordinates[station_id]
                coordinates_list.append((lon, lat))
                rainfall_values.append(rainfall)

        # Create GeoDataFrame
        geometry = [Point(lon, lat) for lon, lat in coordinates_list]
        gdf = gpd.GeoDataFrame(
            {'Rainfall': rainfall_values}, geometry=geometry, crs="EPSG:4326")

        # Plot
        fig, ax = plt.subplots(figsize=(10, 10))
        singapore_map.plot(ax=ax, color='lightgrey', edgecolor='black')
        gdf.plot(ax=ax, markersize=gdf['Rainfall']
                 * 10, color='blue', alpha=0.6, legend=True)

        # Add labels
        for x, y, label in zip(gdf.geometry.x, gdf.geometry.y, gdf['Rainfall']):
            ax.annotate(f"{label:.1f}", (x, y), fontsize=10,
                        ha='center', color='red', weight='bold')

        plt.title(f"Total Rainfall on {date} in Singapore", fontsize=16)
        plt.xlabel("Longitude")
        plt.ylabel("Latitude")
        plt.grid(True)
        plt.show()

    elif choice == "2":
        # Animated Rainfall Over Time
        fig, ax = plt.subplots(figsize=(10, 10))
        singapore_map.plot(ax=ax, color='lightgrey', edgecolor='black')

        scatter = ax.scatter([], [], s=[], c='blue', alpha=0.6)
        time_text = ax.text(
            0.02, 0.95, '', transform=ax.transAxes, fontsize=12, weight='bold')

        def update(frame):
            time, station_readings = rainfall_by_time[frame]
            lons = []
            lats = []
            sizes = []
            for station_id, rainfall in station_readings.items():
                if station_id in coordinates:
                    lon, lat = coordinates[station_id]
                    lons.append(lon)
                    lats.append(lat)
                    sizes.append(rainfall * 10)

            scatter.set_offsets(list(zip(lons, lats)))
            scatter.set_sizes(sizes)
            time_text.set_text(f"Time: {time}")
            return scatter, time_text

        ani = FuncAnimation(fig, update, frames=len(
            rainfall_by_time), interval=50, blit=True)
        plt.title(f"Rainfall on {date} in Singapore (Animated)", fontsize=16)
        plt.xlabel("Longitude")
        plt.ylabel("Latitude")
        plt.grid(True)
        plt.show()

    else:
        print("Invalid choice. Please restart the program and enter 1 or 2.")
