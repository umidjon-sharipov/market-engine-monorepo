import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
    id: string;
    quantity: number;
}

interface CartState {
    cart: CartItem[];
    toggleCart: (id: number) => void;
    incrementQuantity: (id: number) => void;
    decrementQuantity: (id: number) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            cart: [],

            toggleCart: (id) => set((state) => {
                const isExist = state.cart.some(item => item.id === id);

                if (isExist) {
                    return { cart: state.cart.filter(item => item.id !== id) };
                } else {
                    return { cart: [...state.cart, { id, quantity: 1 }] };
                }
            }),

            incrementQuantity: (id) => set((state) => ({
                cart: state.cart.map(item =>
                    item.id === id ? { ...item, quantity: item.quantity + 1 } : item
                )
            })),

            decrementQuantity: (id) => set((state) => {
                const targetItem = state.cart.find(item => item.id === id);

                if (!targetItem) return {};

                if (targetItem.quantity === 1) {
                    return { cart: state.cart.filter(item => item.id !== id) };
                } else {
                    return {
                        cart: state.cart.map(item =>
                            item.id === id ? { ...item, quantity: item.quantity - 1 } : item
                        )
                    };
                }
            }),
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);