'use client';

import React, { useEffect, useState } from 'react';
import type { AddressCoordinates } from './AddressMap.types';
import 'leaflet/dist/leaflet.css';

interface AddressMapProps {
    value: AddressCoordinates | null;
    onSelect: (coordinates: AddressCoordinates) => void;
}

interface LeafletMapModules {
    MapContainer: React.ComponentType<any>;
    TileLayer: React.ComponentType<any>;
    CircleMarker: React.ComponentType<any>;
    useMapEvents: (events: { click: (event: { latlng: { lat: number; lng: number } }) => void }) => unknown;
}

const defaultCenter: AddressCoordinates = { latitude: 41.3111, longitude: 69.2797 };

const AddressMapClickHandler = ({
    useMapEvents,
    onSelect,
}: {
    useMapEvents: LeafletMapModules['useMapEvents'];
    onSelect: AddressMapProps['onSelect'];
}) => {
    useMapEvents({
        click: event => onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
    });
    return null;
};

const AddressMap = ({ value, onSelect }: AddressMapProps) => {
    const [mapModules, setMapModules] = useState<LeafletMapModules | null>(null);

    useEffect(() => {
        import('react-leaflet').then(modules => {
            setMapModules({
                MapContainer: modules.MapContainer,
                TileLayer: modules.TileLayer,
                CircleMarker: modules.CircleMarker,
                useMapEvents: modules.useMapEvents as unknown as LeafletMapModules['useMapEvents'],
            });
        });
    }, []);

    if (!mapModules) {
        return <div style={{ height: 300, borderRadius: 12, backgroundColor: '#eef2f7' }} />;
    }

    const { MapContainer, TileLayer, CircleMarker, useMapEvents } = mapModules;
    const center = value ?? defaultCenter;

    return (
        <div style={{ height: 300, width: '100%', borderRadius: 12, overflow: 'hidden' }}>
            <MapContainer
                center={[center.latitude, center.longitude]}
                zoom={12}
                scrollWheelZoom
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <AddressMapClickHandler useMapEvents={useMapEvents} onSelect={onSelect} />
                {value && (
                    <CircleMarker
                        center={[value.latitude, value.longitude]}
                        radius={9}
                        pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9 }}
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default AddressMap;
