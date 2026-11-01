'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ScrollView, StyleSheet, View, useWindowDimensions, Animated, Easing } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Footer from 'app/components/layout/footer/Footer'
import { useTabStore } from 'app/store/useTabStore'
import { useScrollStore } from 'app/store/useScrollStore'
import { LinearGradient } from 'expo-linear-gradient'

interface ScreenWrapperProps {
    children: React.ReactNode;
    color?: string[];
}

const softenGradientColor = (color: string) => {
    const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
    if (hex) {
        const normalized = hex.length === 3
            ? hex.split('').map((part) => `${part}${part}`).join('')
            : hex;
        const channels = normalized.match(/.{2}/g)?.map((part) => parseInt(part, 16));
        if (channels?.length === 3) {
            return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, 0.25)`;
        }
    }

    const rgba = color.trim().match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i);
    if (rgba) {
        const opacity = Math.min(0.25, Math.max(0, Number(rgba[4])));
        return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${opacity})`;
    }

    const rgb = color.trim().match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i);
    if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, 0.25)`;

    return color;
};

export default function ScreenWrapper({ children, color }: ScreenWrapperProps) {
    let insets = { bottom: 0, top: 0 }
    const tab = useTabStore(state => state.tab)

    const scrollViewRef = useRef<ScrollView>(null);
    const setScrollToTopFunc = useScrollStore((state) => state.setScrollToTopFunc);

    useEffect(() => {
        setScrollToTopFunc(() => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        });
    }, [setScrollToTopFunc]);

    try {
        const hookInsets = useSafeAreaInsets()
        if (hookInsets) {
            insets = hookInsets
        }
    } catch (error) { }

    const { width: windowWidth, height: windowHeight } = useWindowDimensions()
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const currentWidth = isHydrated ? windowWidth : 1200
    const isMobileView = currentWidth < 900

    const spinValue = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 20000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start()
    }, [spinValue])

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    })

    const defaultColors = ['#f8fafc', '#e2e8f0', '#f1f5f9']

    const getGradientColors = (): [string, string, ...string[]] => {
        if (!color || !Array.isArray(color) || color.length === 0) {
            return defaultColors as [string, string, ...string[]]
        }
        if (color.length === 1) {
            return [color[0], color[0], color[0]]
        }
        if (color.length === 2) {
            return [color[0], color[1], color[0]]
        }
        return color as [string, string, ...string[]]
    }

    const gradientColors = getGradientColors().map(softenGradientColor) as [string, string, ...string[]]

    return (
        <View style={styles.outerContainer}>
            <View style={styles.backgroundWrapper} pointerEvents="none">
                <Animated.View 
                    style={[
                        styles.spinningBlobContainer, 
                        { 
                            transform: [{ rotate: spin }],
                            width: Math.max(windowWidth, 1400) * 1.5,
                            height: Math.max(windowWidth, 1400) * 1.5,
                        }
                    ]}
                >
                    <LinearGradient 
                        colors={gradientColors} 
                        style={styles.gradient} 
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </Animated.View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={[
                    styles.scroll,
                    {
                        maxWidth: 1400,
                        width: '100%'
                    }
                ]}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom || 20 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.mainBody, { paddingTop: (isMobileView && tab !== 4) ? 90 : 120 }]}>
                    {children}
                </View>
                <Footer />
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    backgroundWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
        overflow: 'hidden',
    },
    spinningBlobContainer: {
        borderRadius: 9999,
        overflow: 'hidden',
        opacity: 0.55,
        position: 'absolute',
    },
    scroll: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    mainBody: {
        flex: 1,
        width: '100%',
    },
    gradient: {
        width: '100%',
        height: '100%',
    }
})