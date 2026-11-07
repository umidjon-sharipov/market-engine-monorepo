'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useTokenStore } from '@/app/_store/useTokenStore'
import { useNotification } from '@/components/Notification'
import { useThemeStore } from '@/app/_store/useThemeStore'
import GlassInput from '@/components/admin/GlassInput'
import GlassModal from '@/components/admin/GlassModal'
import { OAuthProviderIcon } from '@/components/OAuthProviderIcon'
import { API_URL } from '@/lib/api'
import { TelegramLoginWidget } from '@/components/TelegramLoginWidget'

type Step = 'methods' | 'otp' | 'oauth-callback'
type AuthMode = 'login' | 'register'
type AuthSession = {
    user: { email: string; userName?: string; image?: string }
    accessToken: string
    refreshToken: string
}

function isAuthSession(value: unknown): value is AuthSession {
    if (typeof value !== 'object' || value === null || !('user' in value)) return false
    const user = value.user
    return typeof user === 'object'
        && user !== null
        && 'email' in user
        && typeof user.email === 'string'
        && 'accessToken' in value
        && typeof value.accessToken === 'string'
        && 'refreshToken' in value
        && typeof value.refreshToken === 'string'
}

const PROVIDERS = [
    { id: 'google', label: 'Google' },
    { id: 'github', label: 'GitHub' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'telegram', label: 'Telegram' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'microsoft', label: 'Microsoft' },
    { id: 'notion', label: 'Notion' },
    { id: 'apple', label: 'Apple' },
    { id: 'atlassian', label: 'Atlassian' },
] as const

