'use client'

import { Text, View, StyleSheet, ScrollView, Pressable, Animated, TextInput, useWindowDimensions } from 'react-native'
import { UniversalImage } from 'app/components/UI/UniversalImage'
import React, { useState, useEffect, useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useLanStorage } from 'app/store/useLanStore'
import GrapePng from 'app/features/app/assets/grape.png'
import { useRouter } from 'solito/navigation'
import { useTokenStore } from 'app/store/useTokenStore'
import { useUrlStore } from 'app/store/useUrlStore'

const translations = {
    uz: {
        email: 'Elektron pochta',
        submit: 'Yuborish',
        appTitle: 'Online Market',
    },
    ru: {
        email: 'Эл. почта',
        submit: 'Отправить',
        appTitle: 'Online Market',
    },
    en: {
        email: 'Email',
        submit: 'Submit',
        appTitle: 'Online Market',
    }
}

const AuthPage = () => {
    const url = useUrlStore(state => state.url)
    const token = useTokenStore(state => state.token)
    const setToken = useTokenStore(state => state.setToken)
    const router = useRouter()
    const lan = useLanStorage(state => state.lan) as 'uz' | 'ru' | 'en'
    const setLan = useLanStorage(state => state.setLan)
    const t = translations[lan || 'uz']
    const [auth, setAuth] = useState('email')

    const { width } = useWindowDimensions()
    const isDesktop = width > 600

    const [email, setEmail] = useState('')
    const [code, setCode] = useState<string>('')
    const [inputFocus, setInputFocus] = useState(0)

    const handleSubmit = async () => {
        const bodyData = auth === 'email' ? { email } : { 'email': email, 'code': String(code) };
        const postUrl = auth === 'email' ? `${url}/auth/send-otp` : `${url}/auth/verify-otp`;

        const res = await fetch(postUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData),
        });
        const data = await res.json();

        if (res.ok) {
            if (auth === 'email') {
                setAuth('code');
            } else {
                setToken(data.token)
                router.push('/profile');
            }
        } else {
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop, { paddingTop: 120 }
                ]}
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.orbTop} />
                <View style={styles.orbBottom} />

                <View style={[styles.cardContainer, isDesktop && styles.cardContainerDesktop]}>

                    <View style={styles.headerBox}>
                        <View style={styles.logoCircle}>
                            <UniversalImage
                                src={GrapePng}
                                alt="Logo"
                                width={32}
                                height={32}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={{ textTransform: 'capitalize', fontSize: 20, color: '#1A73E8', fontWeight: 'bold' }}>online market</Text>
                    </View>

                    <View style={[styles.formWrapper]}>

                        <View style={[styles.inputBox, inputFocus === 1 ? (styles.inputBoxActive) : null]}>
                            {auth === 'email' ? (
                                <>
                                    <Text style={styles.inputLabel}>{t.email}</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={email}
                                        onFocus={() => setInputFocus(1)}
                                        onBlur={() => setInputFocus(0)}
                                        onChangeText={setEmail}
                                        placeholder="email"
                                        placeholderTextColor="#64748B"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </>
                            ) : (
                                <>
                                    <Text style={styles.inputLabel}>code</Text>
                                    <TextInput
                                        style={[styles.textInput, { textAlign: 'center' }]}
                                        value={code}
                                        onFocus={() => setInputFocus(1)}
                                        onBlur={() => setInputFocus(0)}
                                        maxLength={6}
                                        onChangeText={(text) => {
                                            const numericText = text.replace(/[^0-9]/g, '');
                                            setCode(numericText);
                                        }}
                                        placeholder="code"
                                        placeholderTextColor="#64748B"
                                        keyboardType="number-pad"
                                    />
                                </>
                            )}
                        </View>
                        <Pressable
                            android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
                                [styles.editProfileButton, { transition: 'all 0.3s' }],
                                {
                                    background: (hovered || pressed)
                                        ? 'linear-gradient(#0284C7, #00E5FF)'
                                        : 'linear-gradient(#00E5FF, #0284C7)'
                                },
                                pressed && [styles.editProfileButtonPressed, {
                                    elevation: 6,
                                    shadowColor: '#0284C7',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.8,
                                    shadowRadius: 8,
                                    opacity: 0.6,
                                    transform: [{ scale: 0.95 }]
                                }],
                                hovered && {
                                    elevation: 6,
                                    shadowColor: '#0284C7',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.8,
                                    shadowRadius: 8,
                                }
                            ]}
                            onPress={handleSubmit}
                        >
                            {({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => (
                                <LinearGradient
                                    colors={(hovered || pressed) ? ['#0284C7', '#00E5FF'] : ['#00E5FF', '#0284C7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={styles.editProfileGradient}
                                >
                                    <Text style={styles.editProfileButtonText}>{t.submit}</Text>
                                </LinearGradient>
                            )}
                        </Pressable>
                    </View>

                </View>

            </ScrollView>
        </View>
    )
}

export default AuthPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        padding: 16,
        alignItems: 'center',
        paddingBottom: 100,
        justifyContent: 'center',
        flex: 1
    },
    scrollContentDesktop: {
        justifyContent: 'center',
        minHeight: '100%',
    },
    orbTop: {
        position: 'absolute',
        top: -40,
        left: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(0, 229, 255, 0.15)',
        zIndex: 0,
    },
    orbBottom: {
        position: 'absolute',
        bottom: 20,
        right: -40,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(30, 62, 98, 0.3)',
        zIndex: 0,
    },
    topBar: {
        width: '100%',
        maxWidth: 440,
        alignItems: 'flex-end',
        marginBottom: 12,
        zIndex: 2,
    },
    topBarDesktop: {
        maxWidth: 480,
    },
    langButton: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 229, 255, 0.4)',
    },
    langBlur: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(11, 25, 44, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputBoxActive: {
        borderColor: '#00E5FF',
        backgroundColor: '#F0FDFA',
    },
    langText: {
        color: '#00E5FF',
        fontWeight: '800',
        fontSize: 12,
    },
    saveButtonWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
        width: '100%',
    },
    saveButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    cardContainer: {
        width: '100%',
        maxWidth: 440,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 1,
    },
    cardContainerDesktop: {
        maxWidth: 480,
        padding: 28,
    },
    headerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
    },
    logoCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appTitleText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    formWrapper: {
        width: '100%',
        gap: 10
    },
    inputBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 2,
    },
    textInput: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        paddingVertical: 2,
    },
    selectRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    selectText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    selectArrow: {
        fontSize: 10,
        color: '#64748B',
    },
    submitButtonWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 12,
        width: '100%',
    },
    submitButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    switchModeFooter: {
        marginTop: 14,
        alignItems: 'center',
    },
    switchModeFooterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0284C7',
    },
    editProfileButton: {
        borderRadius: 24,
        overflow: 'hidden',
        width: '100%',
        transition: 'all 0.3s ease',
        padding: 3
    },
    editProfileGradient: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editProfileButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
})