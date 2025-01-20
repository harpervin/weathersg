"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fetchWindData, StationData } from "../utils/windData";
import WindstreamCanvas from "./WindstreamCanvas";
import WindDirectionCanvas from "./WindDirectionCanvas";

type MapWithWeatherProps = {
    selectedLayers: string[]; // Prop to control wind stream visibility
  };

const MapWithWind: React.FC<MapWithWeatherProps> = ({ selectedLayers }) => {
  const [stations, setStations] = useState<StationData[]>([]);

  useEffect(() => {
    const loadWindData = async () => {
      const data = await fetchWindData();
      setStations(data);
    };
  
    // Initial load
    loadWindData();
  
    // Set up periodic fetching
    const interval = setInterval(() => {
      loadWindData();
    }, 60000); // Fetch every 60 seconds
  
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ height: "100vh", width: "100%" }}>
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
        {selectedLayers.includes("Windstream") && stations.length > 0 && <WindstreamCanvas stations={stations} />}
        {selectedLayers.includes("Wind Direction") && stations.length > 0 && <WindDirectionCanvas stations={stations} />}
        {/* {selectedLayers.includes("Wind Speed") && stations.length > 0 && <WindSpeedCanvas stations={stations} />} */}

      </MapContainer>
    </div>
  );
};

export default MapWithWind;
