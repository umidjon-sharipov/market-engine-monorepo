'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'solito/navigation';
import AnimatedPressable from 'app/components/UI/AnimatedPressable';
import AboutWrapper from 'app/components/UI/AboutWrapper';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import { fetchWithAuth } from 'app/features/app/auth/fetchWithAuth';
import { useDesignStore } from 'app/store/useDesignStore';
import { useLanStorage } from 'app/store/useLanStore';
import { useTokenStore } from 'app/store/useTokenStore';
import { useUrlStore } from 'app/store/useUrlStore';

interface FollowedPickPoint {
    id: string;
    title: string;
    address: string | null;
    latitude: number;
    longitude: number;
    serviceRadiusMeters: number;
    warehouse: {
        id: string;
        title: string;
        market: { id: string; title: string; logo: string };
    };
}

const translations = {
    uz: {
        eyebrow: 'YETKAZIB BERISH', title: 'Topshirish punktlari', subtitle: 'Siz kuzatadigan va sizni bloklamagan marketlarning faol punktlari bir joyda.',
        search: 'Market yoki manzil bo‘yicha qidiring', available: 'Siz kuzatadigan marketlar',
        loading: 'Punktlar yuklanmoqda…', empty: 'Hozircha punktlar topilmadi.',
        emptyHint: 'Marketlarga obuna bo‘ling yoki keyinroq qayta tekshiring.',
        retry: 'Qayta urinish', error: 'Punktlarni yuklab bo‘lmadi.',
        login: 'Punktlarni ko‘rish uchun tizimga kiring', market: 'Market',
        warehouse: 'Ombor', address: 'Manzil kiritilmagan', radius: 'Xizmat radiusi',
        directions: 'Xaritada ochish', count: 'ta punkt', filtered: 'ta natija',
    },
    en: {
        eyebrow: 'DELIVERY', title: 'Pickup points', subtitle: 'Active pickup locations from markets you follow that have not blocked your account.',
        search: 'Search market or address', available: 'Markets you follow',
        loading: 'Loading pickup points…', empty: 'No pickup points found.',
        emptyHint: 'Follow a market or check again later.',
        retry: 'Try again', error: 'Could not load pickup points.',
        login: 'Sign in to view pickup points', market: 'Market',
        warehouse: 'Warehouse', address: 'Address not provided', radius: 'Service radius',
        directions: 'Open map', count: 'points', filtered: 'results',
    },
    ru: {
        eyebrow: 'ДОСТАВКА', title: 'Пункты выдачи', subtitle: 'Активные пункты магазинов, на которые вы подписаны и которые не заблокировали ваш аккаунт.',
        search: 'Поиск по магазину или адресу', available: 'Магазины, на которые вы подписаны',
        loading: 'Загружаем пункты…', empty: 'Пункты выдачи не найдены.',
        emptyHint: 'Подпишитесь на магазин или попробуйте позже.',
        retry: 'Повторить', error: 'Не удалось загрузить пункты выдачи.',
        login: 'Войдите, чтобы видеть пункты выдачи', market: 'Магазин',
        warehouse: 'Склад', address: 'Адрес не указан', radius: 'Зона обслуживания',
        directions: 'Открыть карту', count: 'пунктов', filtered: 'результатов',
    },
} as const;

const isPickPointArray = (value: unknown): value is FollowedPickPoint[] =>
    Array.isArray(value) && value.every(item =>
        typeof item === 'object' && item !== null &&
        'id' in item && typeof item.id === 'string' &&
        'title' in item && typeof item.title === 'string' &&
        'latitude' in item && typeof item.latitude === 'number' &&
        'longitude' in item && typeof item.longitude === 'number' &&
        'warehouse' in item && typeof item.warehouse === 'object' && item.warehouse !== null &&
        'market' in item.warehouse && typeof item.warehouse.market === 'object' && item.warehouse.market !== null &&
        'title' in item.warehouse.market && typeof item.warehouse.market.title === 'string',
    );

