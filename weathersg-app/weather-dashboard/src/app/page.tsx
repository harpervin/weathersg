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
    const [isRainfallMapActive, setIsRainfallMapActive] = useState(false);
    const [isRainfallAreasActive, setIsRainfallAreasActive] = useState(false);

    const handleCheckboxChange = (checkedValues: string[]) => {
        // Remove rainfall layers if any checkbox is clicked
        if (isRainfallMapActive || isRainfallAreasActive) {
            setIsRainfallMapActive(false);
            setIsRainfallAreasActive(false);
        }

        // Update selected layers
        setSelectedLayers(checkedValues);
    };

    const handleRainfallMapBtnClick = () => {
        if (isRainfallMapActive) {
            // Clear rainfall map and selected layers
            setSelectedLayers([]);
        } else {
            // Set rainfall map as the only selected layer
            setSelectedLayers(["AllRainfallReadings"]);
        }
        setIsRainfallMapActive(!isRainfallMapActive);
        setIsRainfallAreasActive(false); // Ensure rainfall areas are deselected
    };

    const handleRainfallAreasBtnClick = () => {
        if (isRainfallAreasActive) {
            // Clear rainfall areas and selected layers
            setSelectedLayers([]);
        } else {
            // Set rainfall areas as the only selected layer
            setSelectedLayers(["RainfallAreas"]);
        }
        setIsRainfallAreasActive(!isRainfallAreasActive);
        setIsRainfallMapActive(false); // Ensure rainfall map is deselected
    };

    return (
        <main className="p-8 flex flex-col space-y-2 overflow-y-auto">
            {/* Map and Checkbox Section */}
			<h1 className="text-2xl font-bold mb-1">WeatherSG</h1>
			<hr/>
            <div className="flex">
                {/* Map Section */}
                <div className="flex-1">
                    <span className="font-medium mb-4">Realtime Weather Map</span>
                    <MapWithWeather selectedLayers={selectedLayers} />
                </div>

                {/* Checkbox Section */}
                <div className="p-4 bg-gray-100 rounded shadow-lg ml-4">
                    <h2 className="text-lg font-semibold mb-2">
                        Wind
                    </h2>
                    <CheckboxGroup
                        options={[
                            {
                                label: "Windstream",
                                tooltip:
                                    "Displays windstream based on station readings over Singapore only.",
                            },
                            { label: "Wind Direction" },
                            { label: "Wind Speed" },
                        ]}
                        value={selectedLayers.filter(
                            (layer) =>
                                ![
                                    "AllRainfallReadings",
                                    "RainfallAreas",
                                ].includes(layer)
                        )} // Remove rainfall options from checkboxes
                        onChange={handleCheckboxChange}
                    />
					<hr className="my-2" />
					<h2 className="text-lg font-semibold mb-2">
                        Air
                    </h2>
					<CheckboxGroup
                        options={[
                            { label: "Air Temperature" },
                            { label: "Humidity" },
                        ]}
                        value={selectedLayers.filter(
                            (layer) =>
                                ![
                                    "AllRainfallReadings",
                                    "RainfallAreas",
                                ].includes(layer)
                        )} // Remove rainfall options from checkboxes
                        onChange={handleCheckboxChange}
                    />
                    <hr className="my-2" />
					<h2 className="text-lg font-semibold mb-2">
                        Precipitation
                    </h2>
                    <div className="flex-col relative group">
                        <button
                            onClick={handleRainfallMapBtnClick}
                            className={`flex px-4 py-2 my-2 rounded-full font-semibold transition-colors duration-300 ${
                                isRainfallMapActive
                                    ? "bg-blue-400 text-white"
                                    : "bg-blue-200 hover:bg-blue-400 hover:text-white"
                            }`}
                        >
                            All Rainfall Readings
                        </button>

                        <button
                            onClick={handleRainfallAreasBtnClick}
                            className={`flex px-4 py-2 rounded-full font-semibold transition-colors duration-300 ${
                                isRainfallAreasActive
                                    ? "bg-blue-400 text-white"
                                    : "bg-blue-200 hover:bg-blue-400 hover:text-white"
                            }`}
                        >
                            View only areas with rainfall
                        </button>
                    </div>
                </div>
            </div>

			<hr className="my-2" />

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
