'use client'
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import { useCartStore } from 'app/store/useCartStore';
import Card from 'app/components/UI/Cart';
import { useLanStorage } from 'app/store/useLanStore';
import LoaderCart from 'app/components/UI/LoaderCart';
import NotLoad from 'app/components/UI/NotLoad';
import Empty from 'app/components/UI/Empty';
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

const Savat = () => {
    const url = useUrlStore(state => state.url)
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState('loading');

    const cart = useCartStore(state => state.cart);
    const cartIds = React.useMemo(() => cart.map(item => item.id), [cart]);
    const lan = useLanStorage(state => state.lan)

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

    const cartProducts = products.filter((product: Product) => cartIds.includes(product.id));
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
                <View style={styles.grid}>
                    {cartProducts.map((product: Product, index) => (
                        <Card key={product.id} product={product} index={index} />
                    ))}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#6b7280' }
});

export default Savat;