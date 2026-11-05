'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'solito/navigation';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import { useInputStorage } from 'app/store/useInputStore';
import { useTokenStore } from 'app/store/useTokenStore';
import { useUrlStore } from 'app/store/useUrlStore';
import { fetchWithAuth } from 'app/features/app/auth/fetchWithAuth';

interface CategoryItem {
    id: string;
    title: string;
    children?: CategoryItem[];
}

interface CategoryOption {
    id: string;
    title: string;
    items: CategoryItem[];
}

interface MarketCategory {
    id: string;
    title: string;
    marketId: string;
    options: CategoryOption[];
}

interface CatalogMarket {
    id: string;
    title: string;
    logo: string;
    categories: MarketCategory[];
}

const flattenItems = (items: CategoryItem[], depth = 0): { id: string; title: string; depth: number }[] =>
    items.flatMap((item) => [
        { id: item.id, title: item.title, depth },
        ...flattenItems(item.children ?? [], depth + 1),
    ]);

const KatalogTizimi = () => {
    const url = useUrlStore((state) => state.url);
    const token = useTokenStore((state) => state.token);
    const setInput = useInputStorage((state) => state.setInput);
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isMobile = width < 1024;
    const [markets, setMarkets] = useState<CatalogMarket[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const categories = useMemo(
        () => markets.flatMap((market) =>
            market.categories.map((category) => ({ market, category })),
        ),
        [markets],
    );
    const active = categories.find(({ category }) => category.id === activeCategoryId) ?? categories[0];

    useEffect(() => {
        if (!url) return;
        if (!token) {
            setMarkets([]);
            setError('');
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError('');
        fetchWithAuth(`${url}/categories/catalog`, { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) throw new Error(`Katalogni yuklab bo‘lmadi: ${response.status}`);
                const data: unknown = await response.json();
                if (!Array.isArray(data)) throw new Error('Katalog javobi noto‘g‘ri formatda.');
                setMarkets(data as CatalogMarket[]);
            })
            .catch((requestError: unknown) => {
                if (controller.signal.aborted) return;
                console.error('Obuna marketlari katalogini yuklashda xatolik:', requestError);
                setError(requestError instanceof Error ? requestError.message : 'Katalogni yuklab bo‘lmadi.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [token, url]);

    useEffect(() => {
        if (active && active.category.id !== activeCategoryId) {
            setActiveCategoryId(active.category.id);
        }
    }, [active, activeCategoryId]);

    const openSearch = (title: string) => {
        const normalized = title.trim().replace(/\s+/g, '-').toLocaleLowerCase();
        setInput(title.trim());
        router.push(`/search/${encodeURIComponent(normalized)}`);
    };

    return (
        <ScreenWrapper>
            <View style={{ width: '100%', maxWidth: 1340, alignSelf: 'center', padding: 16, flex: 1 }}>
                <Text style={{ color: '#111827', fontSize: 24, fontWeight: '800', marginBottom: 16 }}>
                    Katalog
                </Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 32 }} />
                ) : error ? (
                    <Text accessibilityRole="alert" style={{ color: '#dc2626', padding: 16 }}>{error}</Text>
                ) : categories.length === 0 ? (
                    <Text style={{ color: '#64748b', padding: 16 }}>
                        {token
                            ? 'Obuna bo‘lgan marketlaringizda ko‘rinadigan kategoriyalar topilmadi.'
                            : 'Marketlar katalogini ko‘rish uchun tizimga kiring va marketlarga obuna bo‘ling.'}
                    </Text>
                ) : (
                    <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16, flex: 1 }}>
                        <ScrollView
                            style={{ width: isMobile ? '100%' : 280, maxHeight: isMobile ? 300 : 700 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {categories.map(({ market, category }) => {
                                const selected = category.id === active?.category.id;
                                return (
                                    <Pressable
                                        key={category.id}
                                        onPress={() => setActiveCategoryId(category.id)}
                                        style={{
                                            padding: 12,
                                            marginBottom: 6,
                                            borderRadius: 10,
                                            backgroundColor: selected ? '#e0f2fe' : 'transparent',
                                        }}
                                    >
                                        <Text numberOfLines={1} style={{ color: '#64748b', fontSize: 11 }}>
                                            {market.title}
                                        </Text>
                                        <Text numberOfLines={2} style={{
                                            color: selected ? '#0369a1' : '#1f2937',
                                            fontSize: 15,
                                            fontWeight: selected ? '700' : '500',
                                        }}>
                                            {category.title}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                        <ScrollView
                            style={{ flex: 1, maxHeight: isMobile ? undefined : 700 }}
                            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {active?.category.options.map((option) => (
                                <View
                                    key={option.id}
                                    style={{
                                        width: isMobile ? '100%' : '31%',
                                        minWidth: isMobile ? undefined : 240,
                                        padding: 16,
                                        borderRadius: 16,
                                        backgroundColor: 'rgba(226,245,255,0.6)',
                                    }}
                                >
                                    <Text style={{ color: '#1f2937', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
                                        {option.title}
                                    </Text>
                                    <View style={{ gap: 4 }}>
                                        {flattenItems(option.items).map((item) => (
                                            <Pressable
                                                key={item.id}
                                                onPress={() => openSearch(item.title)}
                                                style={{ paddingVertical: 6, paddingLeft: item.depth * 12 }}
                                            >
                                                <Text style={{ color: '#475569', fontSize: 14 }}>{item.title}</Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </ScreenWrapper>
    );
};

export default KatalogTizimi;
