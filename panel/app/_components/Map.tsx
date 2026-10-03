'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function LocationClickEvent({ onSelect }: { onSelect?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            if (onSelect) onSelect(lat, lng);
        },
    });
    return null;
}

interface MapProps {
    isDarkMode?: boolean;
    onLocationSelect?: (lat: number, lng: number) => void;
    markers?: Array<{ id: string | number; lat: number; lng: number; title?: string }>;
}

export default function Map({ isDarkMode = false, onLocationSelect, markers = [] }: MapProps) {
    const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);

    const handleMapClick = (lat: number, lng: number) => {
        setSelectedPosition({ lat, lng });
        if (onLocationSelect) {
            onLocationSelect(lat, lng);
        }
    };

    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    return (
        <div className={`w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300 z-[0] ${isDarkMode
            ? 'border-neutral-800 bg-[#070b14] shadow-blue-950/40'
            : 'border-neutral-200 bg-white shadow-neutral-200/50'
            }`}>
            <MapContainer
                center={[41.311081, 69.240562]}
                zoom={7}
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%', background: isDarkMode ? '#070b14' : '#f8fafc' }}
            >
                <MapResizer />

                <div className={isDarkMode ? "w-full h-full filter invert hue-rotate-180 brightness-75 contrast-125 saturate-150" : "w-full h-full"}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url={tileUrl}
                    />
                </div>

                {isDarkMode && (
                    <div className="absolute inset-0 bg-blue-600/15 pointer-events-none mix-blend-overlay" />
                )}

                <LocationClickEvent onSelect={handleMapClick} />

                {selectedPosition && (
                    <Marker position={[selectedPosition.lat, selectedPosition.lng]}>
                        <Popup className="[&_.leaflet-popup-content-wrapper]:bg-sky-100/10 [&_.leaflet-popup-content-wrapper]:backdrop-blur-md [&_.leaflet-popup-content-wrapper]:shadow-xl [&_.leaflet-popup-content-wrapper]:rounded-3xl [&_.leaflet-popup-tip]:bg-sky-100/80">
                            <div className="text-xs font-sans p-1">
                                <p className="font-bold text-neutral-900">Tanlangan nuqta:</p>
                                <p className="text-neutral-600">Lat: {selectedPosition.lat.toFixed(4)}</p>
                                <p className="text-neutral-600">Lng: {selectedPosition.lng.toFixed(4)}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {markers.map((m) => (
                    <Marker key={m.id} position={[m.lat, m.lng]}>
                        {m.title && (
                            <Popup>
                                <div className="text-xs font-sans font-medium text-neutral-800">
                                    {m.title}
                                </div>
                            </Popup>
                        )}
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}