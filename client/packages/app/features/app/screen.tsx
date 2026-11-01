'use client'
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import ProductCard from 'app/components/UI/ProductCart';
import LoaderProductCard from 'app/components/UI/LoaderProductCart';
import Slider from 'app/components/UI/Slider';
import SliderLoader from 'app/components/UI/SliderLoader';
import NotLoad from 'app/components/UI/NotLoad';
import { useUrlStore } from 'app/store/useUrlStore'
import { useTokenStore } from 'app/store/useTokenStore';

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
    gradient?: string[];
}

interface SliderTypes {
    id: string
    image: string
    link: string
    marketId: string
}

const isWeb = typeof window !== 'undefined' && window.innerWidth > 768;

const getGradientTint = (colors?: string[]) => {
    const color = colors?.[0]?.trim();
    if (!color) return 'rgba(248, 250, 252, 0.96)';

    const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
    if (hex) {
        const normalized = hex.length === 3
            ? hex.split('').map((part) => `${part}${part}`).join('')
            : hex;
        const channels = normalized.match(/.{2}/g)?.map((part) => parseInt(part, 16));
        if (channels?.length === 3) {
            return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, 0.08)`;
        }
    }

    const rgb = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (rgb) {
        return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, 0.08)`;
    }

    return 'rgba(59, 130, 246, 0.06)';
};

const HomeScreen = () => {
    const url = useUrlStore(state => state.url);
    const token = useTokenStore(state => state.token)
    const [products, setProducts] = useState<Product[]>([]);
    const [sliders, setSliders] = useState<SliderTypes[]>([])
    const [loading, setLoading] = useState('loading');
    const { width: screenWidth } = useWindowDimensions();
    const [count, setCount] = useState(0)
    const account = false

    const fetchProducts = async () => {
        try {
            setLoading('loading')
            const response = await fetch(`${url}/products/data`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(`Mahsulotlarni yuklab bo‘lmadi: ${response.status}`);
            if (!Array.isArray(data)) throw new Error('Mahsulotlar noto‘g‘ri formatda qaytdi.');
            setProducts(data as Product[]);

            setLoading('loaded')
        } catch (error) {
            console.error("Ma'lumot yuklashda xatolik:", error);
            setLoading('notLoad')
        }
    };

    const fetchSliders = async () => {
        try {
            const response = await fetch(`${url}/sliders/data`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(`Sliderlarni yuklab bo‘lmadi: ${response.status}`);
            if (!Array.isArray(data)) throw new Error('Sliderlar noto‘g‘ri formatda qaytdi.');
            setSliders(data as SliderTypes[]);
        } catch (error) {
            console.error("Sliders ma'lumotini yuklashda xatolik:", error);
        }
    }

    useEffect(() => {
        fetchProducts()
        fetchSliders()
    }, [token, url]);

    if (loading === 'loading') {
        return (
            <ScreenWrapper>
                <View style={ styles.container }>

                    <View style={ { padding: 24 } }>
                        <SliderLoader />
                    </View>

                    <View style={ styles.grid }>
                        <LoaderProductCard />
                        <LoaderProductCard />
                        <LoaderProductCard />
                        <LoaderProductCard />
                    </View>

                </View>
            </ScreenWrapper>
        );
    }

    else if (loading === 'notLoad') {
        return (
            <NotLoad renderToken={ fetchProducts } />
        )
    }

    return (
        <ScreenWrapper>
            <View style={ styles.container }>
                <View style={ { padding: screenWidth > 900 ? 12 : 0 } }>
                    <Slider sliders={ sliders } link={ true } count={ count } setCount={ setCount } />
                </View>

                <View style={ styles.grid }>
                    {products.length === 0 ? (
                        <Text style={{ width: '100%', color: '#64748b', textAlign: 'center', padding: 28 }}>
                            Hozircha ko‘rsatish uchun mahsulot yo‘q.
                        </Text>
                    ) : products.map((product: Product, index: number) => (
                        <ProductCard
                            key={ product.id }
                            product={ product }
                            products={ products }
                            index={ index }
                            account={ account }
                            bg={ getGradientTint(product.gradient) }
                        />
                    )) }
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { gap: 30 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 12 },
    card: {
        width: isWeb ? '48%' : '100%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    imageWrapper: {
        width: '100%',
        height: 180,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        marginBottom: 12,
    },
    productTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', lineHeight: 20 },
    bottomSection: { marginTop: 12 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    ratingText: { fontSize: 12, color: '#6b7280', marginLeft: 4, fontWeight: '500' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceText: { fontSize: 16, fontWeight: '900', color: '#2563eb' },
    button: { backgroundColor: '#eff6ff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
    buttonInCart: { backgroundColor: '#e0f2fe' },
    buttonText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
    buttonTextInCart: { color: '#0369a1' },
});

export default HomeScreen;