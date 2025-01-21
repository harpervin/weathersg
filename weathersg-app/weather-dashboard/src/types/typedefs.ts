// types/weather.ts

export type StationLocation = {
    latitude: number;
    longitude: number;
};

export type Station = {
    id: string;
    deviceId: string;
    name: string;
    location: StationLocation;
};

export type Reading = {
    stationId: string;
    value: number;
};

export type RainfallReading = {
    timestamp: string;
    data: Reading[];
};

export type RainfallResponse = {
    code: number;
    data: {
        stations: Station[];
        readings: RainfallReading[];
        readingType: string;
        readingUnit: string;
    };
    errorMsg?: string;
};

export type Data = {
    stationId: string,
    value: number
};