export default function PunktPage() {
    const lan = useLanStorage(state => state.lan) as keyof typeof translations;
    const t = translations[lan] ?? translations.uz;
    const url = useUrlStore(state => state.url);
    const token = useTokenStore(state => state.token);
    const hasHydrated = useTokenStore(state => state.hasHydrated);
    const theme = useDesignStore(state => state.theme);
    const accent = useDesignStore(state => state.accentColor);
    const router = useRouter();
    const { width } = useWindowDimensions();
    const dark = theme === 'dark';
    const [points, setPoints] = useState<FollowedPickPoint[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const palette = useMemo(() => ({
        text: dark ? '#f8fafc' : '#0f172a',
        muted: dark ? '#94a3b8' : '#64748b',
        card: dark ? 'rgba(15,23,42,0.78)' : 'rgba(255,255,255,0.88)',
        border: dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)',
        soft: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
    }), [dark]);

    const loadPoints = useCallback(async (signal?: AbortSignal) => {
        if (!hasHydrated) return;
        if (!token) {
            setPoints([]);
            setLoading(false);
            return;
        }
        const response = await fetchWithAuth(`${url}/pickpoints/following`, { method: 'GET', signal }, token);
        if (response.status === 401) {
            router.push('/auth');
            throw new Error(t.login);
        }
        if (!response.ok) throw new Error(`${t.error} (${response.status})`);
        const data: unknown = await response.json();
        if (!isPickPointArray(data)) throw new Error(t.error);
        setPoints(data);
    }, [hasHydrated, router, t.error, t.login, token, url]);

    useEffect(() => {
        if (!hasHydrated) return;
        const controller = new AbortController();
        setLoading(true);
        setError('');
        loadPoints(controller.signal)
            .catch((requestError: unknown) => {
                if (!controller.signal.aborted) {
                    setError(requestError instanceof Error ? requestError.message : t.error);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [hasHydrated, loadPoints, t.error]);

    const marketsCount = useMemo(() => new Set(points.map(point => point.warehouse.market.id)).size, [points]);
    const visiblePoints = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase();
        if (!normalized) return points;
        return points.filter(point =>
            `${point.title} ${point.address ?? ''} ${point.warehouse.title} ${point.warehouse.market.title}`
                .toLocaleLowerCase()
                .includes(normalized),
        );
    }, [points, query]);
    const openMap = (point: FollowedPickPoint) => {
        const destination = `${point.latitude},${point.longitude}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
        void Linking.openURL(url);
    };

    return (
        <ScreenWrapper>
            <View style={styles.page}>
                <AboutWrapper>
                    <View style={styles.content}>
                        <View style={styles.hero}>
                            <Text style={[styles.eyebrow, { color: accent }]}>{t.eyebrow}</Text>
                            <Text style={[styles.title, { color: palette.text }]}>{t.title}</Text>
                            <Text style={[styles.subtitle, { color: palette.muted }]}>{t.subtitle}</Text>
                            <View style={styles.stats}>
                                <View style={[styles.statCard, { backgroundColor: palette.soft, borderColor: palette.border }]}>
                                    <Text style={[styles.statValue, { color: accent }]}>{points.length}</Text>
                                    <Text style={[styles.statLabel, { color: palette.muted }]}>{t.count}</Text>
                                </View>
                                <View style={[styles.statCard, { backgroundColor: palette.soft, borderColor: palette.border }]}>
                                    <Text style={[styles.statValue, { color: accent }]}>{marketsCount}</Text>
                                    <Text style={[styles.statLabel, { color: palette.muted }]}>{t.available}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.searchBox, { backgroundColor: palette.soft, borderColor: palette.border }]}>
                            <Text style={[styles.searchIcon, { color: accent }]}>⌕</Text>
                            <TextInput
                                value={query}
                                onChangeText={setQuery}
                                placeholder={t.search}
                                placeholderTextColor={palette.muted}
                                style={[styles.searchInput, { color: palette.text }]}
                                accessibilityLabel={t.search}
                            />
                            {query ? <Pressable onPress={() => setQuery('')}><Text style={[styles.clear, { color: palette.muted }]}>×</Text></Pressable> : null}
                        </View>

                        {error ? (
                            <View style={[styles.stateCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                <Text style={[styles.stateText, { color: palette.text }]}>{error}</Text>
                                <Pressable onPress={() => {
                                    setLoading(true);
                                    setError('');
                                    loadPoints().catch((requestError: unknown) => {
                                        setError(requestError instanceof Error ? requestError.message : t.error);
                                    }).finally(() => setLoading(false));
                                }}>
                                    <Text style={[styles.retry, { color: accent }]}>{t.retry}</Text>
                                </Pressable>
                            </View>
                        ) : null}
                        {hasHydrated && !token && !error ? (
                            <View style={[styles.stateCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                <Text style={[styles.stateText, { color: palette.text }]}>{t.login}</Text>
                                <AnimatedPressable style={[styles.mapButton, { backgroundColor: accent }]} onPress={() => router.push('/auth')}>
                                    <Text style={styles.mapButtonText}>{t.login}</Text>
                                </AnimatedPressable>
                            </View>
                        ) : loading ? (
                            <View style={styles.loading}>
                                <ActivityIndicator size="large" color={accent} />
                                <Text style={[styles.stateText, { color: palette.muted }]}>{t.loading}</Text>
                            </View>
                        ) : !error && visiblePoints.length === 0 ? (
                            <View style={[styles.stateCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                <Text style={styles.emptyIcon}>⌖</Text>
                                <Text style={[styles.cardTitle, { color: palette.text }]}>{query ? t.empty : t.empty}</Text>
                                <Text style={[styles.subtitle, { color: palette.muted }]}>{t.emptyHint}</Text>
                            </View>
                        ) : (
                            <View style={[styles.grid, width >= 980 && styles.gridWide]}>
                                {visiblePoints.map((point, index) => (
                                    <View key={point.id} style={[styles.pointCard, width >= 980 && styles.pointCardWide, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                        <View style={styles.pointHeading}>
                                            <View style={[styles.pin, { backgroundColor: `${accent}18` }]}>
                                                <Text style={[styles.pinText, { color: accent }]}>⌖</Text>
                                            </View>
                                            <View style={styles.pointTitleBlock}>
                                                <Text style={[styles.cardTitle, { color: palette.text }]}>{point.title}</Text>
                                                <Text style={[styles.marketName, { color: palette.muted }]}>{point.warehouse.market.title}</Text>
                                            </View>
                                            <Text style={[styles.indexBadge, { color: accent }]}>{String(index + 1).padStart(2, '0')}</Text>
                                        </View>
                                        <View style={[styles.infoRow, { borderTopColor: palette.border }]}>
                                            <View style={styles.infoBlock}>
                                                <Text style={[styles.metaLabel, { color: palette.muted }]}>{t.address}</Text>
                                                <Text style={[styles.address, { color: palette.text }]}>{point.address || point.warehouse.title || t.address}</Text>
                                            </View>
                                            <View style={styles.infoBlock}>
                                                <Text style={[styles.metaLabel, { color: palette.muted }]}>{t.radius}</Text>
                                                <Text style={[styles.address, { color: palette.text }]}>{new Intl.NumberFormat(lan === 'ru' ? 'ru-RU' : lan === 'en' ? 'en-US' : 'uz-UZ').format(point.serviceRadiusMeters)} m</Text>
                                            </View>
                                        </View>
                                        <AnimatedPressable style={[styles.mapButton, { backgroundColor: accent }]} onPress={() => openMap(point)}>
                                            <Text style={styles.mapButtonText}>{t.directions} ↗</Text>
                                        </AnimatedPressable>
                                    </View>
                                ))}
                            </View>
                        )}
                        {query && visiblePoints.length > 0 ? (
                            <Text style={[styles.resultCount, { color: palette.muted }]}>{visiblePoints.length} {t.filtered}</Text>
                        ) : null}
                    </View>
                </AboutWrapper>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    page: { width: '100%', padding: 12 },
    content: { padding: 20, paddingBottom: 36, gap: 16 },
    hero: { paddingVertical: 10, gap: 8, maxWidth: 760 },
    eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
    subtitle: { fontSize: 14, lineHeight: 22 },
    stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
    statCard: { minWidth: 130, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
    statValue: { fontSize: 19, fontWeight: '900' },
    statLabel: { fontSize: 10, fontWeight: '700' },
    searchBox: { minHeight: 48, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
    searchIcon: { fontSize: 22, lineHeight: 26 },
    searchInput: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 10 },
    clear: { fontSize: 22, paddingHorizontal: 4 },
    stateCard: { alignItems: 'center', padding: 24, borderWidth: 1, borderRadius: 24, gap: 10 },
    stateText: { fontSize: 14, textAlign: 'center' },
    retry: { fontSize: 14, fontWeight: '800', padding: 8 },
    loading: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyIcon: { fontSize: 32, color: '#0EA5E9' },
    grid: { gap: 12 },
    gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
    pointCard: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 14 },
    pointCardWide: { flexBasis: '48%', flexGrow: 1, maxWidth: '50%' },
    pointHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    pin: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    pinText: { fontSize: 24, lineHeight: 28, fontWeight: '800' },
    pointTitleBlock: { flex: 1, gap: 4 },
    cardTitle: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
    marketName: { fontSize: 11, fontWeight: '600' },
    indexBadge: { fontSize: 11, fontWeight: '800' },
    infoRow: { borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    infoBlock: { flex: 1, minWidth: 120, gap: 5 },
    metaLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
    address: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
    mapButton: { minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
    mapButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    resultCount: { fontSize: 12, textAlign: 'right' },
});
