'use client'
import React, { useState, useEffect, useRef } from 'react'
import { View, Text, Pressable, Animated, PanResponder, LayoutChangeEvent, useWindowDimensions } from 'react-native'
import { UniversalImage } from './UniversalImage'
import NextPng from 'app/features/app/assets/next.png'
import { TextLink } from 'solito/link'

interface Slider {
    id: string
    image: string
    link: string
    marketId: string
}

const Slider = ({ sliders, link, count, setCount }: { sliders: Slider[], link: boolean, count: number, setCount: (prev: number) => void }) => {
    const { width: screenWidth } = useWindowDimensions();
    const [width, setWidth] = useState(0)

    const animX = useRef(new Animated.Value(0)).current
    const currentTranslateX = useRef(0)
    const totalSlides = sliders.length

    const slideTo = (index: number) => {
        let targetIndex = index
        if (index < 0) targetIndex = totalSlides - 1
        if (index >= totalSlides) targetIndex = 0

        setCount(targetIndex)

        const containerWidth = screenWidth > 900 ? width : width / 0.88
        const offset = screenWidth > 900 ? 0 : (containerWidth - width) / 2

        const step = screenWidth > 900 ? width : width + 10
        const targetValue = -targetIndex * step + offset
        currentTranslateX.current = targetValue

        Animated.timing(animX, {
            toValue: targetValue,
            duration: 300,
            useNativeDriver: false,
        }).start()
    }

    useEffect(() => {
        if (width > 0) {
            slideTo(count)
        }
    }, [count, width])

    const onLayout = (e: LayoutChangeEvent) => {
        const containerWidth = e.nativeEvent.layout.width
        const slideWidth = screenWidth > 900 ? containerWidth : containerWidth * 0.88
        setWidth(slideWidth)

        const offset = screenWidth > 900 ? 0 : (containerWidth - slideWidth) / 2

        const initialValue = -count * slideWidth + offset
        currentTranslateX.current = initialValue
        animX.setValue(initialValue)
    }

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 5
            },
            onPanResponderGrant: () => {
                animX.stopAnimation()
            },
            onPanResponderMove: (_, gestureState) => {
                animX.setValue(currentTranslateX.current + gestureState.dx)
            },
            onPanResponderRelease: (_, gestureState) => {
                const dragDistance = gestureState.dx
                const swipeThreshold = width * 0.2

                if (dragDistance < -swipeThreshold) {
                    setCount(prev => (prev < totalSlides - 1 ? prev + 1 : 0))
                } else if (dragDistance > swipeThreshold) {
                    setCount(prev => (prev > 0 ? prev - 1 : totalSlides - 1))
                } else {
                    slideTo(count)
                }
            },
        })
    ).current

    useEffect(() => {
        if (link) {
            const timer = setInterval(() => {
                setCount(prev => (prev < totalSlides - 1 ? prev + 1 : 0))
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [totalSlides])

    return (
        <View
            onLayout={onLayout}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 40, position: 'relative' }}
        >
            <View style={{ width: '100%', height: '100%', borderRadius: screenWidth > 900 ? 24 : 0, overflow: 'hidden' }}>
                <Animated.View
                    {...panResponder.panHandlers}
                    style={{
                        borderRadius: 10,
                        flexDirection: 'row',
                        width: screenWidth > 900 ? width * totalSlides : (width + 10) * totalSlides,
                        height: '100%',
                        transform: [
                            { translateX: animX },
                        ],
                    }}
                >
                    {
                        sliders.map(slider => (
                            <View key={slider.id} style={{ width: width || '100%', marginHorizontal: screenWidth > 900 ? 0 : 5, height: '100%', borderRadius: screenWidth > 900 ? 0 : 15, alignItems: 'center', padding: 0, justifyContent: 'center', backgroundColor: '#EEF2F6' }}>
                                {link === true ? <TextLink href={`/${slider.link}`}>
                                    <UniversalImage
                                        src={slider.image}
                                        alt={`${slider.id}`}
                                        width={screenWidth < 600 ? 150 : screenWidth < 900 ? 250 : 370}
                                        height={screenWidth < 600 ? 150 : screenWidth < 900 ? 250 : 370}
                                        resizeMode="contain"
                                    />
                                </TextLink>
                                    :
                                    <View>
                                        <UniversalImage
                                            src={slider.image}
                                            alt={`${slider.id}`}
                                            width={screenWidth < 600 ? 150 : screenWidth < 900 ? 250 : 370}
                                            height={screenWidth < 600 ? 150 : screenWidth < 900 ? 250 : 370}
                                            resizeMode="contain"
                                        />
                                    </View>}
                            </View>
                        ))
                    }
                </Animated.View>
            </View>

            {
                screenWidth > 900 ? (
                    <>
                        <Pressable
                            style={({ pressed }) => [
                                {
                                    padding: 8,
                                    borderRadius: 100,
                                    marginHorizontal: 10,
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    position: 'absolute',
                                    top: '50%',
                                    left: 10,
                                    zIndex: 20,
                                    transform: [{ translateY: -20 }, { rotate: '180deg' }],
                                    transition: 'all 0.3s ease'
                                },
                                pressed && {
                                    opacity: 0.7,
                                }
                            ]}
                            onPress={() => setCount(prev => (prev > 0 ? prev - 1 : totalSlides - 1))}
                        >
                            <UniversalImage
                                src={NextPng}
                                alt='next'
                                width={20}
                                height={20}
                                resizeMode="contain"
                            />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                {
                                    padding: 8,
                                    borderRadius: 100,
                                    marginHorizontal: 10,
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    position: 'absolute',
                                    top: '50%',
                                    right: 10,
                                    zIndex: 20,
                                    transform: [{ translateY: -20 }],
                                    transition: 'all 0.3s ease'
                                },
                                pressed && {
                                    opacity: 0.7,
                                }
                            ]}
                            onPress={() => setCount(prev => (prev < totalSlides - 1 ? prev + 1 : 0))}
                        >
                            <UniversalImage
                                src={NextPng}
                                alt='next'
                                width={20}
                                height={20}
                                resizeMode="contain"
                            />
                        </Pressable>
                    </>
                ) : null
            }
        </View>
    )
}

export default Slider