export default function AuthPage() {
    const notify = useNotification()
    const dark = useThemeStore((state) => state.theme) === 'dark'
    const addOrUpdateAccount = useTokenStore((state) => state.addOrUpdateAccount)
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const startedOAuthCode = useRef<string | null>(null)
    const locale = String(params.locale || 'uz')
    const [authMode, setAuthMode] = useState<AuthMode>(
        searchParams.get('intent') === 'register' ? 'register' : 'login',
    )
    const [firstName, setFirstName] = useState('')
    const step: Step = searchParams.get('step') === 'otp' || searchParams.get('step') === 'oauth-callback'
        ? (searchParams.get('step') as Step)
        : 'methods'

    const [email, setEmail] = useState(searchParams.get('email') || '')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [codeArr, setCodeArr] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const go = (next: Step, extra?: Record<string, string>) => {
        const query = new URLSearchParams({ step: next, ...extra })
        router.push(`/${locale}/auth?${query.toString()}`)
    }

    const applySession = (data: unknown) => {
        if (!isAuthSession(data)) {
            notify.show('Token kelmadi', 'error', dark ? 'dark' : 'light')
            return
        }
        addOrUpdateAccount({
            email: data.user.email,
            userName: data.user.userName || '',
            image: data.user.image || '',
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
        })
        router.push(`/${locale}`)
        notify.show('Xush kelibsiz!', 'success', dark ? 'dark' : 'light')
    }

    useEffect(() => {
        const error = searchParams.get('error')
        if (error) notify.show(error, 'error', dark ? 'dark' : 'light')
    }, [dark, notify, searchParams])

    useEffect(() => {
        const code = searchParams.get('code')
        if (window.location.hash === '#_=_') {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
        }
        if (step !== 'oauth-callback' || !code || startedOAuthCode.current === code) return
        startedOAuthCode.current = code
        setLoading(true)
        fetch(`${API_URL}/auth/oauth/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || 'OAuth xatosi')
                applySession(data)
            })
            .catch((error: unknown) => {
                notify.show(error instanceof Error ? error.message : 'OAuth xatosi', 'error', dark ? 'dark' : 'light')
                go('methods')
            })
            .finally(() => setLoading(false))
    }, [step, searchParams])

    const handleCodeChange = (value: string, index: number) => {
        if (/^[0-9]?$/.test(value)) {
            const next = [...codeArr]
            next[index] = value
            setCodeArr(next)
            if (value && index < 5) inputRefs.current[index + 1]?.focus()
        }
    }

    const handleSubmit = async (mode: 'otp' | 'register' | 'password' | 'verify') => {
        const normalizedEmail = email.trim().toLowerCase()
        if (mode !== 'verify' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            notify.show('Email ni kiriting!', 'error', dark ? 'dark' : 'light')
            return
        }
        if ((mode === 'password' || mode === 'register') && password.length < 8) {
            notify.show('Parol kamida 8 belgi.', 'error', dark ? 'dark' : 'light')
            return
        }
        if (mode === 'register' && firstName.trim().length < 2) {
            notify.show('Ism kamida 2 ta belgidan iborat bo‘lishi kerak.', 'error', dark ? 'dark' : 'light')
            return
        }
        if (mode === 'register' && password !== passwordConfirmation) {
            notify.show('Parollar mos kelmadi.', 'error', dark ? 'dark' : 'light')
            return
        }
        const fullCode = codeArr.join('')
        if (mode === 'verify' && fullCode.length !== 6) {
            notify.show("6 xonali kodni to'liq kiriting!", 'error', dark ? 'dark' : 'light')
            return
        }

        setLoading(true)
        try {
            if (mode === 'password') {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: normalizedEmail, password }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || 'Kirish xato')
                applySession(data)
                return
            }
            if (mode === 'otp') {
                const res = await fetch(`${API_URL}/auth/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: normalizedEmail,
                        intent: 'login',
                    }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || 'OTP yuborilmadi')
                notify.show(data.message || 'Kod yuborildi', 'success', dark ? 'dark' : 'light')
                go('otp', { email: normalizedEmail, intent: 'login' })
                return
            }
            if (mode === 'register') {
                const res = await fetch(`${API_URL}/auth/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: normalizedEmail,
                        firstName: firstName.trim(),
                        password,
                        intent: 'register',
                    }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || 'OTP yuborilmadi')
                notify.show(data.message || 'Kod yuborildi', 'success', dark ? 'dark' : 'light')
                setAuthMode('register')
                go('otp', { email: normalizedEmail, intent: 'register' })
                return
            }
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail, code: fullCode }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Kod xato')
            applySession(data)
        } catch (error) {
            notify.show(error instanceof Error ? error.message : 'Server xatosi', 'error', dark ? 'dark' : 'light')
        } finally {
            setLoading(false)
        }
    }

    return (
        <GlassModal open={true} title={step === 'otp' ? 'Kodni tasdiqlash' : authMode === 'register' ? 'Ro‘yxatdan o‘tish' : 'Kirish'} onClose={() => router.back()} size="3xl">
            {step === 'oauth-callback' ? (
                <p className="text-sm opacity-70">OAuth orqali kiritilmoqda…</p>
            ) : step === 'otp' ? (
                <form onSubmit={(e) => { e.preventDefault(); void handleSubmit('verify') }} className="space-y-6">
                    <p className="text-sm opacity-80 text-center">
                        <span className="text-sky-400 font-semibold">{email}</span> manziliga yuborilgan kod
                    </p>
                    <div className="flex justify-center gap-2 sm:gap-3">
                        {codeArr.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el }}
                                type="text"
                                inputMode="numeric"
                                autoFocus={index === 0}
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleCodeChange(e.target.value, index)}
                                disabled={loading}
                                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-white/5 border border-white/10 rounded-2xl focus:border-sky-500 focus:outline-none text-white"
                            />
                        ))}
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setAuthMode(searchParams.get('intent') === 'register' ? 'register' : 'login')
                                go('methods', { email })
                            }}
                            className="px-4 py-2.5 rounded-xl text-sm hover:bg-white/5"
                        >
                            Orqaga
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white disabled:opacity-50">Tasdiqlash</button>
                    </div>
                </form>
            ) : (
                <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(authMode === 'register' ? 'register' : 'otp') }} className="space-y-5">
                    {authMode === 'register' ? (
                        <GlassInput
                            autoFocus
                            type="text"
                            label="Ism"
                            placeholder="Ismingiz"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={loading}
                            required
                        />
                    ) : null}
                    <GlassInput
                        autoFocus={authMode === 'login'}
                        type="email"
                        label="Email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                    <GlassInput
                        type="password"
                        label={authMode === 'register' ? 'Parol (kamida 8 belgi)' : 'Doimiy parol'}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required={authMode === 'register'}
                    />
                    {authMode === 'register' ? (
                        <GlassInput
                            type="password"
                            label="Parolni tasdiqlang"
                            placeholder="********"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            disabled={loading}
                            required
                        />
                    ) : null}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                            {authMode === 'register' ? 'Ro‘yxatdan o‘tish va kod olish' : 'Email orqali kod olish'}
                        </button>
                        {authMode === 'login' ? (
                            <button type="button" disabled={loading} onClick={() => void handleSubmit('password')} className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium">
                                Parol bilan kirish
                            </button>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                        className="block w-full text-center text-sm text-sky-400 hover:text-sky-300"
                    >
                        {authMode === 'login' ? 'Akkaunt yo‘qmi? Ro‘yxatdan o‘tish' : 'Akkauntingiz bormi? Kirish'}
                    </button>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-wider opacity-50">
                        <span className="h-px flex-1 bg-white/10" />
                        yoki
                        <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <p className="text-sm text-center opacity-70">Boshqa platforma orqali</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {PROVIDERS.map((provider) => (
                            provider.id === 'telegram' ? (
                                <div key={provider.id} className="flex min-w-32 items-center justify-center rounded-xl border border-sky-400/10 px-4 py-2">
                                    <TelegramLoginWidget
                                        apiUrl={API_URL}
                                        onSuccess={applySession}
                                        onError={(message) => notify.show(message, 'error', dark ? 'dark' : 'light')}
                                    />
                                </div>
                            ) : (
                            <a
                                key={provider.id}
                                href={`${API_URL}/auth/oauth/${provider.id}?platform=panel&locale=${locale}`}
                                aria-label={`Continue with ${provider.label}`}
                                className="flex min-w-32 items-center justify-center gap-2 rounded-xl border border-sky-400/10 px-4 py-3 text-sm font-medium text-snow shadow-lg shadow-black/20 transition-transform hover:scale-[1.02]"
                            >
                                <OAuthProviderIcon id={provider.id} />
                                <span>{provider.label}</span>
                            </a>
                            )
                        ))}
                    </div>
                </form>
            )}
        </GlassModal>
    )
}
