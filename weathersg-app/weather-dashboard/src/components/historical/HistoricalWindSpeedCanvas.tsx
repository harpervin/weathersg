import React, { useEffect, useRef } from "react";
import { HistoricalWindData } from "@/utils/historicalWeatherData";
import { useMap } from "react-leaflet";

type HistoricalWindSpeedCanvas = {
    stationsData: HistoricalWindData[][]; // Array of station data at different timestamps
    currentFrame: number; // Synchronized frame from parent
};

const HistoricalWindSpeedCanvas: React.FC<HistoricalWindSpeedCanvas> = ({
    stationsData,
    currentFrame,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (stationsData.length === 0) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const resizeCanvas = () => {
            const { width, height } = map.getContainer().getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
        };
        resizeCanvas();
        map.on("resize", resizeCanvas);

        const drawWindSpeed = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            const stations = stationsData[currentFrame] || [];

            stations.forEach((station) => {
                // Convert station latitude and longitude to canvas pixel positions
                const point = map.latLngToContainerPoint([
                    station.latitude,
                    station.longitude,
                ]);
                const x = point.x;
                const y = point.y;

                const text = `${station.speed.toFixed(1)} knots`; // Format wind speed text
                const padding = 4; // Padding inside the background box
                const boxWidth = ctx.measureText(text).width + padding * 2; // Box width based on text width
                const boxHeight = 20; // Box height

                // Draw the background box
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; // Background color
                ctx.strokeStyle = "rgba(0, 0, 0, 0.8)"; // Outline color
                ctx.lineWidth = 1;
                ctx.fillRect(x - boxWidth / 2, y - 30, boxWidth, boxHeight); // Center the box above the arrow
                ctx.strokeRect(x - boxWidth / 2, y - 30, boxWidth, boxHeight);

                // Draw the text
                ctx.fillStyle = "rgba(0, 0, 0, 1)"; // Text color
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(text, x, y - 20); // Position text above the arrow
            });
        };

        const animate = () => {
            drawWindSpeed();
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationRef.current!);
            map.off("resize", resizeCanvas);
        };
    }, [map, stationsData, currentFrame]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 10000, // Ensure it's above the map
            }}
        />
    );
};

export default HistoricalWindSpeedCanvas;
