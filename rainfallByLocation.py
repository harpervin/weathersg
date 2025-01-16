import requests
import matplotlib.pyplot as plt
from rainfallByDateBarChart import getStationsJson

# Run helper functions to get rainfall data and prepare for plotting


'''
1. get list of locations
2. input one location
3. filter out data for that location from rainfall data
4. store data in timestamps, rainfall lists
5. plot

6. edge case where location name is not given with the original rainfall data
'''

# locations = ['Alexandra Road', 'Ang Mo Kio Avenue 5', 'Bukit Timah Road', 'Choa Chu Kang Avenue 4', 'Clementi Road', 'East Coast Parkway', 'GEYLANG EAST CENTRAL', 'Handy Road', 'Holland Road', 'Jurong Pier Road', 'Kent Ridge Road', 'Kim Chuan Road', 'Kranji Way', 'Lim Chu Kang Road', 'Mandai Lake Road', 'Marina Gardens Drive', 'Marine Parade Road', 'Nanyang Avenue', 'Nicoll Highway', 'Old Choa Chu Kang Road', 'Pasir Ris Street 51', 'Poole Road', 'Punggol Central', 'Clementi Park', 'Pasir Panjang', 'Bedok Road', 'Changi East Close', 'Yishun Ring Road', 'Woodlands Centre', 'Kranji Road', 'Coronation Walk', 'Tanjong Rhu', 'Ang Mo Kio Avenue 10', 'Bishan Street 13', 'Bukit Batok Street 34', 'Yio Chu Kang Road', 'Compassvale Lane', 'Hougang Avenue 1', 'Henderson Road', 'Margaret Drive', 'Airport Boulevard', 'Malan Road', 'Woodlands Drive 62', 'Jurong West Street 73', 'Jurong West Street 42', 'West Coast Road', 'Seletar Aerospace View', 'Simei Avenue', 'Somerset Road', 'Toa Payoh North', 'Towner Road', 'Tuas Road', 'Tuas South Avenue 3', 'Tuas West Road', 'Upper Changi Road North', 'Upper Thomson Road', 'West Coast Highway', 'Woodlands Avenue 9', 'Woodlands Road', 'Pulau Ubin', 'Scotts Road', 'Upper Peirce Reservoir Park']
def getRainfallByDateJson(date):
    # Create the URL for the specific date
    url = f"https://api-open.data.gov.sg/v2/real-time/api/rainfall?date={date}"
    # Fetch specific date data from the API
    response = requests.get(url)
    data = response.json()
    return data

def getLocationId(location_name):
    stations = getStationsJson()
    # print(stations)
    for station in stations:
        if station['name'] == location_name:
            return station['id']


def getRainfallFromTimestamp(location_id, readings):
    for reading in readings:
        if reading['station_id'] == location_id:
            return reading['value']


if __name__ == '__main__':
    date = '2022-01-01'  # Define the desired date in YYYY-MM-DD format
    rainfall_data = getRainfallByDateJson(date)
    readings_list = rainfall_data['data']['readings']

    timestamps = []
    rf_values = []

    nameNotInRainfallData = 'Pasir Panjang'
    location_id = getLocationId(nameNotInRainfallData)

    for entry in readings_list:
        rf_value = getRainfallFromTimestamp(location_id, entry['data']['value'])
        if rf_value:
            timestamps.append(entry['timestamp'][11:19])
            rf_values.append(rf_value)

    # print(len(timestamps))
    # print(len(rf_values))

    # Plot the bar chart sorted by zones with color coding
    plt.figure(figsize=(14, 7))
    bars = plt.bar(timestamps, rf_values)

    # Add labels and title
    plt.xlabel('Timestamps')
    plt.ylabel('Rainfall (mm)')
    plt.title(f'Rainfall at {nameNotInRainfallData}, {date}')

    # Rotate x-axis labels for readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout to prevent label cut-off
    plt.tight_layout()

    # Set y-axis limits based on data range
    plt.gca().set_ylim(0, max(rf_values) + 0.5)

    plt.subplots_adjust(right=0.8)  # Adjust this as needed (default is 1.0)

    # Show the plot
    plt.show()
