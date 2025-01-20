import requests
import matplotlib.pyplot as plt
import geopandas as gpd
from shapely.geometry import Point
import os


# Helper function to fetch wind speed data
def getWindSpeedData():
    url = "https://api-open.data.gov.sg/v2/real-time/api/wind-speed"
    response = requests.get(url)
    return response.json()


# Main program
if __name__ == "__main__":
    # Fetch wind speed data
    wind_data = getWindSpeedData()

    # Extract station data and windspeed readings
    stations = wind_data["data"]["stations"]
    # Take the latest readings
    readings = wind_data["data"]["readings"][0]["data"]

    # Prepare data for plotting
    coordinates = []
    windspeed_values = []
    station_names = []

    # Create a mapping of station IDs to wind speed values
    windspeed_dict = {reading["stationId"]: reading["value"]
                      for reading in readings}

    for station in stations:
        station_id = station["id"]
        if station_id in windspeed_dict:
            coordinates.append(
                (station["location"]["longitude"], station["location"]["latitude"]))
            windspeed_values.append(windspeed_dict[station_id])
            station_names.append(station["name"])

    # Create GeoDataFrame
    geometry = [Point(lon, lat) for lon, lat in coordinates]
    gdf = gpd.GeoDataFrame({"Windspeed (knots)": windspeed_values, "Station": station_names},
                           geometry=geometry, crs="EPSG:4326")

    # Load Singapore GeoJSON map
    file_path = os.path.join(os.path.dirname(
        __file__), "singapore-boundary.geojson")
    singapore_map = gpd.read_file(file_path)

    # Plot the map with windspeed text
    fig, ax = plt.subplots(figsize=(10, 10))
    singapore_map.plot(ax=ax, color='lightgrey', edgecolor='black')

    # Add windspeed values as text
    for x, y, label in zip(gdf.geometry.x, gdf.geometry.y, gdf["Windspeed (knots)"]):
        ax.text(x, y, f"{label:.1f} knots", fontsize=10,
                ha='center', color='blue', weight='bold')

    # Customize the plot
    plt.title("Windspeed in Singapore (Real-Time) - Knots", fontsize=16)
    plt.xlabel("Longitude")
    plt.ylabel("Latitude")
    plt.grid(True)

    # Show plot
    plt.show()
