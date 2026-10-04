import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
    id: string;
    quantity: number;
    optionSelections: Record<string, string>;
}

interface CartState {
    cart: CartItem[];
    toggleCart: (id: string | number, optionSelections?: Record<string, string>) => void;
    incrementQuantity: (id: string | number, optionSelections?: Record<string, string>) => void;
    decrementQuantity: (id: string | number, optionSelections?: Record<string, string>) => void;
}

const sameSelections = (
    left: Record<string, string> = {},
    right: Record<string, string> = {},
) => {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    return leftKeys.length === rightKeys.length &&
        leftKeys.every((key, index) => key === rightKeys[index] && left[key] === right[key]);
};

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            cart: [],

            toggleCart: (id, optionSelections = {}) => set((state) => {
                const productId = String(id);
                const isExist = state.cart.some(item =>
                    String(item.id) === productId && sameSelections(item.optionSelections, optionSelections)
                );

                if (isExist) {
                    return {
                        cart: state.cart.filter(item =>
                            String(item.id) !== productId || !sameSelections(item.optionSelections, optionSelections)
                        )
                    };
                } else {
                    return {
                        cart: [...state.cart, { id: productId, quantity: 1, optionSelections: { ...optionSelections } }]
                    };
                }
            }),

            incrementQuantity: (id, optionSelections = {}) => set((state) => ({
                cart: state.cart.map(item =>
                    String(item.id) === String(id) && sameSelections(item.optionSelections, optionSelections)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            })),

            decrementQuantity: (id, optionSelections = {}) => set((state) => {
                const targetItem = state.cart.find(item =>
                    String(item.id) === String(id) && sameSelections(item.optionSelections, optionSelections)
                );

                if (!targetItem) return {};

                if (targetItem.quantity === 1) {
                    return {
                        cart: state.cart.filter(item =>
                            String(item.id) !== String(id) || !sameSelections(item.optionSelections, optionSelections)
                        )
                    };
                } else {
                    return {
                        cart: state.cart.map(item =>
                            String(item.id) === String(id) && sameSelections(item.optionSelections, optionSelections)
                                ? { ...item, quantity: item.quantity - 1 }
                                : item
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
