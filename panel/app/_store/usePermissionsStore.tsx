import { create } from 'zustand'

interface PermissionsState {
    permissions: string[]
    setPermissions: (permissions: string[]) => void
}

export const usePermissionsStore = create<PermissionsState>((set) => ({
    permissions: [],
    setPermissions: (permissions) => set({ permissions }),
}))