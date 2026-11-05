'use client'

import React from 'react'
import { StyleSheet, View } from 'react-native'
import AboutItem from 'app/components/UI/AboutItem'
import { useDesignStore } from 'app/store/useDesignStore'

const AboutWrapper = ({ children }: { children: React.ReactNode }) => {
    const theme = useDesignStore(state => state.theme)
    const dark = theme === 'dark'

    return (
        <View style={styles.container}>
            <AboutItem />
            <View
                style={[
                    styles.mainBody,
                    {
                        backgroundColor: dark ? 'rgba(15, 23, 42, 0.74)' : 'rgba(255, 255, 255, 0.78)',
                        borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
                    },
                ]}
            >
                {children}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 16,
    },
    mainBody: {
        width: '100%',
        flex: 1,
        overflow: 'hidden',
        borderWidth: 1,
        borderRadius: 28,
    },
})

export default AboutWrapper