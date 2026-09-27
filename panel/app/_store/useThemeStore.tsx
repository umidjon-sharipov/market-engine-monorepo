import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        }
    )
)