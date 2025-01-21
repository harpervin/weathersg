import { Station, Data } from "@/types/typedefs";


export type StationRainfallData = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    rainfall: number; // Rainfall
};

export const fetchRainfallData = async (): Promise<StationRainfallData[]> => {
    // Fetch rainfall data
    const rainfallResponse = await fetch(
        "https://api-open.data.gov.sg/v2/real-time/api/rainfall"
    );
    const rainfallData = await rainfallResponse.json();

    const stations = rainfallData.data.stations.map((station: Station) => {
        const rainfallReading = rainfallData.data.readings[0].data.find(
            (d: Data) => d.stationId === station.id
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
