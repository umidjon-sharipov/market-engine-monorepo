import { create } from 'zustand'

interface modalState {
    modal: string
    setModal: (modal: string) => void
}

export const useModalStore = create<modalState>((set) => ({
    modal: '',
    setModal: (modal) => set({ modal }),
}))