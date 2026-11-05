'use client'

import { Text, View, StyleSheet, ScrollView, Pressable, TextInput, useWindowDimensions, ActivityIndicator } from 'react-native'
import { UniversalImage } from 'app/components/UI/UniversalImage'
import React, { useState } from 'react'
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
        submit: 'Kodni olish',
        verify: 'Tasdiqlash',
        code: '6 xonali kod',
        sent: 'Tasdiqlash kodi yuborildi.',
        changeEmail: 'Emailni o‘zgartirish',
        invalidEmail: 'To‘g‘ri email manzilini kiriting.',
        invalidCode: '6 xonali kodni to‘liq kiriting.',
        serverError: 'Server bilan ulanishda xatolik yuz berdi.',
        appTitle: 'Online Market',
    },
    ru: {
        email: 'Эл. почта',
        submit: 'Получить код',
        verify: 'Подтвердить',
        code: 'Код из 6 цифр',
        sent: 'Код подтверждения отправлен.',
        changeEmail: 'Изменить эл. почту',
        invalidEmail: 'Введите корректный адрес эл. почты.',
        invalidCode: 'Введите полный код из 6 цифр.',
        serverError: 'Не удалось подключиться к серверу.',
        appTitle: 'Online Market',
    },
    en: {
        email: 'Email',
        submit: 'Send code',
        verify: 'Verify',
        code: '6-digit code',
        sent: 'Verification code sent.',
        changeEmail: 'Change email',
        invalidEmail: 'Enter a valid email address.',
        invalidCode: 'Enter the full 6-digit code.',
        serverError: 'Could not connect to the server.',
        appTitle: 'Online Market',
    }
}

const AuthPage = () => {
    const url = useUrlStore(state => state.url)
    const addOrUpdateAccount = useTokenStore(state => state.addOrUpdateAccount)
    const router = useRouter()
    const lan = useLanStorage(state => state.lan) as 'uz' | 'ru' | 'en'
    const t = translations[lan || 'uz']
    const [auth, setAuth] = useState<'email' | 'code'>('email')

    const { width } = useWindowDimensions()
    const isDesktop = width > 600

    const [email, setEmail] = useState('')
    const [code, setCode] = useState<string>('')
    const [inputFocus, setInputFocus] = useState(0)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState<'success' | 'error'>('error')

    const handleSubmit = async () => {
        const normalizedEmail = email.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setMessageType('error')
            setMessage(t.invalidEmail)
            return
        }
        if (auth === 'code' && !/^\d{6}$/.test(code)) {
            setMessageType('error')
            setMessage(t.invalidCode)
            return
        }

        setMessage('')
        setLoading(true)
        const bodyData = auth === 'email' ? { email: normalizedEmail } : { email: normalizedEmail, code };
        const postUrl = auth === 'email' ? `${url}/auth/send-otp` : `${url}/auth/verify-otp`;

        try {
            const res = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            })
            const data: unknown = await res.json()

            if (!res.ok) {
                const errorMessage = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
                    ? data.message
                    : t.serverError
                setMessageType('error')
                setMessage(errorMessage)
                return
            }
            if (auth === 'email') {
                setAuth('code')
                setMessageType('success')
                setMessage(t.sent)
                return
            }

            if (
                typeof data !== 'object' ||
                data === null ||
                !('user' in data) ||
                typeof data.user !== 'object' ||
                data.user === null ||
                !('email' in data.user) ||
                typeof data.user.email !== 'string' ||
                !('accessToken' in data) ||
                typeof data.accessToken !== 'string' ||
                !('refreshToken' in data) ||
                typeof data.refreshToken !== 'string'
            ) {
                setMessageType('error')
                setMessage(t.serverError)
                return
            }

            addOrUpdateAccount({
                email: data.user.email,
                userName: 'userName' in data.user && typeof data.user.userName === 'string' ? data.user.userName : '',
                image: 'image' in data.user && typeof data.user.image === 'string' ? data.user.image : '',
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            })
            router.push('/profile')
        } catch {
            setMessageType('error')
            setMessage(t.serverError)
        } finally {
            setLoading(false)
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
                                        editable={!loading}
                                    />
                                </>
                            ) : (
                                <>
                                    <Text style={styles.inputLabel}>{t.code} · {email.trim()}</Text>
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
                                        placeholder="••••••"
                                        placeholderTextColor="#64748B"
                                        keyboardType="number-pad"
                                        editable={!loading}
                                    />
                                </>
                            )}
                        </View>
                        {message ? <Text style={[styles.messageText, messageType === 'success' && styles.successMessageText]}>{message}</Text> : null}
                        {auth === 'code' && (
                            <Pressable disabled={loading} onPress={() => { setAuth('email'); setCode(''); setMessage('') }}>
                                <Text style={styles.switchModeFooterText}>{t.changeEmail}</Text>
                            </Pressable>
                        )}
                        <Pressable
                            disabled={loading}
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
                                    {loading
                                        ? <ActivityIndicator color="#FFFFFF" />
                                        : <Text style={styles.editProfileButtonText}>{auth === 'email' ? t.submit : t.verify}</Text>}
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
    messageText: {
        color: '#B91C1C',
        fontSize: 13,
        textAlign: 'center',
    },
    successMessageText: {
        color: '#15803D',
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