'use client';

import React, { useState, useEffect, useRef } from 'react'
import ScreenWrapper from '../layout/ScreenWrapper'
import { View, Text, Pressable, Animated } from 'react-native'
import { UniversalImage } from './UniversalImage';
import noInternet from 'app/features/app/assets/no-wifi.png'
import { useLanStorage } from 'app/store/useLanStore'
import { useNativeAnimDriver } from 'app/utils/animation'

const NotLoad = ({ renderToken }: { renderToken: () => void }) => {
    const lan = useLanStorage(state => state.lan)
    const [isMounted, setIsMounted] = useState(false)

    const fadeAnim = useRef(new Animated.Value(0)).current
    const slideAnim = useRef(new Animated.Value(30)).current

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (isMounted) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver: useNativeAnimDriver,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 450,
                    useNativeDriver: useNativeAnimDriver,
                }),
            ]).start()
        }
    }, [isMounted, fadeAnim, slideAnim])

    if (!isMounted) {
        return null
    }

    return (
        <ScreenWrapper>
            <Animated.View 
                style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    padding: 24, 
                    minHeight: 400,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }}
            >
                <UniversalImage
                    src={noInternet}
                    alt='noInternet'
                    width={70}
                    height={70}
                    resizeMode='contain'
                />

                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8, textAlign: 'center' }}>
                    {lan === 'uz' ? 'Aloqa mavjud emas' : lan === 'en' ? 'No connection available' : lan === 'ru' ? 'Нет подключения' : 'Aloqa mavjud emas'}
                </Text>

                <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                    {lan === 'uz' ? "Internetga ulaning yoki Wi-Fi tarmog'ingizni tekshirib ko'ring" : lan === 'en' ? 'Connect to the Internet or check your Wi-Fi network' : lan === 'ru' ? 'Подключитесь к Интернету или проверьте сеть Wi-Fi' : "Internetga ulaning yoki Wi-Fi tarmog'ingizni tekshirib ko'ring"}.
                </Text>

                <Pressable
                    style={({ pressed }) => [
                        {
                            backgroundColor: '#0070f3',
                            paddingVertical: 12,
                            paddingHorizontal: 28,
                            borderRadius: 14,
                            width: '100%',
                            alignItems: 'center',
                        },
                        pressed && {
                            opacity: 0.85,
                        }
                    ]}
                    onPress={renderToken}
                >
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                        {lan === 'uz' ? 'Qayta urinish' : lan === 'en' ? 'retry' : lan === 'ru' ? 'повторить попытку' : 'Qayta urinish'}
                    </Text>
                </Pressable>
            </Animated.View>
        </ScreenWrapper>
    )
}

export default NotLoad