'use client'

import React, { useState, useEffect } from 'react'
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AboutItem from 'app/components/UI/AboutItem'

const AboutWrapper = ({ children }: { children: React.ReactNode }) => {
    let insets = { bottom: 0, top: 0 }

    try {
        const hookInsets = useSafeAreaInsets()
        if (hookInsets) {
            insets = hookInsets
        }
    } catch (error) {
    }

    const { width: windowWidth } = useWindowDimensions()
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const currentWidth = isHydrated ? windowWidth : 1200
    function isMobile() {
        const isMobileView = currentWidth < 1000
        return isMobileView
    }

    return (
        <View
            style={styles.scroll}
            contentContainerStyle={[
                styles.scrollContent,
            ]}
        >
            <AboutItem />
            <View style={[styles.mainBody]}>
                {children}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    scroll: {
        backgroundColor: '#fff',
        widht: '100%',
        aligntItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    mainBody: {
        flex: 1,
    },
})

export default AboutWrapper