export type HistoricalWindData = {
    id: string;
    name: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    speed: number; // Wind speed
    direction: number; // Wind direction in degrees
    u: number; // East-West component
    v: number; // North-South component
};