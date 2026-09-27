import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface useThemeStore {
    color: string
    setColor: (nextColor: string) => void
}

export const useColorStore = create<useThemeStore>()(
    persist(
        (set) => ({
            color: '#7000FF',
            setColor: (nextColor) => set({ color: nextColor })
        }),
        {
            name: 'color-storage',
            storage: createJSONStorage(() =>
                AsyncStorage
            ),
        }
    )
)