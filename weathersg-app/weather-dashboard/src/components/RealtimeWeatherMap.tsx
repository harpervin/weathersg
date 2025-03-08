"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import RealtimeWindstreamCanvas from "./realtime/RealtimeWindstreamCanvas";
import RealtimeWindDirectionCanvas from "./realtime/RealtimeWindDirectionCanvas";
import RealtimeWindSpeedCanvas from "./realtime/RealtimeWindSpeedCanvas";
import RealtimeAirTemperatureCanvas from "./realtime/RealtimeAirTemperatureCanvas";
import RealtimeHumidityCanvas from "./realtime/RealtimeHumidityCanvas";
import RealtimeRainfallReadingsCanvas from "./realtime/RealtimeRainfallReadingsCanvas";
import RealtimeRainfallAreasCanvas from "./realtime/RealtimeRainfallAreasCanvas";
import MapTextOverlay from "./MapTextOverlay";
import useScreenSize from "@/hooks/useScreenSize";

import { fetchWindData, StationData } from "../utils/windData";
import { fetchHumidityData, StationHumidityData } from "@/utils/humidityData";
import {
    fetchTemperatureData,
    StationTemperatureData,
} from "@/utils/airTemperatureData";
import { fetchRainfallData, StationRainfallData } from "@/utils/rainfallData";

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

const RealtimeWeatherMap: React.FC<MapWithWeatherProps> = ({
    selectedLayers,
}) => {
    const [stations, setStations] = useState<StationData[]>([]);
    const [temperatures, setTemperatures] = useState<StationTemperatureData[]>(
        []
    );
    const [humidity, setHumidity] = useState<StationHumidityData[]>([]);
    const [rainfall, setRainfall] = useState<StationRainfallData[]>([]);
    const isSmallScreen = useScreenSize();
    const zoomLevel = isSmallScreen ? 10 : 11;

    useEffect(() => {
        const loadWeatherData = async () => {
            const windData = await fetchWindData();
            setStations(windData);

            const tempData = await fetchTemperatureData();
            setTemperatures(tempData);

            const humidityData = await fetchHumidityData();
            setHumidity(humidityData);

            const rainfallData = await fetchRainfallData();
            setRainfall(rainfallData);
        };

        // Initial load
        loadWeatherData();

        // Set up periodic fetching
        const interval = setInterval(() => {
            loadWeatherData();
        }, 60000); // Fetch every 60 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ height: "80vh", width: "100%", position: "relative" }}>
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
                    stations.length > 0 && (
                        <RealtimeWindstreamCanvas stations={stations} />
                    )}
                {selectedLayers.includes("Wind Direction") &&
                    stations.length > 0 && (
                        <RealtimeWindDirectionCanvas stations={stations} />
                    )}
                {selectedLayers.includes("Wind Speed") &&
                    stations.length > 0 && (
                        <RealtimeWindSpeedCanvas stations={stations} />
                    )}
                {selectedLayers.includes("Air Temperature") &&
                    temperatures.length > 0 && (
                        <RealtimeAirTemperatureCanvas stations={temperatures} />
                    )}
                {selectedLayers.includes("Humidity") && humidity.length > 0 && (
                    <RealtimeHumidityCanvas stations={humidity} />
                )}
                {selectedLayers.includes("AllRainfallReadings") &&
                    rainfall.length > 0 && (
                        <RealtimeRainfallReadingsCanvas stations={rainfall} />
                    )}
                {selectedLayers.includes("RainfallAreas") &&
                    rainfall.length > 0 && (
                        <RealtimeRainfallAreasCanvas stations={rainfall} />
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

export default RealtimeWeatherMap;
