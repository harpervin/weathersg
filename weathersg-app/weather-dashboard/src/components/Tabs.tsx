import React from "react";

type WeatherTab = "Rainfall" | "Wind Speed" | "Air Temperature" | "Humidity";

type TabsProps = {
    tabs: WeatherTab[]; // Use WeatherTab[] for the tabs array
    activeTab: WeatherTab; // Ensure activeTab is of type WeatherTab
    setActiveTab: React.Dispatch<React.SetStateAction<WeatherTab>>; // Correct type for the setter
  };

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b mb-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`p-2 ${
            activeTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
