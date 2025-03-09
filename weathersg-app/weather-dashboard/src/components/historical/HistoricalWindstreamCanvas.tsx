"use client";

import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { HistoricalWindData } from "@/utils/historicalWeatherData";

type HistoricalWindCanvasProps = {
    stationsData: HistoricalWindData[][];
    currentFrame: number;
    windParticleSize: number; // Controls particle size
    windColor: string; // Controls wind color (e.g., "grey", "blue", "red", "green")
};

type Particle = {
    x: number;
    y: number;
    lat: number;
    lng: number;
    life: number;
};

const HistoricalWindstreamCanvas: React.FC<HistoricalWindCanvasProps> = ({
    stationsData,
    currentFrame,
    windParticleSize,
    windColor,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();
    const animationRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const MAX_PARTICLES = 5000;

    // Define Singapore's geographical bounds
    const SINGAPORE_BOUNDS = {
        latMin: 1.205,
        latMax: 1.475,
        lngMin: 103.595,
        lngMax: 104.045,
    };

    useEffect(() => {
        if (stationsData.length === 0) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const resizeCanvas = () => {
            const { width, height } = map.getContainer().getBoundingClientRect();
            canvas.width = width;
            canvas.height = height;
        };

        const getRandomLatLng = () => ({
            lat:
                Math.random() * (SINGAPORE_BOUNDS.latMax - SINGAPORE_BOUNDS.latMin) +
                SINGAPORE_BOUNDS.latMin,
            lng:
                Math.random() * (SINGAPORE_BOUNDS.lngMax - SINGAPORE_BOUNDS.lngMin) +
                SINGAPORE_BOUNDS.lngMin,
        });

        const initializeParticles = () => {
            particlesRef.current = [];
            const zoomLevel = map.getZoom();
            const particleDensity = Math.min(
                MAX_PARTICLES,
                Math.round(Math.pow(2, zoomLevel - 10) * 500)
            );

            particlesRef.current = Array.from({ length: particleDensity }, () => {
                const { lat, lng } = getRandomLatLng();
                const point = map.latLngToContainerPoint([lat, lng]);
                return {
                    x: point.x,
                    y: point.y,
                    lat,
                    lng,
                    life: Math.random() * 100,
                };
            });
        };

        const updateParticles = () => {
            const stations = stationsData[currentFrame] || [];

            particlesRef.current.forEach((particle) => {
                const nearestStation = stations.reduce<{
                    station: HistoricalWindData | null;
                    distance: number;
                }>(
                    (nearest, s) => {
                        const distance = Math.sqrt(
                            Math.pow(particle.lat - s.latitude, 2) +
                                Math.pow(particle.lng - s.longitude, 2)
                        );
                        return distance < nearest.distance
                            ? { station: s, distance }
                            : nearest;
                    },
                    { station: null, distance: Infinity }
                ).station;

                if (!nearestStation) return;

                // Apply wind movement
                particle.lat += nearestStation.v * 0.0001;
                particle.lng += nearestStation.u * 0.0001;

                // Convert lat/lng back to pixel positions
                const point = map.latLngToContainerPoint([particle.lat, particle.lng]);
                particle.x = point.x;
                particle.y = point.y;

                // Reset particles if they move out of bounds
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
            particlesRef.current.forEach((particle) => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, windParticleSize, 0, 2 * Math.PI);
                ctx.fillStyle = windColor; // Use windColor prop
                ctx.fill();
            });
        };

        const animate = () => {
            updateParticles();
            drawParticles();
            animationRef.current = requestAnimationFrame(animate);
        };

        // Resize and initialize
        resizeCanvas();
        initializeParticles();
        animate();

        // Event listeners
        map.on("resize", resizeCanvas);
        map.on("zoomend", initializeParticles);

        return () => {
            cancelAnimationFrame(animationRef.current!);
            map.off("resize", resizeCanvas);
            map.off("zoomend", initializeParticles);
        };
    }, [map, stationsData, currentFrame, windParticleSize, windColor]); // ✅ Added windColor as dependency

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
