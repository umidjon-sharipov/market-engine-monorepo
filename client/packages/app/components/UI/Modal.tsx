'use client'
import React, { useState, useEffect } from 'react'
import { View, Text, Pressable, touchableOpacity, Platform, StyleSheet, TouchableOpacity } from 'react-native'
import { useModalStore } from 'app/store/useModalStore'
import { UniversalImage } from './UniversalImage'
import BackPng from 'app/features/app/assets/back.png'
import { useRouter } from 'solito/navigation'
import { BlurView } from 'expo-blur'
import CartPng from 'app/features/app/assets/online-shopping.png'
import KebabPng from 'app/features/app/assets/kebab.png'
import SadPng from 'app/features/app/assets/sad.png'
import HeartPng from 'app/features/app/assets/black-heart.png'

const Modal = ({ top, left }: { top: number, left: number }) => {
    const modal = useModalStore(state => state.modal)
    const router = useRouter()
    const [kebabState, setKebabState] = useState(false)
    return (
        <>
            <View
                style={{
                    ...Platform.select({
                        web: { position: 'fixed' },
                        default: { position: 'absolute' }
                    }),
                    top: top,
                    left: left,
                    width: '100%',
                    height: 40,
                    zIndex: 99999999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {
                    modal === 'product' ? (
                        <View style={{ width: '100%', height: 50, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 5, paddingHorizontal: 10 }}>

                            <BlurView
                                tint="light" intensity={40}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 25,
                                    overflow: 'hidden',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.6)',
                                    elevation: 2
                                }}
                            >
                                <Pressable style={({ pressed }) => [{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: pressed ? 0.8 : 1 }]} onPress={() => router.back()}>
                                    <UniversalImage src={BackPng} alt='back' height={22} width={22} resizeMode='contain' />
                                </Pressable>
                            </BlurView>

                            <BlurView
                                tint="light" intensity={40}
                                style={{
                                    flex: 1,
                                    height: 40,
                                    borderRadius: 25,
                                    overflow: 'hidden',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.6)',
                                    elevation: 2
                                }}>
                                <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
                                    <View></View>
                                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a1a1a' }}>
                                        Product
                                    </Text>
                                    {
                                        kebabState ? (
                                            <>
                                                <Pressable>
                                                    <UniversalImage src={SadPng} alt='sad' width={20} height={20} resizeMode='contain' />
                                                </Pressable>
                                                <Pressable>
                                                    <UniversalImage src={HeartPng} alt='heart' width={20} height={20} resizeMode='contain' />
                                                </Pressable>
                                                <Pressable>
                                                    <UniversalImage src={KebabPng} alt='kebab' width={20} height={20} resizeMode='contain' />
                                                </Pressable>
                                            </>
                                        ) : null
                                    }
                                    <Pressable onPress={() => setKebabState(prev => !prev)} style={{ alignItems: 'center', justifyItems: 'center', width: 40 }}>
                                        <UniversalImage src={KebabPng} alt='kebab' width={22} height={22} resizeMode='contain' />
                                    </Pressable>
                                </View>
                            </BlurView>

                            <BlurView
                                tint="light" intensity={40}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 25,
                                    overflow: 'hidden',
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.6)',
                                    elevation: 2
                                }}
                            >
                                <Pressable style={({ pressed }) => [{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: pressed ? 0.8 : 1 }]}>
                                    <UniversalImage src={CartPng} alt='cart' width={22} height={22} resizeMode='contain' />
                                </Pressable>
                            </BlurView>

                        </View>
                    ) : (
                        <Text style={{ flex: 1 }}>Modal</Text>
                    )
                }
            </View>
        </>
    )
}

export default Modal
const styles = StyleSheet.create({

})