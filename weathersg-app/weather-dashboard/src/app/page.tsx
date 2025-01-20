"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

import CheckboxGroup from "@/components/CheckboxGroup";
import WeatherChartTabs from "@/components/WeatherChartTabs";
const MapWithWeather = dynamic(() => import("../components/MapWithWeather"), { ssr: false });

export default function Page() {
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);

  const handleCheckboxChange = (checkedValues: string[]) => {
    setSelectedLayers(checkedValues)
  };

  return (
    <main className="p-8 flex flex-col space-y-8 overflow-y-auto">
      {/* Map and Checkbox Section */}
      <div className="flex">
        {/* Map Section */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4">Leaflet Map</h1>
          <MapWithWeather selectedLayers={selectedLayers}/>
        </div>

        {/* Checkbox Section */}
        <div className="p-4 bg-gray-100 rounded shadow-lg ml-4">
          <h2 className="text-lg font-semibold mb-2">Weather Layers</h2>
          <CheckboxGroup
            options={["Windstream", "Wind Direction", "Wind Speed", "Air Temperature", "Rainfall"]}
            onChange={handleCheckboxChange}
          />
        </div>
      </div>

      {/* Tabbed Bar Chart Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Weather Data Visualization (2022-2024)</h2>
        <WeatherChartTabs />
      </div>
    </main>
  );
}
