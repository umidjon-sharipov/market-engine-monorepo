'use client'
import React, { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTokenStore } from '@/app/_store/useTokenStore'
import { useNotification } from '@/components/Notification'
import { useThemeStore } from '@/app/_store/useThemeStore'
import GlassInput from '@/components/admin/GlassInput'
import GlassModal from '@/components/admin/GlassModal'
import { API_URL } from '@/lib/api'

export default function AuthPage() {
    const notify = useNotification()
    const dark = useThemeStore(state => state.theme) === 'dark'
    const addOrUpdateAccount = useTokenStore(state => state.addOrUpdateAccount)
    
    const [email, setEmail] = useState('')
    const [codeArr, setCodeArr] = useState(['', '', '', '', '', ''])
    const [auth, setAuth] = useState<'email' | 'code'>('email')
    const [loading, setLoading] = useState(false)
    
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const router = useRouter()
    const params = useParams()
    const locale = params.locale || 'uz'

    const handleCodeChange = (value: string, index: number) => {
        if (/^[0-9]?$/.test(value)) {
            const newCodeArr = [...codeArr]
            newCodeArr[index] = value
            setCodeArr(newCodeArr)

            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus()
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !codeArr[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        if (auth === 'email') {
            if (!email) {
                notify.show("Email ni kiriting!", "error", dark ? 'dark' : 'light')
                return
            }
        } else {
            const fullCode = codeArr.join('')
            if (fullCode.length !== 6) {
                notify.show("6 xonali kodni to'liq kiriting!", "error", dark ? 'dark' : 'light')
                return
            }
        }

        const fullCode = codeArr.join('')
        const bodyData = auth === 'email' ? { email } : { email, code: fullCode };
        const postUrl = auth === 'email' ? `${API_URL}/auth/send-otp` : `${API_URL}/auth/verify-otp`;

        setLoading(true)
        try {
            const res = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });
            
            const data = await res.json();

            if (res.ok) {
                if (auth === 'email') {
                    setAuth('code');
                    notify.show(data.message || "Kod muvaffaqiyatli yuborildi!", "success", dark ? 'dark' : 'light')
                } else {
                    addOrUpdateAccount({
                        email: data.user.email,
                        userName: data.user.userName,
                        image: data.user.image,
                        accessToken: data.accessToken || data.token || alert('accesstoken kelmadi'),
                        refreshToken: data.refreshToken,
                    });

                    router.push(`/${locale}`);
                    notify.show("Xush kelibsiz, akkaunt muvaffaqiyatli qo'shildi!", "success", dark ? 'dark' : 'light')
                }
            } else {
                notify.show(data.message || "Nimadir xato ketdi!", "error", dark ? 'dark' : 'light')
            }
        } catch (error) {
            notify.show("Server bilan ulanishda xatolik yuz berdi!", "error", dark ? 'dark' : 'light')
        } finally {
            setLoading(false)
        }
    }

    return (
        <GlassModal open={true} title={auth === 'email' ? "Ro'yxatdan o'tish" : "Kodni tasdiqlash"} onClose={() => router.back()} size='3xl'>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    {auth === 'email' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium opacity-80">Email manzilingiz</label>
                            <GlassInput
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3 text-center">
                            <label className="text-sm font-medium opacity-80 block">
                                <span className="text-sky-400 font-semibold">{email}</span> manziliga yuborilgan 6 xonali kodni kiriting
                            </label>
                            
                            {/* Kartochka ko'rinishidagi OTP inputlar */}
                            <div className="flex justify-center gap-2 sm:gap-3 my-4">
                                {codeArr.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el }}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(e.target.value, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        disabled={loading}
                                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-white/5 border border-white/10 rounded-2xl focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-white shadow-inner"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={() => router.back()}
                        type="button"
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                    >
                        Bekor qilish
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && (
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                        )}
                        {auth === 'email' ? 'Kodni olish' : 'Tasdiqlash'}
                    </button>
                </div>
            </form>
        </GlassModal>
    )
}