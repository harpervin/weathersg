import { Station, Data} from "@/types/typedefs";

export type StationHumidityData = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    humidity: number; // Wind speed
};

export const fetchHumidityData = async (): Promise<StationHumidityData[]> => {
    // Fetch humidity data
    const humidityResponse = await fetch(
        "https://api-open.data.gov.sg/v2/real-time/api/relative-humidity"
    );
    const humidityData = await humidityResponse.json();

    const stations = humidityData.data.stations.map((station: Station) => {
        const humidityReading = humidityData.data.readings[0].data.find(
            (d: Data) => d.stationId === station.id
        );

        const humidity = humidityReading?.value || 0;

        return {
            id: station.id,
            name: station.name,
            latitude: station.location.latitude,
            longitude: station.location.longitude,
            humidity: humidity,
        };
    });

    return stations;
};
