import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'
import { getAppStorage } from 'app/storage'

interface useLanStore {
    lan: string,
    setLan: (lang: string) => void
}

export const useLanStorage = create<useLanStore>()(
    persist(
        (set) => ({
            lan: 'uz',
            setLan: (lang) => set({ lan: lang })
        }),
        {
            name: 'lan-storage',
            storage: createJSONStorage(getAppStorage),
        }
    )
)