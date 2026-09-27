'use client'
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import ProductCard from 'app/components/UI/ProductCart';
import LoaderProductCard from 'app/components/UI/LoaderProductCart';
import Slider from 'app/components/UI/Slider';
import SliderLoader from 'app/components/UI/SliderLoader';
import NotLoad from 'app/components/UI/NotLoad';
import Empty from 'app/components/UI/Empty';
import { useRouter } from 'solito/navigation';
import { useUrlStore } from 'app/store/useUrlStore'
import { useTokenStore } from 'app/store/useTokenStore';

interface User {
    id: string
    email: string
}

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

interface Follower {
    id: string;
    userId: string;
    following: string[];
}


interface Slider {
    id: string
    image: string
    link: string
    marketId: string
}

const isWeb = typeof window !== 'undefined' && window.innerWidth > 768;

const HomeScreen = () => {
    const url = useUrlStore(state => state.url)
    const token = useTokenStore(state => state.token)
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([]);
    const [sliders, setSliders] = useState<Slider[]>([])
    const [loading, setLoading] = useState('loading');
    const { width: screenWidth } = useWindowDimensions();
    const [count, setCount] = useState(0)
    const [account, setAccount] = useState(false)

    const fetchProducts = async () => {
        try {
            setLoading('loading')
            const response = await fetch(`${url}/products`);

            const data = await response.json();

            const filteredProducts = data.filter((product: Product) => product.marketId === 'umidjon')

            setProducts(filteredProducts);
            setLoading('loaded')
        } catch (error) {
            console.error("Ma'lumot yuklashda xatolik:", error);
            setLoading('notLoad')
        }
    };


    const fetchSliders = async () => {
        try {
            const response = await fetch(`${url}/sliders`);

            const data = await response.json();

            const filteredSliders = data.filter((slider: Slider) => slider.marketId === 'umidjon')

            setSliders(filteredSliders);
            console.log(data, filteredSliders)
        } catch (error) {
            console.error("Ma'lumot yuklashda xatolik:", error);
        }
    };

    const getSliders = async (followers: string[]) => {
        try {
            const response = await fetch(`${url}/sliders`);
            const data = await response.json();

            if (response.ok) {
                const bigSliders = data.filter((slider: Slider) => followers.includes(slider.marketId));

                console.log(data, bigSliders);

                if (bigSliders.length === 0) {
                    console.log(`bigSliders.length = 0`);
                    fetchSliders();
                } else {
                    setSliders(bigSliders);
                }
            }
        } catch (error) {
            console.error("Ma'lumot yuklashda xatolik:", error);
        }
    };

    const getProducts = async (followers: string[]) => {
        try {
            const res = await fetch(`${url}/products`);
    
            if (res.ok) {
                const req = await res.json();
    
                const bigData = req.filter((product: Product) => followers.includes(product.marketId));
    
                console.log(req, bigData);
    
                if (bigData.length === 0) {
                    fetchProducts();
                } else {
                    setLoading('loaded');
                    setProducts(bigData);
                }
            } else {
                fetchProducts();
            }
        } catch (err) {
            console.log(err);
            fetchProducts();
        }
    }

    const getFollower = async (id: string) => {
        try {
            const res = await fetch(`${url}/followings`);

            if (res.ok) {
                const req = await res.json()

                const userFollowings = req.filter((follower: Follower) => follower.userId === id);

                let userMarkets: string[] = [];
                userFollowings.forEach((item: any) => {
                    if (Array.isArray(item.following)) {
                        userMarkets = [...userMarkets, ...item.following];
                    }
                });

                console.log(req, userMarkets)

                if (userMarkets.length === 0) {
                    fetchProducts()
                } else {
                    getProducts(userMarkets)
                    getSliders(userMarkets)
                }
            } else {
                fetchProducts()
            }
        } catch (err) {
            console.log(err)
            fetchProducts()
        }
    }

    const getUser = async (email: string) => {
        try {
            const res = await fetch(`${url}/users`);

            if (res.ok) {
                const req = await res.json()

                const userId = req.find((user: User) => user.email === email).id

                console.log(req, userId)
                getFollower(userId)
            } else {
                fetchProducts()
            }
        } catch (err) {
            console.log(err)
            fetchProducts()
        }
    }

    const renderToken = async (storageToken: string = token) => {
        try {
            const res = await fetch(`${url}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${storageToken}`
                }
            });

            if (res.ok) {
                const req = await res.json()
                console.log(req)
                setAccount(true)

                getUser(req.email)
            } else {
                fetchProducts()
            }
        } catch (err) {
            console.log(err)
            fetchProducts()
        }
    }

    useEffect(() => {
        renderToken()
    }, [token]);

    if (loading === 'loading') {
        return (
            <ScreenWrapper>
                <View contentContainerStyle={styles.container}>

                    <View style={{ padding: 24 }}>
                        <SliderLoader />
                    </View>

                    <View style={styles.grid}>
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
            <NotLoad renderToken={renderToken} />
        )
    }

    if (products.length === 0) return <Empty />

    return (
        <ScreenWrapper>
            <View contentContainerStyle={styles.container}>
                <View style={{ padding: screenWidth > 900 ? 12 : 0 }}>
                    <Slider sliders={sliders} link={true} count={count} setCount={setCount} />
                </View>

                <View style={styles.grid}>
                    {products.map((product: Product, index: number) => (
                        <ProductCard key={product.id} product={product} products={products} index={index} account={account} />
                    ))}
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