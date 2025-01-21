export type StationPrecipitationData = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    rainfall: number; // Rainfall
};

export const fetchPrecipitationData = async (): Promise<StationPrecipitationData[]> => {
    // Fetch rainfall data
    const rainfallResponse = await fetch(
        "https://api-open.data.gov.sg/v2/real-time/api/rainfall"
    );
    const rainfallData = await rainfallResponse.json();

    const stations = rainfallData.data.stations.map((station: any) => {
        const rainfallReading = rainfallData.data.readings[0].data.find(
            (d: any) => d.stationId === station.id
        );

        const rainfall = rainfallReading?.value || 0;

        return {
            id: station.id,
            name: station.name,
            latitude: station.location.latitude,
            longitude: station.location.longitude,
            rainfall: rainfall,
        };
    });

    return stations;
};
