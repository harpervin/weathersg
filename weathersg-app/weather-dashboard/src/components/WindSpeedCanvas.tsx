import React, { useEffect, useRef } from "react";
import { StationData } from "../utils/windData";
import { useMap } from "react-leaflet";

type WindCanvasProps = {
    stations: StationData[];
};

const WindSpeedCanvas: React.FC<WindCanvasProps> = ({ stations }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        // Adjust canvas dimensions to match map container
        const resizeCanvas = () => {
            const { width, height } = map.getContainer().getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
        };

        resizeCanvas(); // Initial resize
        map.on("resize", resizeCanvas); // Resize on map container changes

        const drawWindSpeed = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

            stations.forEach((station) => {
                // Convert station latitude and longitude to canvas pixel positions
                const point = map.latLngToContainerPoint([station.latitude, station.longitude]);
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

        // Redraw wind speed on map move or zoom
        const onMapMoveOrZoom = () => {
            drawWindSpeed();
        };

        map.on("move", onMapMoveOrZoom);
        map.on("zoom", onMapMoveOrZoom);

        // Initial draw
        drawWindSpeed();

        // Cleanup on unmount
        return () => {
            map.off("resize", resizeCanvas);
            map.off("move", onMapMoveOrZoom);
            map.off("zoom", onMapMoveOrZoom);
        };
    }, [stations, map]);

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

export default WindSpeedCanvas;
