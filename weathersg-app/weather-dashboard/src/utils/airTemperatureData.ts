import { Station, Data } from "@/types/typedefs";

export type StationTemperatureData = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    airTemperature: number; // Wind speed
};

export const fetchTemperatureData = async (): Promise<
    StationTemperatureData[]
> => {
    // Fetch air temperature data
    const airTemperatureResponse = await fetch(
        "https://api-open.data.gov.sg/v2/real-time/api/air-temperature"
    );
    const airTemperatureData = await airTemperatureResponse.json();

    const stations = airTemperatureData.data.stations.map(
        (station: Station) => {
            const airTemperatureReading =
                airTemperatureData.data.readings[0].data.find(
                    (d: Data) => d.stationId === station.id
                );

            const airTemperature = airTemperatureReading?.value || 0;

            return {
                id: station.id,
                name: station.name,
                latitude: station.location.latitude,
                longitude: station.location.longitude,
                airTemperature: airTemperature,
            };
        }
    );

    return stations;
};
