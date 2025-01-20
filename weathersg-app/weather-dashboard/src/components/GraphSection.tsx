import React from "react";
import { Bar } from "react-chartjs-2";

type GraphSectionProps = {
  graphConfig: { tab: string; duration: string; data: number[] };
};

const GraphSection: React.FC<GraphSectionProps> = ({ graphConfig }) => {
  return (
    <div className="w-1/2 pl-4">
      <h2 className="text-lg font-semibold mb-4">Graph</h2>
      <Bar
        data={{
          labels: ["North", "South", "East", "West", "Central", "City"],
          datasets: [
            {
              label: `${graphConfig.tab} (${graphConfig.duration})`,
              data: graphConfig.data,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "top" },
          },
        }}
      />
    </div>
  );
};

export default GraphSection;
