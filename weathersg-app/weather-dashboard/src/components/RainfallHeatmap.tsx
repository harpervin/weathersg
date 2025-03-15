import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import { useMap } from "react-leaflet";
import { LatLngTuple } from "leaflet";
import { HistoricalWeatherData } from "@/utils/historicalWeatherData";
import { useEffect } from "react";

type RainfallHeatmapProps = {
    stationsData: HistoricalWeatherData[][];
    currentFrame: number;
    maxIntensity?: number;
    radius?: number;
    heatmapMode?: string;
};

const RainfallHeatmap: React.FC<RainfallHeatmapProps> = ({
    stationsData,
    currentFrame,
    maxIntensity = 50,
    radius = 40,
    heatmapMode = "snapshot",
}) => {
    const stations = stationsData[currentFrame] || [];

    // Convert data to Heatmap format
    const heatmapPoints: LatLngTuple[] = stations.map((station) => [
        station.latitude,
        station.longitude,
        Math.min(station.value / maxIntensity, 1),
    ]);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* Text Overlay */}
            {heatmapMode === "average" && (
                <div
                    style={{
                        position: "absolute",
                        top: "10px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "#fff",
                        padding: "8px 12px",
                        borderRadius: "5px",
                        fontSize: "14px",
                        zIndex: 1000,
                    }}
                >
                    Displaying Average Rainfall Data
                </div>
            )}

            {/* Heatmap Layer */}
            <HeatmapLayer
                fitBoundsOnLoad
                fitBoundsOnUpdate
                points={heatmapPoints}
                longitudeExtractor={(m) => m[1]}
                latitudeExtractor={(m) => m[0]}
                intensityExtractor={(m) => m[2] ?? 0}
                radius={radius}
                max={1.0}
                blur={15}
                gradient={{
                    0.2: "#B0E0E6",
                    0.4: "#4682B4",
                    0.6: "#1E90FF",
                    0.8: "#0000FF",
                    1.0: "#00008B",
                }}
            />
        </div>
    );
};

export default RainfallHeatmap;
