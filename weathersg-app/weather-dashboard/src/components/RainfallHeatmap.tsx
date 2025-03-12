import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3" 
import { useMap } from "react-leaflet";
import { LatLngTuple } from "leaflet";
import { HistoricalWeatherData } from "@/utils/historicalWeatherData";

type RainfallHeatmapProps = {
    stationsData: HistoricalWeatherData[][];
    currentFrame: number;
    maxIntensity?: number;
    radius?: number;
};

const RainfallHeatmap: React.FC<RainfallHeatmapProps> = ({
    stationsData,
    currentFrame,
    maxIntensity = 50,
    radius = 40,
}) => {
    const map = useMap();

    const stations = stationsData[currentFrame] || [];

    // Convert data to Heatmap format
    const heatmapPoints: LatLngTuple[] = stations.map((station) => [
        station.latitude,
        station.longitude,
        Math.min(station.value / maxIntensity, 1),
    ]);

    return (
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
    );
};

export default RainfallHeatmap;
