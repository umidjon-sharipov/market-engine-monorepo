import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
            storage: createJSONStorage(() =>
                AsyncStorage
            ),
        }
    )
)