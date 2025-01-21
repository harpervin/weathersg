"use client";

import React, { useEffect, useState } from "react";
import { useMap } from "react-leaflet";

type MapTextOverlayProps = {
    position: [number, number]; // Latitude and longitude of the text
    text: string; // Text to display
    style?: React.CSSProperties; // Additional styles for customization
};

const MapTextOverlay: React.FC<MapTextOverlayProps> = ({ position, text, style }) => {
    const map = useMap();
    const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updatePosition = () => {
            const point = map.latLngToContainerPoint(position);
            setScreenPosition({ x: point.x, y: point.y });
        };

        // Initial position and listeners
        updatePosition();
        map.on("move", updatePosition);
        map.on("zoom", updatePosition);

        // Cleanup listeners on unmount
        return () => {
            map.off("move", updatePosition);
            map.off("zoom", updatePosition);
        };
    }, [position, map]);

    return (
        <div
            style={{
                position: "absolute",
                left: `${screenPosition.x}px`,
                top: `${screenPosition.y}px`,
                transform: "translate(-50%, -50%)",
                zIndex: 9999,
                pointerEvents: "none",
                fontSize: "18px",
                fontWeight: "bold",
                color: "black",
                textShadow: "1px 1px 2px white",
                ...style, // Allow custom styles to be passed in
            }}
        >
            {text}
        </div>
    );
};

export default MapTextOverlay;
