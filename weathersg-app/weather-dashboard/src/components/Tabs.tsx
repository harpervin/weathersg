import React from "react";


type TabsProps = {
    tabs: string[]; // Use WeatherTab[] for the tabs array
    activeTab: string; // Ensure activeTab is of type WeatherTab
    setActiveTab: React.Dispatch<React.SetStateAction<string>>; // Correct type for the setter
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
