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

interface Market {
    id: string
    title: string
    logo: string
}

interface Worker {
    id: string
    title: string
    logo: string
    role: string
}

export default function ProfilePage() {
    const notify = useNotification()
    const dark = useThemeStore(state => state.theme) === 'dark'
    const router = useRouter()
    const params = useParams()
    const locale = params.locale || 'uz'

    const accounts = useTokenStore(state => state.accounts)
    const activeEmail = useTokenStore(state => state.activeEmail)
    const { switchAccount, removeAccount, getActiveToken } = useTokenStore(state => state)
    
    const token = getActiveToken()

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [image, setImage] = useState('https://i.ibb.co/nNZrjBSD/user.png')
    
    const [workers, setWorkers] = useState<Worker[]>([])
    const [markets, setMarkets] = useState<Market[]>([])
    
    const [marketAdd, setMarketAdd] = useState(false)
    const [deleteAkkModalOpen, setDeleteAkkModalOpen] = useState(false)
    const [imageUploadModal, setImageUploadModal] = useState(false)
    
    const [openMap, setOpenMap] = useState(false)
    const [mapLat, setMapLat] = useState(0)
    const [mapLng, setMapLng] = useState(0)

    const [selectedMarket, setSelectedMarket] = useState('')
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    useEffect(() => {
        if (!marketAdd) {
            setMapLat(0)
            setMapLng(0)
        }
    }, [marketAdd])

    useEffect(() => {
        if (!token) {
            router.push(`/${locale}/auth`)
        } else {
            renderProfile(token)
            handleGetMarkets(token)
            getWorkers(token)
        }
    }, [token, locale])

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
        } catch (err) {
            console.error("Profilni yuklash xatosi:", err);
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
        try {
            const response = await fetch(`${API_URL}/auth/account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
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

    const handleCreateMarket = async (e: React.FormEvent<HTMLFormElement>) => {
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
        setMarketAdd(false)

        try {
            const response = await fetch(`${API_URL}/markets`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                notify.show("Market muvaffaqiyatli ochildi!", "success", dark ? 'dark' : 'light')
                if (token) handleGetMarkets(token);
            } else {
                notify.show("Market ochishda xatolik", "error", dark ? 'dark' : 'light')
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
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-16">
            <header className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <AccountSwitcher />
                </div>
            </header>

            {accounts.length > 1 && (
                <div className={`p-4 rounded-2xl ${dark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} border backdrop-blur-md flex items-center justify-between gap-4 overflow-x-auto`}>
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Akkauntlar:</span>
                    <div className="flex items-center gap-2">
                        {accounts.map((acc) => (
                            <button
                                key={acc.email}
                                onClick={() => switchAccount(acc.email)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                    acc.email === activeEmail 
                                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                                        : 'bg-white/5 hover:bg-white/10 opacity-70 hover:opacity-100'
                                }`}
                            >
                                <span className="w-5 h-5 rounded-full overflow-hidden relative inline-block">
                                    <Image src={acc.image || 'https://i.ibb.co/nNZrjBSD/user.png'} alt="" fill className="object-cover" />
                                </span>
                                {acc.userName || acc.email}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={`p-8 rounded-[32px] ${dark ? 'bg-[#121214]/40 border-white/10' : 'bg-white/10 border-white/20'} backdrop-blur-3xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-center justify-between gap-6`}>
                <div className="flex items-center gap-5">
                    <div 
                        onClick={() => setImageUploadModal(true)}
                        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-sky-500/50 shadow-lg cursor-pointer group"
                    >
                        <Image src={image} alt="Profile" fill className="object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium">
                            O'zgartirish
                        </div>
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-neutral-900'}`}>{firstName} {lastName}</h2>
                        <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <button
                        onClick={() => router.push(`/${locale}/auth`)}
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all`}
                    >
                        + Akkaunt qo'shish
                    </button>
                    <button
                        onClick={() => {
                            removeAccount(email)
                            const remaining = useTokenStore.getState().accounts;
                            if (remaining.length > 0) {
                                router.push(`/${locale}`);
                            } else {
                                router.push(`/${locale}/auth`);
                            }
                        }}
                        className={`px-4 py-2.5 rounded-xl font-medium ${dark ? 'text-neutral-300' : 'text-neutral-700'} text-sm bg-neutral-500/10 hover:bg-neutral-500/20 transition-all`}
                    >
                        Chiqish (Logout)
                    </button>
                    <button
                        onClick={() => setDeleteAkkModalOpen(true)}
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm ${dark ? 'text-red-400' : 'text-red-600'} bg-red-500/10 hover:bg-red-500/20 transition-all`}
                    >
                        Akkauntni o'chirish
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className={`text-lg ${dark ? 'text-white' : 'text-neutral-900'} font-bold tracking-wide uppercase`}>
                        Mening marketlarim
                    </h3>
                    <GlassButton onClick={() => setMarketAdd(true)}>
                        + Market qo'shish
                    </GlassButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {markets.map((market) => (
                        <GlassCard hover={true} className='!p-4 flex flex-col gap-3 group' key={market.id}>
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden">
                                <Image src={market.logo} alt={market.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="flex items-center justify-between w-full">
                                <h1 className={`font-bold text-base ${dark ? 'text-white' : 'text-neutral-900'}`}>{market.title}</h1>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleMarketClick(market.id)}
                                        className="px-3 py-1.5 rounded-xl text-xs bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all"
                                    >
                                        Boshqarish
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedMarket(market.id); setIsDeleteModalOpen(true); }}
                                        className={`p-2 rounded-xl ${dark ? 'bg-white/5 text-neutral-300' : 'bg-black/5 text-neutral-600'} hover:bg-red-500/20 hover:text-red-500 transition-all`}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                    {markets.length === 0 && (
                        <p className="text-sm opacity-50 col-span-2 text-center py-6">Hozircha marketlar mavjud emas.</p>
                    )}
                </div>

                <div className="flex items-center justify-between pt-6">
                    <h3 className={`text-lg ${dark ? 'text-white' : 'text-neutral-900'} font-bold tracking-wide uppercase`}>
                        Mening ishlarim
                    </h3>
                    <GlassButton onClick={() => router.push(`/${locale}/vacancy/vacancy`)}>
                        + Ishlar qo'shish
                    </GlassButton>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workers.map((worker) => (
                        <GlassCard hover={true} className='!p-4 flex flex-col gap-3 group' key={worker.id}>
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden">
                                <Image src={worker.logo} alt={worker.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                                <div className='absolute top-2 right-2 px-3 py-1 rounded-full text-xs bg-black/40 backdrop-blur-md text-white font-medium'>
                                    {worker.role}
                                </div>
                            </div>
                            <h1 className={`font-bold text-base ${dark ? 'text-white' : 'text-neutral-900'}`}>
                                {worker.title}
                            </h1>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleMarketClick(worker.id)}
                                        className="px-3 py-1.5 rounded-xl text-xs bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all"
                                    >
                                        Boshqarish
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                    {workers.length === 0 && (
                        <p className="text-sm opacity-50 col-span-2 text-center py-6">Hozircha ishlar mavjud emas.</p>
                    )}
                </div>
            </div>

            <GlassModal title="Profil rasmini o'zgartirish" onClose={() => setImageUploadModal(false)} open={imageUploadModal}>
                <form onSubmit={handleUpdateImage} className="space-y-4">
                    <p className="text-zinc-400 text-sm">Yangi profil rasmini tanlang:</p>
                    <GlassInput name='image' type='file' required />
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setImageUploadModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-white/5">Bekor qilish</button>
                        <GlassButton type="submit">Yuklash</GlassButton>
                    </div>
                </form>
            </GlassModal>

            <GlassModal title="Market ochish" onClose={() => setMarketAdd(false)} open={marketAdd}>
                <form onSubmit={handleCreateMarket} className="space-y-4">
                    <p className="text-zinc-400 text-sm">Yangi market ochish uchun nomini kiriting, rasmini yuklang va xaritadan koordinatasini belgilang.</p>
                    <div className="flex flex-col w-full gap-4">
                        <GlassInput name='title' type='text' maxLength={26} placeholder="Market nomini yozing" required />
                        <GlassInput name='logo' type='file' required />
                    </div>
                    <GlassButton type='button' className='w-full' onClick={() => setOpenMap(true)}>
                        {mapLat !== 0 ? "Koordinata belgilandi ✓" : "Xaritadan belgilash"}
                    </GlassButton>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button onClick={() => setMarketAdd(false)} type="button" className="px-4 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-white/5">Bekor qilish</button>
                        <GlassButton type="submit">Yuborish</GlassButton>
                    </div>
                </form>
            </GlassModal>

            <GlassModal size='full' open={openMap} onClose={() => setOpenMap(false)} title='Xaritadan belgilang'>
                <Map
                    isDarkMode={dark}
                    onLocationSelect={(lat, lng) => {
                        setMapLat(lat)
                        setMapLng(lng)
                    }} 
                />
                <GlassButton
                    onClick={() => setOpenMap(false)}
                    className={`w-full mt-4 ${mapLng === 0 || mapLat === 0 ? '!bg-gray-200 !text-gray-400 cursor-not-allowed' : ''}`}
                    disabled={mapLng === 0 || mapLat === 0}
                >
                    Tanlandi
                </GlassButton>
            </GlassModal>

            <GlassModal title="Akkauntni o'chirish" onClose={() => setDeleteAkkModalOpen(false)} open={deleteAkkModalOpen}>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Haqiqatan ham akkauntingizni o'chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button onClick={() => setDeleteAkkModalOpen(false)} className="px-4 py-2.5 rounded-xl text-sm hover:bg-white/5">Bekor qilish</button>
                        <button onClick={handleDeleteAccount} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20">O'chirish</button>
                    </div>
                </div>
            </GlassModal>

            <GlassModal title="Marketni o'chirish" onClose={() => setIsDeleteModalOpen(false)} open={isDeleteModalOpen}>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Haqiqatan ham bu marketni o'chirib yubormoqchimisiz?</p>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2.5 rounded-xl text-sm hover:bg-white/5">Bekor qilish</button>
                        <button onClick={() => { handleDeleteMarket(selectedMarket); setIsDeleteModalOpen(false); }} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/20">O'chirish</button>
                    </div>
                </div>
            </GlassModal>
        </div>
    )
}