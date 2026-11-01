import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getAppStorage } from 'app/storage'

interface ThemeState {
    theme: string
    setTheme: (mode: string) => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'dark',
            setTheme: (mode) => set({ theme: mode }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(getAppStorage),
        }
    )
)