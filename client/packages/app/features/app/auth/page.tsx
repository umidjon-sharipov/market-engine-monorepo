'use client'

import { Text, View, StyleSheet, ScrollView, Pressable, TextInput, useWindowDimensions, ActivityIndicator, Platform, Linking, KeyboardAvoidingView } from 'react-native'
import { UniversalImage } from 'app/components/UI/UniversalImage'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LinearGradient } from 'app/components/UI/UniversalLinearGradient'
import { useLanStorage } from 'app/store/useLanStore'
import GrapePng from 'app/features/app/assets/grape.png'
import { useRouter, useSearchParams } from 'solito/navigation'
import { useTokenStore } from 'app/store/useTokenStore'
import { useUrlStore } from 'app/store/useUrlStore'
import { OAUTH_PROVIDERS, OAuthBrandIcon } from 'app/features/app/auth/OAuthIcons'
import TelegramLoginWidget from 'app/features/app/auth/TelegramLoginWidget'

type Step = 'methods' | 'otp' | 'oauth-callback'

const translations = {
    uz: {
        email: 'Elektron pochta',
        firstName: 'Ism',
        password: 'Doimiy parol',
        confirm: 'Parolni tasdiqlang',
        registerTitle: 'Ro‘yxatdan o‘tish',
        registerSubmit: 'Ro‘yxatdan o‘tish va kod olish',
        switchToRegister: 'Akkaunt yo‘qmi? Ro‘yxatdan o‘tish',
        switchToLogin: 'Akkauntingiz bormi? Kirish',
        submit: 'Kodni olish',
        verify: 'Tasdiqlash',
        login: 'Parol bilan kirish',
        register: 'Ro‘yxatdan o‘tish',
        code: '6 xonali kod',
        sent: 'Tasdiqlash kodi yuborildi.',
        changeEmail: 'Emailni o‘zgartirish',
        invalidEmail: 'To‘g‘ri email manzilini kiriting.',
        invalidName: 'Ismni kiriting (kamida 2 belgi).',
        invalidCode: '6 xonali kodni to‘liq kiriting.',
        invalidPassword: 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak.',
        passwordMismatch: 'Parollar mos kelmadi.',
        serverError: 'Server bilan ulanishda xatolik yuz berdi.',
        methodsTitle: 'Kirish',
        or: 'yoki',
        oauthHint: 'Boshqa platforma orqali',
        back: 'Orqaga',
        oauthLoading: 'OAuth orqali kiritilmoqda…',
        optionalPassword: 'Doimiy parol',
    },
    ru: {
        email: 'Эл. почта',
        firstName: 'Имя',
        password: 'Постоянный пароль',
        confirm: 'Подтвердите пароль',
        registerTitle: 'Регистрация',
        registerSubmit: 'Зарегистрироваться и получить код',
        switchToRegister: 'Нет аккаунта? Зарегистрироваться',
        switchToLogin: 'Уже есть аккаунт? Войти',
        submit: 'Получить код',
        verify: 'Подтвердить',
        login: 'Войти с паролем',
        register: 'Регистрация',
        code: 'Код из 6 цифр',
        sent: 'Код подтверждения отправлен.',
        changeEmail: 'Изменить эл. почту',
        invalidEmail: 'Введите корректный адрес эл. почты.',
        invalidName: 'Введите имя (минимум 2 символа).',
        invalidCode: 'Введите полный код из 6 цифр.',
        invalidPassword: 'Пароль должен содержать минимум 8 символов.',
        passwordMismatch: 'Пароли не совпадают.',
        serverError: 'Не удалось подключиться к серверу.',
        methodsTitle: 'Вход',
        or: 'или',
        oauthHint: 'Через другую платформу',
        back: 'Назад',
        oauthLoading: 'Вход через OAuth…',
        optionalPassword: 'Постоянный пароль',
    },
    en: {
        email: 'Email',
        firstName: 'First name',
        password: 'Password',
        confirm: 'Confirm password',
        registerTitle: 'Create account',
        registerSubmit: 'Create account and send code',
        switchToRegister: 'No account? Create one',
        switchToLogin: 'Already have an account? Sign in',
        submit: 'Send code',
        verify: 'Verify',
        login: 'Sign in with password',
        register: 'Create account',
        code: '6-digit code',
        sent: 'Verification code sent.',
        changeEmail: 'Change email',
        invalidEmail: 'Enter a valid email address.',
        invalidName: 'Enter your name (at least 2 characters).',
        invalidCode: 'Enter the full 6-digit code.',
        invalidPassword: 'Password must be at least 8 characters.',
        passwordMismatch: 'Passwords do not match.',
        serverError: 'Could not connect to the server.',
        methodsTitle: 'Sign in',
        or: 'or',
        oauthHint: 'Continue with',
        back: 'Back',
        oauthLoading: 'Signing in with OAuth…',
        optionalPassword: 'Password',
    },
}

