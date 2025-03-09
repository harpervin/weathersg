import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { HistoricalWeatherData } from "@/utils/historicalWeatherData";

type RainfallCanvasProps = {
    stationsData: HistoricalWeatherData[][]; // Array of station data at different timestamps
    currentFrame: number; // Synchronized frame from parent
};

const RealtimeRainfallAreasCanvas: React.FC<RainfallCanvasProps> = ({
    stationsData,
    currentFrame,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize canvas to match map
        const resizeCanvas = () => {
            const { width, height } = map
                .getContainer()
                .getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
        };

        resizeCanvas(); // Initial resize
        map.on("resize", resizeCanvas); // Resize on map container changes

        // Function to draw rainfall overlay
        const drawRainfall = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

            const stations = stationsData[currentFrame] || [];

            // Draw rainfall at station locations
            stations
                .filter((station) => station.value > 0)
                .forEach((station) => {
                    const point = map.latLngToContainerPoint([
                        station.latitude,
                        station.longitude,
                    ]);
                    const x = point.x;
                    const y = point.y;

                    // Define dimensions for the rounded rectangle
                    const rectWidth = 50;
                    const rectHeight = 30;
                    const radius = 8;

                    // Draw the rounded rectangle
                    ctx.beginPath();
                    ctx.roundRect(
                        x - rectWidth / 2, // Top-left x
                        y - rectHeight, // Top-left y (offset above the station)
                        rectWidth,
                        rectHeight,
                        radius
                    );
                    ctx.fillStyle = "rgba(82, 243, 235, 0.5)"; // Blue background
                    ctx.fill();
                    ctx.strokeStyle = "rgba(62, 210, 202, 1)"; // Blue border
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Draw rainfall text
                    ctx.font = "14px Arial";
                    ctx.fillStyle = "black";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        `${station.value.toFixed(1)} mm`,
                        x,
                        y - rectHeight / 2
                    );
                });
        };

        const animate = () => {
            drawRainfall(); // Initial draw
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup on unmount
        return () => {
            map.off("resize", resizeCanvas);
        };
    }, [stationsData, map, currentFrame]);

    return (
        <>
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 10000,
                }}
            />
        </>
    );
};

export default RealtimeRainfallAreasCanvas;
