import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import { getAppStorage } from 'app/storage';

interface YoqtirilganState {
    yoqtirilganIds: string[];
    toggleYoqtirilgan: (id: string | number) => void;
}

export const useYoqtirilganStore = create<YoqtirilganState>()(
    persist(
        (set) => ({
            yoqtirilganIds: [],
            toggleYoqtirilgan: (id) => set((state) => {
                const productId = String(id);
                const isExist = state.yoqtirilganIds.includes(productId);
                
                if (isExist) {
                    return { yoqtirilganIds: state.yoqtirilganIds.filter(itemId => itemId !== productId) };
                } else {
                    return { yoqtirilganIds: [...state.yoqtirilganIds, productId] };
                }
            }),
        }),
        {
            name: 'yoqtirilgan-storage',
            storage: createJSONStorage(getAppStorage),
            partialize: (state) => ({ yoqtirilganIds: state.yoqtirilganIds }),
            version: 1,
            migrate: (persistedState) => {
                const state = persistedState as Partial<YoqtirilganState> | undefined;
                return {
                    yoqtirilganIds: Array.isArray(state?.yoqtirilganIds)
                        ? Array.from(new Set(state.yoqtirilganIds.map(String)))
                        : [],
                };
            },
        }
    )
);