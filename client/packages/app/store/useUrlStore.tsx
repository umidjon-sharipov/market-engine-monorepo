import { create } from 'zustand'

interface urlState {
    url: string
    setUrl: (url: string) => void
}

export const useUrlStore = create<urlState>()(
    (set) => ({
        url: 'https://internet-magazin-nest-server.vercel.app',
        setUrl: (url) => set({ url: url }),
    })
)