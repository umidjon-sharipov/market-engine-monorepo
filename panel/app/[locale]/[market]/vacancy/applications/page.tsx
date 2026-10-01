"use client";
/* eslint-disable react/no-unescaped-entities */

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useMemo, Suspense } from "react";
import { Activity, Award, CheckCircle2, Clock3, Search, SlidersHorizontal, Star, Users } from "lucide-react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassTable from "@/components/admin/GlassTable";
import GlassModal from "@/components/admin/GlassModal";
import GlassCard from "@/components/admin/GlassCard";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { useNotification } from "@/components/Notification";
import { useParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import UltimateGlassDiagram from '@/components/admin/GlassDiagram';
import StatCard from '@/components/admin/StatCard';

interface UserProfile {
    id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    image: string;
    bio: string;
    name: string;
    message?: string;
    rate: number | null | string;
    applicantImage: string | null;
    isAccepted?: boolean;
    [key: string]: unknown;
}

interface VacancyData {
    id: string;
    marketId: string;
    title: string;
    requiredRole: string;
    jobType: string;
    requiredWorkers: number;
    salary: number | null;
    image: string;
    skills: string;
    experience: string;
    description: string;
    benefits: string;
    hrName: string;
    hrPhone: string;
    hrLink: string;
    createdAt: string;
    applicantsCount: number;
    isOwner: boolean;
    matchedUsers: UserProfile[];
}

function ApplicationsContent() {
    const searchParams = useSearchParams();
    const queryId = searchParams.get("id") as string;
    const notify = useNotification();
    const [vacancy, setVacancy] = useState<VacancyData | null>(null);
    const [matchedUsers, setMatchedUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [rateModal, setRateModal] = useState(false);
    const [rateCount, setRateCount] = useState(0);
    const [selectEmail, setSelectEmail] = useState('');
    const [messageModal, setMessageModal] = useState<null | string>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
    const [sortMode, setSortMode] = useState<'recent' | 'rate' | 'name'>('recent');
    const { getActiveToken } = useTokenStore((state) => state);
    const token = getActiveToken();
    const dark = useThemeStore(state => state.theme) === 'dark' ? true : false;
    const params = useParams();
    const market = (params?.market as string) || "";

    const filteredUsers = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return matchedUsers
            .filter((user) => {
                const searchable = `${user.name} ${user.email} ${user.phone || ''} ${user.message || ''}`.toLowerCase();
                const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
                const matchesStatus = statusFilter === 'all' || (statusFilter === 'accepted' && user.isAccepted) || (statusFilter === 'pending' && !user.isAccepted);
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortMode === 'name') return a.name.localeCompare(b.name);
                if (sortMode === 'rate') return Number(b.rate || 0) - Number(a.rate || 0);
                return Number(Boolean(b.isAccepted)) - Number(Boolean(a.isAccepted));
            });
    }, [matchedUsers, searchTerm, sortMode, statusFilter]);

    const stats = useMemo(() => {
        const ratedUsers = matchedUsers.filter((user) => Number(user.rate) > 0);
        const averageRate = ratedUsers.length ? ratedUsers.reduce((sum, user) => sum + Number(user.rate), 0) / ratedUsers.length : 0;
        return {
            total: vacancy?.applicantsCount ?? matchedUsers.length,
            visible: matchedUsers.length,
            accepted: matchedUsers.filter((user) => user.isAccepted).length,
            pending: matchedUsers.filter((user) => !user.isAccepted).length,
            averageRate,
            messages: matchedUsers.filter((user) => Boolean(user.message)).length,
        };
    }, [matchedUsers, vacancy?.applicantsCount]);

    const chartData = useMemo(() => [
        { name: 'Jami', value: stats.visible },
        { name: 'Kutilmoqda', value: stats.pending },
        { name: 'Qabul qilingan', value: stats.accepted },
        { name: 'Xabarli', value: stats.messages },
    ], [stats]);

    useEffect(() => {
        const fetchData = async () => {
            if (!queryId || !token) return;
            try {
                setLoading(true);
                const res = await fetch(`${API_URL}/vacancies/data/${queryId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if (res.ok) {
                    setVacancy(data);
                    setMatchedUsers(data.matchedUsers || []);
                } else {
                    notify.show(data.message || 'Xatolik yuz berdi', "error", dark ? 'dark' : 'light');
                }
            } catch (err) {
                console.error("Xatolik:", err);
                notify.show("So'rov yuborilmadi", "error", dark ? 'dark' : 'light');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [queryId, token, dark, notify]);

    const handleDelete = (id: string) => {
        if (confirm("Bu nomzodni ro'yxatdan o'chirmoqchimisiz?")) {
            setMatchedUsers((prev) => prev.filter((user) => user.id !== id));
        }
    };

    const handleRate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (rateCount === 0) return;

        try {
            const res = await fetch(`${API_URL}/vacancies/${queryId}/rate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rateCount: rateCount,
                    targetEmail: selectEmail
                })
            });

            const data = await res.json();

            if (res.ok) {
                notify.show('Muvaffaqiyatli baholandi', "success", dark ? 'dark' : 'light');
                setRateModal(false);
                setRateCount(0);
                setMatchedUsers(prev => prev.map(u => u.email === selectEmail ? { ...u, rate: rateCount } : u));
            } else {
                notify.show(data.message || 'Xatolik yuz berdi', "error", dark ? 'dark' : 'light');
            }
        } catch {
            notify.show("So'rov yuborilmadi", "error", dark ? 'dark' : 'light');
        }
    };

    const handleAccept = async (applicantId: string, marketId: string, vacancyId: string) => {
        try {
            const res = await fetch(`${API_URL}/workers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: applicantId,
                    marketId: marketId,
                    vacancyId: vacancyId
                })
            });

            const req = await res.json();

            if (res.ok) {
                notify.show("Ishga olindi", "success", dark ? 'dark' : 'light');
                setMatchedUsers(prev => prev.map(u => u.id === applicantId ? { ...u, isAccepted: true } : u));
            } else {
                notify.show(req.message || 'Xatolik yuz berdi', "error", dark ? 'dark' : 'light');
            }
        } catch (err) {
            notify.show("So'rov yuborilmadi", "error", dark ? 'dark' : 'light');
            console.log(err);
        }
    };

    return (
        <div className="w-full max-w-[1500px] mx-auto p-8">
            <div className="mb-10 border-l-4 border-sky-500 pl-6 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Ariza Markazi</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        {vacancy?.title ? `Vakansiya: ${vacancy.title}` : "Nomzodlar ma'lumotlari"}
                    </p>
                    {vacancy && (
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                            <span>Rol: <strong className="text-sky-400">{vacancy.requiredRole}</strong></span>
                            <span>Turi: <strong className="text-sky-400">{vacancy.jobType}</strong></span>
                            <span>Maosh: <strong className="text-emerald-400">{vacancy.salary ? `${vacancy.salary} so'm` : "Kelishilgan"}</strong></span>
                            <span>Ariza topshirganlar: <strong className="text-amber-400">{vacancy.applicantsCount ?? 0} ta</strong></span>
                        </div>
                    )}
                </div>
                {queryId && (
                    <div className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-500 rounded-xl font-mono text-sm">
                        ID: {queryId}
                    </div>
                )}
            </div>

            {!loading && vacancy?.isOwner && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <StatCard title="Jami arizalar" value={stats.total} icon={Users} trend={`${stats.visible} ta profil topildi`} delay={0} />
                        <StatCard title="Kutilmoqda" value={stats.pending} icon={Clock3} trend="Ko'rib chiqish kerak" delay={0.05} />
                        <StatCard title="Qabul qilingan" value={stats.accepted} icon={CheckCircle2} trend={stats.total ? `${Math.round((stats.accepted / stats.total) * 100)}% conversion` : '0% conversion'} delay={0.1} />
                        <StatCard title="O'rtacha baho" value={`${stats.averageRate.toFixed(1)} / 5`} icon={Star} trend={`${stats.messages} ta xabar mavjud`} delay={0.15} />
                        <StatCard title="Ko'rib chiqish" value={filteredUsers.length} icon={Activity} trend="Joriy filter natijasi" delay={0.2} />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 mb-8">
                        <UltimateGlassDiagram
                            title="Applicant funnel"
                            description="Nomzodlar holati va recruitment conversion ko'rinishi"
                            data={chartData}
                            xAxisKey="name"
                            height={300}
                            series={[{ key: 'value', label: 'Applicantlar', color: '#38bdf8' }]}
                            defaultChartType="bar"
                            allowedChartTypes={['bar', 'area', 'line']}
                            customThemes={[{ name: 'Sky', primary: '#38bdf8', secondary: '#0284c7', glowClass: 'bg-sky-500' }, { name: 'Emerald', primary: '#34d399', secondary: '#059669', glowClass: 'bg-emerald-500' }, { name: 'Amber', primary: '#fbbf24', secondary: '#d97706', glowClass: 'bg-amber-500' }]}
                            showTimeRangeFilter={false}
                            showDownloadButton
                            showCopyButton
                            enableZoomBrush={false}
                        />
                        <GlassCard className="h-full">
                            <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-gray-400">Quick insight</p><h2 className="mt-2 text-xl font-bold">Ish jarayoni</h2></div><Award className="w-5 h-5 text-amber-300" /></div>
                            <div className="mt-6 space-y-5">
                                <div><div className="flex justify-between text-xs mb-2"><span className="text-gray-400">Qabul conversion</span><strong className="text-emerald-400">{stats.total ? Math.round((stats.accepted / stats.total) * 100) : 0}%</strong></div><div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${stats.total ? Math.min((stats.accepted / stats.total) * 100, 100) : 0}%` }} /></div></div>
                                <div><div className="flex justify-between text-xs mb-2"><span className="text-gray-400">Xabar qoldirganlar</span><strong className="text-sky-400">{stats.messages}</strong></div><div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-sky-400" style={{ width: `${stats.total ? Math.min((stats.messages / stats.total) * 100, 100) : 0}%` }} /></div></div>
                                <div className="pt-3 border-t border-white/10 text-xs text-gray-400 flex items-start gap-2"><SlidersHorizontal className="w-4 h-4 text-sky-400 shrink-0" /> Qidiruv va status filteri orqali kuchli nomzodlarni tez ajrating.</div>
                            </div>
                        </GlassCard>
                    </div>
                </>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500 text-lg">Yuklanmoqda...</div>
            ) : vacancy && !vacancy.isOwner ? (
                <GlassCard>
                    <div className="text-center py-12 space-y-4">
                        <h3 className="text-2xl font-bold text-gray-700 dark:text-white">{vacancy.title}</h3>
                        <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">{vacancy.description}</p>
                        <div className="pt-4">
                            <span className="inline-block px-4 py-2 bg-sky-500/10 text-sky-400 rounded-xl text-sm font-medium">
                                Bu vakansiyaga jami <strong className="text-amber-400">{vacancy.applicantsCount} ta</strong> nomzod ariza topshirgan.
                            </span>
                        </div>
                    </div>
                </GlassCard>
            ) : (
                <div>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                        <div><h2 className="text-xl font-bold text-gray-800 dark:text-white">Nomzodlar ro'yxati</h2><p className="text-xs text-gray-500 mt-1">{filteredUsers.length} ta natija ko'rsatilmoqda</p></div>
                        {vacancy?.isOwner && <div className="flex flex-col sm:flex-row gap-2">
                            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3"><Search className="w-4 h-4 text-gray-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Ism, email, xabar..." className="w-full sm:w-56 bg-transparent py-2.5 text-sm outline-none text-gray-900 dark:text-white" /></label>
                            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-700 dark:text-neutral-300 outline-none"><option value="all">Barcha status</option><option value="pending">Kutilmoqda</option><option value="accepted">Qabul qilingan</option></select>
                            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-700 dark:text-neutral-300 outline-none"><option value="recent">Holat bo'yicha</option><option value="rate">Baho bo'yicha</option><option value="name">Ism bo'yicha</option></select>
                        </div>}
                    </div>
                    <GlassTable
                    columns={[
                        { key: "name", label: "Nomzod" },
                        { key: "email", label: "Email" },
                        { key: "phone", label: "Telefon" },
                        { key: "rate", label: "Baho (Rate)" },
                    ]}
                    data={filteredUsers as Record<string, unknown>[]}
                    actions={(row) => {
                        const user = row as UserProfile;
                        return (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedUser(user)}
                                    className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 transition text-gray-200"
                                >
                                    Profil
                                </button>
                                {user.isAccepted ? (
                                    <button
                                        className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition cursor-default"
                                    >
                                        Accepted
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAccept(user.id, market, queryId)}
                                        className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition"
                                    >
                                        Qabul
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                                >
                                    O'chirish
                                </button>
                                <button
                                    onClick={() => setMessageModal(user.email)}
                                    className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                                >
                                    Xabar
                                </button>
                                <button
                                    onClick={() => { setRateModal(true); setSelectEmail(user.email); }}
                                    className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition"
                                >
                                    Baholash {user.rate ? `(${user.rate}★)` : ''}
                                </button>
                            </div>
                        );
                    }}
                    />
                </div>
            )}

            {selectedUser && (
                <GlassModal title="Profile" open={!!selectedUser} size="3xl" onClose={() => setSelectedUser(null)}>
                    <div className="space-y-6 pb-16">
                        <div className="flex items-center gap-6">
                            <Image
                                width={100}
                                height={100}
                                src={selectedUser.applicantImage || selectedUser.image || "https://i.ibb.co/nNZrjBSD/user.png"}
                                alt={selectedUser.name}
                                className="w-24 h-24 rounded-full object-cover border border-white/10 shadow-xl"
                            />
                            <div>
                                <h2 className="text-3xl font-bold">{selectedUser.name}</h2>
                                <p className="text-sky-400 font-medium text-lg">@{selectedUser.userName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <GlassCard>
                                <p className="text-gray-400 text-xs uppercase mb-1">Email</p>
                                <p className="font-semibold">{selectedUser.email}</p>
                            </GlassCard>
                            <GlassCard>
                                <p className="text-gray-400 text-xs uppercase mb-1">Telefon</p>
                                <p className="font-semibold">{selectedUser.phone}</p>
                            </GlassCard>
                        </div>

                        <GlassCard>
                            <p className="text-gray-400 text-xs uppercase mb-2">Bio</p>
                            <p className="leading-relaxed text-sm opacity-90">{selectedUser.bio}</p>
                        </GlassCard>

                        <GlassCard>
                            <p className="text-gray-400 text-xs uppercase mb-2">Ariza Xabari</p>
                            <p className="leading-relaxed text-sm opacity-90">{selectedUser.message}</p>
                        </GlassCard>

                        <div className="flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 bg-zinc-900/60 backdrop-blur-md rounded-b-[28px] border-t border-white/5">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Yopish
                            </button>
                            <button
                                onClick={() => {
                                    handleAccept(selectedUser.id, market, queryId);
                                    setSelectedUser(null);
                                }}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                            >
                                Qabul qilish
                            </button>
                        </div>
                    </div>
                </GlassModal>
            )}

            {rateModal && (
                <GlassModal title='Baholash' open={rateModal} onClose={() => setRateModal(false)}>
                    <form onSubmit={handleRate} className="space-y-6 pb-12">
                        <div className="flex items-center justify-center gap-3">
                            {[1, 2, 3, 4, 5].map((star, index) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRateCount(index + 1)}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl transition-all duration-200 ${
                                        rateCount > index
                                            ? 'text-yellow-400 scale-110'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 bg-zinc-900/60 backdrop-blur-md rounded-b-[28px] border-t border-white/5">
                            <button
                                onClick={() => setRateModal(false)}
                                type="button"
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                            >
                                Baholash
                            </button>
                        </div>
                    </form>
                </GlassModal>
            )}

            {messageModal && (
                <GlassModal title="Message" open={!!messageModal} size="3xl" onClose={() => setMessageModal(null)}>
                    <div className="space-y-4 pb-16">
                        <p className="text-lg leading-relaxed">
                            {matchedUsers.find(item => item.email === messageModal)?.message}
                        </p>

                        {matchedUsers.find(item => item.email === messageModal)?.applicantImage && (
                            <div className="relative w-full h-[300px]">
                                <Image
                                    src={`${matchedUsers.find(item => item.email === messageModal)?.applicantImage}`}
                                    alt="Applicant Attachment"
                                    className="rounded-2xl object-cover"
                                    fill
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 bg-zinc-900/60 backdrop-blur-md rounded-b-[28px] border-t border-white/5">
                            <button
                                onClick={() => setMessageModal(null)}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </GlassModal>
            )}
        </div>
    );
}

export default function ApplicationsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Yuklanmoqda...</div>}>
            <ApplicationsContent />
        </Suspense>
    );
}