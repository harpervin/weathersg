"use client";

import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { HistoricalWindData } from "@/utils/historicalWeatherData";

type HistoricalWindCanvasProps = {
    stationsData: HistoricalWindData[][];
    currentFrame: number; // Synchronized frame from parent
};

const HistoricalWindDirectionCanvas: React.FC<HistoricalWindCanvasProps> = ({
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

        const drawArrows = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const stations = stationsData[currentFrame] || [];

            stations.forEach((station) => {
                // Convert station latitude and longitude to canvas pixel positions
                const point = map.latLngToContainerPoint([
                    station.latitude,
                    station.longitude,
                ]);
                const x = point.x;
                const y = point.y + 10;

                const radians = Math.atan2(station.u, station.v);
                const length = 20; // Arrow length

                // Draw arrow body
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + length * Math.sin(radians),
                    y - length * Math.cos(radians)
                );
                ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw arrowhead
                ctx.beginPath();
                ctx.moveTo(
                    x + length * Math.sin(radians),
                    y - length * Math.cos(radians)
                );
                ctx.lineTo(
                    x + (length - 5) * Math.sin(radians + Math.PI / 6),
                    y - (length - 5) * Math.cos(radians + Math.PI / 6)
                );
                ctx.lineTo(
                    x + (length - 5) * Math.sin(radians - Math.PI / 6),
                    y - (length - 5) * Math.cos(radians - Math.PI / 6)
                );
                ctx.closePath();
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fill();
            });
        };

        const animate = () => {
            drawArrows();
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
                zIndex: 10000,
            }}
        />
    );
};

export default HistoricalWindDirectionCanvas;
