import React, { useEffect, useRef } from "react";
import { StationData } from "../utils/windData";
import { useMap } from "react-leaflet";

type WindCanvasProps = {
    stations: StationData[];
};

type NearestStationAccumulator = {
    station: StationData | null;
    distance: number;
};

const WindstreamCanvas: React.FC<WindCanvasProps> = ({ stations }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();

    useEffect(() => {
        if (stations.length === 0) return;

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
            const { width, height } = map
                .getContainer()
                .getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
        };

        resizeCanvas(); // Initial resize
        map.on("resize", resizeCanvas); // Resize on map container changes

        // Helper: Generate random latitude and longitude within Singapore bounds
        const getRandomLatLng = () => ({
            lat:
                Math.random() *
                    (SINGAPORE_BOUNDS.latMax - SINGAPORE_BOUNDS.latMin) +
                SINGAPORE_BOUNDS.latMin,
            lng:
                Math.random() *
                    (SINGAPORE_BOUNDS.lngMax - SINGAPORE_BOUNDS.lngMin) +
                SINGAPORE_BOUNDS.lngMin,
        });

        // Initialize particles
        let particles: {
            x: number;
            y: number;
            lat: number;
            lng: number;
            life: number;
            lastX: number;
            lastY: number;
        }[] = [];

        const initializeParticles = () => {
            const zoomLevel = map.getZoom();
            const particleDensity = Math.pow(2, zoomLevel - 10) * 500; // Scale particle count with zoom
            particles = Array(Math.round(particleDensity))
                .fill(null)
                .map(() => {
                    const { lat, lng } = getRandomLatLng();
                    const point = map.latLngToContainerPoint([lat, lng]);
                    return {
                        x: point.x,
                        y: point.y,
                        lat,
                        lng,
                        life: Math.random() * 100,
                        lastX: point.x,
                        lastY: point.y,
                    };
                });
        };

        initializeParticles(); // Initial particle generation

        map.on("zoomend", initializeParticles); // Recalculate particles on zoom

        const updateParticles = () => {
            particles.forEach((particle) => {
                // Find the nearest station for wind data
                const station = stations.reduce<NearestStationAccumulator>(
                    (nearest, s) => {
                        const distance = Math.sqrt(
                            Math.pow(particle.lat - s.latitude, 2) +
                                Math.pow(particle.lng - s.longitude, 2)
                        );

                        if (distance < nearest.distance) {
                            return { station: s, distance }; // Update nearest station
                        }

                        return nearest; // Keep the current nearest station
                    },
                    { station: null, distance: Infinity } // Initial value for the accumulator
                ).station;

                if (!station) return;

                // Apply wind movement
                const scaleFactor = 0.1; // Adjust movement speed
                particle.lat += station.v * scaleFactor * 0.001; // Use v for latitude adjustment
                particle.lng += station.u * scaleFactor * 0.001; // Use u for longitude adjustment

                // Convert lat/lng back to pixel positions
                const point = map.latLngToContainerPoint([
                    particle.lat,
                    particle.lng,
                ]);
                particle.x = point.x;
                particle.y = point.y;

                // Reset particles if they go out of Singapore's bounds
                if (
                    particle.lat < SINGAPORE_BOUNDS.latMin ||
                    particle.lat > SINGAPORE_BOUNDS.latMax ||
                    particle.lng < SINGAPORE_BOUNDS.lngMin ||
                    particle.lng > SINGAPORE_BOUNDS.lngMax
                ) {
                    const { lat, lng } = getRandomLatLng();
                    const point = map.latLngToContainerPoint([lat, lng]);
                    particle.x = point.x;
                    particle.y = point.y;
                    particle.lat = lat;
                    particle.lng = lng;
                    particle.life = Math.random() * 100;
                }
            });
        };

        const drawParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear entire canvas
            particles.forEach((particle) => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0, 150, 255, 0.7)";
                ctx.fill();
            });
        };

        // Animation loop
        const animate = () => {
            updateParticles();
            drawParticles();
            requestAnimationFrame(animate);
        };

        animate();

        // Cleanup on unmount
        return () => {
            map.off("resize", resizeCanvas);
            map.off("zoomend", initializeParticles);
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

export default WindstreamCanvas;
