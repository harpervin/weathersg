"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

import CheckboxGroup from "@/components/CheckboxGroup";
import WeatherChartTabs from "@/components/WeatherChartTabs";

const MapWithWeather = dynamic(() => import("../components/MapWithWeather"), {
    ssr: false,
});

export default function Page() {
    const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
    const [isPrecipitationActive, setIsPrecipitationActive] = useState(false);

    const handleCheckboxChange = (checkedValues: string[]) => {
        setSelectedLayers(checkedValues);
        setIsPrecipitationActive(false); // Unclick the Precipitation button
    };

    const handlePrecipitationBtnClick = () => {
        if (isPrecipitationActive) {
            setSelectedLayers([]); // Clear selected layers
        } else {
            setSelectedLayers(["Precipitation"]); // Only select Precipitation
        }
        setIsPrecipitationActive(!isPrecipitationActive); // Toggle the button's state
    };

    return (
        <main className="p-8 flex flex-col space-y-8 overflow-y-auto">
            {/* Map and Checkbox Section */}
            <div className="flex">
                {/* Map Section */}
                <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-4">WeatherSG</h1>
                    <MapWithWeather selectedLayers={selectedLayers} />
                </div>

                {/* Checkbox Section */}
                <div className="p-4 bg-gray-100 rounded shadow-lg ml-4">
                    <h2 className="text-lg font-semibold mb-2">
                        Weather Filters
                    </h2>
                    <CheckboxGroup
                        options={[
							{ label: "Windstream", tooltip: "Displays windstream based on station readings over Singapore only." },
							{ label: "Wind Direction"},
							{ label: "Wind Speed"},
							{ label: "Air Temperature"},
							{ label: "Humidity"},
						]}
                        value={selectedLayers.filter(
                            (layer) => layer !== "Precipitation"
                        )} // Remove Precipitation from checkboxes
                        onChange={handleCheckboxChange}
                    />

                    <hr className="my-2" />

                    <button
                        onClick={handlePrecipitationBtnClick}
                        className={`px-4 py-2 rounded-full font-semibold transition-colors duration-300 ${
                            isPrecipitationActive
                                ? "bg-blue-400 text-white"
                                : "bg-blue-200 hover:bg-blue-400 hover:text-white"
                        }`}
                    >
                        Precipitation
                    </button>
                </div>
            </div>

            {/* Tabbed Bar Chart Section */}
            <div>
                <h2 className="text-2xl font-bold mb-4">
                    Weather Data Visualization (2022-2024)
                </h2>
                <WeatherChartTabs />
            </div>
        </main>
    );
}
