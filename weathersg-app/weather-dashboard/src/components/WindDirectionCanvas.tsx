import React, { useEffect, useRef } from "react";
import { StationData } from "../utils/windData";
import { useMap } from "react-leaflet";

type WindCanvasProps = {
    stations: StationData[];
};

const WindDirectionCanvas: React.FC<WindCanvasProps> = ({ stations }) => {
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

        const drawArrows = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear entire canvas

            stations.forEach((station) => {
                // Convert station latitude and longitude to canvas pixel positions
                const point = map.latLngToContainerPoint([station.latitude, station.longitude]);
                const x = point.x;
                const y = point.y;

                const radians = Math.atan2(station.u, station.v); // Calculate wind direction in radians
                const length = 20; // Arrow length

                // Draw arrow body
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + length * Math.sin(radians),
                    y - length * Math.cos(radians)
                );
                ctx.strokeStyle = "rgba(0, 0, 0)";
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
                ctx.fillStyle = "rgba(0, 0, 0)";
                ctx.fill();
            });
        };

        // Redraw arrows on every map move or zoom
        const onMapMoveOrZoom = () => {
            drawArrows();
        };

        map.on("move", onMapMoveOrZoom);
        map.on("zoom", onMapMoveOrZoom);

        // Initial draw
        drawArrows();

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

export default WindDirectionCanvas;
