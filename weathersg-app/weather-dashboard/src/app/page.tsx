"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import CheckboxGroup from "@/components/CheckboxGroup";
import SearchBar from "@/components/SearchBar";
import Tabs from "@/components/Tabs";
import HistoricalWeatherMap from "@/components/HistoricalWeatherMap";

const RealtimeWeatherMap = dynamic(
    () => import("../components/RealtimeWeatherMap"),
    {
        ssr: false,
    }
);

type MapTab = "Realtime Weather Map" | "Historical Weather Map";

export default function Page() {
    const [activeTab, setActiveTab] = useState<string>("Realtime Weather Map");
    const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
    const [isRainfallMapActive, setIsRainfallMapActive] = useState(false);
    const [isRainfallAreasActive, setIsRainfallAreasActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleCheckboxChange = (checkedValues: string[]) => {
        if (isRainfallMapActive || isRainfallAreasActive) {
            setIsRainfallMapActive(false);
            setIsRainfallAreasActive(false);
        }
        setSelectedLayers(checkedValues);
    };

    const handleRainfallMapBtnClick = () => {
        if (isRainfallMapActive) {
            setSelectedLayers([]);
        } else {
            setSelectedLayers(["AllRainfallReadings"]);
        }
        setIsRainfallMapActive(!isRainfallMapActive);
        setIsRainfallAreasActive(false);
    };

    const handleRainfallAreasBtnClick = () => {
        if (isRainfallAreasActive) {
            setSelectedLayers([]);
        } else {
            setSelectedLayers(["RainfallAreas"]);
        }
        setIsRainfallAreasActive(!isRainfallAreasActive);
        setIsRainfallMapActive(false);
    };

    const tabs: MapTab[] = ["Realtime Weather Map", "Historical Weather Map"];

    return (
        <main className="p-4 flex flex-col space-y-4 overflow-y-auto lg:p-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-center mb-4">
                <h1 className="text-xl lg:text-2xl font-bold text-center">
                    WeatherSG
                </h1>
                <SearchBar query={searchQuery} setQuery={setSearchQuery} />
            </div>

            {/* Time Slider */}
            <div className="flex flex-col lg:flex-row">
                <div className="flex-1">
                    <Tabs
                        tabs={tabs}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />

                    {activeTab == "Historical Weather Map" && (
                        <>
                            <HistoricalWeatherMap
                                selectedLayers={selectedLayers}
                                
                            />
                        </>
                    )}

                    {activeTab == "Realtime Weather Map" && (
                        <RealtimeWeatherMap selectedLayers={selectedLayers} />
                    )}
                </div>

                <div className="p-4 bg-gray-100 rounded shadow-lg mt-4 lg:mt-0 lg:ml-4">
                    <h2 className="text-lg font-semibold mb-2">Wind</h2>
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
                        )}
                        onChange={handleCheckboxChange}
                    />
                    <hr className="my-2" />
                    <h2 className="text-lg font-semibold mb-2">Air</h2>
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
                        )}
                        onChange={handleCheckboxChange}
                    />
                    <hr className="my-2" />
                    <h2 className="text-lg font-semibold mb-2">
                        Precipitation
                    </h2>
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={handleRainfallMapBtnClick}
                            className={`px-4 py-2 rounded-full font-semibold transition-colors duration-300 ${
                                isRainfallMapActive
                                    ? "bg-blue-400 text-white"
                                    : "bg-blue-200 hover:bg-blue-400 hover:text-white"
                            }`}
                        >
                            All Rainfall Readings
                        </button>

                        <button
                            onClick={handleRainfallAreasBtnClick}
                            className={`px-4 py-2 rounded-full font-semibold transition-colors duration-300 ${
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

            {/* <hr className="my-2" /> */}

            {/* Tabbed Bar Chart Section */}
            {/* <div>
                <h2 className="text-xl lg:text-2xl font-bold mb-4 text-center lg:text-left">
                    Weather Data Visualization (2022-2024)
                </h2>
                <WeatherChartTabs />
            </div> */}
        </main>
    );
}
