'use client'
import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform, Animated } from 'react-native'
import { useNativeAnimDriver } from 'app/utils/animation'
import { useCartStore } from "app/store/useCartStore";
import { useYoqtirilganStore } from "app/store/useYoqtirilganStore";
import { UniversalImage } from "./UniversalImage";

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

const CardProduct = ({ product, index }: { product: Product; index?: number }) => {
    const { width: windowWidth } = useWindowDimensions();
    const [isMounted, setIsMounted] = useState(false);

    const cart = useCartStore(state => state.cart);
    const toggleCart = useCartStore(state => state.toggleCart);

    const yoqtirilganIds = useYoqtirilganStore(state => state.yoqtirilganIds);
    const toggleYoqtirilgan = useYoqtirilganStore(state => state.toggleYoqtirilgan);

    const incrementQuantity = useCartStore(state => state.incrementQuantity);
    const decrementQuantity = useCartStore(state => state.decrementQuantity);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        setIsMounted(true);
        const delay = Math.min(index * 60, 400);

        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: useNativeAnimDriver,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: useNativeAnimDriver,
                }),
            ]).start();
        }, delay);

        return () => clearTimeout(timer);
    }, [index, fadeAnim, slideAnim]);

    const isInCart = cart.some(item => item.id === product.id);
    const isFavorite = isMounted && yoqtirilganIds.includes(product.id);

    const cartItem = cart.find(item => item.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 1;
    const oldPrice = product.price * 1.5;

    const scaleAnim = useRef(new Animated.Value(0)).current;

    const heartScale = scaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.4],
    });
    
    const handleFavoritePress = (e: any) => {
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

    if (!isMounted) {
        return null;
    }

    const isSmall = windowWidth < 380;

    return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%' }]}>
            <View style={[styles.card, isSmall && styles.cardSmall]}>
                <View style={[styles.leftSection, isSmall && styles.leftSectionSmall]}>
                    <View style={[styles.imageWrapper, isSmall && styles.imageWrapperSmall]}>
                        <UniversalImage
                            src={Array.isArray(product.images) && product.images.length > 0 && product.images[0]
                                ? product.images[0]
                                : 'https://dummyimage.com/600x600/18181b/a1a1aa'}
                            alt={product.title}
                            width={isSmall ? 70 : 100}
                            height={isSmall ? 70 : 100}
                            resizeMode="contain"
                        />
                    </View>

                    <Pressable
                        onPress={handleFavoritePress}
                        style={styles.favoriteButton}
                    >
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <UniversalImage
                                src={isFavorite ? 'https://i.ibb.co/XkFkG62y/image.png' : 'https://i.ibb.co/GfZzh6Y7/heart.png'}
                                alt="heart Icon"
                                width={18}
                                height={18}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </Pressable>
                </View>

                <View style={styles.rightSection}>
                    <View style={styles.headerRow}>
                        <Text numberOfLines={2} style={[styles.productTitle, isSmall && styles.productTitleSmall]}>
                            {product.title}
                        </Text>

                        <Pressable onPress={() => toggleCart(product.id)} style={styles.deleteButton}>
                            <Text style={[styles.deleteText, isSmall && styles.deleteTextSmall]}>Yo'q qilish</Text>
                        </Pressable>
                    </View>

                    <View style={styles.metaInfo}>
                        <Text style={styles.metaText}>Sotuvchi: <Text style={styles.metaValue}>Premium Store</Text></Text>
                        <Text style={styles.metaText}>Kategoriya: <Text style={styles.metaValue}>{product.categoryId}</Text></Text>
                    </View>

                    <View style={[styles.footerRow, isSmall && styles.footerRowSmall]}>
                        <View style={[styles.counterContainer, isSmall && styles.counterContainerSmall]}>
                            <Pressable style={[styles.counterBtn, isSmall && styles.counterBtnSmall]} onPress={() => decrementQuantity(product.id)}>
                                <Text style={styles.counterBtnText}>-</Text>
                            </Pressable>
                            <Text style={[styles.counterValue, isSmall && styles.counterValueSmall]}>{quantity}</Text>
                            <Pressable style={[styles.counterBtn, isSmall && styles.counterBtnSmall]} onPress={() => incrementQuantity(product.id)}>
                                <Text style={styles.counterBtnText}>+</Text>
                            </Pressable>
                        </View>

                        <View style={[styles.priceContainer, isSmall && styles.priceContainerSmall]}>
                            <Text style={[styles.currentPrice, isSmall && styles.currentPriceSmall]}>
                                {product.price} so'm
                            </Text>
                            <Text style={[styles.oldPrice, isSmall && styles.oldPriceSmall]}>
                                {oldPrice} so'm
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        justifyContent: 'space-between',
        width: '100%',
    },
    cardSmall: {
        padding: 10,
    },
    leftSection: {
        position: 'relative',
        marginRight: 16,
    },
    leftSectionSmall: {
        marginRight: 10,
    },
    imageWrapper: {
        width: 110,
        height: 110,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    imageWrapperSmall: {
        width: 80,
        height: 80,
    },
    favoriteButton: {
        position: 'absolute',
        top: 4,
        left: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 100,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            }
        })
    },
    rightSection: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    productTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#1f2937',
        lineHeight: 18,
        paddingRight: 8,
    },
    productTitleSmall: {
        fontSize: 13,
        lineHeight: 16,
    },
    deleteButton: {
        paddingVertical: 2,
    },
    deleteText: {
        fontSize: 13,
        color: '#9ca3af',
    },
    deleteTextSmall: {
        fontSize: 11,
    },
    metaInfo: {
        marginTop: 4,
        gap: 2,
    },
    metaText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    metaValue: {
        color: '#4b5563',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    footerRowSmall: {
        flexDirection: 'column-reverse',
        alignItems: 'stretch',
        gap: 10,
        marginTop: 8,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
    },
    counterContainerSmall: {
        width: '100%',
        justifyContent: 'space-between',
    },
    counterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f9fafb',
    },
    counterBtnSmall: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    counterBtnText: {
        fontSize: 16,
        color: '#4b5563',
        fontWeight: '600',
    },
    counterValue: {
        paddingHorizontal: 12,
        fontSize: 14,
        fontWeight: '500',
        color: '#1f2937',
    },
    counterValueSmall: {
        paddingHorizontal: 16,
        fontSize: 14,
        textAlign: 'center',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceContainerSmall: {
        alignItems: 'flex-start',
    },
    currentPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    currentPriceSmall: {
        fontSize: 15,
    },
    oldPrice: {
        fontSize: 11,
        color: '#9ca3af',
        textDecorationLine: 'line-through',
        marginTop: 2,
    },
    oldPriceSmall: {
        marginTop: 1,
    },
});

export default CardProduct;