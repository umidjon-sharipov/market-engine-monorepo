import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getAppStorage } from 'app/storage';
import type { AddressCoordinates } from 'app/components/UI/AddressMap.types';

interface DeliveryLocationState {
    location: AddressCoordinates | null;
    ownerUserId: string | null;
    pickPointId: string | null;
    setLocation: (location: AddressCoordinates | null, ownerUserId?: string | null) => void;
    setPickPointId: (pickPointId: string | null) => void;
}

export const useDeliveryLocationStore = create<DeliveryLocationState>()(
    persist(
        set => ({
            location: null,
            ownerUserId: null,
            pickPointId: null,
            setLocation: (location, ownerUserId) => set(state => ({
                location,
                ownerUserId: ownerUserId === undefined ? state.ownerUserId : ownerUserId,
            })),
            setPickPointId: pickPointId => set({ pickPointId }),
        }),
        {
            name: 'delivery-location-storage',
            storage: createJSONStorage(getAppStorage),
        }
    )
);
