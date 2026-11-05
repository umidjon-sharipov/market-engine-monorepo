'use client'
import GlassCard from '@/components/admin/GlassCard'
import GlassInput from '@/components/admin/GlassInput'
import GlassModal from '@/components/admin/GlassModal'
import React, { useEffect, useState } from 'react'
import { useThemeStore } from '@/app/_store/useThemeStore'
import GlassButton from '@/components/admin/GlassButton'
import { useTokenStore } from '@/app/_store/useTokenStore'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useNotification } from '@/components/Notification'
import Image from 'next/image'
import GlassWindow from '@/components/admin/GlassWindow'
import { API_URL } from '@/lib/api';
import { Check, Eye, Users } from 'lucide-react';

interface VacancyType {
    id: string;
    marketId: string;
    title: string;
    requiredRole: string;
    jobType: string;
    requiredWorkers: number;
    salary: number | string | null;
    image: string;
    skills: string | string[];
    experience: string;
    description: string | null;
    benefits: string | null;
    hrName: string;
    hrPhone: string;
    hrLink?: string | null;
    applicantsCount?: number;
    matchedUsers?: ApplicantType[];
    isOwner?: boolean;
    createdAt: string | Date;
}

interface ApplicantType {
    id: string;
    userName?: string;
    name: string;
    email: string;
    phone?: string;
    image?: string;
    applicantImage?: string | null;
    bio?: string;
    message?: string;
    rate?: number | string | null;
    isAccepted?: boolean;
}

interface VacancyCardProps {
    item: VacancyType;
    getVacancions: () => void;
    locale: string;
}

