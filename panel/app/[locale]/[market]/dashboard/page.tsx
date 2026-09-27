"use client";

import React, { useState, useEffect } from 'react';
import UltimateGlassDiagram from '@/components/admin/GlassDiagram';
import { TrendingUp, Users, DollarSign, Activity, Server, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTokenStore } from '@/app/_store/useTokenStore';
import { API_URL } from '@/lib/api';
import { useNotification } from '@/components/Notification';
import { useThemeStore } from '@/app/_store/useThemeStore';

const financialData = [
    { date: 'Yan', revenue: 320000, expenses: 150000, profit: 170000 },
    { date: 'Fev', revenue: 540000, expenses: 220000, profit: 320000 },
    { date: 'Mar', revenue: 480000, expenses: 200000, profit: 280000 },
    { date: 'Apr', revenue: 890000, expenses: 350000, profit: 540000 },
    { date: 'May', revenue: 1250000, expenses: 480000, profit: 770000 },
    { date: 'Iyun', revenue: 1600000, expenses: 600000, profit: 1000000 },
];

const serverLoadData = [
    { time: '00:00', cpu: 25, memory: 45 },
    { time: '04:00', cpu: 18, memory: 42 },
    { time: '08:00', cpu: 65, memory: 78 },
    { time: '12:00', cpu: 92, memory: 88 },
    { time: '16:00', cpu: 75, memory: 80 },
    { time: '20:00', cpu: 40, memory: 55 },
];

interface UserProfile {
    id: string;
    userId?: string;
    following?: Array<{
        id: string;
        following: string[];
        isBlocked?: string[];
    }>;
    [key: string]: unknown;
}

interface DashboardProps {
    params: Promise<{
        locale: string;
        market: string;
    }>;
}

