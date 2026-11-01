import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getAppStorage } from 'app/storage'

interface TabState {
    tab: number
    setTab: (tab: number) => void
}

export const useTabStore = create<TabState>()(
    persist(
        (set) => ({
            tab: 0,
            setTab: (tab) => set({ tab: tab }),
        }),
        {
            name: 'tab-storage',
            storage: createJSONStorage(getAppStorage),
        }
    )
)