'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, StyleSheet, Platform, Animated, Easing } from 'react-native'

interface ICursorInstance {
    id: number
    x: number
    y: number
    scaleAnim: Animated.Value
    opacityAnim: Animated.Value
}

const CURSOR_RADIUS = 10
const ANIMATION_DURATION = 500

const Cursor = () => {
    const [cursors, setCursors] = useState<ICursorInstance[]>([])
    
    const cursorIdCounter = useRef(0)

    useEffect(() => {
        if (Platform.OS !== 'web') return

        const handleDown = (e: MouseEvent) => {
            const newId = cursorIdCounter.current++
            
            const scaleAnim = new Animated.Value(0.2)
            const opacityAnim = new Animated.Value(1)

            const newCursor: ICursorInstance = {
                id: newId,
                x: e.clientX,
                y: e.clientY,
                scaleAnim,
                opacityAnim,
            }

            setCursors((prev) => [...prev, newCursor])

            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 2.5,
                    duration: ANIMATION_DURATION,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: ANIMATION_DURATION,
                    useNativeDriver: false,
                }),
            ]).start(() => {
                setCursors((prev) => prev.filter((cursor) => cursor.id !== newId))
            })
        }

        window.addEventListener('mousedown', handleDown)
        return () => {
            window.removeEventListener('mousedown', handleDown)
        }
    }, [])

    if (Platform.OS !== 'web') {
        return null
    }

    return (
        <View style={styles.container} pointerEvents="none">
            {cursors.map((cursor) => (
                <Animated.View
                    key={cursor.id}
                    style={[
                        styles.cursor,
                        {
                            left: cursor.x - CURSOR_RADIUS,
                            top: cursor.y - CURSOR_RADIUS,
                            width: CURSOR_RADIUS * 2,
                            height: CURSOR_RADIUS * 2,
                            borderRadius: CURSOR_RADIUS,
                            transform: [{ scale: cursor.scaleAnim }],
                            opacity: cursor.opacityAnim,
                        },
                    ]}
                />
            ))}
        </View>
    )
}

export default Cursor

const styles = StyleSheet.create({
    container: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999999,
    },
    cursor: {
        position: 'absolute' as any,
        backgroundColor: 'rgba(0, 166, 255, 0.1)',
        borderColor: 'rgba(0, 166, 255, 0.5)',
        borderWidth: 1.5,
        
        boxShadow: '0 0 15px 3px rgba(0, 191, 255, 0.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        
        elevation: 0, 
    },
})