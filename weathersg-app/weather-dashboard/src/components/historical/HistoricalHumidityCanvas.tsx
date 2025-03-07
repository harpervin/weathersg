"use client";

import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { HistoricalWeatherData } from "@/utils/historicalWeatherData";

type HistoricalHumidityCanvasProps = {
    stationsData: HistoricalWeatherData[][]; // Array of station data at different timestamps
    currentFrame: number; // Synchronized frame from parent
};

const HistoricalHumidityCanvas: React.FC<HistoricalHumidityCanvasProps> = ({
    stationsData,
    currentFrame, // Use the frame from parent
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

        const drawHumidity = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

            const stations = stationsData[currentFrame] || []; // Use parent frame

            stations.forEach((station) => {
                // Convert latitude/longitude to canvas pixel positions
                const point = map.latLngToContainerPoint([
                    station.latitude,
                    station.longitude,
                ]);
                const x = point.x;
                const y = point.y;

                // Draw circular background
                const radius = 22;
                ctx.beginPath();
                ctx.arc(x + 25, y - 60, radius, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(82, 243, 235, 0.5)"; // Light blue background
                ctx.fill();
                ctx.strokeStyle = "rgba(62, 210, 202, 1)"; // Border
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw humidity text
                ctx.font = "14px Arial";
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`${station.value.toFixed(1)}%`, x + 25, y - 60);
            });

        };
        const animate = () => {
            drawHumidity();
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationRef.current!);
            map.off("resize", resizeCanvas);
        };
    }, [map, stationsData, currentFrame]); // Reacts to parent `currentFrame`

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
                zIndex: 10001, // Ensure humidity is rendered above wind layers
            }}
        />
    );
};

export default HistoricalHumidityCanvas;
