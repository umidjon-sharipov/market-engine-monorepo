import { create } from 'zustand';
import { Platform } from 'react-native';

interface ScrollStore {
    scrollToTopFunc: (() => void) | null;
    setScrollToTopFunc: (fn: () => void) => void;
    scrollToTop: () => void;
}

export const useScrollStore = create<ScrollStore>((set, get) => ({
    scrollToTopFunc: null,
    setScrollToTopFunc: (fn) => set({ scrollToTopFunc: fn }),
    scrollToTop: () => {
        if (Platform.OS === 'web') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const fn = get().scrollToTopFunc;
            if (fn) fn();
        }
    },
}));