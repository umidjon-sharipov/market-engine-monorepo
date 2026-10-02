import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Account {
    email: string
    userName: string
    image: string
    accessToken: string
    refreshToken: string
}

interface TokenState {
    token: string
    accounts: Account[]
    activeEmail: string | null
    hasHydrated: boolean
    setToken: (token: string) => void
    setHasHydrated: (hasHydrated: boolean) => void
    addOrUpdateAccount: (account: Account) => void
    switchAccount: (email: string) => void
    removeAccount: (email: string) => void
    updateAccountTokens: (email: string, accessToken: string, refreshToken: string) => void
}

export const useTokenStore = create<TokenState>()(
    persist(
        (set) => ({
            token: '',
            accounts: [],
            activeEmail: null,
            hasHydrated: false,
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
            setToken: (token) => set((state) => ({
                token,
                accounts: state.activeEmail
                    ? state.accounts.map(account => account.email === state.activeEmail
                        ? { ...account, accessToken: token }
                        : account)
                    : state.accounts,
            })),
            addOrUpdateAccount: (account) => set((state) => ({
                accounts: [
                    ...state.accounts.filter(existing => existing.email !== account.email),
                    account,
                ],
                activeEmail: account.email,
                token: account.accessToken,
            })),
            switchAccount: (email) => set((state) => {
                const account = state.accounts.find(item => item.email === email)
                return account
                    ? { activeEmail: email, token: account.accessToken }
                    : state
            }),
            removeAccount: (email) => set((state) => {
                const accounts = state.accounts.filter(account => account.email !== email)
                const activeAccount = state.activeEmail === email
                    ? accounts[0]
                    : accounts.find(account => account.email === state.activeEmail)
                return {
                    accounts,
                    activeEmail: activeAccount?.email ?? null,
                    token: activeAccount?.accessToken ?? '',
                }
            }),
            updateAccountTokens: (email, accessToken, refreshToken) => set((state) => ({
                accounts: state.accounts.map(account => account.email === email
                    ? { ...account, accessToken, refreshToken }
                    : account),
                token: state.activeEmail === email ? accessToken : state.token,
            })),
        }),
        {
            name: 'token-storage',
            storage: createJSONStorage(() => AsyncStorage),
            version: 1,
            migrate: (persistedState, version) => {
                if (version === 0) {
                    const legacyState = persistedState as Pick<TokenState, 'token'>
                    return {
                        token: legacyState.token ?? '',
                        accounts: [],
                        activeEmail: null,
                        hasHydrated: false,
                    } as TokenState
                }
                return persistedState as TokenState
            },
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.error('Tokenlarni saqlashdan tiklashda xatolik:', error)
                    useTokenStore.setState({ hasHydrated: true })
                } else {
                    state?.setHasHydrated(true)
                }
            },
        }
    )
)
