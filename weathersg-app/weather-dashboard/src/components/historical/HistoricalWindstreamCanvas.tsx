import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { HistoricalWindData } from "@/utils/historicalWeatherData";

type HistoricalWindCanvasProps = {
    stationsData: HistoricalWindData[][]; // Array of station data at different timestamps
    totalPlaybackSeconds?: number; // Total duration of the playback in milliseconds
};

const HistoricalWindstreamCanvas: React.FC<HistoricalWindCanvasProps> = ({
    stationsData,
    totalPlaybackSeconds = 60, // Default: 1-minute playback for all timestamps
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();
    const [currentFrame, setCurrentFrame] = useState(0);
    const frameDuration = (totalPlaybackSeconds * 1000) / stationsData.length; // Time per timestamp

    useEffect(() => {
        if (stationsData.length === 0) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        // Define Singapore's geographical bounds
        const SINGAPORE_BOUNDS = {
            latMin: 1.205,
            latMax: 1.475,
            lngMin: 103.595,
            lngMax: 104.045,
        };

        // Adjust canvas dimensions to match map container
        const resizeCanvas = () => {
            const { width, height } = map.getContainer().getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
        };

        resizeCanvas();
        map.on("resize", resizeCanvas);

        // Helper: Generate random lat/lng within bounds
        const getRandomLatLng = () => ({
            lat: Math.random() * (SINGAPORE_BOUNDS.latMax - SINGAPORE_BOUNDS.latMin) + SINGAPORE_BOUNDS.latMin,
            lng: Math.random() * (SINGAPORE_BOUNDS.lngMax - SINGAPORE_BOUNDS.lngMin) + SINGAPORE_BOUNDS.lngMin,
        });

        let particles: {
            x: number;
            y: number;
            lat: number;
            lng: number;
            lastLat: number;
            lastLng: number;
            life: number;
        }[] = [];

        const initializeParticles = () => {
            const zoomLevel = map.getZoom();
            const particleDensity = Math.pow(2, zoomLevel - 10) * 500; // Scale with zoom
            particles = Array(Math.round(particleDensity))
                .fill(null)
                .map(() => {
                    const { lat, lng } = getRandomLatLng();
                    const point = map.latLngToContainerPoint([lat, lng]);
                    return {
                        x: point.x,
                        y: point.y,
                        lat,
                        lastLat: lat,
                        lng,
                        lastLng: lng,
                        life: Math.random() * 100,
                    };
                });
        };

        initializeParticles();
        map.on("zoomend", initializeParticles);

        const updateParticles = () => {
            if (stationsData.length === 0) return;

            const stations = stationsData[currentFrame] || [];

            particles.forEach((particle) => {
                // Find the closest weather station
                const station = stations.reduce<{ station: HistoricalWindData | null; distance: number }>(
                    (nearest, s) => {
                        const distance = Math.sqrt(
                            Math.pow(particle.lat - s.latitude, 2) + Math.pow(particle.lng - s.longitude, 2)
                        );
                        return distance < nearest.distance ? { station: s, distance } : nearest;
                    },
                    { station: null, distance: Infinity }
                ).station;

                if (!station) return;

                // Apply wind movement based on U/V components
                const scaleFactor = 0.1;
                particle.lastLat = particle.lat;
                particle.lastLng = particle.lng;
                particle.lat += station.v * scaleFactor * 0.001;
                particle.lng += station.u * scaleFactor * 0.001;

                // Convert lat/lng back to pixel positions
                const point = map.latLngToContainerPoint([particle.lat, particle.lng]);
                particle.x = point.x;
                particle.y = point.y;

                // Reset particles if they go out of bounds
                if (
                    particle.lat < SINGAPORE_BOUNDS.latMin ||
                    particle.lat > SINGAPORE_BOUNDS.latMax ||
                    particle.lng < SINGAPORE_BOUNDS.lngMin ||
                    particle.lng > SINGAPORE_BOUNDS.lngMax
                ) {
                    const { lat, lng } = getRandomLatLng();
                    const newPoint = map.latLngToContainerPoint([lat, lng]);
                    particle.x = newPoint.x;
                    particle.y = newPoint.y;
                    particle.lat = lat;
                    particle.lng = lng;
                    particle.life = Math.random() * 100;
                }
            });
        };

        const drawParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        
            // Draw particles
            particles.forEach((particle) => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0, 150, 255, 0.7)";
                ctx.fill();
            });
        
            // Ensure timestamp exists
            if (stationsData[currentFrame] && stationsData[currentFrame][0]?.timestamp) {
                const timestamp = stationsData[currentFrame][0].timestamp;
                console.log("Current Timestamp:", timestamp); // Debugging
        
                // Text box styling
                const text = `Time: ${timestamp}`;
                ctx.font = "bold 24px Arial";
                ctx.textAlign = "center";
        
                // Calculate text dimensions
                const textWidth = ctx.measureText(text).width;
                const padding = 10;
                const boxWidth = textWidth + padding * 2;
                const boxHeight = 40;
                const x = canvas.width / 2 - boxWidth / 2;
                const y = 30; // Position near the top
        
                // Draw background rectangle
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Semi-transparent black
                ctx.fillRect(x, y, boxWidth, boxHeight);
        
                // Draw border
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, boxWidth, boxHeight);
        
                // Draw text
                ctx.fillStyle = "white";
                ctx.fillText(text, canvas.width / 2, y + boxHeight / 2 + 8);
            }
        };
        

        const animate = () => {
            updateParticles();
            drawParticles();
            requestAnimationFrame(animate);
        };

        animate();

        // Automatically switch frames at fixed intervals
        const frameInterval = setInterval(() => {
            setCurrentFrame((prevFrame) => (prevFrame + 1) % stationsData.length);
        }, frameDuration);

        return () => {
            clearInterval(frameInterval);
            map.off("resize", resizeCanvas);
            map.off("zoomend", initializeParticles);
        };
    }, [stationsData, currentFrame, map, frameDuration]);

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

export default HistoricalWindstreamCanvas;
