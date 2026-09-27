import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Account {
    email: string;
    userName: string;
    image: string;
    accessToken: string;
    refreshToken: string;
}

interface TokenState {
    accounts: Account[];
    activeEmail: string | null;
    
    addOrUpdateAccount: (account: Account) => void;
    switchAccount: (email: string) => void;
    removeAccount: (email: string) => void;
    getActiveToken: () => string | null;
}

export const useTokenStore = create<TokenState>()(
    persist(
        (set, get) => ({
        accounts: [],
        activeEmail: null,

        addOrUpdateAccount: (newAccount) => {
            set((state) => {
            const exists = state.accounts.some(acc => acc.email === newAccount.email);
            let updatedAccounts;
            if (exists) {
                updatedAccounts = state.accounts.map(acc => 
                acc.email === newAccount.email ? newAccount : acc
                );
            } else {
                updatedAccounts = [...state.accounts, newAccount];
            }
            return {
                accounts: updatedAccounts,
                activeEmail: newAccount.email,
            };
            });
        },

        switchAccount: (email) => {
            set({ activeEmail: email });
        },

        removeAccount: (email) => {
            set((state) => {
            const filtered = state.accounts.filter(acc => acc.email !== email);
            let newActiveEmail = state.activeEmail;
            
            if (state.activeEmail === email) {
                newActiveEmail = filtered.length > 0 ? filtered[0].email : null;
            }

            return {
                accounts: filtered,
                activeEmail: newActiveEmail,
            };
            });
        },

        getActiveToken: () => {
            const state = get();
            if (!state.activeEmail) return null;
            const current = state.accounts.find(acc => acc.email === state.activeEmail);
            return current ? current.accessToken : null;
        },
        }),
        {
        name: 'multi-account-storage',
        }
    )
);