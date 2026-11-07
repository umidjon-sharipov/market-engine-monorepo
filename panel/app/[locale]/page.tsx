'use client'
import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useTokenStore } from '@/app/_store/useTokenStore'
import GlassModal from '@/components/admin/GlassModal'
import GlassInput from '@/components/admin/GlassInput'
import GlassButton from '@/components/admin/GlassButton'
import GlassCard from '@/components/admin/GlassCard'
import { useThemeStore } from '@/app/_store/useThemeStore'
import Map from '@/app/_components/Map'
import { useNotification } from '@/components/Notification'
import { API_URL } from '@/lib/api'
import AccountSwitcher from '@/components/AccountSwitcher'
import { refreshToken } from '../_components/refresh'
import { Edit2, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useDesignStore } from '@/app/_store/useDesignStore'

interface Market {
    id: string
    title: string
    lat: number
    lng: number
    logo: string
}

interface Worker {
    id: string
    title: string
    logo: string
    role: string
    market: Market
}

export default function ProfilePage() {
    const notify = useNotification()
    const dark = useThemeStore(state => state.theme) === 'dark'
    const accent = useDesignStore(state => state.accentColor)
    const router = useRouter()
    const params = useParams()
    const locale = params.locale || 'uz'
    const copy = locale === 'ru'
        ? { title: 'Панель управления', subtitle: 'Все ваши магазины и команда — в одном рабочем пространстве.', markets: 'Мои магазины', addMarket: 'Добавить магазин', emptyMarkets: 'Пока нет магазинов.' }
        : locale === 'en'
            ? { title: 'Your workspace', subtitle: 'Manage your stores and team from one focused workspace.', markets: 'Your markets', addMarket: 'Add market', emptyMarkets: 'No markets yet.' }
            : { title: 'Boshqaruv markazi', subtitle: 'Barcha marketlaringiz va jamoangiz — yagona ish maydonida.', markets: 'Mening marketlarim', addMarket: 'Market qo‘shish', emptyMarkets: 'Hozircha marketlar mavjud emas.' }

    const accounts = useTokenStore(state => state.accounts)
    const activeEmail = useTokenStore(state => state.activeEmail)
    const { switchAccount, removeAccount, getActiveToken } = useTokenStore(state => state)

    const token = getActiveToken()

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [image, setImage] = useState('https://i.ibb.co/nNZrjBSD/user.png')
    const [hasPassword, setHasPassword] = useState(false)

    const [workers, setWorkers] = useState<Worker[]>([])
    const [markets, setMarkets] = useState<Market[]>([])

    const [marketAdd, setMarketAdd] = useState(false)
    const [deleteAkkModalOpen, setDeleteAkkModalOpen] = useState(false)
    const [imageUploadModal, setImageUploadModal] = useState(false)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [passwordSaving, setPasswordSaving] = useState(false)

    const [openMap, setOpenMap] = useState(false)
    const [mapLat, setMapLat] = useState(0)
    const [mapLng, setMapLng] = useState(0)

    const [selectedMarket, setSelectedMarket] = useState('')
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    const [editId, setEditId] = useState<string | null>(null)
    const [deleteAccountText, setDeleteAccountText] = useState('')

    const renderProfile = async (currentToken: string) => {
        try {
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });

            if (!res.ok) {
                notify.show("Sessiya eskirgan, qaytadan kiring!", "error", dark ? 'dark' : 'light')
                // router.push(`/${locale}/auth`)
                refreshToken()
            }

            const req = await res.json();
            setFirstName(req.firstName || 'Foydalanuvchi');
            setLastName(req.lastName || '');
            setEmail(req.email);
            setImage(req.image || 'https://i.ibb.co/nNZrjBSD/user.png');
            setHasPassword(Boolean(req.hasPassword));
        } catch (err) {
            console.error("Profilni yuklash xatosi:", err);
        }
    }

    const handleSetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (newPassword.length < 8) {
            notify.show('Parol kamida 8 ta belgidan iborat bo‘lishi kerak.', 'error', dark ? 'dark' : 'light')
            return
        }
        if (newPassword !== passwordConfirmation) {
            notify.show('Parollar mos kelmadi.', 'error', dark ? 'dark' : 'light')
            return
        }
        if (!token) {
            notify.show('Sessiya topilmadi. Qaytadan kiring.', 'error', dark ? 'dark' : 'light')
            return
        }

        setPasswordSaving(true)
        try {
            const response = await fetch(`${API_URL}/auth/password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ password: newPassword }),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.message || 'Parolni saqlab bo‘lmadi.')
            setHasPassword(true)
            setNewPassword('')
            setPasswordConfirmation('')
            setPasswordModalOpen(false)
            notify.show(data.message || 'Parol saqlandi.', 'success', dark ? 'dark' : 'light')
        } catch (error) {
            notify.show(error instanceof Error ? error.message : 'Server xatosi.', 'error', dark ? 'dark' : 'light')
        } finally {
            setPasswordSaving(false)
        }
    }

    const getWorkers = async (currentToken: string) => {
        try {
            const res = await fetch(`${API_URL}/workers/get`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            })
            const req = await res.json()
            if (res.ok) {
                console.log(req)
                setWorkers(req)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleGetMarkets = async (currentToken: string) => {
        try {
            const response = await fetch(`${API_URL}/markets/get`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            const data = await response.json();
            if (response.ok) {
                setMarkets(data)
            }
        } catch (error) {
            console.error('Marketlarni olishda xatolik:', error);
        }
    }

    useEffect(() => {
        if (!token) {
            router.push(`/${locale}/auth`)
        } else {
            queueMicrotask(() => {
                renderProfile(token)
                handleGetMarkets(token)
                getWorkers(token)
            })
        }
    }, [token, locale])

    const handleUpdateImage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        try {
            const res = await fetch(`${API_URL}/auth/image`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })
            const data = await res.json()
            if (res.ok) {
                setImage(data.image || image)
                notify.show("Profil rasmi muvaffaqiyatli yangilandi!", "success", dark ? 'dark' : 'light')
                setImageUploadModal(false)
            } else {
                notify.show(data.message || "Xatolik yuz berdi", "error", dark ? 'dark' : 'light')
            }
        } catch (err) {
            notify.show("Server bilan aloqada xatolik", "error", dark ? 'dark' : 'light')
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteAccountText !== 'DELETE') {
            notify.show("Xatolik: 'DELETE' so'zini kiriting", "error", dark ? 'dark' : 'light')
            return
        }

        try {
            const response = await fetch(`${API_URL}/auth/account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setDeleteAccountText('')
                setDeleteAkkModalOpen(false)
                removeAccount(email)
                notify.show("Akkaunt muvaffaqiyatli o'chirildi", "success", dark ? 'dark' : 'light')

                const remainingAccounts = useTokenStore.getState().accounts;
                if (remainingAccounts.length > 0) {
                    router.push(`/${locale}`);
                } else {
                    router.push(`/${locale}/auth`);
                }
            } else {
                notify.show("O'chirishda xatolik yuz berdi", "error", dark ? 'dark' : 'light')
            }
        } catch (error) {
            notify.show("Xatolik yuz berdi", "error", dark ? 'dark' : 'light')
        }
    };

    const handleMarket = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget);
        formData.append('lat', mapLat.toString());
        formData.append('lng', mapLng.toString());
        const title = formData.get('title');
        const logo = formData.get('logo');

        if (!title) {
            notify.show("Market nomini kiriting", "error", dark ? 'dark' : 'light')
            return
        }
        if (!logo || (logo instanceof File && logo.size === 0)) {
            notify.show("Market logosini kiriting", "error", dark ? 'dark' : 'light');
            return;
        }
        if (mapLat === 0 || mapLng === 0) {
            notify.show("Market koordinatasini xaritadan belgilang", "error", dark ? 'dark' : 'light')
            return
        }
        const currentEditId = editId;
        setMarketAdd(false)
        setEditId(null)
        setMapLat(0)
        setMapLng(0)

        try {
            const method = currentEditId ? 'PATCH' : 'POST';
            const response = await fetch(`${API_URL}/markets${currentEditId ? `/${currentEditId}` : ''}`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                notify.show(`Market muvaffaqiyatli ${currentEditId ? 'tahrirlandi' : 'yaratildi'}!`, "success", dark ? 'dark' : 'light')
                if (token) handleGetMarkets(token);
            } else {
                notify.show(`Market ${currentEditId ? 'yangilashda' : 'yaratishda'} xatolik`, "error", dark ? 'dark' : 'light')
            }
        } catch (error) {
            notify.show("Server bilan aloqada xatolik", "error", dark ? 'dark' : 'light')
        }
    };

    const handleDeleteMarket = async (marketId: string) => {
        try {
            const response = await fetch(`${API_URL}/markets/${marketId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                notify.show("Market muvaffaqiyatli o'chirildi!", "success", dark ? 'dark' : 'light')
                if (token) handleGetMarkets(token);
            } else {
                notify.show("O'chirishda xatolik", "error", dark ? 'dark' : 'light')
            }
        } catch (error) {
            notify.show("Xatolik yuz berdi", "error", dark ? 'dark' : 'light')
        }
    };

    const handleMarketClick = (marketId: string) => {
        router.push(`/${locale}/${encodeURIComponent(marketId)}/dashboard`)
    }

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 pb-16">
            <motion.header
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-[28px] border p-5 sm:p-7"
                style={{
                    borderColor: `${accent}30`,
                    background: dark
                        ? `radial-gradient(ellipse at 92% 10%, ${accent}20, transparent 45%), rgba(15,23,42,.66)`
                        : `radial-gradient(ellipse at 92% 10%, ${accent}15, transparent 45%), rgba(255,255,255,.72)`,
                }}
            >
                <div className="flex items-center gap-4">
                    <AccountSwitcher />
                </div>
                <div className="mt-7 max-w-2xl">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: accent }}>MARKET ENGINE / WORKSPACE</span>
                    <h1 className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${dark ? 'text-white' : 'text-slate-950'}`}>{copy.title}</h1>
                    <p className={`mt-2 max-w-xl text-sm leading-6 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{copy.subtitle}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${dark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-600'}`}>
                            {markets.length} {copy.markets.toLocaleLowerCase()}
                        </span>
                        <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${dark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white/70 text-slate-600'}`}>
                            {accounts.length} {locale === 'en' ? 'accounts' : locale === 'ru' ? 'аккаунта' : 'akkaunt'}
                        </span>
                    </div>
                </div>
            </motion.header>

            { accounts.length > 1 && (
                <div className={ `p-4 rounded-2xl ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} border backdrop-blur-md flex items-center justify-between gap-4 overflow-x-auto` }>
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Akkauntlar:</span>
                    <div className="flex items-center gap-2">
                        { accounts.map((acc) => (
                            <button
                                key={ acc.email }
                                onClick={ () => switchAccount(acc.email) }
                                className={ `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${acc.email === activeEmail
                                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                                    : 'bg-white/5 hover:bg-white/10 opacity-70 hover:opacity-100'
                                    }` }
                            >
                                <span className="w-5 h-5 rounded-full overflow-hidden relative inline-block">
                                    <Image src={ acc.image || 'https://i.ibb.co/nNZrjBSD/user.png' } alt="user" fill className="object-cover" />
                                </span>
                                { acc.userName || acc.email }
                            </button>
                        )) }
                    </div>
                </div>
            ) }

            <div className={ `p-8 rounded-[32px] ${dark ? 'bg-[#121214]/40 border-white/10' : 'bg-white/10 border-white/20'} backdrop-blur-3xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-center justify-between gap-6` }>
                <div className="flex items-center gap-5">
                    <div
                        onClick={ () => setImageUploadModal(true) }
                        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-sky-500/50 shadow-lg cursor-pointer group"
                    >
                        <Image src={ image } alt="Profile" fill className="object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium">
                            O&apos;zgartirish
                        </div>
                    </div>
                    <div>
                        <h2 className={ `text-xl font-bold ${dark ? 'text-white' : 'text-neutral-900'}` }>{ firstName } { lastName }</h2>
                        <p className={ `text-sm ${dark ? 'text-neutral-400' : 'text-neutral-500'}` }>{ email }</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <button
                        onClick={() => setPasswordModalOpen(true)}
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm ${dark ? 'text-neutral-300' : 'text-neutral-700'} bg-neutral-500/10 hover:bg-neutral-500/20 transition-all`}
                    >
                        {hasPassword ? 'Parolni o‘zgartirish' : 'Parol o‘rnatish'}
                    </button>
                    <button
                        onClick={ () => router.push(`/${locale}/auth`) }
                        className={ `px-4 py-2.5 rounded-xl font-medium text-sm bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all` }
                    >
                        + Akkaunt qo&apos;shish
                    </button>
                    <button
                        onClick={ () => {
                            removeAccount(email)
                            const remaining = useTokenStore.getState().accounts;
                            if (remaining.length > 0) {
                                router.push(`/${locale}`);
                            } else {
                                router.push(`/${locale}/auth`);
                            }
                        } }
                        className={ `px-4 py-2.5 rounded-xl font-medium ${dark ? 'text-neutral-300' : 'text-neutral-700'} text-sm bg-neutral-500/10 hover:bg-neutral-500/20 transition-all` }
                    >
                        Chiqish (Logout)
                    </button>
                    <button
                        onClick={ () => setDeleteAkkModalOpen(true) }
                        className={ `px-4 py-2.5 rounded-xl font-medium text-sm ${dark ? 'text-red-400' : 'text-red-600'} bg-red-500/10 hover:bg-red-500/20 transition-all` }
                    >
                        Akkauntni o&apos;chirish
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className={ `text-lg ${dark ? 'text-white' : 'text-neutral-900'} font-bold tracking-wide` }>
                        {copy.markets}
                    </h3>
                    <GlassButton onClick={ () => { setMapLat(0); setMapLng(0); setMarketAdd(true); } }>
                        + {copy.addMarket}
                    </GlassButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    { markets.map((market, index) => (
                        <motion.div
                            key={market.id}
                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.42, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
                        >
                        <GlassCard hover={ true } className='!p-4 flex flex-col gap-3 group' key={ market.id }>
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden">
                                <Image src={ market.logo } alt={ market.title } fill className="object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <h1 className={ `font-bold text-base ${dark ? 'text-white' : 'text-neutral-900'}` }>{ market.title }</h1>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={ () => handleMarketClick(market.id) }
                                        className="px-3 py-1.5 rounded-xl text-xs bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all"
                                    >
                                        Boshqarish
                                    </button>
                                    <button
                                        onClick={ () => setEditId(market.id) }
                                        className={ `p-2 rounded-xl ${dark ? 'bg-white/5 text-neutral-300' : 'bg-black/5 text-neutral-600'} hover:bg-sky-500/20 hover:text-sky-500 transition-all` }
                                    >
                                        <Edit2 size={ 16 } />
                                    </button>
                                    <button
                                        onClick={ (e) => { e.stopPropagation(); setSelectedMarket(market.id); setIsDeleteModalOpen(true); } }
                                        className={ `p-2 rounded-xl ${dark ? 'bg-white/5 text-neutral-300' : 'bg-black/5 text-neutral-600'} hover:bg-red-500/20 hover:text-red-500 transition-all` }
                                    >
                                        <Trash2 size={ 16 } />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                        </motion.div>
                    )) }
                    { markets.length === 0 && (
                        <p className="text-sm opacity-50 col-span-2 text-center py-6">{copy.emptyMarkets}</p>
                    ) }
                </div>

                <div className="flex items-center justify-between pt-6">
                    <h3 className={ `text-lg ${dark ? 'text-white' : 'text-neutral-900'} font-bold tracking-wide uppercase` }>
                        Mening ishlarim
                    </h3>
                    <GlassButton onClick={ () => router.push(`/${locale}/vacancy/vacancy`) }>
                        + Ishlar qo&apos;shish
                    </GlassButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    { workers.map((worker, index) => (
                        <motion.div
                            key={worker.id}
                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.42, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
                        >
                        <GlassCard hover={ true } className='!p-4 flex flex-col gap-3 group' key={ worker.id }>
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden">
                                <Image src={ worker.market.logo } alt={ worker.market.title } fill className="object-cover group-hover:scale-105 transition-transform" />
                                <div className='absolute top-2 right-2 px-3 py-1 rounded-full text-xs bg-black/40 backdrop-blur-md text-white font-medium'>
                                    { worker.role }
                                </div>
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <h1 className={ `font-bold text-base ${dark ? 'text-white' : 'text-neutral-900'}` }>
                                    { worker.market.title }
                                </h1>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={ () => handleMarketClick(worker.market.id) }
                                        className="px-3 py-1.5 rounded-xl text-xs bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all"
                                    >
                                        Boshqarish
                                    </button>
                                    <button
                                        onClick={ (e) => { e.stopPropagation(); setSelectedMarket(worker.market.id); setIsDeleteModalOpen(true); } }
                                        className={ `p-2 rounded-xl ${dark ? 'bg-white/5 text-neutral-300' : 'bg-black/5 text-neutral-600'} hover:bg-red-500/20 hover:text-red-500 transition-all` }
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                        </motion.div>
                    )) }
                    { workers.length === 0 && (
                        <p className="text-sm opacity-50 col-span-2 text-center py-6">Hozircha ishlar mavjud emas.</p>
                    ) }
                </div>
            </div>

            <GlassModal title="Profil rasmini o'zgartirish" onClose={ () => setImageUploadModal(false) } open={ imageUploadModal }>
                <form onSubmit={ handleUpdateImage } className="space-y-4">
                    <p className="text-zinc-400 text-sm">Yangi profil rasmini tanlang:</p>
                    <GlassInput name='image' type='file' required />
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={ () => setImageUploadModal(false) } className="px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-white/5">Cancel</button>
                        <GlassButton type="submit">Yuklash</GlassButton>
                    </div>
                </form>
            </GlassModal>

            <GlassModal
                title={hasPassword ? 'Parolni o‘zgartirish' : 'Parol o‘rnatish'}
                onClose={() => {
                    setPasswordModalOpen(false)
                    setNewPassword('')
                    setPasswordConfirmation('')
                }}
                open={passwordModalOpen}
            >
                <form onSubmit={handleSetPassword} className="space-y-4">
                    <p className="text-sm text-neutral-400">
                        Parol kamida 8 ta belgidan iborat bo‘lishi kerak.
                    </p>
                    <GlassInput
                        type="password"
                        label="Yangi parol"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        required
                    />
                    <GlassInput
                        type="password"
                        label="Parolni tasdiqlang"
                        value={passwordConfirmation}
                        onChange={(event) => setPasswordConfirmation(event.target.value)}
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        required
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setPasswordModalOpen(false)}
                            className="px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-white/5"
                        >
                            Bekor qilish
                        </button>
                        <GlassButton type="submit" disabled={passwordSaving}>
                            {passwordSaving ? 'Saqlanmoqda…' : 'Saqlash'}
                        </GlassButton>
                    </div>
                </form>
            </GlassModal>

            <GlassModal title={ editId ? "Marketni tahrirlash" : "Market ochish" } onClose={ () => { setMarketAdd(false); setEditId(null); setMapLat(0); setMapLng(0); } } open={ marketAdd || editId !== null }>
                <form onSubmit={ handleMarket } className="space-y-4">
                    <p className="text-zinc-400 text-sm">Yangi market ochish uchun nomini kiriting, rasmini yuklang va xaritadan koordinatasini belgilang.</p>

                    <div className="flex flex-col w-full gap-4">
                        <GlassInput
                            name='title'
                            type='text'
                            defaultValue={ editId ? markets.find(m => m.id === editId)?.title : '' }
                            maxLength={ 26 }
                            placeholder="Market nomini yozing"
                            required
                        />

                        <div className="flex flex-col gap-3">
                            { editId && markets.find(m => m.id === editId)?.logo && (
                                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                    <img
                                        src={ markets.find(m => m.id === editId)?.logo }
                                        alt="Market logo"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) }

                            { editId ? (
                                <input
                                    type="hidden"
                                    name="logo"
                                    value={ markets.find(m => m.id === editId)?.logo || '' }
                                />
                            ) : null }

                            <GlassInput name='logo' type='file' required={ !editId } />
                        </div>
                    </div>

                    <GlassButton type='button' className='w-full' onClick={ () => { setOpenMap(true), editId ? (setMapLat(markets.find(m => m.id === editId)?.lat || 0), setMapLng(markets.find(m => m.id === editId)?.lng || 0)) : null } }>
                        { mapLat !== 0 ? "Koordinata belgilandi ✓" : "Xaritadan belgilash" }
                    </GlassButton>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button onClick={ () => { setMarketAdd(false), setEditId(null) } } type="button" className="px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-white/5">Cancel</button>
                        <GlassButton type="submit">{ editId ? "Update" : "Create" }</GlassButton>
                    </div>
                </form>
            </GlassModal>

            <GlassModal size='full' open={ openMap } onClose={ () => setOpenMap(false) } title='Xaritadan belgilang'>
                <Map
                    isDarkMode={ dark }
                    onLocationSelect={ (lat = mapLat, lng = mapLng) => {
                        setMapLat(lat)
                        setMapLng(lng)
                    } }
                />
                <GlassButton
                    onClick={ () => setOpenMap(false) }
                    className={ `w-full mt-4 ${mapLng === 0 || mapLat === 0 ? '!bg-gray-200 !text-gray-400 cursor-not-allowed' : ''}` }
                    disabled={ mapLng === 0 || mapLat === 0 }
                >
                    Tanlandi
                </GlassButton>
            </GlassModal>

            <GlassModal title="Akkauntni o'chirish" onClose={ () => { setDeleteAkkModalOpen(false), setDeleteAccountText('') } } open={ deleteAkkModalOpen }>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Haqiqatan ham akkauntingizni o&apos;chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo&apos;lmaydi.</p>
                    <GlassInput
                        placeholder='DELETE'
                        value={ deleteAccountText }
                        onChange={ e => setDeleteAccountText(e.target.value.toUpperCase()) }
                    />
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button onClick={ () => { setDeleteAkkModalOpen(false), setDeleteAccountText('') } } className="px-4 py-2.5 rounded-xl text-sm hover:bg-white/5">Cancel</button>
                        <button
                            onClick={ handleDeleteAccount }
                            disabled={ deleteAccountText !== 'DELETE' }
                            className={ `px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all ${deleteAccountText === 'DELETE'
                                ? 'bg-red-600/90 hover:bg-red-500 shadow-lg shadow-red-500/20 cursor-pointer'
                                : 'bg-red-600/30 shadow-lg shadow-red-300/20 cursor-not-allowed'
                                }` }
                        >
                            O&apos;chirish
                        </button>
                    </div>
                </div>
            </GlassModal>

            <GlassModal title="Marketni o'chirish" onClose={ () => setIsDeleteModalOpen(false) } open={ isDeleteModalOpen }>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Haqiqatan ham bu marketni o&apos;chirib yubormoqchimisiz?</p>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button onClick={ () => setIsDeleteModalOpen(false) } className="px-4 py-2.5 rounded-xl text-sm hover:bg-white/5">Cancel</button>
                        <button onClick={ () => { handleDeleteMarket(selectedMarket); setIsDeleteModalOpen(false); } } className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20">O&apos;chirish</button>
                    </div>
                </div>
            </GlassModal>
        </div>
    )
}