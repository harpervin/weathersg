"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import WindstreamCanvas from "./WindstreamCanvas";
import WindDirectionCanvas from "./WindDirectionCanvas";
import WindSpeedCanvas from "./WindSpeedCanvas";
import AirTemperatureCanvas from "./AirTemperatureCanvas";
import HumidityCanvas from "./HumidityCanvas";
import PrecipitationCanvas from "./PrecipitationCanvas";
import MapTextOverlay from "./MapTextOverlay";

import { fetchWindData, StationData } from "../utils/windData";
import { fetchHumidityData, StationHumidityData } from "@/utils/humidityData";
import {
    fetchTemperatureData,
    StationTemperatureData,
} from "@/utils/airTemperatureData";
import {
    fetchPrecipitationData,
    StationPrecipitationData,
} from "@/utils/precipitationData";

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
            }}
        >
            Reset Map
        </button>
    );
};

const MapWithWind: React.FC<MapWithWeatherProps> = ({ selectedLayers }) => {
    const [stations, setStations] = useState<StationData[]>([]);
    const [temperatures, setTemperatures] = useState<StationTemperatureData[]>(
        []
    );
    const [humidity, setHumidity] = useState<StationHumidityData[]>([]);
    const [precipitation, setPrecipitation] = useState<
        StationPrecipitationData[]
    >([]);

    useEffect(() => {
        const loadWeatherData = async () => {
            const data = await fetchWindData();
            setStations(data);

            const tempData = await fetchTemperatureData();
            setTemperatures(tempData);

            const humidityData = await fetchHumidityData();
            setHumidity(humidityData);

            const precipitationData = await fetchPrecipitationData();
            setPrecipitation(precipitationData);
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
        <div style={{ height: "100vh", width: "100%", position: "relative" }}>
            <MapContainer
                center={[1.3521, 103.8198]}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedLayers.includes("Windstream") &&
                    stations.length > 0 && (
                        <WindstreamCanvas stations={stations} />
                    )}
                {selectedLayers.includes("Wind Direction") &&
                    stations.length > 0 && (
                        <WindDirectionCanvas stations={stations} />
                    )}
                {selectedLayers.includes("Wind Speed") &&
                    stations.length > 0 && (
                        <WindSpeedCanvas stations={stations} />
                    )}
                {selectedLayers.includes("Air Temperature") &&
                    temperatures.length > 0 && (
                        <AirTemperatureCanvas stations={temperatures} />
                    )}
                {selectedLayers.includes("Humidity") &&
                    temperatures.length > 0 && (
                        <HumidityCanvas stations={humidity} />
                    )}
                {selectedLayers.includes("Precipitation") &&
                    temperatures.length > 0 && (
                        <PrecipitationCanvas stations={precipitation} />
                    )}

                {/* Add the Singapore text overlay */}
                <MapTextOverlay
                    position={[1.3521, 103.8198]} // Singapore's coordinates
                    text="Singapore"
                    style={{
                        fontSize: "15px",
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

export default MapWithWind;
