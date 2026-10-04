'use client'
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import { useCartStore } from 'app/store/useCartStore';
import Card from 'app/components/UI/Cart';
import { useLanStorage } from 'app/store/useLanStore';
import LoaderCart from 'app/components/UI/LoaderCart';
import NotLoad from 'app/components/UI/NotLoad';
import Empty from 'app/components/UI/Empty';
import { useUrlStore } from 'app/store/useUrlStore';
import AddressMap from 'app/components/UI/AddressMap';
import { useDeliveryLocationStore } from 'app/store/useDeliveryLocationStore';

interface Product {
    id: string;
    title: string;
    price: number;
    marketId: string;
    description: { uz: string, ru: string, en: string };
    categoryId: string;
    discountId: string;
    images: string[];
    quantity: number;
    options: any[];
}

interface CartItem {
    id: string;
    quantity: number;
    optionSelections: Record<string, string>;
}

interface PickPoint {
    id: string;
    title: string;
    address: string | null;
    distanceMeters: number;
    withinServiceRadius: boolean;
}

interface NearestPickPointsResponse {
    nearest: PickPoint | null;
    data: PickPoint[];
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const Savat = () => {
    const url = useUrlStore(state => state.url)
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState('loading');

    const cart = useCartStore(state => state.cart) as CartItem[];
    const cartIds = React.useMemo(() => cart.map(item => item.id), [cart]);
    const lan = useLanStorage(state => state.lan)
    const deliveryLocation = useDeliveryLocationStore(state => state.location);
    const setDeliveryLocation = useDeliveryLocationStore(state => state.setLocation);
    const selectedPickPointId = useDeliveryLocationStore(state => state.pickPointId);
    const setSelectedPickPointId = useDeliveryLocationStore(state => state.setPickPointId);
    const [nearbyPickPoints, setNearbyPickPoints] = useState<PickPoint[]>([]);
    const [pickPointsLoading, setPickPointsLoading] = useState(false);
    const [pickPointsUnavailable, setPickPointsUnavailable] = useState(false);
    const deliveryCopy = {
        title: lan === 'ru' ? 'Место доставки' : lan === 'en' ? 'Delivery location' : 'Yetkazib berish manzili',
        instructions: lan === 'ru'
            ? 'Нажмите на карту, чтобы выбрать место доставки.'
            : lan === 'en'
                ? 'Tap the map to select a delivery location.'
                : 'Yetkazib berish joyini tanlash uchun xaritani bosing.',
        selected: lan === 'ru' ? 'Выбраны координаты' : lan === 'en' ? 'Selected coordinates' : 'Tanlangan koordinatalar',
        pickPoints: lan === 'ru' ? 'Ближайшие пункты выдачи' : lan === 'en' ? 'Nearby pickup points' : 'Yaqin topshirish punktlari',
        noPickPoints: lan === 'ru' ? 'Пункты выдачи поблизости не найдены.' : lan === 'en' ? 'No nearby pickup points found.' : 'Yaqin atrofda topshirish punktlari topilmadi.',
        outsideRadius: lan === 'ru' ? 'Вне зоны обслуживания' : lan === 'en' ? 'Outside service area' : 'Xizmat hududidan tashqarida',
        loadingPickPoints: lan === 'ru' ? 'Загружаем пункты выдачи…' : lan === 'en' ? 'Loading pickup points…' : 'Topshirish punktlari yuklanmoqda…',
        pickPointsUnavailable: lan === 'ru' ? 'Не удалось загрузить пункты выдачи.' : lan === 'en' ? 'Could not load pickup points.' : 'Topshirish punktlarini yuklab bo‘lmadi.',
    };

    const fetchCartProducts = async () => {
        try {
            setLoading('loading')
            const response = await fetch(`${url}/products`);
            const data = await response.json();

            setProducts(data);
            setLoading('loaded')
        } catch (error) {
            console.error("Savat ma'lumotlarini yuklashda xatolik:", error);
            setLoading('notLoad')
        }
    };

    useEffect(() => {
        if (cartIds.length > 0) {
            fetchCartProducts();
        }
    }, [cartIds.join(',')]);

    const cartLines = cart.flatMap(cartItem => {
        const product = products.find(item => String(item.id) === String(cartItem.id));
        return product ? [{ product, cartItem }] : [];
    });
    const marketIds = Array.from(new Set(cartLines.map(line => line.product.marketId).filter(Boolean)));
    const marketId = marketIds.length === 1 ? marketIds[0] : undefined;
    const latitude = deliveryLocation?.latitude;
    const longitude = deliveryLocation?.longitude;

    useEffect(() => {
        if (latitude === undefined || longitude === undefined || !marketId || !UUID_PATTERN.test(marketId)) {
            setNearbyPickPoints([]);
            setSelectedPickPointId(null);
            setPickPointsLoading(false);
            setPickPointsUnavailable(false);
            return;
        }

        let cancelled = false;
        setPickPointsLoading(true);
        setPickPointsUnavailable(false);
        const query = new URLSearchParams({
            marketId,
            latitude: String(latitude),
            longitude: String(longitude),
        });

        fetch(`${url}/pickpoints/nearest?${query.toString()}`)
            .then(async response => {
                if (!response.ok) throw new Error(`Pick point lookup failed: ${response.status}`);
                return response.json() as Promise<NearestPickPointsResponse>;
            })
            .then(response => {
                if (cancelled) return;
                const points = Array.isArray(response.data) ? [...response.data] : [];
                if (response.nearest && !points.some(point => point.id === response.nearest?.id)) {
                    points.unshift(response.nearest);
                }
                setNearbyPickPoints(points);
                const currentPickPointId = useDeliveryLocationStore.getState().pickPointId;
                const preferredPoint = points.find(point => point.id === currentPickPointId && point.withinServiceRadius)
                    ?? (response.nearest?.withinServiceRadius ? response.nearest : null)
                    ?? points.find(point => point.withinServiceRadius)
                    ?? null;
                setSelectedPickPointId(preferredPoint?.id ?? null);
            })
            .catch(() => {
                if (!cancelled) {
                    setNearbyPickPoints([]);
                    setSelectedPickPointId(null);
                    setPickPointsUnavailable(true);
                }
            })
            .finally(() => {
                if (!cancelled) setPickPointsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [
        latitude,
        longitude,
        marketId,
        setSelectedPickPointId,
        url,
    ]);
    if (cartIds.length === 0) return <Empty />

    if (loading === 'loading') {
        return (
            <ScreenWrapper>
                <View style={[styles.grid, {padding: 12}]}>
                    <LoaderCart />
                    <LoaderCart />
                    <LoaderCart />
                    <LoaderCart />
                </View>
            </ScreenWrapper>
        );
    }

    else if (loading === 'notLoad') {
        return <NotLoad renderToken={fetchCartProducts} />
    }

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.deliveryLocation}>
                    <Text style={styles.headerTitle}>{deliveryCopy.title}</Text>
                    <Text style={styles.instructions}>{deliveryCopy.instructions}</Text>
                    <AddressMap value={deliveryLocation} onSelect={setDeliveryLocation} />
                    {deliveryLocation && (
                        <Text style={styles.locationLabel}>
                            {deliveryCopy.selected}: {deliveryLocation.latitude.toFixed(5)}, {deliveryLocation.longitude.toFixed(5)}
                        </Text>
                    )}
                    {deliveryLocation && marketId && UUID_PATTERN.test(marketId) && (
                        <View style={styles.pickPointList}>
                            <Text style={styles.pickPointHeading}>{deliveryCopy.pickPoints}</Text>
                            {pickPointsLoading ? (
                                <Text style={styles.instructions}>{deliveryCopy.loadingPickPoints}</Text>
                            ) : pickPointsUnavailable ? (
                                <Text style={styles.instructions}>{deliveryCopy.pickPointsUnavailable}</Text>
                            ) : nearbyPickPoints.length === 0 ? (
                                <Text style={styles.instructions}>{deliveryCopy.noPickPoints}</Text>
                            ) : nearbyPickPoints.map(point => {
                                const available = point.withinServiceRadius;
                                const selected = point.id === selectedPickPointId;
                                return (
                                    <Pressable
                                        key={point.id}
                                        onPress={() => available && setSelectedPickPointId(point.id)}
                                        disabled={!available}
                                        style={[
                                            styles.pickPoint,
                                            selected && styles.selectedPickPoint,
                                            !available && styles.unavailablePickPoint,
                                        ]}
                                    >
                                        <Text style={[styles.pickPointText, !available && styles.unavailablePickPoint]}>
                                            {selected ? '✓ ' : ''}{point.title}
                                            {point.address ? ` · ${point.address}` : ''}
                                            {` · ${(point.distanceMeters / 1000).toFixed(1)} km`}
                                            {!available ? ` · ${deliveryCopy.outsideRadius}` : ''}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                </View>
                <View style={styles.grid}>
                    {cartLines.map(({ product, cartItem }, index) => (
                        <Card
                            key={`${product.id}-${JSON.stringify(cartItem.optionSelections ?? {})}`}
                            product={product}
                            cartItem={cartItem}
                            index={index}
                        />
                    ))}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    deliveryLocation: { marginBottom: 24, gap: 10 },
    instructions: { color: '#64748b', fontSize: 14, marginBottom: 4 },
    locationLabel: { color: '#334155', fontSize: 14, fontWeight: '600' },
    pickPointList: { gap: 8 },
    pickPointHeading: { color: '#111827', fontSize: 16, fontWeight: '700' },
    pickPoint: { padding: 12, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10 },
    pickPointText: { color: '#334155' },
    selectedPickPoint: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
    unavailablePickPoint: { color: '#94a3b8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#6b7280' }
});

export default Savat;
