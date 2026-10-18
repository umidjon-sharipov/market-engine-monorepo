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

    const gradientColors = getGradientColors()

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
        opacity: 0.65,
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