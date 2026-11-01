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
import AddressMap from 'app/components/UI/AddressMap';
import Empty from 'app/components/UI/Empty';
import { fetchWithAuth } from 'app/features/app/auth/fetchWithAuth';
import { useCartStore } from 'app/store/useCartStore';
import { useDeliveryLocationStore } from 'app/store/useDeliveryLocationStore';
import { useTokenStore } from 'app/store/useTokenStore';
import { useUrlStore } from 'app/store/useUrlStore';
import { createCheckoutId } from 'app/utils/createCheckoutId';
import {
    evaluateConfiguration,
    type ConfigurableProduct,
} from 'app/features/app/product/productConfiguration';

interface Product extends ConfigurableProduct {
    id: string;
    title: string;
    price: number;
    marketId: string;
    quantity: number;
}

interface CartLine {
    id: string;
    quantity: number;
    optionSelections: Record<string, string>;
}

interface PickPoint {
    id: string;
    title: string;
    address: string | null;
    distanceMeters: number;
}

interface PickPointRecommendations {
    nearest: PickPoint | null;
    data: PickPoint[];
}

const CheckoutPage = () => {
    const url = useUrlStore((state) => state.url);
    const token = useTokenStore((state) => state.token);
    const cart = useCartStore((state) => state.cart) as CartLine[];
    const toggleCart = useCartStore((state) => state.toggleCart);
    const deliveryLocation = useDeliveryLocationStore((state) => state.location);
    const locationOwnerUserId = useDeliveryLocationStore((state) => state.ownerUserId);
    const setDeliveryLocation = useDeliveryLocationStore((state) => state.setLocation);
    const pickPointId = useDeliveryLocationStore((state) => state.pickPointId);
    const setPickPointId = useDeliveryLocationStore((state) => state.setPickPointId);
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
    const [pickPoints, setPickPoints] = useState<PickPoint[]>([]);
    const [pickPointsLoading, setPickPointsLoading] = useState(false);
    const [pickPointsError, setPickPointsError] = useState('');

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
                if ('id' in profile && typeof profile.id === 'string') {
                    const profileLatitude = 'latitude' in profile &&
                        typeof profile.latitude === 'number' && Number.isFinite(profile.latitude)
                        ? profile.latitude
                        : null;
                    const profileLongitude = 'longitude' in profile &&
                        typeof profile.longitude === 'number' && Number.isFinite(profile.longitude)
                        ? profile.longitude
                        : null;
                    const profileLocation = profileLatitude !== null && profileLongitude !== null
                        ? { latitude: profileLatitude, longitude: profileLongitude }
                        : null;
                    const current = useDeliveryLocationStore.getState();
                    if (current.ownerUserId && current.ownerUserId !== profile.id) {
                        setDeliveryLocation(profileLocation, profile.id);
                    } else if (!current.ownerUserId) {
                        setDeliveryLocation(profileLocation ?? current.location, profile.id);
                    } else if (profileLocation && !current.location) {
                        setDeliveryLocation(profileLocation, profile.id);
                    }
                }
            })
            .catch((profileError: unknown) => {
                console.error('Checkout profil ma’lumotlarini yuklashda xatolik:', profileError);
            });
    }, [locationOwnerUserId, setDeliveryLocation, token, url]);

    const lines = useMemo(() => cart.flatMap((cartLine) => {
        const product = products.find((item) => item.id === cartLine.id);
        if (!product) return [];
        const configuration = evaluateConfiguration(product, cartLine.optionSelections ?? {});
        const selected = configuration.selected.map(({ group, product: option }) => ({
            group,
            option,
        }));
        const unitPrice = configuration.totalPrice;
        return [{
            cartLine,
            product,
            selected,
            unitPrice,
            total: unitPrice * cartLine.quantity,
            missingRequired: configuration.missingGroups.length > 0,
        }];
    }), [cart, products]);
    const total = lines.reduce((sum, line) => sum + line.total, 0);
    const unavailableCount = cart.length - lines.length;
    const marketsInCart = Array.from(new Set(lines.map((line) => line.product.marketId)));
    const recommendationItems = useMemo(() => lines.map(({ cartLine, product }) => ({
        productId: product.id,
        quantity: cartLine.quantity,
        selectedOptions: evaluateConfiguration(product, cartLine.optionSelections ?? {})
            .selected.map(({ parentProductId, product: optionProduct }) => ({
                parentProductId,
                optionProductId: optionProduct.id,
            })),
    })), [lines]);
    const marketId = marketsInCart.length === 1 ? marketsInCart[0] : null;

    useEffect(() => {
        if (!url || !deliveryLocation || !marketId) {
            setPickPoints([]);
            setPickPointId(null);
            setPickPointsLoading(false);
            setPickPointsError('');
            return;
        }
        let cancelled = false;
        setPickPointsLoading(true);
        setPickPointsError('');
        fetch(`${url}/pickpoints/recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                marketId,
                latitude: deliveryLocation.latitude,
                longitude: deliveryLocation.longitude,
                items: recommendationItems,
            }),
        })
            .then(async (response) => {
                if (!response.ok) {
                    const payload: unknown = await response.json().catch(() => null);
                    const message = payload && typeof payload === 'object' && 'message' in payload
                        ? String(payload.message)
                        : `Topshirish punktlari olinmadi: ${response.status}`;
                    throw new Error(message);
                }
                return response.json() as Promise<PickPointRecommendations>;
            })
            .then((result) => {
                if (cancelled) return;
                const points = Array.isArray(result.data) ? result.data : [];
                setPickPoints(points);
                const preferred = points.find((point) => point.id === useDeliveryLocationStore.getState().pickPointId)
                    ?? (result.nearest && points.some((point) => point.id === result.nearest?.id) ? result.nearest : null)
                    ?? points[0]
                    ?? null;
                setPickPointId(preferred?.id ?? null);
            })
            .catch((recommendationError: unknown) => {
                if (!cancelled) {
                    setPickPoints([]);
                    setPickPointId(null);
                    setPickPointsError(recommendationError instanceof Error
                        ? recommendationError.message
                        : 'Topshirish punktlarini yuklab bo‘lmadi.');
                }
            })
            .finally(() => {
                if (!cancelled) setPickPointsLoading(false);
            });
        return () => { cancelled = true; };
    }, [
        deliveryLocation,
        marketId,
        recommendationItems,
        setPickPointId,
        url,
    ]);

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
        if (!deliveryLocation) {
            setError('Xaritani bosib joriy joylashuvingizni belgilang.');
            return;
        }
        if (marketId && pickPointsError) {
            setError('Topshirish punktlari olinmadi. Aloqani tekshirib, qayta urinib ko‘ring.');
            return;
        }
        if (marketId && pickPointsLoading) {
            setError('Yaqin topshirish punktlari yuklanishini kuting.');
            return;
        }
        if (marketId && pickPoints.length > 0 && !pickPointId) {
            setError('Buyurtma uchun topshirish punktini tanlang.');
            return;
        }
        if (pickPointId && !pickPoints.some((point) => point.id === pickPointId)) {
            setError('Tanlangan topshirish punkti endi mavjud emas. Qaytadan tanlang.');
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
                        Tanlangan joylashuv: {deliveryLocation.latitude.toFixed(5)}, {deliveryLocation.longitude.toFixed(5)}
                    </Text>
                ) : <Text style={styles.locationPrompt}>Xaritani bosib buyurtma uchun joylashuvingizni tanlang.</Text>}
                <AddressMap value={deliveryLocation} onSelect={setDeliveryLocation} />
                {marketId ? (
                    <View style={styles.pickPoints}>
                        <Text style={styles.pickPointsTitle}>Tavsiya etilgan topshirish punktlari</Text>
                        {pickPointsLoading ? <ActivityIndicator color="#2563eb" /> : null}
                        {pickPointsError ? <Text style={styles.error}>{pickPointsError}</Text> : null}
                        {!pickPointsLoading && !pickPointsError && pickPoints.length === 0 ? (
                            <Text style={styles.note}>Tanlangan mahsulotlar uchun mos topshirish punkti topilmadi.</Text>
                        ) : null}
                        {pickPoints.map((point) => (
                            <Pressable
                                key={point.id}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: point.id === pickPointId }}
                                onPress={() => setPickPointId(point.id)}
                                style={[styles.pickPoint, point.id === pickPointId && styles.pickPointSelected]}
                            >
                                <Text style={styles.pickPointName}>{point.title}</Text>
                                {point.address ? <Text style={styles.note}>{point.address}</Text> : null}
                                <Text style={styles.note}>{(point.distanceMeters / 1000).toFixed(1)} km</Text>
                            </Pressable>
                        ))}
                    </View>
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
    locationPrompt: { color: '#b45309', fontSize: 14, fontWeight: '600' },
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
    pickPoints: { gap: 8, paddingVertical: 8 },
    pickPointsTitle: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
    pickPoint: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, backgroundColor: '#fff' },
    pickPointSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
    pickPointName: { color: '#0f172a', fontWeight: '700' },
});

export default CheckoutPage;
