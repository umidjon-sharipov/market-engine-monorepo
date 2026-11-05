'use client';

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, useWindowDimensions, Platform, Animated } from 'react-native';
import { useNativeAnimDriver } from 'app/utils/animation';

const LoaderProductCart = () => {
    const { width: windowWidth } = useWindowDimensions();
    const isWebDesktop = Platform.OS === 'web' && windowWidth > 768;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const createAnimation = () => {
            return Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0.4,
                    duration: 1000,
                    useNativeDriver: useNativeAnimDriver,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: useNativeAnimDriver,
                })
            ]);
        };

        Animated.loop(createAnimation()).start();
    }, [fadeAnim]);

    return (
        <Animated.View 
            style={[
                styles.card, 
                { width: isWebDesktop ? '23%' : windowWidth > 500 ? '48%' : '100%' },
                { opacity: fadeAnim }
            ]}
        >
            <View style={styles.topSection}>
                <View style={styles.favoriteLoader} />
                <View style={styles.imageWrapper} />
                <View style={styles.titleLoader} />
                <View style={[styles.titleLoader, { width: '60%', marginTop: 6 }]} />
            </View>

            <View style={styles.bottomSection}>
                <View style={styles.priceLoader} />
                <View style={styles.buttonLoader} />
            </View>
        </Animated.View>
    );
};

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
                flexShrink: 0,
                flexGrow: 0,
            }
        })
    },
    topSection: {
        position: 'relative',
        width: '100%',
    },
    favoriteLoader: {
        position: 'absolute',
        zIndex: 10,
        top: 4,
        right: 4,
        width: 36,
        height: 36,
        backgroundColor: '#e5e7eb',
        borderRadius: 100,
    },
    imageWrapper: {
        width: '100%',
        height: 180,
        backgroundColor: '#e5e7eb',
        borderRadius: 14,
        marginBottom: 10,
    },
    titleLoader: {
        height: 14,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        width: '90%',
    },
    bottomSection: {
        marginTop: 10,
        gap: 8,
    },
    priceLoader: {
        width: '60%',
        height: 18,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        marginTop: 4,
    },
    buttonLoader: {
        width: '100%',
        height: 38,
        backgroundColor: '#e5e7eb',
        borderRadius: 10,
        marginTop: 4,
    },
});

export default LoaderProductCart;