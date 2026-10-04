import React from 'react';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';
import type { AddressCoordinates } from './AddressMap.types';

interface AddressMapProps {
    value: AddressCoordinates | null;
    onSelect: (coordinates: AddressCoordinates) => void;
}

const defaultCenter: AddressCoordinates = { latitude: 41.3111, longitude: 69.2797 };

const AddressMap = ({ value, onSelect }: AddressMapProps) => {
    const center = value ?? defaultCenter;
    const handlePress = (event: MapPressEvent) => onSelect(event.nativeEvent.coordinate);

    return (
        <MapView
            style={{ height: 300, width: '100%', borderRadius: 12 }}
            initialRegion={{
                ...center,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
            }}
            onPress={handlePress}
        >
            {value && <Marker coordinate={value} />}
        </MapView>
    );
};

export default AddressMap;
