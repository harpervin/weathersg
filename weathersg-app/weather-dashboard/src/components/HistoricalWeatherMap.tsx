"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import HistoricalWindstreamCanvas from "./historical/HistoricalWindstreamCanvas";
import HistoricalWindDirectionCanvas from "./historical/HistoricalWindDirectionCanvas";
import HistoricalWindSpeedCanvas from "./historical/HistoricalWindSpeedCanvas";
import HistoricalAirTemperatureCanvas from "./historical/HistoricalAirTemperatureCanvas";
import HistoricalHumidityCanvas from "./historical/HistoricalHumidityCanvas";
import HistoricalRainfallAreasCanvas from "./historical/HistoricalRainfallAreasCanvas";
import MapTextOverlay from "./MapTextOverlay";
import useScreenSize from "@/hooks/useScreenSize";
import DatetimeSlider from "@/components/DatetimeSlider";

import {
    HistoricalWeatherData,
    HistoricalWindData,
} from "../utils/historicalWeatherData";
import { StationHumidityData } from "@/utils/humidityData";
import { StationTemperatureData } from "@/utils/airTemperatureData";
import { StationRainfallData } from "@/utils/rainfallData";

import windStations from "../utils/wind_stations.json";
import rainfallStations from "../utils/rainfall_stations.json";
import RainfallHeatmapCanvas from "./RainfallHeatmap";
import dynamic from "next/dynamic";

// ✅ Import RainfallHeatmap without SSR
const RainfallHeatmap = dynamic(() => import("./RainfallHeatmap"), {
    ssr: false, // ❌ Prevents Next.js from rendering this component on the server
});

type MapWithWeatherProps = {
    selectedLayers: string[];
    windParticleSize: number;
    windDirectionScale: number;
    windParticleColor: string;
    rainDisplayMode: string;
    rainMapScale: number;
    mapType: string;
    heatmapMode: string;
};

