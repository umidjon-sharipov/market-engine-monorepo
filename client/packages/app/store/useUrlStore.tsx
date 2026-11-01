import { create } from 'zustand'

interface urlState {
    url: string
    setUrl: (url: string) => void
}

export const useUrlStore = create<urlState>()(
    (set) => ({
        url: 'http://localhost:4000',
        setUrl: (url) => set({ url: url }),
    })
)