import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getAppStorage } from 'app/storage'

interface locationTypes {
    location: string,
    setLocation: (location: string) => void
}

export const uselocationStorage = create<locationTypes>()(
    persist(
        (set) => ({
            location: 'Toshkent',
            setLocation: (newlocation) => set({location: newlocation})
        }),
        {
            name: 'location-storage',
            storage: createJSONStorage(getAppStorage),
        }
    )
)