const CenterButton: React.FC = () => {
    const map = useMap();

    const handleCenterMap = () => {
        map.setView([1.3521, 103.8198], 12);
    };

    return (
        <button
            onClick={handleCenterMap}
            style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 100009,
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
    windParticleSize,
    windDirectionScale,
    windParticleColor,
    rainDisplayMode,
    rainMapScale,
    mapType,
    heatmapMode,
}) => {
    const [windData, setWindData] = useState<HistoricalWindData[][]>([]);
    const [humidityData, setHumidityData] = useState<HistoricalWeatherData[][]>(
        []
    );
    const [temperatureData, setTemperatureData] = useState<
        HistoricalWeatherData[][]
    >([]);

    const [rainfallData, setRainfallData] = useState<HistoricalWeatherData[][]>(
        []
    );
    const [currentFrame, setCurrentFrame] = useState(0);
    const [timestampDuration, setTimestampDuration] = useState(3000);
    const [currentTimestamp, setCurrentTimestamp] = useState("");
    const [maxFrames, setMaxFrames] = useState(0);

    const isSmallScreen = useScreenSize();
    const zoomLevel = isSmallScreen ? 10 : 11;

    const formatTimestamp = (timestamp: string) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);

        return date
            .toLocaleString("en-SG", {
                day: "2-digit",
                month: "long", // Full month name (e.g., June)
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false, // Use 24-hour format
                timeZone: "Asia/Singapore", // Ensure Singapore Time
            })
            .replace(",", ""); // Remove the comma
    };

    const handleWeatherDataUpdate = (data: {
        windData: HistoricalWindData[];
        temperatureData: HistoricalWeatherData[];
        humidityData: HistoricalWeatherData[];
        rainfallData: HistoricalWeatherData[];
    }) => {
        const rainfallStationsLookup = rainfallStations.reduce(
            (acc, station) => {
                acc[station.id.trim()] = station; // Normalize ID
                return acc;
            },
            {} as Record<string, (typeof rainfallStations)[0]>
        );

        const stationLookup = windStations.reduce((acc, station) => {
            acc[station.id.trim()] = station; // Normalize ID
            return acc;
        }, {} as Record<string, (typeof windStations)[0]>);

        const groupedWindData: Record<string, HistoricalWindData[]> = {};
        data.windData.forEach((station) => {
            const matchedStation = stationLookup[station.stationId];

            const timestamp = station.timestamp;

            if (!groupedWindData[timestamp]) {
                groupedWindData[timestamp] = [];
            }

            groupedWindData[timestamp].push({
                stationId: station.stationId,
                name: station.name,
                timestamp: station.timestamp,
                latitude: matchedStation?.location.latitude ?? 0,
                longitude: matchedStation?.location.longitude ?? 0,
                speed: station.speed,
                direction: station.direction,
                u: station.u,
                v: station.v,
            });
        });

        const groupedHumidityData: Record<string, HistoricalWeatherData[]> = {};
        data.humidityData.forEach((station) => {
            const matchedStation = stationLookup[station.stationId];

            const timestamp = station.timestamp;

            if (!groupedHumidityData[timestamp]) {
                groupedHumidityData[timestamp] = [];
            }
            groupedHumidityData[timestamp].push({
                stationId: station.stationId,
                name: matchedStation?.name ?? "",
                timestamp: station.timestamp,
                latitude: matchedStation?.location.latitude ?? 0,
                longitude: matchedStation?.location.longitude ?? 0,
                value: station.value,
            });
            if (!matchedStation) {
                console.log("Station name is empty: ", station);
            }
        });

        const groupedTemperatureData: Record<string, HistoricalWeatherData[]> =
            {};
        data.temperatureData.forEach((station) => {
            const matchedStation = stationLookup[station.stationId];

            const timestamp = station.timestamp;

            if (!groupedTemperatureData[timestamp]) {
                groupedTemperatureData[timestamp] = [];
            }

            groupedTemperatureData[timestamp].push({
                stationId: station.stationId,
                name: matchedStation.name,
                timestamp: station.timestamp,
                latitude: matchedStation?.location.latitude ?? 0,
                longitude: matchedStation?.location.longitude ?? 0,
                value: station.value,
            });
        });

        const groupedRainfallData: Record<string, HistoricalWeatherData[]> = {};
        data.rainfallData.forEach((station) => {
            const matchedStation = rainfallStationsLookup[station.stationId];

            const timestamp = station.timestamp;

            if (!groupedRainfallData[timestamp]) {
                groupedRainfallData[timestamp] = [];
            }

            if (!matchedStation) {
                console.log("Station name is empty: ", station);
            }

            groupedRainfallData[timestamp].push({
                stationId: station.stationId,
                name: matchedStation?.name,
                timestamp: station.timestamp,
                latitude: matchedStation?.location.latitude ?? 0,
                longitude: matchedStation?.location.longitude ?? 0,
                value: station.value,
            });
        });

        const sortedTimestamps = Object.keys(groupedWindData).sort();
        const formattedWindData: HistoricalWindData[][] = sortedTimestamps.map(
            (timestamp) => groupedWindData[timestamp]
        );

        const sortedHumidityTimestamps =
            Object.keys(groupedHumidityData).sort();
        const formattedHumidityData: HistoricalWeatherData[][] =
            sortedHumidityTimestamps.map(
                (timestamp) => groupedHumidityData[timestamp]
            );

        const sortedTempTimestamps = Object.keys(groupedTemperatureData).sort();
        const formattedTemperatureData: HistoricalWeatherData[][] =
            sortedTempTimestamps.map(
                (timestamp) => groupedTemperatureData[timestamp]
            );

        const sortedRainfallTimestamps =
            Object.keys(groupedRainfallData).sort();
        const formattedRainfallData: HistoricalWeatherData[][] =
            sortedRainfallTimestamps.map(
                (timestamp) => groupedRainfallData[timestamp]
            );
        setWindData(formattedWindData);
        setHumidityData(formattedHumidityData);
        setTemperatureData(formattedTemperatureData);
        setRainfallData(formattedRainfallData);
    };

    useEffect(() => {
        // If no layers are selected, clear the timestamp immediately
        if (selectedLayers.length === 0) {
            setCurrentTimestamp("");
            return;
        }
        // Ensure the timestamp updates immediately when data is available
        let newTimestamp = "";
        if (windData[currentFrame]?.[0]?.timestamp) {
            newTimestamp = windData[currentFrame][0].timestamp;
        } else if (humidityData[currentFrame]?.[0]?.timestamp) {
            newTimestamp = humidityData[currentFrame][0].timestamp;
        } else if (temperatureData[currentFrame]?.[0]?.timestamp) {
            newTimestamp = temperatureData[currentFrame][0].timestamp;
        } else if (rainfallData[currentFrame]?.[0]?.timestamp) {
            newTimestamp = rainfallData[currentFrame][0].timestamp;
        }
        setCurrentTimestamp(formatTimestamp(newTimestamp));

        // Set interval to update timestamp over time
        const interval = setInterval(() => {
            setCurrentFrame((prevFrame) => {
                const windLength = windData.length;
                const humidityLength = humidityData.length;
                const tempLength = temperatureData.length;
                const rainfallLength = rainfallData.length;
                const maxFrames = Math.max(
                    windLength,
                    humidityLength,
                    tempLength,
                    rainfallLength
                );

                if (maxFrames === 0) return prevFrame; // Prevent division by zero

                const newFrame = (prevFrame + 1) % maxFrames;

                let updatedTimestamp = "";
                if (windData[newFrame]?.[0]?.timestamp) {
                    updatedTimestamp = windData[newFrame][0].timestamp;
                } else if (humidityData[newFrame]?.[0]?.timestamp) {
                    updatedTimestamp = humidityData[newFrame][0].timestamp;
                } else if (temperatureData[newFrame]?.[0]?.timestamp) {
                    updatedTimestamp = temperatureData[newFrame][0].timestamp;
                } else if (rainfallData[newFrame]?.[0]?.timestamp) {
                    updatedTimestamp = rainfallData[newFrame][0].timestamp;
                }

                setCurrentTimestamp(formatTimestamp(updatedTimestamp));
                setMaxFrames(maxFrames);

                return newFrame;
            });
        }, timestampDuration);

        return () => clearInterval(interval);
    }, [
        selectedLayers, // Trigger update when layers are selected/deselected
        windData,
        humidityData,
        rainfallData,
        temperatureData,
        timestampDuration,
        currentFrame,
    ]);

    return (
        <div style={{ height: "80vh", width: "100%", position: "relative" }}>
            <DatetimeSlider
                selectedLayers={selectedLayers}
                onDataUpdate={handleWeatherDataUpdate}
                currentFrame={currentFrame}
                currentTimestamp={currentTimestamp}
                totalFrames={maxFrames} // Ensure total frames match available data
                setCurrentFrame={setCurrentFrame} // Allow slider to update the frame
                heatmapMode={heatmapMode}
            />

            <MapContainer
                center={[1.3521, 103.8198]}
                zoom={zoomLevel}
                minZoom={zoomLevel}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                {mapType === "greyscale" && (
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        className="grayscale"
                    />
                )}

                {mapType === "default" && (
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                )}

                {selectedLayers.includes("Windstream") &&
                    windData.length > 0 && (
                        <HistoricalWindstreamCanvas
                            stationsData={windData}
                            // rainfallData={rainfallData}
                            currentFrame={currentFrame}
                            windParticleSize={windParticleSize}
                            windColor={windParticleColor}
                        />
                    )}
                {selectedLayers.includes("Wind Direction") &&
                    windData.length > 0 && (
                        <HistoricalWindDirectionCanvas
                            stationsData={windData}
                            currentFrame={currentFrame}
                            sizeScale={windDirectionScale}
                        />
                    )}
                {selectedLayers.includes("Wind Speed") &&
                    windData.length > 0 && (
                        <HistoricalWindSpeedCanvas
                            stationsData={windData}
                            currentFrame={currentFrame}
                        />
                    )}
                {selectedLayers.includes("Air Temperature") &&
                    temperatureData.length > 0 && (
                        <HistoricalAirTemperatureCanvas
                            stationsData={temperatureData}
                            currentFrame={currentFrame}
                        />
                    )}
                {selectedLayers.includes("Humidity") &&
                    humidityData.length > 0 && (
                        <HistoricalHumidityCanvas
                            stationsData={humidityData}
                            currentFrame={currentFrame}
                        />
                    )}
                {/* {selectedLayers.includes("AllRainfallReadings") &&
                    rainfallData.length > 0 && (
                        <RealtimeRainfallReadingsCanvas
                            stationsData={rainfallData}
                        />
                    )} */}
                {selectedLayers.includes("Rainfall") &&
                    rainDisplayMode !== "heatmap" &&
                    rainfallData.length > 0 && (
                        <HistoricalRainfallAreasCanvas
                            stationsData={rainfallData}
                            currentFrame={currentFrame}
                            displayMode={rainDisplayMode}
                            rainMapScale={rainMapScale}
                        />
                    )}

                {(selectedLayers.includes("Rainfall") || selectedLayers.includes("Rainfall Average"))&&
                    rainDisplayMode === "heatmap" &&
                    rainfallData.length > 0 && (
                        <RainfallHeatmap
                            stationsData={rainfallData}
                            currentFrame={currentFrame}
                            maxIntensity={50}
                            radius={30}
                            heatmapMode={heatmapMode}
                        />
                    )}

                <MapTextOverlay
                    position={[1.3521, 103.8198]}
                    text="Singapore"
                    style={{
                        fontSize: "21px",
                        fontWeight: "bold",
                        color: "white",
                        textShadow: "1px 1px 2px black",
                        stroke: "black",
                    }}
                />
                {/* Timestamp Overlay - Displayed centrally for all layers */}
                {currentTimestamp && (
                    <div
                        style={{
                            position: "absolute",
                            top: "10px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            color: "white",
                            padding: "10px 15px",
                            borderRadius: "5px",
                            fontSize: "18px",
                            fontWeight: "bold",
                            textAlign: "center",
                            zIndex: 10005,
                        }}
                    >
                        {currentTimestamp}
                    </div>
                )}

                <CenterButton />
            </MapContainer>
        </div>
    );
};

export default HistoricalWeatherMap;
