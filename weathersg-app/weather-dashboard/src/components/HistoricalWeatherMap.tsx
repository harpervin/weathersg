"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import HistoricalWindstreamCanvas from "./historical/HistoricalWindstreamCanvas";
import RealtimeWindDirectionCanvas from "./realtime/RealtimeWindDirectionCanvas";
import RealtimeWindSpeedCanvas from "./realtime/RealtimeWindSpeedCanvas";
import RealtimeAirTemperatureCanvas from "./realtime/RealtimeAirTemperatureCanvas";
import RealtimeHumidityCanvas from "./realtime/RealtimeHumidityCanvas";
import RealtimeRainfallReadingsCanvas from "./realtime/RealtimeRainfallReadingsCanvas";
import RealtimeRainfallAreasCanvas from "./realtime/RealtimeRainfallAreasCanvas";
import MapTextOverlay from "./MapTextOverlay";
import useScreenSize from "@/hooks/useScreenSize";
import DatetimeSlider from "@/components/DatetimeSlider";


import { HistoricalWindData } from "../utils/historicalWeatherData";
import { StationHumidityData } from "@/utils/humidityData";
import { StationTemperatureData } from "@/utils/airTemperatureData";
import { StationRainfallData } from "@/utils/rainfallData";

import windStations from "../utils/wind_stations.json";
import rainfallStations from "../utils/rainfall_stations.json";

type MapWithWeatherProps = {
    selectedLayers: string[]; // Prop to control wind stream visibility
};

const CenterButton: React.FC = () => {
    const map = useMap();

    const handleCenterMap = () => {
        map.setView([1.3521, 103.8198], 12); // Reset to Singapore coordinates and zoom level
    };

    return (
        <button
            onClick={handleCenterMap}
            style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 1000,
                padding: "8px 12px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
            }}
        >
            Reset Map
        </button>
    );
};

const HistoricalWeatherMap: React.FC<MapWithWeatherProps> = ({
    selectedLayers,
}) => {
    const [windData, setWindData] = useState<HistoricalWindData[][]>([]);
    const [temperatureData, setTemperatureData] = useState<
        StationTemperatureData[]
    >([]);
    const [humidityData, setHumidityData] = useState<StationHumidityData[]>([]);
    const [rainfallData, setRainfallData] = useState<StationRainfallData[]>([]);

    const isSmallScreen = useScreenSize();
    const zoomLevel = isSmallScreen ? 11 : 12;

    const handleWeatherDataUpdate = (data: {
        windData: HistoricalWindData[];
        temperatureData: StationTemperatureData[];
        humidityData: StationHumidityData[];
        rainfallData: StationRainfallData[];
    }) => {
        // Convert wind stations into lookup dictionaries
        const windStationLookup = windStations.reduce((acc, station) => {
            acc[station.id] = station;
            return acc;
        }, {} as Record<string, typeof windStations[0]>);
    
        // Group wind data by timestamp
        const groupedWindData: Record<string, HistoricalWindData[]> = {};
        data.windData.forEach((station) => {
            const matchedStation = windStationLookup[station.id];
            const timestamp = station.timestamp; // Assuming each station has a timestamp field
    
            if (!groupedWindData[timestamp]) {
                groupedWindData[timestamp] = [];
            }
    
            groupedWindData[timestamp].push({
                id: station.id,
                name: station.name,
                timestamp: station.timestamp,
                latitude: matchedStation?.location.latitude ?? 0,
                longitude: matchedStation?.location.longitude ?? 0,
                speed: station.speed,
                direction: (station.direction + 180) % 360,
                u: station.u,
                v: station.v,
            });
        });
    
        // Convert grouped data to an array of arrays (sorted by timestamp)
        const sortedTimestamps = Object.keys(groupedWindData).sort();
        const formattedWindData: HistoricalWindData[][] = sortedTimestamps.map(
            (timestamp) => groupedWindData[timestamp]
        );
    
        // Set state with transformed data
        setWindData(formattedWindData);
    };
    

    return (
        <div style={{ height: "80vh", width: "100%", position: "relative" }}>
            <DatetimeSlider
                selectedLayers={selectedLayers}
                onDataUpdate={handleWeatherDataUpdate}
            />

            <MapContainer
                center={[1.3521, 103.8198]}
                zoom={zoomLevel}
                minZoom={zoomLevel}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {selectedLayers.includes("Windstream") &&
                    windData.length > 0 && (
                        <HistoricalWindstreamCanvas stationsData={windData} totalPlaybackSeconds={120} />
                    )}
                {/* {selectedLayers.includes("Wind Direction") &&
                    windData.length > 0 && (
                        <RealtimeWindDirectionCanvas stations={windData} />
                    )}
                {selectedLayers.includes("Wind Speed") &&
                    windData.length > 0 && (
                        <RealtimeWindSpeedCanvas stations={windData} />
                    )} */}
                {selectedLayers.includes("Air Temperature") &&
                    temperatureData.length > 0 && (
                        <RealtimeAirTemperatureCanvas stations={temperatureData} />
                    )}
                {selectedLayers.includes("Humidity") &&
                    humidityData.length > 0 && (
                        <RealtimeHumidityCanvas stations={humidityData} />
                    )}
                {selectedLayers.includes("AllRainfallReadings") &&
                    rainfallData.length > 0 && (
                        <RealtimeRainfallReadingsCanvas stations={rainfallData} />
                    )}
                {selectedLayers.includes("RainfallAreas") &&
                    rainfallData.length > 0 && (
                        <RealtimeRainfallAreasCanvas stations={rainfallData} />
                    )}
                {/* Add the Singapore text overlay */}
                <MapTextOverlay
                    position={[1.3521, 103.8198]} // Singapore's coordinates
                    text="Singapore"
                    style={{
                        fontSize: "21px",
                        fontWeight: "bold",
                        color: "white",
                        textShadow: "1px 1px 2px black",
                        stroke: "black",
                    }}
                />
                {/* Add the CenterButton inside the MapContainer */}
                <CenterButton />
            </MapContainer>
        </div>
    );
};

export default HistoricalWeatherMap;