const AuthPage = () => {
    const url = useUrlStore((state) => state.url)
    const addOrUpdateAccount = useTokenStore((state) => state.addOrUpdateAccount)
    const router = useRouter()
    const searchParams = useSearchParams()
    const startedOAuthCode = useRef<string | null>(null)
    const oauthCallbackParams = useMemo(() => ({
        code: searchParams?.get('code') ?? null,
        state: searchParams?.get('state') ?? null,
        step: searchParams?.get('step') ?? null,
    }), [searchParams])
    const lan = useLanStorage((state) => state.lan) as 'uz' | 'ru' | 'en'
    const t = translations[lan || 'uz']
    const [localStep, setLocalStep] = useState<Step>('methods')
    const queryStep = oauthCallbackParams.step
    const step: Step = queryStep === 'otp' || queryStep === 'oauth-callback' ? queryStep : localStep === 'otp' || localStep === 'oauth-callback' ? localStep : 'methods'

    const { width } = useWindowDimensions()
    const isDesktop = width > 600

    const [email, setEmail] = useState(searchParams?.get('email') ?? '')
    const [authMode, setAuthMode] = useState<'login' | 'register'>(
        searchParams?.get('intent') === 'register' ? 'register' : 'login',
    )
    const [firstName, setFirstName] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [code, setCode] = useState('')
    const [inputFocus, setInputFocus] = useState(2)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(searchParams?.get('error') ?? '')
    const [messageType, setMessageType] = useState<'success' | 'error'>(
        searchParams?.get('error') ? 'error' : 'error',
    )

    const go = useCallback((next: Step, extra?: Record<string, string>) => {
        setLocalStep(next)
        const params = new URLSearchParams({ step: next, ...extra })
        router.push(`/auth?${params.toString()}`)
    }, [router])

    const applySession = useCallback((data: unknown) => {
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
            throw new Error(t.serverError)
        }
        addOrUpdateAccount({
            email: data.user.email,
            userName: 'userName' in data.user && typeof data.user.userName === 'string' ? data.user.userName : '',
            image: 'image' in data.user && typeof data.user.image === 'string' ? data.user.image : '',
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
        })
        router.push('/profile')
    }, [addOrUpdateAccount, router, t.serverError])

    const readError = (data: unknown) => {
        if (typeof data === 'object' && data !== null && 'message' in data) {
            const value = data.message
            if (typeof value === 'string') return value
            if (Array.isArray(value)) return value.map(String).join(' ')
        }
        return t.serverError
    }

    const exchangeOAuth = useCallback(async (oauthCode: string) => {
        setLoading(true)
        try {
            const res = await fetch(`${url}/auth/oauth/exchange`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: oauthCode }),
            })
            const data: unknown = await res.json()
            if (!res.ok) throw new Error(readError(data))
            applySession(data)
        } catch (error) {
            setMessageType('error')
            setMessage(error instanceof Error ? error.message : t.serverError)
            go('methods')
        } finally {
            setLoading(false)
        }
    }, [applySession, go, t.serverError, url])

    useEffect(() => {
        const oauthCode = oauthCallbackParams.code
        if (
            step === 'oauth-callback' &&
            oauthCode &&
            url &&
            startedOAuthCode.current !== oauthCode
        ) {
            startedOAuthCode.current = oauthCode
            void exchangeOAuth(oauthCode)
        }
    }, [exchangeOAuth, oauthCallbackParams.code, step, url])

    useEffect(() => {
        const onUrl = ({ url: incoming }: { url: string }) => {
            try {
                const parsed = new URL(incoming.replace('online-market://', 'https://auth.local/'))
                const oauthCode = parsed.searchParams.get('code')
                const nextStep = parsed.searchParams.get('step')
                const error = parsed.searchParams.get('error')
                if (error) {
                    setMessageType('error')
                    setMessage(error)
                    go('methods')
                }
                if (nextStep === 'oauth-callback' && oauthCode) {
                    go('oauth-callback', { code: oauthCode })
                }
            } catch {
                return
            }
        }
        const subscription = Linking.addEventListener('url', onUrl)
        void Linking.getInitialURL().then((initial) => {
            if (initial) onUrl({ url: initial })
        })
        return () => subscription.remove()
    }, [go])

    const platform = useMemo(
        () => (Platform.OS === 'web' ? 'client' : 'mobile'),
        [],
    )

    const openProvider = (providerId: string) => {
        const href = `${url}/auth/oauth/${providerId}?platform=${platform}`
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.href = href
            return
        }
        void Linking.openURL(href)
    }

    const handleSubmit = async (mode: 'otp' | 'register' | 'password' | 'verify' = 'otp') => {
        const normalizedEmail = email.trim().toLowerCase()
        if (mode !== 'verify' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setMessageType('error')
            setMessage(t.invalidEmail)
            return
        }
        if (mode === 'verify' && !/^\d{6}$/.test(code)) {
            setMessageType('error')
            setMessage(t.invalidCode)
            return
        }
        if (mode === 'password' && password.length < 8) {
            setMessageType('error')
            setMessage(t.invalidPassword)
            return
        }
        if (mode === 'register' && firstName.trim().length < 2) {
            setMessageType('error')
            setMessage(t.invalidName)
            return
        }
        if (mode === 'register' && password.length < 8) {
            setMessageType('error')
            setMessage(t.invalidPassword)
            return
        }
        if (mode === 'register' && password !== passwordConfirmation) {
            setMessageType('error')
            setMessage(t.passwordMismatch)
            return
        }

        setMessage('')
        setLoading(true)
        try {
            if (mode === 'password') {
                const res = await fetch(`${url}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: normalizedEmail, password }),
                })
                const data: unknown = await res.json()
                if (!res.ok) throw new Error(readError(data))
                applySession(data)
                return
            }

            if (mode === 'otp' || mode === 'register') {
                const res = await fetch(`${url}/auth/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mode === 'register'
                        ? {
                            email: normalizedEmail,
                            firstName: firstName.trim(),
                            password,
                            intent: 'register',
                        }
                        : { email: normalizedEmail, intent: 'login' }),
                })
                const data: unknown = await res.json()
                if (!res.ok) throw new Error(readError(data))
                setMessageType('success')
                setMessage(t.sent)
                if (mode === 'register') setAuthMode('register')
                go('otp', { email: normalizedEmail, intent: mode === 'register' ? 'register' : 'login' })
                return
            }

            const res = await fetch(`${url}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail, code }),
            })
            const data: unknown = await res.json()
            if (!res.ok) throw new Error(readError(data))
            applySession(data)
        } catch (error) {
            setMessageType('error')
            setMessage(error instanceof Error ? error.message : t.serverError)
        } finally {
            setLoading(false)
        }
    }

    const renderField = (
        label: string,
        value: string,
        onChange: (text: string) => void,
        options: { focusId: number; secure?: boolean; keyboard?: 'email-address' | 'default' | 'number-pad'; placeholder?: string; autoFocus?: boolean },
    ) => (
        <View style={[styles.inputBox, inputFocus === options.focusId ? styles.inputBoxActive : null]}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={styles.textInput}
                value={value}
                autoFocus={options.autoFocus}
                onFocus={() => setInputFocus(options.focusId)}
                onBlur={() => setInputFocus(0)}
                onChangeText={onChange}
                placeholder={options.placeholder}
                placeholderTextColor="#64748B"
                keyboardType={options.keyboard || 'default'}
                autoCapitalize={options.keyboard === 'email-address' ? 'none' : 'words'}
                secureTextEntry={options.secure}
                editable={!loading}
            />
        </View>
    )

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop,
                    { paddingTop: 80, paddingBottom: 40 },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.orbTop} />
                <View style={styles.orbBottom} />

                <View style={[styles.cardContainer, isDesktop && styles.cardContainerDesktop]}>
                    <View style={styles.headerBox}>
                        <View style={styles.logoCircle}>
                            <UniversalImage src={GrapePng} alt="Logo" width={32} height={32} resizeMode="contain" />
                        </View>
                        <Text style={{ textTransform: 'capitalize', fontSize: 20, color: '#1A73E8', fontWeight: 'bold' }}>online market</Text>
                    </View>

                    <View style={styles.formWrapper}>
                        {step === 'oauth-callback' ? (
                            <>
                                <Text style={styles.sectionTitle}>{t.oauthLoading}</Text>
                                <ActivityIndicator color="#0284C7" />
                            </>
                        ) : step === 'otp' ? (
                            <>
                                <View style={[styles.inputBox, inputFocus === 5 ? styles.inputBoxActive : null]}>
                                    <Text style={styles.inputLabel}>{t.code} · {email.trim()}</Text>
                                    <TextInput
                                        style={[styles.textInput, { textAlign: 'center', letterSpacing: 8, fontSize: 22 }]}
                                        value={code}
                                        autoFocus
                                        onFocus={() => setInputFocus(5)}
                                        onBlur={() => setInputFocus(0)}
                                        maxLength={6}
                                        onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                                        placeholder="••••••"
                                        placeholderTextColor="#64748B"
                                        keyboardType="number-pad"
                                        editable={!loading}
                                    />
                                </View>
                                {message ? (
                                    <Text style={[styles.messageText, messageType === 'success' && styles.successMessageText]}>{message}</Text>
                                ) : null}
                                <Pressable disabled={loading} onPress={() => handleSubmit('verify')} style={styles.editProfileButton}>
                                    <LinearGradient colors={['#00E5FF', '#0284C7']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.editProfileGradient}>
                                        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.editProfileButtonText}>{t.verify}</Text>}
                                    </LinearGradient>
                                </Pressable>
                                <Pressable
                                    disabled={loading}
                                    onPress={() => go('methods', { email, intent: authMode })}
                                >
                                    <Text style={styles.switchModeFooterText}>{t.changeEmail}</Text>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                {authMode === 'register' ? (
                                    <>
                                        {renderField(t.firstName, firstName, setFirstName, { focusId: 1, placeholder: t.firstName, autoFocus: true })}
                                        {renderField(t.email, email, setEmail, { focusId: 2, keyboard: 'email-address', placeholder: 'name@example.com' })}
                                        {renderField(t.password, password, setPassword, { focusId: 3, secure: true, placeholder: '********' })}
                                        {renderField(t.confirm, passwordConfirmation, setPasswordConfirmation, { focusId: 4, secure: true, placeholder: '********' })}
                                    </>
                                ) : (
                                    <>
                                        {renderField(t.email, email, setEmail, { focusId: 2, keyboard: 'email-address', placeholder: 'name@example.com', autoFocus: true })}
                                        {renderField(t.optionalPassword, password, setPassword, { focusId: 3, secure: true, placeholder: '********' })}
                                    </>
                                )}
                                {message ? (
                                    <Text style={[styles.messageText, messageType === 'success' && styles.successMessageText]}>{message}</Text>
                                ) : null}
                                <Pressable disabled={loading} onPress={() => handleSubmit(authMode === 'register' ? 'register' : 'otp')} style={styles.editProfileButton}>
                                    <LinearGradient colors={['#00E5FF', '#0284C7']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.editProfileGradient}>
                                        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.editProfileButtonText}>{authMode === 'register' ? t.registerSubmit : t.submit}</Text>}
                                    </LinearGradient>
                                </Pressable>
                                {authMode === 'login' ? (
                                    <>
                                        <Pressable disabled={loading} onPress={() => handleSubmit('password')} style={styles.secondaryButton}>
                                            <Text style={styles.secondaryButtonText}>{t.login}</Text>
                                        </Pressable>
                                        <Pressable disabled={loading} onPress={() => setAuthMode('register')}>
                                            <Text style={styles.switchModeFooterText}>{t.switchToRegister}</Text>
                                        </Pressable>
                                    </>
                                ) : (
                                    <Pressable disabled={loading} onPress={() => setAuthMode('login')}>
                                        <Text style={styles.switchModeFooterText}>{t.switchToLogin}</Text>
                                    </Pressable>
                                )}
                                <View style={styles.dividerRow}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.hint}>{t.or}</Text>
                                    <View style={styles.dividerLine} />
                                </View>
                                <Text style={styles.hint}>{t.oauthHint}</Text>
                                <View style={styles.providerGrid}>
                                    {OAUTH_PROVIDERS.filter((provider) => provider.id !== 'telegram' || Platform.OS === 'web').map((provider) => (
                                        provider.id === 'telegram' && Platform.OS === 'web' ? (
                                            <View key={provider.id} style={styles.providerButton}>
                                                <TelegramLoginWidget
                                                    apiUrl={url}
                                                    onSuccess={applySession}
                                                    onError={(error) => {
                                                        setMessageType('error')
                                                        setMessage(error)
                                                    }}
                                                />
                                            </View>
                                        ) : (
                                        <Pressable
                                            key={provider.id}
                                            disabled={loading}
                                            onPress={() => openProvider(provider.id)}
                                            style={styles.providerButton}
                                            accessibilityLabel={provider.label}
                                        >
                                            <OAuthBrandIcon id={provider.id} />
                                            <Text style={styles.providerButtonText}>{provider.label}</Text>
                                        </Pressable>
                                        )
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

export default AuthPage

const styles = StyleSheet.create({
    container: { flex: 1, width: '100%' },
    scrollContent: {
        padding: 16,
        alignItems: 'center',
        paddingBottom: 100,
        justifyContent: 'center',
        flexGrow: 1,
    },
    scrollContentDesktop: { justifyContent: 'center', minHeight: '100%' },
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
    inputBoxActive: { borderColor: '#00E5FF', backgroundColor: '#F0FDFA' },
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
    cardContainerDesktop: { maxWidth: 520, padding: 28 },
    headerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
    },
    logoCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    formWrapper: { width: '100%', gap: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
    hint: { fontSize: 12, color: '#64748B', textAlign: 'center' },
    providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    providerButton: {
        minWidth: 130,
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    providerButtonText: { color: '#1E293B', fontWeight: '600' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    secondaryButton: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
    },
    secondaryButtonText: { color: '#0369A1', fontWeight: '700' },
    inputBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginBottom: 4,
    },
    inputLabel: { fontSize: 10, color: '#64748B', fontWeight: '600', marginBottom: 2 },
    textInput: { fontSize: 14, fontWeight: '600', color: '#0F172A', paddingVertical: 6 },
    switchModeFooterText: { fontSize: 13, fontWeight: '600', color: '#0284C7', textAlign: 'center', paddingVertical: 8 },
    messageText: { color: '#B91C1C', fontSize: 13, textAlign: 'center' },
    successMessageText: { color: '#15803D' },
    editProfileButton: { borderRadius: 24, overflow: 'hidden', width: '100%', padding: 3 },
    editProfileGradient: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    editProfileButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
})
