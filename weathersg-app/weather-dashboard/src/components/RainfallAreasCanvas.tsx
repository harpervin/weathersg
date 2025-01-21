import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";

type RainfallCanvasProps = {
    stations: {
        id: string;
        latitude: number;
        longitude: number;
        rainfall: number;
    }[];
};

const RainfallAreasCanvas: React.FC<RainfallCanvasProps> = ({ stations }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();
    const [showTooltip, setShowTooltip] = useState(false); // State to manage tooltip visibility

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

        // Initialize raindrops
        const numRaindrops = 200; // Adjust for density
        let raindrops = Array.from({ length: numRaindrops }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 2 + 1, // Random speed for raindrops
            length: Math.random() * 15 + 5, // Random length for raindrops
        }));

        const updateRaindrops = () => {
            raindrops = raindrops.map((drop) => {
                const newY = drop.y + drop.speed;
                if (newY > canvas.height) {
                    // Reset raindrop to the top
                    return {
                        ...drop,
                        y: 0,
                        x: Math.random() * canvas.width,
                        speed: Math.random() * 2 + 1,
                        length: Math.random() * 15 + 5,
                    };
                }
                return { ...drop, y: newY };
            });
        };

        const drawOverlayAndRainfall = () => {
            // Draw translucent blue overlay
            ctx.fillStyle = "rgba(0, 0, 255, 0.03)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw raindrops
            ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
            ctx.lineWidth = 1.5;

            raindrops.forEach((drop) => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x, drop.y + drop.length);
                ctx.stroke();
            });

            // Draw rainfall data at station locations with rainfall > 0
            stations
                .filter((station) => station.rainfall > 0)
                .forEach((station) => {
                    const point = map.latLngToContainerPoint([
                        station.latitude,
                        station.longitude,
                    ]);
                    const x = point.x;
                    const y = point.y;

                    // Define dimensions for the rounded rectangle
                    const rectWidth = 50; // Adjust width
                    const rectHeight = 30; // Adjust height
                    const radius = 8; // Corner radius

                    // Draw the rounded rectangle
                    ctx.beginPath();
                    ctx.roundRect(
                        x - rectWidth / 2, // Top-left x
                        y - rectHeight, // Top-left y (offset above the station)
                        rectWidth, // Width
                        rectHeight, // Height
                        radius // Corner radius
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
                        `${station.rainfall.toFixed(1)} mm`,
                        x,
                        y - rectHeight / 2 // Center text within the rectangle
                    );
                });
        };

        // Animation loop
        const animate = () => {
            const hasRainfall = stations.some((station) => station.rainfall > 0);

            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

            if (hasRainfall) {
                setShowTooltip(false); // Hide tooltip
                drawOverlayAndRainfall();
                updateRaindrops();
            } else {
                setShowTooltip(true); // Show tooltip
            }

            requestAnimationFrame(animate);
        };

        animate();

        // Cleanup on unmount
        return () => {
            map.off("resize", resizeCanvas);
        };
    }, [stations, map]);

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
                    zIndex: 10000, // Ensure it's above the map
                }}
            />
            {showTooltip && (
                <div
                    style={{
                        position: "absolute",
                        top: "10px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        color: "white",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        zIndex: 10001,
                        pointerEvents: "none",
                        fontSize: "14px",
                    }}
                >
                    No rainfall received at any station
                </div>
            )}
        </>
    );
};

export default RainfallAreasCanvas;
