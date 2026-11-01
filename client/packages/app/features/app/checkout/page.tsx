'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useRouter } from 'solito/navigation';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import Empty from 'app/components/UI/Empty';
import { fetchWithAuth } from 'app/features/app/auth/fetchWithAuth';
import { useCartStore } from 'app/store/useCartStore';
import { useDeliveryLocationStore } from 'app/store/useDeliveryLocationStore';
import { useTokenStore } from 'app/store/useTokenStore';
import { useUrlStore } from 'app/store/useUrlStore';
import { createCheckoutId } from 'app/utils/createCheckoutId';

interface ProductOption {
    id: string;
    title: string;
    isOptional: boolean;
    items: {
        id: string;
        includedProduct?: { id: string; title: string; price: number } | null;
    }[];
}

interface Product {
    id: string;
    title: string;
    price: number;
    marketId: string;
    quantity: number;
    options: ProductOption[];
}

interface CartLine {
    id: string;
    quantity: number;
    optionSelections: Record<string, string>;
}

const CheckoutPage = () => {
    const url = useUrlStore((state) => state.url);
    const token = useTokenStore((state) => state.token);
    const cart = useCartStore((state) => state.cart) as CartLine[];
    const toggleCart = useCartStore((state) => state.toggleCart);
    const deliveryLocation = useDeliveryLocationStore((state) => state.location);
    const pickPointId = useDeliveryLocationStore((state) => state.pickPointId);
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [checkoutId, setCheckoutId] = useState(createCheckoutId);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!url) return;
        const controller = new AbortController();
        setLoading(true);
        fetch(`${url}/products`, { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) throw new Error(`Savat mahsulotlarini yuklab bo‘lmadi: ${response.status}`);
                const result: unknown = await response.json();
                if (!Array.isArray(result)) throw new Error('Mahsulotlar noto‘g‘ri formatda qaytdi.');
                setProducts(result as Product[]);
            })
            .catch((requestError: unknown) => {
                if (controller.signal.aborted) return;
                console.error('Checkout mahsulotlarini yuklashda xatolik:', requestError);
                setError(requestError instanceof Error ? requestError.message : 'Mahsulotlarni yuklab bo‘lmadi.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [url]);

    useEffect(() => {
        if (!token || !url) return;
        fetchWithAuth(`${url}/auth/profile`)
            .then(async (response) => {
                if (!response.ok) return;
                const profile: unknown = await response.json();
                if (!profile || typeof profile !== 'object') return;
                const fullName = [
                    'firstName' in profile && typeof profile.firstName === 'string' ? profile.firstName : '',
                    'lastName' in profile && typeof profile.lastName === 'string' ? profile.lastName : '',
                ].filter(Boolean).join(' ');
                if (fullName) setName((current) => current || fullName);
                if ('phone' in profile && typeof profile.phone === 'string') {
                    const profilePhone = profile.phone;
                    setPhone((current) => current || profilePhone);
                }
            })
            .catch((profileError: unknown) => {
                console.error('Checkout profil ma’lumotlarini yuklashda xatolik:', profileError);
            });
    }, [token, url]);

    const lines = useMemo(() => cart.flatMap((cartLine) => {
        const product = products.find((item) => item.id === cartLine.id);
        if (!product) return [];
        const selected = product.options.flatMap((group) => {
            const itemId = cartLine.optionSelections[group.id];
            const option = group.items.find((item) => item.id === itemId)?.includedProduct;
            return option ? [{ group, option }] : [];
        });
        const unitPrice = product.price + selected.reduce((sum, item) => sum + item.option.price, 0);
        return [{
            cartLine,
            product,
            selected,
            unitPrice,
            total: unitPrice * cartLine.quantity,
            missingRequired: product.options.some(
                (group) => !group.isOptional && !cartLine.optionSelections[group.id],
            ),
        }];
    }), [cart, products]);
    const total = lines.reduce((sum, line) => sum + line.total, 0);
    const unavailableCount = cart.length - lines.length;
    const marketsInCart = Array.from(new Set(lines.map((line) => line.product.marketId)));

    const submit = async () => {
        if (!url) {
            setError('Server manzili topilmadi.');
            return;
        }
        if (name.trim().length < 2 || phone.trim().length < 7 || address.trim().length < 5) {
            setError('Ism, telefon raqami va manzilni to‘liq kiriting.');
            return;
        }
        if (unavailableCount > 0) {
            setError('Savatda omborda qolmagan mahsulot bor. Uni savatdan olib tashlang.');
            return;
        }
        if (lines.some((line) => line.missingRequired)) {
            setError('Majburiy option tanlovlarini savatda to‘ldiring.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const response = await fetch(`${url}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    checkoutId,
                    name: name.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                    ...(deliveryLocation
                        ? {
                            deliveryLatitude: deliveryLocation.latitude,
                            deliveryLongitude: deliveryLocation.longitude,
                        }
                        : {}),
                    ...(marketsInCart.length === 1 && pickPointId ? { pickPointId } : {}),
                    items: lines.map(({ cartLine }) => ({
                        productId: cartLine.id,
                        quantity: cartLine.quantity,
                        optionSelections: cartLine.optionSelections,
                    })),
                }),
            });
            const result: unknown = await response.json().catch(() => null);
            if (!response.ok) {
                const message = result && typeof result === 'object' && 'message' in result
                    ? String(result.message)
                    : `Buyurtma yaratilmadi: ${response.status}`;
                throw new Error(message);
            }
            if (!Array.isArray(result) || result.length === 0) {
                throw new Error('Buyurtma javobi noto‘g‘ri formatda qaytdi.');
            }
            for (const { cartLine } of lines) {
                toggleCart(cartLine.id, cartLine.optionSelections);
            }
            setSuccess(`${result.length} ta buyurtma naqd to‘lov bilan qabul qilindi.`);
            setCheckoutId(createCheckoutId());
        } catch (requestError) {
            console.error('Buyurtma yuborishda xatolik:', requestError);
            setError(requestError instanceof Error ? requestError.message : 'Buyurtma yaratilmadi.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!cart.length && success) {
        return (
            <ScreenWrapper>
                <View style={styles.successCard}>
                    <Text accessibilityRole="alert" style={styles.success}>{success}</Text>
                </View>
            </ScreenWrapper>
        );
    }
    if (!cart.length) return <Empty />;
    if (loading) {
        return <ScreenWrapper><ActivityIndicator style={{ marginTop: 32 }} color="#2563eb" /></ScreenWrapper>;
    }

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <Pressable onPress={() => router.push('/savat')}>
                    <Text style={styles.back}>‹ Savatga qaytish</Text>
                </Pressable>
                <Text style={styles.heading}>Buyurtmani rasmiylashtirish</Text>
                <Text style={styles.note}>To‘lov yetkazib berilganda naqd pulda olinadi.</Text>
                {lines.map(({ cartLine, product, selected, unitPrice }) => (
                    <View key={`${cartLine.id}-${JSON.stringify(cartLine.optionSelections)}`} style={styles.line}>
                        <Text style={styles.lineTitle}>{product.title} × {cartLine.quantity}</Text>
                        {selected.map(({ group, option }) => (
                            <Text key={group.id} style={styles.optionText}>
                                {group.title}: {option.title}
                            </Text>
                        ))}
                        <Text style={styles.price}>{(unitPrice * cartLine.quantity).toLocaleString()} so‘m</Text>
                        {product.options.some((group) => !group.isOptional && !cartLine.optionSelections[group.id]) ? (
                            <Text style={styles.error}>Majburiy option tanlanmagan.</Text>
                        ) : null}
                    </View>
                ))}
                {unavailableCount > 0 ? (
                    <Text style={styles.error}>{unavailableCount} ta mahsulot omborda qolmagan.</Text>
                ) : null}
                <Text style={styles.total}>Jami: {total.toLocaleString()} so‘m</Text>
                <TextInput value={name} onChangeText={setName} placeholder="Ism-familiya" autoComplete="name" style={styles.input} />
                <TextInput value={phone} onChangeText={setPhone} placeholder="Telefon raqami" keyboardType="phone-pad" autoComplete="tel" style={styles.input} />
                <TextInput value={address} onChangeText={setAddress} placeholder="Yetkazib berish manzili" multiline style={[styles.input, styles.address]} />
                {deliveryLocation ? (
                    <Text style={styles.note}>
                        Xarita: {deliveryLocation.latitude.toFixed(5)}, {deliveryLocation.longitude.toFixed(5)}
                    </Text>
                ) : null}
                {marketsInCart.length > 1 ? (
                    <Text style={styles.note}>Turli marketlar uchun alohida buyurtmalar yaratiladi.</Text>
                ) : null}
                {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
                <Pressable onPress={submit} disabled={submitting} style={[styles.button, submitting && { opacity: 0.6 }]}>
                    {submitting
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.buttonText}>Naqd to‘lov bilan buyurtma berish</Text>}
                </Pressable>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16, gap: 12 },
    heading: { color: '#111827', fontSize: 24, fontWeight: '800' },
    back: { color: '#2563eb', fontWeight: '700' },
    note: { color: '#64748b', fontSize: 14 },
    line: { padding: 14, gap: 4, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#fff' },
    lineTitle: { color: '#0f172a', fontWeight: '700' },
    optionText: { color: '#475569', fontSize: 13 },
    price: { color: '#0f172a', fontWeight: '600', marginTop: 4 },
    total: { color: '#111827', fontSize: 18, fontWeight: '800' },
    input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#0f172a', backgroundColor: '#fff' },
    address: { minHeight: 72, textAlignVertical: 'top' },
    button: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 24 },
    buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
    error: { color: '#dc2626', fontSize: 13 },
    successCard: { margin: 24, padding: 20, backgroundColor: '#fff', borderRadius: 14 },
    success: { color: '#15803d', fontSize: 16, fontWeight: '700' },
});

export default CheckoutPage;
