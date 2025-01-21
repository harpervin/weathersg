"use client";

import React, { useState } from "react";
import "chart.js/auto"; // Automatically register Chart.js components
import "react-date-range/dist/styles.css"; // Main stylesheet
import "react-date-range/dist/theme/default.css"; // Theme stylesheet
import Tabs from "./Tabs";
import RainWindOptions from "./RainWindOptions";
import DatePicker from "./DatePicker";
import DurationCheckboxes from "./DurationCheckboxes";
import GraphSection from "./GraphSection";

type WeatherTab = "Rainfall" | "Wind Speed" | "Air Temperature" | "Humidity";

const WeatherChartTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WeatherTab>("Rainfall");
  const [duration, setDuration] = useState("Hourly");
  const [showGraph, setShowGraph] = useState(false);
  const [rainWindOption, setRainWindOption] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState([
    { startDate: new Date(), endDate: new Date(), key: "selection" },
  ]);
  const [graphConfig, setGraphConfig] = useState({
    tab: "Rainfall",
    duration: "Hourly",
    data: [10, 20, 30, 40],
  });

  const durations = ["By Region", "Hourly", "Daily", "Weekly", "Monthly", "Yearly"];
  const tabs: WeatherTab[] = ["Rainfall", "Wind Speed", "Air Temperature", "Humidity"];

  const data: Record<WeatherTab, number[]> = {
    Rainfall: [10, 20, 30, 40],
    "Wind Speed": [5, 15, 25, 35],
    "Air Temperature": [25, 26, 27, 28],
    Humidity: [70, 75, 80, 85],
  };

  const handleGenerateGraph = () => {
    setGraphConfig({ tab: activeTab, duration, data: data[activeTab] });
    setShowGraph(true);
  };

  return (
    <div className="p-4 bg-white shadow rounded flex">
      <div className="w-1/2 pr-4">
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        {(activeTab === "Rainfall" || activeTab === "Wind Speed") && (
          <RainWindOptions rainWindOption={rainWindOption} setRainWindOption={setRainWindOption} />
        )}
        <DatePicker dateRange={dateRange} setDateRange={setDateRange} />
        <DurationCheckboxes durations={durations} duration={duration} setDuration={setDuration} />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleGenerateGraph}
        >
          Generate Graph
        </button>
      </div>
      {showGraph && <GraphSection graphConfig={graphConfig} />}
    </div>
  );
};

export default WeatherChartTabs;