const VacancyCard = ({ item, getVacancions }: VacancyCardProps) => {
    const descriptionText = item.description || ''
    const isLongDescription = descriptionText.length > 100
    const params = useParams()
    const market = (params?.market as string) || ''
    const notify = useNotification()
    const dark = useThemeStore(state => state.theme) === 'dark' ? true : false
    const {getActiveToken} = useTokenStore((state) => state);
    const token = getActiveToken()

    const displayedDescription = descriptionText.slice(0, 100) + (isLongDescription ? '...' : '')

    const handleDeleteVacancy = async (id: string) => {
        try {
            const req = await fetch(`${API_URL}/vacancies/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (req.ok) {
                notify.show("Muvaffaqiyatli o'chirildi!", "success", dark ? 'dark' : 'light');
                getVacancions()
            } else {
                const res = await req.json();
                notify.show(res.message || "O'chirilmadi!", "error", dark ? 'dark' : 'light');
            }
        } catch (err) {
            notify.show("So'rov yuborilmadi!", "error", dark ? 'dark' : 'light');
            console.log(err);
        }
    }

    return (
        <GlassCard className="group relative flex flex-col justify-between h-full overflow-hidden rounded-3xl p-4 sm:p-5 transition-all duration-300 hover:shadow-2xl">

            {market === item.marketId && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVacancy(item.id);
                    }}
                    className="absolute top-6 right-6 z-30 p-2.5 rounded-2xl backdrop-blur-xl bg-black/20 border border-white/10 text-rose-400 hover:text-white hover:bg-rose-600/30 transition-all duration-300 shadow-xl cursor-pointer"
                    title="Delete"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
            )}

            <Link href={`?id=${item.id}&isFullScreen=false`} scroll={false} className="flex flex-col h-full justify-between cursor-pointer">
                <div>
                    <div className="relative w-full h-48 mb-4 overflow-hidden rounded-2xl">
                        <Image
                            width={500}
                            height={300}
                            src={item.image || '/placeholder.png'}
                            alt={item.title}
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                            <span className="px-3 py-1 text-xs font-medium backdrop-blur-md bg-black/40 text-white/90 rounded-full border border-white/20 shadow-lg">
                                {item.requiredRole}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 mb-2.5">
                        <h3 className="text-lg font-bold tracking-tight line-clamp-1 group-hover:text-sky-400 transition-colors duration-300">
                            {item.title}
                        </h3>
                        <span className="text-base font-bold whitespace-nowrap text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20">
                            {item.salary} $
                        </span>
                    </div>

                    <div className="mb-2">
                        <p className="text-xs sm:text-sm text-white/70 leading-relaxed line-clamp-2">
                            {displayedDescription}
                        </p>
                    </div>
                </div>
            </Link>
        </GlassCard>
    )
}

const Vacancy = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const notify = useNotification()
    const params = useParams();
    const locale = params?.locale as string || 'uz';

    const [sliderCount, setSliderCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [vacancions, setVacancions] = useState<VacancyType[]>([])
    const [vacancy, setVacancy] = useState<VacancyType | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [applyModal, setApplyModal] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)

    const dark = useThemeStore(state => state.theme) === 'dark'
    const market = (params?.market as string) || ''
    const {getActiveToken} = useTokenStore((state) => state);
    const token = getActiveToken()

    const vacancyId = searchParams.get('id')
    const isFullScreen = searchParams.get('isFullScreen') === 'true'

    const getVacancions = async () => {
        try {
            const res = await fetch(`${API_URL}/vacancies`)
            const result = await res.json()
            const dataArray = Array.isArray(result) ? result : (result.data || [])
            const publicVacancies = dataArray.map((item: VacancyType) => {
                const { matchedUsers, isOwner, applicantsCount, ...publicVacancy } = item
                void matchedUsers
                void isOwner
                void applicantsCount
                return publicVacancy
            })
            setVacancions(publicVacancies)

        } catch (err) {
            console.error(err)
            setVacancions([])
        }
    }

    const getVacancyData = async (id: string) => {
        if (!token) return;
        setDetailLoading(true);
        try {
            const res = await fetch(`${API_URL}/vacancies/data/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Vakansiya ma\'lumotlari olinmadi');
            setVacancy(data as VacancyType);
        } catch (err) {
            setVacancy(null);
            notify.show(err instanceof Error ? err.message : 'Vakansiya ma\'lumotlari olinmadi', 'error', dark ? 'dark' : 'light');
        } finally {
            setDetailLoading(false);
        }
    }

    useEffect(() => {
        getVacancions()
    }, [])

    useEffect(() => {
        if (vacancyId) getVacancyData(vacancyId)
        else setVacancy(null)
    }, [vacancyId, token])

    const handleCloseDetailModal = () => {
        router.push(`/${locale}/${market}/vacancy`, { scroll: false })
        setVacancy(null)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formElement = e.currentTarget;

        const formData = new FormData(formElement);
        if (market) {
            formData.append('marketId', market);
        }

        try {
            const response = await fetch(`${API_URL}/vacancies`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                notify.show("Vakansiya muvaffaqiyatli qo'shildi!", "success", dark ? 'dark' : 'light');
                setIsOpen(false);
                setSliderCount(0);

                formElement.reset();

                getVacancions();
            } else {
                const errData = await response.json().catch(() => ({}));
                notify.show(errData.message || "Xatolik yuz berdi", "error", dark ? 'dark' : 'light');
            }
        } catch (err) {
            console.error("Fetch xatosi:", err);
            notify.show("So'rov yuborilmadi!", "error", dark ? 'dark' : 'light');
        }
    };

    const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.currentTarget);

            const response = await fetch(`${API_URL}/vacancies/${vacancy?.id}/apply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                notify.show("Ariza muvaffaqiyatli yuborildi!", "success", dark ? 'dark' : 'light');
                setApplyModal(false);
            } else {
                notify.show(data.message || "Xatolik yuz berdi!", "error", dark ? 'dark' : 'light');
            }
        } catch (err) {
            notify.show("So'rov yuborilmadi!", "error", dark ? 'dark' : 'light');
            console.log(err);
        }
    }

    const handleAcceptApplicant = async (applicant: ApplicantType) => {
        if (!vacancy || applicant.isAccepted) return;
        try {
            const res = await fetch(`${API_URL}/workers`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: applicant.id, marketId: vacancy.marketId, vacancyId: vacancy.id }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Nomzodni qabul qilib bo\'lmadi');
            setVacancy((current) => current ? {
                ...current,
                matchedUsers: current.matchedUsers?.map((user) => user.id === applicant.id ? { ...user, isAccepted: true } : user),
            } : current);
            notify.show('Nomzod ishga qabul qilindi', 'success', dark ? 'dark' : 'light');
        } catch (err) {
            notify.show(err instanceof Error ? err.message : 'So\'rov yuborilmadi', 'error', dark ? 'dark' : 'light');
        }
    };

    const filteredVacancies = Array.isArray(vacancions)
        ? vacancions.filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.requiredRole?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' || item.requiredRole === roleFilter;
            return matchesSearch && matchesRole;
        })
        : [];

    return (
        <div className='w-full min-h-screen flex flex-col gap-4 p-4'>
            <GlassCard className='flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 w-full p-4'>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <h1 className='text-2xl font-bold'>Vacancies</h1>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none backdrop-blur-md"
                    >
                        <option value="all" className="bg-neutral-900">Barcha rollar</option>
                        <option value="admin" className="bg-neutral-900">Admin</option>
                        <option value="saler" className="bg-neutral-900">Saler</option>
                        <option value="meneger" className="bg-neutral-900">Meneger</option>
                        <option value="warehouse" className="bg-neutral-900">Warehouse</option>
                    </select>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="relative flex items-center flex-1 sm:flex-initial">
                        <GlassInput
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-48 sm:focus:w-72 transition-all duration-300 text-xs py-2"
                        />
                    </div>
                    <GlassButton onClick={() => setIsOpen(true)} className="whitespace-nowrap">
                        Create Vacancy
                    </GlassButton>
                </div>
            </GlassCard>

            {(!Array.isArray(filteredVacancies) || filteredVacancies.length === 0) ? (
                <div className="w-full h-full flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="w-16 h-16 bg-gray-800 text-gray-200 rounded-full flex items-center justify-center mb-4 text-2xl">
                        📭
                    </div>
                    <h3 className="text-lg font-semibold text-white">Hozircha vakansiyalar mavjud emas</h3>
                    <p className="text-sm text-gray-400 mt-1">Yangi e'lonlar qo'shilishini kuting yoki keyinroq tekshiring.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 place-items-center w-full h-full">
                    {filteredVacancies.map(item => (
                        <VacancyCard key={item.id} item={item} locale={locale} getVacancions={getVacancions} />
                    ))}
                </div>
            )}

            {detailLoading && (
                <GlassWindow title="Vakansiya yuklanmoqda" open={true} size="xl" onClose={handleCloseDetailModal}>
                    <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
                        Vakansiya va ruxsat etilgan ma'lumotlar yuklanmoqda...
                    </div>
                </GlassWindow>
            )}

            {vacancy && !detailLoading && (
                <GlassWindow title='Vakansiya tafsilotlari' open={true} size={isFullScreen ? 'full' : 'xl'} onClose={handleCloseDetailModal}>
                    <div className="flex flex-col relative justify-between h-full overflow-hidden group">
                        <div className="relative w-full h-[45vh] mb-4 overflow-hidden rounded-2xl shadow-lg">
                            <Image
                                width={1200}
                                height={800}
                                src={vacancy.image}
                                alt={vacancy.title}
                                className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                <span className="px-3.5 py-1 text-xs font-semibold backdrop-blur-md bg-black/50 text-white rounded-full border border-white/20 shadow-sm">
                                    {vacancy.requiredRole}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start justify-between gap-4 mb-3 border-b border-white/10 pb-3">
                            <div>
                                <h3 className="text-2xl font-extrabold tracking-tight text-white">
                                    {vacancy.title}
                                </h3>
                                <p className="text-xs opacity-60 mt-1">Eʼlon qilingan sana: {vacancy.createdAt ? new Date(vacancy.createdAt).toLocaleDateString() : "Yaqinda"}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black whitespace-nowrap bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                                    ${vacancy.salary}
                                </span>
                                <p className="text-[10px] opacity-70 uppercase tracking-wider">oylik daromad</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col justify-center">
                                <span className="text-[11px] opacity-60">Ishchilar soni</span>
                                <span className="text-sm font-bold text-white mt-0.5">{vacancy.requiredWorkers} ta o'rin</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col justify-center">
                                <span className="text-[11px] opacity-60">Tajriba darajasi</span>
                                <span className="text-sm font-bold text-white mt-0.5">{vacancy.experience || "Talab etilmaydi"}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col justify-center">
                                <span className="text-[11px] opacity-60">Arizalar</span>
                                <span className="text-sm font-bold text-amber-300 mt-0.5">{vacancy.applicantsCount ?? 0} ta</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                                Vakansiya haqida batafsil
                            </h4>
                            <div className="p-3.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 max-h-70 overflow-y-auto custom-scrollbar">
                                <p className="text-sm opacity-85 leading-relaxed whitespace-pre-line">
                                    {vacancy.description}
                                </p>
                            </div>
                        </div>

                        {vacancy.benefits && (
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-white mb-1.5">Qulayliklar va Imtiyozlar</h4>
                                <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-xs opacity-85">
                                    {vacancy.benefits}
                                </div>
                            </div>
                        )}

                        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 mb-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="opacity-60">Mas'ul shaxs (HR):</span>
                                <span className="font-bold text-white">{vacancy.hrName || "Ko'rsatilmagan"}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="opacity-60">Bog'lanish uchun tel:</span>
                                <a href={`tel:${vacancy.hrPhone}`} className="font-bold text-sky-400 hover:underline">{vacancy.hrPhone || "Ko'rsatilmagan"}</a>
                            </div>
                            {vacancy.hrLink && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="opacity-60">Telegram / Link:</span>
                                    <span className="font-bold text-sky-400">{vacancy.hrLink}</span>
                                </div>
                            )}
                        </div>

                        {vacancy.isOwner ? (
                            <section className="mb-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-sky-300"><Users className="w-4 h-4" /><h4 className="text-sm font-bold">Nomzodlar markazi</h4></div>
                                        <p className="text-xs text-gray-400 mt-1">Faqat vakansiya egasi uchun ko'rinadigan ma'lumotlar</p>
                                    </div>
                                    <span className="text-xs rounded-full bg-sky-500/15 text-sky-300 px-2.5 py-1">{vacancy.matchedUsers?.length ?? 0} profil</span>
                                </div>
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                    {(vacancy.matchedUsers ?? []).map((applicant) => (
                                        <div key={applicant.id} className="rounded-2xl border border-white/10 bg-black/10 p-3">
                                            <div className="flex items-start gap-3">
                                                <Image width={44} height={44} src={applicant.applicantImage || applicant.image || '/placeholder.png'} alt={applicant.name} className="w-11 h-11 rounded-xl object-cover" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold truncate">{applicant.name}</p>{applicant.isAccepted && <span className="text-[10px] rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5">Qabul qilingan</span>}</div>
                                                    <p className="text-xs text-gray-400 mt-0.5">{applicant.email}</p>
                                                    <p className="text-xs text-gray-300/80 mt-2 line-clamp-2">{applicant.message || 'Nomzod xabar qoldirmagan'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-white/10">
                                                <span className="text-xs text-amber-300">Rate: {applicant.rate ?? 'Baholanmagan'}</span>
                                                {!applicant.isAccepted && <button onClick={() => handleAcceptApplicant(applicant)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25"><Check className="w-3.5 h-3.5" /> Qabul qilish</button>}
                                            </div>
                                        </div>
                                    ))}
                                    {!vacancy.matchedUsers?.length && <div className="py-8 text-center text-sm text-gray-400">Hozircha mos nomzodlar yo'q.</div>}
                                </div>
                            </section>
                        ) : (
                            <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
                                <Eye className="w-5 h-5 text-amber-300 shrink-0" />
                                <div><p className="text-sm font-semibold">{vacancy.applicantsCount ?? 0} ta ariza mavjud</p><p className="text-xs text-gray-400 mt-1">Nomzodlar tafsilotlari faqat vakansiya egasiga ko'rsatiladi.</p></div>
                            </div>
                        )}

                        <div className="pt-3 border-t border-white/10 flex items-center gap-3 mt-auto">
                            <GlassButton
                                onClick={handleCloseDetailModal}
                                variant='ghost'
                                className="w-1/3"
                            >
                                Yopish
                            </GlassButton>
                            <GlassButton
                                onClick={() => {
                                    if (vacancy.isOwner) router.push(`vacancy/applications?id=${vacancy.id}`)
                                    else setApplyModal(true)
                                }}
                                className="w-2/3"
                            >
                                {vacancy.isOwner ? `To'liq arizalar` : 'Ariza topshirish'}
                            </GlassButton>
                        </div>
                    </div>
                </GlassWindow>
            )}

            {isOpen && (
                <GlassModal title="Elon berish" open={isOpen} size='full' className='relative' onClose={() => setIsOpen(false)}>
                    <form className="space-y-4 max-h-[80vh] w-full overflow-hidden" onSubmit={handleSubmit}>
                        <div
                            className="w-[400%] flex gap-6 transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${sliderCount * (100 / 4)}%)` }}
                        >
                            <div className="w-[100%] space-y-4 pb-20 overflow-y-auto max-h-[65vh] px-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Vakansiya Nomi (Title)</label>
                                    <GlassInput name='title' type='text' placeholder="Mavzu" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Rol / Bo'lim</label>
                                        <select
                                            name='requiredRole'
                                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-sky-500/80 focus:bg-white/10 outline-none transition-all text-sm text-white backdrop-blur-md"
                                        >
                                            <option value="admin" className="bg-neutral-900">Admin</option>
                                            <option value="saler" className="bg-neutral-900">Saler (Sotuvchi)</option>
                                            <option value="meneger" className="bg-neutral-900">Meneger</option>
                                            <option value="warehouse" className="bg-neutral-900">Warehouse (Ombor)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Ish turi</label>
                                        <select
                                            name='jobType'
                                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-sky-500/80 focus:bg-white/10 outline-none transition-all text-sm text-white backdrop-blur-md"
                                        >
                                            <option value="full-time" className="bg-neutral-900">To'liq stavka (Full-time)</option>
                                            <option value="part-time" className="bg-neutral-900">Yarim stavka (Part-time)</option>
                                            <option value="remote" className="bg-neutral-900">Masofaviy (Remote)</option>
                                            <option value="internship" className="bg-neutral-900">Stajirovka</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Ishchilar soni</label>
                                        <GlassInput name='requiredWorkers' type='number' placeholder="Masalan: 3" min="1" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Oylik Maosh ($ / so'm)</label>
                                        <GlassInput name='salary' type='text' placeholder="Masalan: $500 - $800" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Banner / Rasm yuklang</label>
                                    <GlassInput name='image' type='file' className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-300 hover:file:bg-sky-500/30" />
                                </div>
                            </div>

                            <div className="w-[100%] space-y-4 pb-20 overflow-y-auto max-h-[65vh] px-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Talab qilinadigan ko'nikmalar (Skills)</label>
                                    <GlassInput name='skills' type='text' placeholder="Masalan: Ingliz tili (vergul bilan)" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Ish tajribasi</label>
                                    <select
                                        name='experience'
                                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-sky-500/80 focus:bg-white/10 outline-none transition-all text-sm text-white backdrop-blur-md"
                                    >
                                        <option value="no-experience" className="bg-neutral-900">Tajribasiz</option>
                                        <option value="1-3" className="bg-neutral-900">1 - 3 yil</option>
                                        <option value="3-5" className="bg-neutral-900">3 - 5 yil</option>
                                        <option value="5+" className="bg-neutral-900">5 yildan ortiq</option>
                                    </select>
                                </div>
                            </div>

                            <div className="w-[100%] space-y-4 pb-20 overflow-y-auto max-h-[65vh] px-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Ish haqida batafsil (Description)</label>
                                    <textarea
                                        name='description'
                                        placeholder="Nomzod nima ish qiladi, vazifalari va mas'uliyatlari..."
                                        rows={6}
                                        className="w-full rounded-2xl py-3 px-4 outline-none transition-all duration-200 border border-white/10 bg-white/5 text-white placeholder:text-neutral-500 focus:border-sky-500/80 focus:bg-white/10 backdrop-blur-md resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Qulayliklar va Imtiyozlar (Benefits)</label>
                                    <textarea
                                        name='benefits'
                                        placeholder="Bepul tushlik, 13-oylik maosh, qulay ofis..."
                                        rows={3}
                                        className="w-full rounded-2xl py-3 px-4 outline-none transition-all duration-200 border border-white/10 bg-white/5 text-white placeholder:text-neutral-500 focus:border-sky-500/80 focus:bg-white/10 backdrop-blur-md resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="w-[100%] space-y-4 pb-20 overflow-y-auto max-h-[65vh] px-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Mas'ul shaxs / HR ismi</label>
                                    <GlassInput name='hrName' type='text' placeholder="Masalan: Anvar Karimov" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Aloqa uchun Telefon raqam</label>
                                    <GlassInput name='hrPhone' type='tel' placeholder="+998 90 000 00 00" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Telegram username yoki Link (ixtiyoriy)</label>
                                    <GlassInput name='hrLink' type='text' placeholder="@hr_username" />
                                </div>

                                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-200 text-xs">
                                    ✨ Barcha ma'lumotlar to'g'riligini tekshirib chiqqach, **"Finish"** tugmasini bosing. Vakansiya darhol bazaga qo'shiladi!
                                </div>
                            </div>
                        </div>

                        <div className="flex absolute bottom-0 left-0 w-full justify-between items-center rounded-[28px] backdrop-blur-xl z-20">
                            <button
                                onClick={() => setSliderCount(prev => Math.max(prev - 1, 0))}
                                type="button"
                                className={`px-4 flex gap-2.5 items-center justify-center py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors ${sliderCount <= 0 ? 'opacity-40 pointer-events-none' : 'opacity-100'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8L2 12L6 16" /><path d="M2 12H22" /></svg>
                                Back
                            </button>

                            <div className="flex gap-2">
                                {[0, 1, 2, 3].map((step) => (
                                    <div
                                        key={step}
                                        className={`h-2 rounded-full transition-all duration-300 ${sliderCount === step ? 'w-6 bg-sky-400 shadow-glow' : 'w-2 bg-white/20'
                                            }`}
                                    />
                                ))}
                            </div>

                            <GlassButton
                                onClick={(e) => {
                                    if (sliderCount < 3) {
                                        e.preventDefault();
                                        setSliderCount(prev => prev + 1);
                                    }
                                }}
                                type={sliderCount >= 3 ? "submit" : "button"}
                                className="px-6 flex gap-2.5 items-center duration-300 justify-center py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 transition-all shadow-lg shadow-sky-500/25 border border-sky-400/30"
                            >
                                {sliderCount >= 3 ? 'Finish' : 'Next'}
                                {sliderCount < 3 && (
                                    <svg className="rotate-180" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8L2 12L6 16" /><path d="M2 12H22" /></svg>
                                )}
                            </GlassButton>
                        </div>
                    </form>
                </GlassModal>
            )}

            {applyModal && (
                <GlassModal title='Ariza topshirish' open={applyModal} onClose={() => setApplyModal(false)} size='3xl'>
                    <form className="space-y-4 max-h-[80vh] w-full overflow-hidden" onSubmit={handleApply}>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Xabar (Message)</label>
                            <textarea
                                name='message'
                                placeholder="Message..."
                                rows={6}
                                className="w-full rounded-2xl py-3 px-4 outline-none transition-all duration-200 border border-white/10 bg-white/5 text-white placeholder:text-neutral-500 focus:border-sky-500/80 focus:bg-white/10 backdrop-blur-md resize-none"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Rasm yuklang (ixtiyoriy)</label>
                            <GlassInput name='image' type='file' className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-500/20 file:text-sky-300 hover:file:bg-sky-500/30" />
                        </div>

                        <div className="p-6"></div>

                        <div className="flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                            <button
                                onClick={() => setApplyModal(false)}
                                type="button"
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Bekor qilish
                            </button>
                            <GlassButton
                                type="submit"
                                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                            >
                                Yuborish
                            </GlassButton>
                        </div>
                    </form>
                </GlassModal>
            )}
        </div>
    )
}

export default Vacancy;