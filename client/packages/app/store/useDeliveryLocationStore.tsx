import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AddressCoordinates } from 'app/components/UI/AddressMap.types';

interface DeliveryLocationState {
    location: AddressCoordinates | null;
    pickPointId: string | null;
    setLocation: (location: AddressCoordinates) => void;
    setPickPointId: (pickPointId: string | null) => void;
}

export const useDeliveryLocationStore = create<DeliveryLocationState>()(
    persist(
        set => ({
            location: null,
            pickPointId: null,
            setLocation: location => set({ location }),
            setPickPointId: pickPointId => set({ pickPointId }),
        }),
        {
            name: 'delivery-location-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
