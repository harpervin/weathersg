"use client";

import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { HistoricalWindData } from "@/utils/historicalWeatherData";

type HistoricalWindCanvasProps = {
    stationsData: HistoricalWindData[][];
    currentFrame: number; // Synchronized frame from parent
    sizeScale?: number; // Controls arrow size (length, thickness, arrowhead)
};

const HistoricalWindDirectionCanvas: React.FC<HistoricalWindCanvasProps> = ({
    stationsData,
    currentFrame,
    sizeScale = 10, // Default scaling factor
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
                const point = map.latLngToContainerPoint([
                    station.latitude,
                    station.longitude,
                ]);
                const x = point.x;
                const y = point.y + 10;

                const radians = Math.atan2(station.u, station.v);

                // Scale everything using sizeScale
                const baseSize = 10;
                const length = baseSize + station.speed * sizeScale;
                const thickness = Math.max(1, station.speed * (sizeScale / 10)); // Avoid 0 thickness
                const arrowheadSize = length / 4; // Keep arrowhead proportional

                // Limit max values to avoid excessive sizes
                const maxArrowLength = 60;
                const maxThickness = 6;
                const maxArrowheadSize = 18;

                const finalLength = Math.min(length, maxArrowLength);
                const finalThickness = Math.min(thickness, maxThickness);
                const finalArrowheadSize = Math.min(arrowheadSize, maxArrowheadSize);

                // Draw arrow body
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + (finalLength - finalArrowheadSize) * Math.sin(radians),
                    y - (finalLength - finalArrowheadSize) * Math.cos(radians)
                );
                ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
                ctx.lineWidth = finalThickness;
                ctx.stroke();

                // Draw arrowhead
                const arrowTipX = x + finalLength * Math.sin(radians);
                const arrowTipY = y - finalLength * Math.cos(radians);

                const arrowLeftX = x + (finalLength - finalArrowheadSize) * Math.sin(radians + Math.PI / 7);
                const arrowLeftY = y - (finalLength - finalArrowheadSize) * Math.cos(radians + Math.PI / 7);

                const arrowRightX = x + (finalLength - finalArrowheadSize) * Math.sin(radians - Math.PI / 7);
                const arrowRightY = y - (finalLength - finalArrowheadSize) * Math.cos(radians - Math.PI / 7);

                ctx.beginPath();
                ctx.moveTo(arrowTipX, arrowTipY);
                ctx.lineTo(arrowLeftX, arrowLeftY);
                ctx.lineTo(arrowRightX, arrowRightY);
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
    }, [map, stationsData, currentFrame, sizeScale]); // Ensure re-render on sizeScale change

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
