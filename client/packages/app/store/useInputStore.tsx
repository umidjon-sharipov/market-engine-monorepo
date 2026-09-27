import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from '@react-native-async-storage/async-storage'

interface inputTypes {
    input: string,
    setInput: (input: string) => void
}

export const useInputStorage = create<inputTypes>()(
    persist(
        (set) => ({
            input: '',
            setInput: (newInput) => set({input: newInput})
        }),
        {
            name: 'input-storage',
            storage: createJSONStorage(() =>
                AsyncStorage
            ),
        }
    )
)