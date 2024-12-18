ation JSON file.
        rainfall_data (dict): Rainfall data containing station IDs and readings.

    Returns:
        dict: Dictionary with station IDs as keys and a list of [station name, total rainfall] as values.
    """
    output_dict = {}
    if station_json_path and os.path.exists(station_json_path):
        # Load the station JSON data
        with open(station_json_path, 'r') as file:
            station_data = json.load(file)
