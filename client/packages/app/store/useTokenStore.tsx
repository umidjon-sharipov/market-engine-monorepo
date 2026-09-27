import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface tokenState {
    token: string
    setToken: (token: string) => void
}

export const useTokenStore = create<tokenState>()(
    persist(
        (set) => ({
            token: '',
            setToken: (token) => set({ token: token }),
        }),
        {
            name: 'token-storage',
            storage: createJSONStorage(() =>
                AsyncStorage
            ),
        }
    )
)