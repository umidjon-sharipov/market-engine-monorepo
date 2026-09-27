'use client'
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import ProductCard from 'app/components/UI/ProductCart';
import { useLanStorage } from 'app/store/useLanStore';
import { useSearchParams } from 'solito/navigation';
import { useInputStorage } from 'app/store/useInputStore';
import NotLoad from 'app/components/UI/NotLoad'
import Empty from 'app/components/UI/Empty';
import LoaderProductCart from 'app/components/UI/LoaderProductCart';
import { useRouter } from 'solito/navigation';
import { usePathname } from 'solito/navigation';
import { useUrlStore } from 'app/store/useUrlStore';

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

const FilterSearch = () => {
    const url = useUrlStore(state => state.url)
    const pathnameWeb = usePathname()
    const pathnameWebProduct = pathnameWeb?.split('/')[2]
    const lan = useLanStorage(state => state.lan);
    const inputValue = useInputStorage(state => state.input)
    const router = useRouter()

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState('loading');

    const fetchSearchProducts = async () => {
        try {
            setLoading('loading')
            const response = await fetch(`${url}/products`);
            const data = await response.json();

            const searchProducts = data.filter((product: Product) =>
                product.title.toLowerCase().includes(`${Platform.OS !== 'web' ? inputValue : pathnameWebProduct}`)
            );
            setProducts(searchProducts);
            setLoading('loaded')
        } catch (error) {
            console.error("Ma'lumot yuklashda xatolik:", error);
            setLoading('notLoad')
        }
    };

    useEffect(() => {
        fetchSearchProducts();
        router.push(`/search/${Platform.OS !== 'web' ? inputValue : pathnameWebProduct}`)
    }, [inputValue]);

    if (loading === 'loading') {
        return (
            <ScreenWrapper>
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.grid}>
                        <LoaderProductCart />
                        <LoaderProductCart />
                        <LoaderProductCart />
                        <LoaderProductCart />
                    </View>
                </ScrollView>
            </ScreenWrapper>
        );
    }

    else if (loading === 'notLoad') {
        return (
            <NotLoad renderToken={fetchSearchProducts} />
        )
    }

    if (products.length === 0) return <Empty />

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {products.map((product: Product, index) => (
                        <ProductCard key={product.id} product={product} products={products} index={index} />
                    ))}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    infoText: { marginTop: 10, fontSize: 16, color: '#6b7280' },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#6b7280', textAlign: 'center' }
});

export default FilterSearch;