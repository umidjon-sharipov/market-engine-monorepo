'use client'
import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native'
import ScreenWrapper from 'app/components/layout/ScreenWrapper'
import ProductCard from 'app/components/UI/ProductCart'
import { useInputStorage } from 'app/store/useInputStore'
import NotLoad from 'app/components/UI/NotLoad'
import Empty from 'app/components/UI/Empty';
import LoaderProductCart from 'app/components/UI/LoaderProductCart'
import { useUrlStore } from 'app/store/useUrlStore'

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

const Search = () => {
    const url = useUrlStore(state => state.url)
    const searchInput = useInputStorage((state) => state.input);
    const { height: screenHeight, width: screenWidth } = useWindowDimensions()

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState('loading');

    const fetchProducts = async () => {
        try {
            setLoading('loading');
            const response = await fetch(`${url}/products`);
            const data: Product[] = await response.json();

            const filtered = data.filter(item =>
                item.title.toLowerCase().includes(searchInput.toLowerCase())
            );

            setProducts(filtered);
            setLoading('loaded')
        } catch (error) {
            console.error("Ma'lumot yuklashda xatolik:", error);
            setLoading('notLoad')
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    if (loading === 'loading') {
        return (
            <ScreenWrapper>
                <View style={styles.grid}>
                    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                        <LoaderProductCart />
                        <LoaderProductCart />
                        <LoaderProductCart />
                        <LoaderProductCart />
                    </ScrollView>
                </View>
            </ScreenWrapper>
        )
    }

    else if (loading === 'notLoad') {
        return (
            <NotLoad renderToken={fetchProducts} />
        )
    }

    if (products.length === 0) return <Empty />

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.grid}>
                    {products.map((product: Product) => (
                        <ProductCard key={product.id} product={product} products={products} />
                    ))}
                </View>
            </ScrollView>
        </ScreenWrapper>
    )
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 16 },
    noResult: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 24 },
    errorText: { fontSize: 16, color: '#dc2626', textAlign: 'center', marginTop: 24, fontWeight: '500' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', width: '100%' }
});

export default Search;