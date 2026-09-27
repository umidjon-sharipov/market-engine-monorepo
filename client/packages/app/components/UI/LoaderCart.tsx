'use client'
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native'

const LoaderCart = () => {
    const { width: windowWidth } = useWindowDimensions();
    const isSmall = windowWidth < 380;

    const shimmerAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [shimmerAnim]);

    return (
        <Animated.View style={[styles.card, isSmall && styles.cardSmall, { opacity: shimmerAnim }]}>
            <View style={[styles.leftSection, isSmall && styles.leftSectionSmall]}>
                <View style={[styles.imageLoader, isSmall && styles.imageLoaderSmall]} />
            </View>

            <View style={styles.rightSection}>
                <View style={styles.headerRow}>
                    <View style={styles.titleWrapper}>
                        <View style={[styles.lineLoader, { width: '90%' }, isSmall && styles.lineLoaderSmall]} />
                        <View style={[styles.lineLoader, { width: '60%', marginTop: 6 }, isSmall && styles.lineLoaderSmall]} />
                    </View>

                    <View style={[styles.deleteLoader, isSmall && styles.deleteLoaderSmall]} />
                </View>

                <View style={styles.metaInfo}>
                    <View style={[styles.lineLoader, { width: '45%', height: 10 }]} />
                    <View style={[styles.lineLoader, { width: '35%', height: 10, marginTop: 4 }]} />
                </View>

                <View style={[styles.footerRow, isSmall && styles.footerRowSmall]}>
                    <View style={[styles.counterLoader, isSmall && styles.counterLoaderSmall]} />

                    <View style={[styles.priceContainer, isSmall && styles.priceContainerSmall]}>
                        <View style={[styles.currentPriceLoader, isSmall && styles.currentPriceLoaderSmall]} />
                        <View style={styles.oldPriceLoader} />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        justifyContent: 'space-between',
    },
    cardSmall: {
        padding: 10,
    },
    leftSection: {
        marginRight: 16,
    },
    leftSectionSmall: {
        marginRight: 10,
    },
    imageLoader: {
        width: 110,
        height: 110,
        backgroundColor: '#e5e7eb',
        borderRadius: 12,
    },
    imageLoaderSmall: {
        width: 80,
        height: 80,
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
    titleWrapper: {
        flex: 1,
        paddingRight: 8,
    },
    lineLoader: {
        height: 14,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
    },
    lineLoaderSmall: {
        height: 12,
    },
    deleteLoader: {
        width: 60,
        height: 16,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
    },
    deleteLoaderSmall: {
        width: 50,
        height: 14,
    },
    metaInfo: {
        marginTop: 4,
        gap: 2,
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
    counterLoader: {
        width: 90,
        height: 32,
        backgroundColor: '#e5e7eb',
        borderRadius: 12,
    },
    counterLoaderSmall: {
        width: '100%',
        height: 36,
    },
    priceContainer: {
        alignItems: 'flex-end',
        gap: 4,
    },
    priceContainerSmall: {
        alignItems: 'flex-start',
        gap: 2,
    },
    currentPriceLoader: {
        width: 100,
        height: 18,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
    },
    currentPriceLoaderSmall: {
        width: 80,
        height: 16,
    },
    oldPriceLoader: {
        width: 70,
        height: 12,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
    },
});

export default LoaderCart;