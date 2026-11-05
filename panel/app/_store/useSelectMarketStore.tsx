import { create } from 'zustand'

interface SelectMarketState {
    selectMarket: string
    setSelectMarket: (market: string) => void
}

export const useSelectMarketStore = create<SelectMarketState>((set) => ({
    selectMarket: '',
    setSelectMarket: (selectMarket) => set({ selectMarket }),
}))