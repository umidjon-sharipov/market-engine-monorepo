import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface YoqtirilganState {
    yoqtirilganIds: string[];
    toggleYoqtirilgan: (id: string) => void;
}

export const useYoqtirilganStore = create<YoqtirilganState>()(
    persist(
        (set) => ({
            yoqtirilganIds: [],
            toggleYoqtirilgan: (id) => set((state) => {
                const isExist = state.yoqtirilganIds.includes(id);
                
                if (isExist) {
                    return { yoqtirilganIds: state.yoqtirilganIds.filter(itemId => itemId !== id) };
                } else {
                    return { yoqtirilganIds: [...state.yoqtirilganIds, id] };
                }
            }),
        }),
        {
            name: 'yoqtirilgan-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);