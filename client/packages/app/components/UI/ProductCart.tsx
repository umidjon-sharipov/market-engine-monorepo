'use client';

import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform, Animated, GestureResponderEvent } from 'react-native';
import { useNativeAnimDriver } from 'app/utils/animation';
import { useCartStore } from "app/store/useCartStore";
import { useYoqtirilganStore } from "app/store/useYoqtirilganStore";
import { UniversalImage } from "./UniversalImage";
import { useRouter } from "solito/navigation";

interface Product {
    id: string;
    title: string;
    marketId: string;
    price: number;
    description: { uz: string, ru: string, en: string };
    categoryId: string;
    discountId: string;
    images: string[];
    quantity: number;
    options: any[];
}

interface ProductCardProps {
    product: Product;
    products: Product[];
    index: number;
    account: boolean
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ProductCard = ({ product, products, index, account }: ProductCardProps) => {
    const [isMounted, setIsMounted] = useState(false);
    const { cart, toggleCart } = useCartStore();
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();
    const isInCart = cart.some(item => item.id === product.id);

    const yoqtirilganIds = useYoqtirilganStore(state => state.yoqtirilganIds);
    const toggleYoqtirilgan = useYoqtirilganStore(state => state.toggleYoqtirilgan);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (!isMounted) return;

        if (Platform.OS === 'web') {
            const cardElement = document.getElementById(`product-card-${product.id}`);
            if (!cardElement) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        const rowOffset = (index % 4) * 50;
                        const delay = rowOffset;

                        Animated.parallel([
                            Animated.timing(fadeAnim, {
                                toValue: 1,
                                duration: 450,
                                delay: delay,
                                useNativeDriver: useNativeAnimDriver,
                            }),
                            Animated.timing(slideAnim, {
                                toValue: 0,
                                duration: 450,
                                delay: delay,
                                useNativeDriver: useNativeAnimDriver,
                            }),
                        ]).start();

                        observer.unobserve(entry.target);
                    }
                },
                {
                    root: null,
                    threshold: 0.1,
                }
            );

            observer.observe(cardElement);

            return () => {
                if (cardElement) observer.unobserve(cardElement);
            };
        } else {
            const delay = (index % 4) * 70;
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    delay: delay,
                    useNativeDriver: useNativeAnimDriver,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    delay: delay,
                    useNativeDriver: useNativeAnimDriver,
                }),
            ]).start();
        }
    }, [isMounted, index, fadeAnim, slideAnim, product.id]);

    const isFavorite = isMounted && yoqtirilganIds.includes(product.id);

    const handleTargetIDs = (currentId: number) => {
        const currentIndex = products.findIndex(p => p.id === currentId);
        if (currentIndex === -1) return `${currentId}`;
        const nextProductsSlice = products.slice(currentIndex, currentIndex + 10);
        return nextProductsSlice.map(p => p.id).join(',');
    };

    const handleCardPress = () => {
        router.push(`/product/${handleTargetIDs(product.id)}`);
    };

    const scaleAnim = useRef(new Animated.Value(0)).current;

    const handleFavoritePress = (e: GestureResponderEvent) => {
        e.stopPropagation();
        toggleYoqtirilgan(product.id);

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 120,
                useNativeDriver: useNativeAnimDriver,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: useNativeAnimDriver,
            }),
        ]).start();
    };

    const heartScale = scaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.4],
    });

    if (!isMounted) {
        return null;
    }

    const cardWidth = windowWidth > 1400
        ? '19%'
        : windowWidth > 1000
            ? '24%'
            : windowWidth > 650
                ? '31%'
                : windowWidth > 350
                    ? '48%'
                    : '100%';

    return (
        <AnimatedPressable
            {...({ nativeID: `product-card-${product.id}` } as any)}
            onPress={handleCardPress}
            style={[
                styles.card,
                {
                    width: cardWidth,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.topSection}>
                <Pressable
                    onPress={handleFavoritePress}
                    style={styles.favoriteButton}
                >
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                        <UniversalImage
                            src={isFavorite ? 'https://i.ibb.co/XkFkG62y/image.png' : 'https://i.ibb.co/GfZzh6Y7/heart.png'}
                            alt={product.title}
                            width={24}
                            height={24}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </Pressable>

                <View style={styles.imageWrapper}>
                    <UniversalImage
                        src={Array.isArray(product.images) && product.images.length > 0 && product.images[0]
                            ? product.images[0]
                            : 'https://dummyimage.com/600x600/18181b/a1a1aa'}
                        alt={product.title}
                        width={130}
                        height={130}
                        resizeMode="contain"
                    />
                </View>

                <Text numberOfLines={2} style={styles.productTitle}>
                    {product.title}
                </Text>
            </View>

            <View style={styles.bottomSection}>
                <Text numberOfLines={1} style={styles.priceText}>
                    {(product.price * 12500).toLocaleString()} so'm
                </Text>

                <Pressable
                    onPress={(e: any) => {
                        e.stopPropagation();
                        toggleCart(product.id);
                    }}
                    style={({ pressed }: { pressed: boolean }) => [
                        styles.cartButtonWrapper,
                        pressed && { opacity: 0.85 },
                    ]}
                >
                    <View style={[styles.button, isInCart && styles.buttonInCart]}>
                        <Text numberOfLines={1} style={[styles.buttonText, isInCart && styles.buttonTextInCart]}>
                            {isInCart ? 'Savatda ✓' : 'Savatga'}
                        </Text>
                    </View>
                </Pressable>
            </View>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'column',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.03)',
                cursor: 'pointer',
                flexShrink: 0,
                flexGrow: 0,
            }
        })
    },
    topSection: {
        position: 'relative',
        width: '100%',
    },
    favoriteButton: {
        position: 'absolute',
        zIndex: 10,
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        padding: 6,
        borderRadius: 100,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            }
        })
    },
    imageWrapper: {
        width: '100%',
        height: 180,
        backgroundColor: '#fcfcfc',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        marginBottom: 10,
    },
    productTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#2d3748',
        lineHeight: 18,
        minHeight: 36,
    },
    bottomSection: {
        marginTop: 10,
        gap: 8,
    },
    priceText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'rgb(0, 89, 255)',
    },
    cartButtonWrapper: {
        width: '100%',
    },
    button: {
        backgroundColor: 'rgb(0, 166, 255)',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonInCart: {
        backgroundColor: 'rgba(0, 166, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgb(0, 166, 255)',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 13,
    },
    buttonTextInCart: {
        color: 'rgb(0, 166, 255)',
    },
});

export default ProductCard;