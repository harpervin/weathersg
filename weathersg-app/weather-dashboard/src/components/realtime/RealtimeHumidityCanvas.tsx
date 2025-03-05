import React, { useEffect, useRef } from "react";
import { StationHumidityData } from "../../utils/humidityData";
import { useMap } from "react-leaflet";

type HumidityCanvasProps = {
    stations: StationHumidityData[];
};

const RealtimeHumidityCanvas: React.FC<HumidityCanvasProps> = ({
    stations,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();

    useEffect(() => {
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
                ctx.arc(x + 25, y - 60, radius, 0, 2 * Math.PI); // Adjusted y position
                ctx.fillStyle = "rgba(82, 243, 235, 0.5)"; // Blue background
                ctx.fill();
                ctx.strokeStyle = "rgba(62, 210, 202, 1)"; // Blue border
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw humidity text
                ctx.font = "14px Arial"; // Slightly larger font
                ctx.fillStyle = "black"; // Black text color
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`${station.humidity.toFixed(1)}%`, x + 25, y - 60); // Render above wind speed
            });
        };

        // Redraw temperatures on every map move or zoom
        const onMapMoveOrZoom = () => {
            drawTemperatures();
        };

        map.on("move", onMapMoveOrZoom);
        map.on("zoom", onMapMoveOrZoom);

        // Initial draw
        drawTemperatures();

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
                zIndex: 10001, // Ensure air temperature is rendered above wind speed
            }}
        />
    );
};

export default RealtimeHumidityCanvas;
