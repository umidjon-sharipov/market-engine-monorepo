import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface selectMarketState {
    selectMarket: string
    setSelectMarket: (selectMarket: string) => void
}

export const useSelectMarketStore = create<selectMarketState>()(
    persist(
        (set) => ({
            selectMarket: '',
            setSelectMarket: (selectMarket) => set({ selectMarket: selectMarket }),
        }),
        {
            name: 'selectMarket-storage',
        }
    )
)
