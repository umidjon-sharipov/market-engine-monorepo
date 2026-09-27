'use client'
import React, { useState, useEffect, useRef } from 'react'
import { View, Pressable, Animated, LayoutChangeEvent, useWindowDimensions } from 'react-native'
import NextPng from 'app/features/app/assets/next.png'
import { UniversalImage } from './UniversalImage'

interface SliderItem {
    id: string
    image: string
    marketId?: string
}

const ProductSlider = ({ sliders, count, setCount }: { sliders: SliderItem[], count: number, setCount: (prev: number) => void }) => {
    const { width: screenWidth } = useWindowDimensions();
    const [containerHeight, setContainerHeight] = useState(0)

    const animY = useRef(new Animated.Value(0)).current
    const totalSlides = sliders.length

    const VISIBLE_ITEMS = 5
    const CENTER_OFFSET = 2

    const maxScrollIndex = Math.max(0, totalSlides - 1)

    const slideTo = (index: number) => {
        let targetIndex = index
        if (index < 0) targetIndex = maxScrollIndex
        if (index > maxScrollIndex) targetIndex = 0

        setCount(targetIndex)

        const itemHeight = containerHeight / VISIBLE_ITEMS

        let visualOffsetIndex = targetIndex - CENTER_OFFSET

        const maxOffset = totalSlides - VISIBLE_ITEMS
        if (visualOffsetIndex < 0) {
            visualOffsetIndex = 0
        } else if (visualOffsetIndex > maxOffset) {
            visualOffsetIndex = maxOffset
        }

        const targetValue = -visualOffsetIndex * itemHeight

        Animated.timing(animY, {
            toValue: targetValue,
            duration: 300,
            useNativeDriver: false,
        }).start()
    }

    useEffect(() => {
        if (containerHeight > 0) {
            slideTo(count)
        }
    }, [count, containerHeight])

    const onLayout = (e: LayoutChangeEvent) => {
        const height = e.nativeEvent.layout.height
        setContainerHeight(height)

        const itemHeight = height / VISIBLE_ITEMS

        let visualOffsetIndex = count - CENTER_OFFSET
        const maxOffset = totalSlides - VISIBLE_ITEMS
        if (visualOffsetIndex < 0) visualOffsetIndex = 0
        if (visualOffsetIndex > maxOffset) visualOffsetIndex = maxOffset

        const initialValue = -visualOffsetIndex * itemHeight
        animY.setValue(initialValue)
    }

    const itemHeight = containerHeight / VISIBLE_ITEMS

    return (
        <View
            onLayout={onLayout}
            style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                position: 'relative',
                overflow: 'hidden',
                paddingVertical: 0
            }}
        >
            <View style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <Animated.View
                    style={{
                        flexDirection: 'column',
                        height: itemHeight * totalSlides,
                        width: '100%',
                        transform: [
                            { translateY: animY },
                        ],
                    }}
                >
                    {
                        sliders.map((item, index) => {
                            const isActive = index === count;

                            return (
                                <Pressable
                                    onPress={() => setCount(index)}
                                    key={item.id}
                                    style={{
                                        width: '100%',
                                        height: itemHeight || '20%',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isActive
                                            ? 'rgba(0, 149, 255, 0.25)'
                                            : 'rgba(0, 149, 255, 0.05)',
                                        borderWidth: isActive ? 2 : 0.5,
                                        borderColor: isActive
                                            ? 'rgb(0, 149, 255)'
                                            : 'rgba(0, 162, 255, 0.3)',
                                        borderRadius: 10,
                                        transform: [{ scale: isActive ? 0.95 : 0.85 }],
                                    }}
                                >
                                    <UniversalImage
                                        src={item.image}
                                        alt={`${item.id}`}
                                        width={itemHeight * 0.6}
                                        height={itemHeight * 0.6}
                                        resizeMode={'contain'}
                                    />
                                </Pressable>
                            );
                        })
                    }
                </Animated.View>
            </View>

            <Pressable
                style={({ pressed }) => [
                    {
                        padding: 8,
                        borderRadius: 100,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        position: 'absolute',
                        top: 10,
                        zIndex: 20,
                        transform: [{ rotate: '-90deg' }],
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    },
                    pressed && { opacity: 0.7 }
                ]}
                onPress={() => setCount(count > 0 ? count - 1 : maxScrollIndex)}
            >
                <UniversalImage
                    src={NextPng}
                    alt='prev'
                    width={18}
                    height={18}
                    resizeMode={'contain'}
                />
            </Pressable>

            <Pressable
                style={({ pressed }) => [
                    {
                        padding: 8,
                        borderRadius: 100,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        position: 'absolute',
                        bottom: 10,
                        zIndex: 20,
                        transform: [{ rotate: '90deg' }],
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    },
                    pressed && { opacity: 0.7 }
                ]}
                onPress={() => setCount(count < maxScrollIndex ? count + 1 : 0)}
            >
                <UniversalImage
                    src={NextPng}
                    alt='next'
                    width={18}
                    height={18}
                    resizeMode={'contain'}
                />
            </Pressable>
        </View>
    )
}

export default ProductSlider