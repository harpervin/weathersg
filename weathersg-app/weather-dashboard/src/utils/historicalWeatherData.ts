export type HistoricalWindData = {
    stationId: string;
    name: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    speed: number; // Wind speed
    direction: number; // Wind direction in degrees
    u: number; // East-West component
    v: number; // North-South component
};

export type HistoricalWeatherData = {
    stationId: string;
    name: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    value: number; // Wind speed
};