import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface roleState {
    role: string
    setRole: (role: string) => void
}

export const useRoleStore = create<roleState>()(
    persist(
        (set) => ({
            role: '',
            setRole: (role) => set({ role: role }),
        }),
        {
            name: 'role-storage',
        }
    )
)
