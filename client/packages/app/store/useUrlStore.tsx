import { create } from 'zustand'

interface urlState {
    url: string
    setUrl: (url: string) => void
}

export const useUrlStore = create<urlState>()(
    (set) => ({
        url: 'https://market-engine-monorepo-back.onrender.com',
        setUrl: (url) => set({ url: url }),
    })
)