"use client";

import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { HistoricalWindData } from "@/utils/historicalWeatherData";

type HistoricalWindCanvasProps = {
    stationsData: HistoricalWindData[][];
    currentFrame: number; // Synchronized frame from parent
};

type NearestStationAccumulator = {
    station: HistoricalWindData | null;
    distance: number;
};

const HistoricalWindstreamCanvas: React.FC<HistoricalWindCanvasProps> = ({
    stationsData,
    currentFrame,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const map = useMap();
    const animationRef = useRef<number | null>(null);

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
        resizeCanvas();
        map.on("resize", resizeCanvas);

        let particles: {
            x: number;
            y: number;
            lat: number;
            lng: number;
            life: number;
        }[] = [];

        const getRandomLatLng = () => ({
            lat: Math.random() * (SINGAPORE_BOUNDS.latMax - SINGAPORE_BOUNDS.latMin) + SINGAPORE_BOUNDS.latMin,
            lng: Math.random() * (SINGAPORE_BOUNDS.lngMax - SINGAPORE_BOUNDS.lngMin) + SINGAPORE_BOUNDS.lngMin,
        });

        const initializeParticles = () => {
            const zoomLevel = map.getZoom();
            const particleDensity = Math.pow(2, zoomLevel - 10) * 500; // Scale particle count with zoom
            particles = Array(Math.round(particleDensity))
                .fill(null)
                .map(() => {
                    const { lat, lng } = getRandomLatLng();
                    const point = map.latLngToContainerPoint([lat, lng]);
                    return { x: point.x, y: point.y, lat, lng, life: Math.random() * 100 };
                });
        };

        initializeParticles();
        map.on("zoomend", initializeParticles);

        const updateParticles = () => {
            const stations = stationsData[currentFrame] || [];

            particles.forEach((particle) => {
                // Find the nearest wind station
                const nearestStation = stations.reduce<NearestStationAccumulator>(
                    (nearest, s) => {
                        const distance = Math.sqrt(
                            Math.pow(particle.lat - s.latitude, 2) + Math.pow(particle.lng - s.longitude, 2)
                        );
                        return distance < nearest.distance ? { station: s, distance } : nearest;
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
            particles.forEach((particle) => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 2, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0, 150, 255, 0.7)";
                ctx.fill();
            });
        };

        const animate = () => {
            updateParticles();
            drawParticles();
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationRef.current!);
            map.off("resize", resizeCanvas);
            map.off("zoomend", initializeParticles);
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

export default HistoricalWindstreamCanvas;
