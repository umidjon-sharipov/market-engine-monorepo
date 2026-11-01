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
    useWindowDimensions,
} from 'react-native';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import ProductCard from 'app/components/UI/ProductCart';
import LoaderProductCart from 'app/components/UI/LoaderProductCart';
import NotLoad from 'app/components/UI/NotLoad';
import Empty from 'app/components/UI/Empty';
import { useUrlStore } from 'app/store/useUrlStore';

interface Product {
    id: string;
    title: string;
    price: number;
    marketId: string;
    categoryPath?: string | null;
    categoryId: string;
    discountId: string;
    description: { uz: string; ru: string; en: string };
    images: string[];
    quantity: number;
    options: any[];
    createdAt?: string;
    gradient?: string[];
    market?: { id: string; title: string };
}

type SortOrder = 'relevance' | 'price-asc' | 'price-desc' | 'newest';

const SearchCatalog = ({ searchTerm }: { searchTerm: string }) => {
    const url = useUrlStore((state) => state.url);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;
    const [products, setProducts] = useState<Product[]>([]);
    const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [retryToken, setRetryToken] = useState(0);
    const [filtersVisible, setFiltersVisible] = useState(true);
    const [category, setCategory] = useState('');
    const [market, setMarket] = useState('');
    const [minimumPrice, setMinimumPrice] = useState('');
    const [maximumPrice, setMaximumPrice] = useState('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('relevance');

    useEffect(() => {
        if (!url) return;
        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                setLoadError(false);
                const query = new URLSearchParams();
                if (searchTerm.trim()) query.set('search', searchTerm.trim());
                const response = await fetch(
                    `${url}/products${query.toString() ? `?${query.toString()}` : ''}`,
                    { signal: controller.signal },
                );
                if (!response.ok) {
                    throw new Error(`Product qidiruvi amalga oshmadi: ${response.status}`);
                }
                const data: unknown = await response.json();
                if (!Array.isArray(data)) {
                    throw new Error('Product qidiruvi noto‘g‘ri javob qaytardi.');
                }
                setProducts(data as Product[]);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('Product qidiruvida xatolik:', error);
                setLoadError(true);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 250);
        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [retryToken, searchTerm, url]);

    useEffect(() => {
        if (!url || products.length === 0) {
            setCategoryLabels({});
            return;
        }
        let cancelled = false;
        const marketIds = Array.from(new Set(products.map((product) => product.marketId)));
        Promise.all(marketIds.map(async (marketId) => {
            const response = await fetch(
                `${url}/categories?marketId=${encodeURIComponent(marketId)}`,
            );
            if (!response.ok) {
                throw new Error(`Kategoriyalarni yuklab bo‘lmadi: ${response.status}`);
            }
            const data: unknown = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('Kategoriyalar noto‘g‘ri formatda qaytdi.');
            }
            return data as { id: string; title: string }[];
        })).then((categoriesByMarket) => {
            if (cancelled) return;
            setCategoryLabels(Object.fromEntries(
                categoriesByMarket.flat().map((item) => [item.id, item.title]),
            ));
        }).catch((error: unknown) => {
            if (!cancelled) {
                console.error('Search filter kategoriyalarini yuklashda xatolik:', error);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [products, url]);

    const categories = useMemo(
        () => Array.from(new Set(
            products
                .map((product) => product.categoryPath?.split('|')[0])
                .filter((value): value is string => Boolean(value))
        )),
        [products],
    );
    const markets = useMemo(
        () => Array.from(new Set(products.map((product) => product.marketId).filter(Boolean))),
        [products],
    );
    const filteredProducts = useMemo(() => {
        const min = minimumPrice.trim() ? Number(minimumPrice) : undefined;
        const max = maximumPrice.trim() ? Number(maximumPrice) : undefined;
        const filtered = products.filter((product) =>
            (!category || product.categoryPath?.split('|')[0] === category) &&
            (!market || product.marketId === market) &&
            (min === undefined || (Number.isFinite(min) && product.price >= min)) &&
            (max === undefined || (Number.isFinite(max) && product.price <= max))
        );
        if (sortOrder === 'price-asc') filtered.sort((left, right) => left.price - right.price);
        if (sortOrder === 'price-desc') filtered.sort((left, right) => right.price - left.price);
        if (sortOrder === 'newest') {
            filtered.sort((left, right) =>
                new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime()
            );
        }
        return filtered;
    }, [category, market, maximumPrice, minimumPrice, products, sortOrder]);

    const resetFilters = () => {
        setCategory('');
        setMarket('');
        setMinimumPrice('');
        setMaximumPrice('');
        setSortOrder('relevance');
    };

    const filters = (
        <View style={[styles.filters, isDesktop ? styles.desktopFilters : styles.mobileFilters]}>
            <View style={styles.filterHeading}>
                <Text style={styles.heading}>Filterlar</Text>
                <Pressable onPress={resetFilters}><Text style={styles.reset}>Tozalash</Text></Pressable>
            </View>
            <Text style={styles.label}>Narx oralig‘i (UZS)</Text>
            <View style={styles.priceFields}>
                <TextInput
                    accessibilityLabel="Eng past narx"
                    keyboardType="numeric"
                    placeholder="Dan"
                    value={minimumPrice}
                    onChangeText={setMinimumPrice}
                    style={styles.input}
                />
                <TextInput
                    accessibilityLabel="Eng yuqori narx"
                    keyboardType="numeric"
                    placeholder="Gacha"
                    value={maximumPrice}
                    onChangeText={setMaximumPrice}
                    style={styles.input}
                />
            </View>
            <Text style={styles.label}>Kategoriya</Text>
            <Pressable onPress={() => setCategory('')} style={[styles.filterOption, !category && styles.selectedOption]}>
                <Text style={styles.optionText}>Barcha kategoriyalar</Text>
            </Pressable>
            {categories.map((categoryId) => (
                <Pressable
                    key={categoryId}
                    onPress={() => setCategory(categoryId)}
                    style={[styles.filterOption, category === categoryId && styles.selectedOption]}
                >
                    <Text numberOfLines={1} style={styles.optionText}>
                        {categoryLabels[categoryId] ?? categoryId}
                    </Text>
                </Pressable>
            ))}
            <Text style={styles.label}>Market</Text>
            <Pressable onPress={() => setMarket('')} style={[styles.filterOption, !market && styles.selectedOption]}>
                <Text style={styles.optionText}>Barcha marketlar</Text>
            </Pressable>
            {markets.map((marketId) => (
                <Pressable
                    key={marketId}
                    onPress={() => setMarket(marketId)}
                    style={[styles.filterOption, market === marketId && styles.selectedOption]}
                >
                    <Text numberOfLines={1} style={styles.optionText}>
                        {products.find((product) => product.marketId === marketId)?.market?.title ?? marketId}
                    </Text>
                </Pressable>
            ))}
        </View>
    );

    if (loadError) return <NotLoad renderToken={() => setRetryToken((value) => value + 1)} />;

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.toolbar}>
                    <Text style={styles.heading}>
                        {searchTerm.trim() ? `“${searchTerm.trim()}” qidiruvi` : 'Mahsulotlar'}
                    </Text>
                    <View style={styles.toolbarActions}>
                        <Text style={styles.count}>{filteredProducts.length} ta mahsulot</Text>
                        {!isDesktop && (
                            <Pressable onPress={() => setFiltersVisible((visible) => !visible)} style={styles.filterButton}>
                                <Text style={styles.filterButtonText}>{filtersVisible ? 'Filterlarni yashirish' : 'Filterlar'}</Text>
                            </Pressable>
                        )}
                        <View style={styles.sortWrap}>
                            <Text style={styles.sortLabel}>Saralash:</Text>
                            <View style={styles.sortOptions}>
                                {([
                                    ['relevance', 'Mosligi'],
                                    ['price-asc', 'Arzon'],
                                    ['price-desc', 'Qimmat'],
                                    ['newest', 'Yangi'],
                                ] as const).map(([value, label]) => (
                                    <Pressable
                                        key={value}
                                        onPress={() => setSortOrder(value)}
                                        style={[styles.sortOption, sortOrder === value && styles.selectedOption]}
                                    >
                                        <Text style={styles.optionText}>{label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
                {loading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <LoaderProductCart />
                    </View>
                ) : (
                    <View style={[styles.layout, isDesktop && styles.desktopLayout]}>
                        {(isDesktop || filtersVisible) && filters}
                        <View style={styles.results}>
                            {filteredProducts.length === 0 ? <Empty /> : filteredProducts.map((product, index) => (
                                <ProductCard key={product.id} product={product} products={filteredProducts} index={index} />
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    toolbar: { gap: 12, marginBottom: 16 },
    toolbarActions: { gap: 12 },
    heading: { color: '#111827', fontSize: 22, fontWeight: '800' },
    count: { color: '#64748b', fontSize: 13 },
    filterButton: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 10 },
    filterButtonText: { color: '#1d4ed8', fontWeight: '700' },
    sortWrap: { gap: 6 },
    sortLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
    sortOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    sortOption: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
    selectedOption: { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
    optionText: { color: '#334155', fontSize: 12 },
    layout: { gap: 16 },
    desktopLayout: { flexDirection: 'row', alignItems: 'flex-start' },
    filters: { backgroundColor: '#fff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
    desktopFilters: { width: 260, flexShrink: 0 },
    mobileFilters: { width: '100%' },
    filterHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    reset: { color: '#2563eb', fontSize: 12, fontWeight: '700' },
    label: { color: '#475569', fontSize: 12, fontWeight: '700', marginTop: 6 },
    priceFields: { flexDirection: 'row', gap: 8 },
    input: { flex: 1, minWidth: 0, borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, color: '#0f172a' },
    filterOption: { paddingHorizontal: 8, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
    results: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    loading: { gap: 16, alignItems: 'center', paddingVertical: 24 },
});

export default SearchCatalog;
