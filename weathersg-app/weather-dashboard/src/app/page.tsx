"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Slider from "@mui/material/Slider";

import CheckboxGroup from "@/components/CheckboxGroup";
import Tabs from "@/components/Tabs";

const RealtimeWeatherMap = dynamic(
    () => import("../components/RealtimeWeatherMap"),
    {
        ssr: false,
    }
);
const HistoricalWeatherMap = dynamic(
    () => import("../components/HistoricalWeatherMap"),
    { ssr: false }
);

type MapTab = "Realtime Weather Map" | "Historical Weather Map";

export default function Page() {
    const [activeTab, setActiveTab] = useState<string>("Realtime Weather Map");
    const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
    const [isRainfallMapActive, setIsRainfallMapActive] = useState(false);
    const [isRainfallAreasActive, setIsRainfallAreasActive] = useState(false);
    const [windParticleSize, setWindParticleSize] = useState<number>(1.5); // Default particle size
    const [windDirectionScale, setWindDirectionScale] = useState<number>(1); // Default particle size
    const [windParticleColor, setWindParticleColor] = useState<string>(
        "rgba(0, 150, 255, 0.7)"
    ); // Default color
    const [rainDisplayMode, setRainDisplayMode] = useState<string>("rectangle");
    const [rainMapScale, setRainMapScale] = useState<number>(1);
    const [heatmapMode, setHeatmapMode] = useState<string>("snapshot");
    const [mapType, setMapType] = useState<string>("default");

    const handleWindParticleSizeChange = (
        event: Event,
        value: number | number[]
    ) => {
        if (typeof value === "number") {
            setWindParticleSize(value);
        }
    };

    const handleWindDirectionScaleChange = (
        event: Event,
        value: number | number[]
    ) => {
        if (typeof value === "number") {
            setWindDirectionScale(value);
        }
    };

    const handleRainMapScaleChange = (
        event: Event,
        value: number | number[]
    ) => {
        if (typeof value === "number") {
            setRainMapScale(value);
        }
    };

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

    const handleHistoricalCheckboxChange = (checkedValues: string[]) => {
        setSelectedLayers(
            checkedValues.filter((layer) => layer !== "Rainfall")
        );
    };

    // Helper function to handle Rainfall selection
    const handleHistoricalRainfallSelection = () => {
        setSelectedLayers(["Rainfall"]);
    };

    const handleAverageRainfallSelection = (heatmapMode: string) => {
        setHeatmapMode(heatmapMode);
        setSelectedLayers(["Rainfall"]);
    };


    const tabs: MapTab[] = ["Realtime Weather Map", "Historical Weather Map"];

    return (
        <main className="p-4 flex flex-col lg:px-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-center mb-4">
                <h1 className="text-xl lg:text-2xl font-bold text-center">
                    WeatherSG
                </h1>
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
                                windParticleSize={windParticleSize}
                                windDirectionScale={windDirectionScale}
                                windParticleColor={windParticleColor}
                                rainDisplayMode={rainDisplayMode}
                                rainMapScale={rainMapScale}
                                mapType={mapType}
                                heatmapMode={heatmapMode}
                            />
                        </>
                    )}

                    {activeTab == "Realtime Weather Map" && (
                        <RealtimeWeatherMap selectedLayers={selectedLayers} />
                    )}
                </div>
                {activeTab == "Realtime Weather Map" && (
                    <div className="p-4 bg-gray-100 rounded shadow-lg mt-4 lg:mt-0 lg:ml-4">
                        <h1 className="text-lg font-semibold mb-2">
                            Weather Filters
                        </h1>
                        <hr className="my-2" />
                        <h2 className="text-md font-semibold mb-2">Wind</h2>
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
                        <h2 className="text-md font-semibold mb-2">Air</h2>
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

                        <h2 className="text-md font-semibold mb-2">
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
                                All Readings
                            </button>

                            <button
                                onClick={handleRainfallAreasBtnClick}
                                className={`px-4 py-2 rounded-full font-semibold transition-colors duration-300 ${
                                    isRainfallAreasActive
                                        ? "bg-blue-400 text-white"
                                        : "bg-blue-200 hover:bg-blue-400 hover:text-white"
                                }`}
                            >
                                View areas with rainfall
                            </button>
                        </div>
                    </div>
                )}
                {activeTab == "Historical Weather Map" && (
                    <div className="p-4 bg-gray-100 rounded shadow-lg mt-4 lg:mt-0 lg:ml-4">
                        <h1 className="text-lg font-semibold mb-2">
                            Weather Filters
                        </h1>

                        <hr className="my-2" />
                        <h2 className="text-md font-semibold mb-2">Map Type</h2>
                        <select
                            value={mapType}
                            onChange={(e) => setMapType(e.target.value)}
                            className="p-2 rounded border border-gray-300 bg-white"
                        >
                            <option value="default">Default</option>
                            <option value="greyscale">Greyscale</option>
                        </select>

                        <hr className="my-2" />
                        <h2 className="text-md font-semibold mb-2">Wind</h2>
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
                            value={selectedLayers}
                            onChange={handleHistoricalCheckboxChange}
                        />

                        {selectedLayers.includes("Windstream") && (
                            <div className="my-2">
                                <h3 className="text-sm font-semibold">
                                    Windstream Particle Size
                                </h3>
                                <Slider
                                    value={windParticleSize}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={handleWindParticleSizeChange}
                                    valueLabelDisplay="auto"
                                />

                                <h3 className="text-sm font-semibold mt-2">
                                    Windstream Particle Color
                                </h3>
                                <select
                                    value={windParticleColor}
                                    onChange={(e) =>
                                        setWindParticleColor(e.target.value)
                                    }
                                    className="p-2 rounded border border-gray-300 bg-white"
                                >
                                    <option value="rgba(0, 150, 255, 0.7)">
                                        Blue
                                    </option>
                                    <option value="rgba(255, 0, 0, 0.7)">
                                        Red
                                    </option>
                                    <option value="rgba(0, 255, 0, 0.8)">
                                        Green
                                    </option>
                                    <option value="grey">Grey</option>
                                </select>
                            </div>
                        )}

                        {selectedLayers.includes("Wind Direction") && (
                            <div className="my-2">
                                <h3 className="text-sm font-semibold">
                                    Wind Direction Scale
                                </h3>
                                <Slider
                                    value={windDirectionScale}
                                    min={1}
                                    max={10}
                                    step={0.1}
                                    onChange={handleWindDirectionScaleChange}
                                    valueLabelDisplay="auto"
                                />
                            </div>
                        )}
                        <hr className="my-2" />
                        <h2 className="text-md font-semibold mb-2">Air</h2>
                        <CheckboxGroup
                            options={[
                                { label: "Air Temperature" },
                                { label: "Humidity" },
                            ]}
                            value={selectedLayers}
                            onChange={handleHistoricalCheckboxChange}
                        />
                        <hr className="my-2" />

                        <h2 className="text-md font-semibold mb-2">
                            Precipitation
                        </h2>
                        <div className="flex flex-col space-y-2">
                            <CheckboxGroup
                                options={[{ label: "Rainfall" }]}
                                value={selectedLayers}
                                onChange={handleHistoricalRainfallSelection}
                            />
                        </div>
                        {selectedLayers.includes("Rainfall") && (
                            <div className="my-2">
                                <h3 className="text-sm font-semibold">
                                    Rainfall Map Scale
                                </h3>
                                <select
                                    value={rainDisplayMode}
                                    onChange={(e) =>
                                        setRainDisplayMode(e.target.value)
                                    }
                                    className="p-2 rounded border border-gray-300 bg-white"
                                >
                                    <option value="rectangle">
                                        Measurements
                                    </option>
                                    <option value="rainmap">Bubble Plot</option>
                                    <option value="heatmap">Heat Map</option>
                                </select>

                                {rainDisplayMode == "rainmap" && (
                                    <>
                                        <h3 className="text-sm font-semibold">
                                            Rain Map Scale
                                        </h3>
                                        <Slider
                                            value={rainMapScale}
                                            min={0.5}
                                            max={3}
                                            step={0.1}
                                            onChange={handleRainMapScaleChange}
                                            valueLabelDisplay="auto"
                                        />
                                    </>
                                )}

                                {rainDisplayMode == "heatmap" && (
                                    <>
                                        <h3 className="text-sm font-semibold mt-2">
                                            Heat Map Mode
                                        </h3>
                                        <select
                                            value={heatmapMode}
                                            onChange={(e) =>
                                                handleAverageRainfallSelection(
                                                    e.target.value
                                                )
                                            }
                                            className="p-2 rounded border border-gray-300 bg-white"
                                        >
                                            <option value="snapshot">
                                                Snapshot
                                            </option>
                                            <option value="average">
                                                Average
                                            </option>
                                        </select>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
