"use client";

import React, { useEffect, useRef } from "react";
import { HistoricalWeatherData } from "@/utils/historicalWeatherData";
import { useMap } from "react-leaflet";

type AirTemperatureCanvasProps = {
    stationsData: HistoricalWeatherData[][];
    currentFrame: number; // Synchronized frame from parent
};

const RealtimeAirTemperatureCanvas: React.FC<AirTemperatureCanvasProps> = ({
    stationsData,
    currentFrame,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        console.log(stationsData)
        if (stationsData.length === 0) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        // Adjust canvas dimensions to match map container
        const resizeCanvas = () => {
            const { width, height } = map
                .getContainer()
                .getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
        };

        resizeCanvas(); // Initial resize
        map.on("resize", resizeCanvas); // Resize on map container changes

        const drawTemperatures = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear entire canvas
            const stations = stationsData[currentFrame] || []; // Use parent frame

            stations.forEach((station) => {
                // Convert station latitude and longitude to canvas pixel positions
                const point = map.latLngToContainerPoint([
                    station.latitude,
                    station.longitude,
                ]);
                const x = point.x;
                const y = point.y;

                // Draw circular background
                const radius = 22; // Increase radius size for larger background
                ctx.beginPath();
                ctx.arc(x - 25, y - 60, radius, 0, 2 * Math.PI); // Adjusted y position
                ctx.fillStyle = "rgba(255, 165, 0, 0.8)"; // Orange background
                ctx.fill();
                ctx.strokeStyle = "rgba(255, 140, 0, 1)"; // Orange border
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw temperature text
                ctx.font = "14px Arial"; // Slightly larger font
                ctx.fillStyle = "black"; // Black text color
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`${station.value.toFixed(1)}°C`, x - 25, y - 60); // Render above wind speed
            });
        };

        // Initial draw
        const animate = () => {
            drawTemperatures();
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup on unmount
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
                zIndex: 10001, // Ensure air temperature is rendered above wind speed
            }}
        />
    );
};

export default RealtimeAirTemperatureCanvas;
