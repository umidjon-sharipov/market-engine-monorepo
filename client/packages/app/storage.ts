import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

const serverStorage: StateStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

export function getAppStorage() {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
        return serverStorage;
    }

    return AsyncStorage;
}