export default function Dashboard({ params }: DashboardProps) {
    const resolvedParams = React.use(params);
    const { locale, market } = resolvedParams;

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const token = useTokenStore(state => state.getActiveToken());
    const notify = useNotification();
    const dark = useThemeStore(state => state.theme) === 'dark';

    const currentMarket = market;

    useEffect(() => {
        const getUsers = async () => {
            if (!currentMarket) return;
            try {
                const res = await fetch(`${API_URL}/dashboard/users/${currentMarket}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();

                if (res.ok) {
                    const formatted = Array.isArray(data) ? data.map((item: any) => item.user || item) : [];
                    notify.show(JSON.stringify(data), "success", dark ? 'dark' : 'light')
                    console.log(data)
                    setUsers(formatted);
                } else {
                    notify.show(data.message || 'Xatolik yuz berdi', "error", dark ? 'dark' : 'light');
                }
            } catch (err) {
                notify.show("So'rov yuborilmadi", "error", dark ? 'dark' : 'light');
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        getUsers();
    }, [currentMarket, token]);

    const calculateUserActivity = () => {
        const daysMap: { [key: string]: { activeUsers: Set<string>; newRegistrations: number } } = {
            'Dush': { activeUsers: new Set(), newRegistrations: 0 },
            'Sesh': { activeUsers: new Set(), newRegistrations: 0 },
            'Chor': { activeUsers: new Set(), newRegistrations: 0 },
            'Pay': { activeUsers: new Set(), newRegistrations: 0 },
            'Jum': { activeUsers: new Set(), newRegistrations: 0 },
            'Shan': { activeUsers: new Set(), newRegistrations: 0 },
            'Yak': { activeUsers: new Set(), newRegistrations: 0 },
        };

        const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

        users.forEach((userItem: any) => {
            const followList = userItem.following || [];

            if (Array.isArray(followList)) {
                followList.forEach((marketObj: any) => {
                    if (marketObj?.id === currentMarket || marketObj?.id) {
                        const timeStamps = marketObj?.following || [];
                        
                        if (Array.isArray(timeStamps)) {
                            timeStamps.forEach((dateString: string) => {
                                const date = new Date(dateString);
                                if (!isNaN(date.getTime())) {
                                    const dayIndex = date.getDay();
                                    const dayName = dayNames[dayIndex];

                                    if (daysMap[dayName]) {
                                        daysMap[dayName].newRegistrations += 1;
                                        daysMap[dayName].activeUsers.add(userItem.userId || userItem.id);
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });

        return Object.keys(daysMap).map(day => ({
            day,
            activeUsers: daysMap[day].activeUsers.size,
            newRegistrations: daysMap[day].newRegistrations
        }));
    };

    let dynamicUserActivityData = calculateUserActivity();

    useEffect(() => {
        dynamicUserActivityData = calculateUserActivity()
    }, [users])

    return (
        <div className="space-y-8 pb-16">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/60 dark:bg-neutral-900/50 border border-sky-500/10 dark:border-white/10 p-6 sm:p-8 rounded-[32px] backdrop-blur-2xl shadow-xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-500 border border-sky-500/25">
                            Bozor (Market): {currentMarket?.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/25">
                            Til: {locale}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Tizim barqaror
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
                        Eksklyuziv Analitika Markazi
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
                        Moliyaviy oqimlar, server quvvatlari va mijozlar faolligini real vaqt rejimida boshqarish paneli.
                    </p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-sky-500/10 dark:border-white/10 backdrop-blur-md shadow-sm">
                        <p className="text-[10px] text-neutral-400 font-medium">Jami Foydalanuvchilar</p>
                        <p className="text-lg font-black text-emerald-500">{users.length} ta</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-[28px] bg-white/60 dark:bg-neutral-900/50 border border-sky-500/10 dark:border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500"><DollarSign className="w-5 h-5" /></div>
                        <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +14.2%
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Umumiy Tushum</p>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">$4,820,000</p>
                </div>

                <div className="p-6 rounded-[28px] bg-white/60 dark:bg-neutral-900/50 border border-sky-500/10 dark:border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500"><Users className="w-5 h-5" /></div>
                        <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +8.1%
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Faol Mijozlar</p>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{users.length} ta</p>
                </div>

                <div className="p-6 rounded-[28px] bg-white/60 dark:bg-neutral-900/50 border border-sky-500/10 dark:border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500"><Activity className="w-5 h-5" /></div>
                        <span className="flex items-center text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> -2.4%
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Server Kechikishi (Latency)</p>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">24 ms</p>
                </div>

                <div className="p-6 rounded-[28px] bg-white/60 dark:bg-neutral-900/50 border border-sky-500/10 dark:border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500"><ShieldCheck className="w-5 h-5" /></div>
                        <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                            99.9%
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Xavfsizlik & Uptime</p>
                    <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1">Mukammal</p>
                </div>
            </div>

            <UltimateGlassDiagram
                title="Yarim yillik Moliya, Xarajat va Sof Foyda Tahlili"
                description="Daromad hajmi va qilingan xarajatlar solishtirig'ining chuqur dinamikasi"
                data={financialData}
                xAxisKey="date"
                height={420}
                snapToCursor={true}
                series={[
                    { key: 'revenue', label: 'Daromad ($)', color: '#6366f1' },
                    { key: 'expenses', label: 'Xarajatlar ($)', color: '#f43f5e' },
                    { key: 'profit', label: 'Sof Foyda ($)', color: '#34d399' }
                ]}
                defaultChartType="area"
                allowedChartTypes={['area', 'bar', 'line']}
                customThemes={[
                    { name: 'Indigo Brand', primary: '#6366f1', secondary: '#4f46e5', glowClass: 'bg-indigo-500' },
                    { name: 'Emerald Growth', primary: '#34d399', secondary: '#059669', glowClass: 'bg-emerald-500' },
                    { name: 'Amber Pro', primary: '#fbbf24', secondary: '#d97706', glowClass: 'bg-amber-500' }
                ]}
                showCopyButton={true}
                showDownloadButton={true}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <UltimateGlassDiagram
                    title="Real vaqtda Server CPU va RAM Yuklanishi"
                    description="Soatlik o'rtacha quvvat sarfi va tarmoq tarangligi"
                    data={serverLoadData}
                    xAxisKey="time"
                    height={340}
                    series={[
                        { key: 'cpu', label: 'CPU (%)', color: '#f59e0b' },
                        { key: 'memory', label: 'RAM (%)', color: '#06b6d4' }
                    ]}
                    defaultChartType="line"
                    allowedChartTypes={['line', 'bar']}
                    showThemeSelector={false}
                    showTimeRangeFilter={false}
                    showRefreshButton={true}
                    showCopyButton={false}
                    snapToCursor={true}
                    showDownloadButton={false}
                    enableZoomBrush={false}
                />

                <UltimateGlassDiagram
                    title="Haftalik Haqiqiy Foydalanuvchilar va Registratsiyalar"
                    description="Bazadagi real obuna (following) vaqtlari asosida kunlik dinamika"
                    data={dynamicUserActivityData}
                    xAxisKey="day"
                    height={340}
                    series={[
                        { key: 'activeUsers', label: 'Faol Mijozlar (Real)', color: '#8b5cf6' },
                        { key: 'newRegistrations', label: 'Yangi Registratsiya (Real)', color: '#ec4899' }
                    ]}
                    defaultChartType="bar"
                    allowedChartTypes={['bar', 'area']}
                    customThemes={[
                        { name: 'Violet Neon', primary: '#8b5cf6', secondary: '#7c3aed', glowClass: 'bg-violet-500' },
                        { name: 'Pink Rose', primary: '#ec4899', secondary: '#db2777', glowClass: 'bg-pink-500' }
                    ]}
                    showThemeSelector={true}
                    showTimeRangeFilter={false}
                    showRefreshButton={false}
                    showCopyButton={true}
                    snapToCursor={true}
                    showDownloadButton={true}
                    enableZoomBrush={false}
                />

            </div>

        </div>
    );
}