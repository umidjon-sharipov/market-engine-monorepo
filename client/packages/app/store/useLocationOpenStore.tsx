import { create } from 'zustand'

interface locationOpenState {
    locationOpen: boolean
    setLocationOpen: (locationOpen: boolean) => void
}

export const useLocationOpenStore = create<locationOpenState>((set) => ({
    locationOpen: false,
    setLocationOpen: (locationOpen) => set({ locationOpen }),
}))