import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ApikeyState {
    apikey: string
    setApikey: (key: string) => void
}

export const useApikeyStore = create<ApikeyState>()(
    persist(
        (set) => ({
            apikey: '1234',
            setApikey: (key) => set({ apikey: key }),
        }),
        {
            name: 'apikey-storage',
        }
    )
)