"use client";
/* eslint-disable react/no-unescaped-entities */

import Image from "next/image";
import { useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, ArrowUpRight, CalendarDays, Clock3, Eye, Search, ShieldBan, UserCheck, UserPlus, Users, UserX, X } from "lucide-react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import { useParams } from "next/navigation";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { API_URL } from "@/lib/api";
import UltimateGlassDiagram from "@/components/admin/GlassDiagram";
import GlassCard from "@/components/admin/GlassCard";
import GlassModal from "@/components/admin/GlassModal";
import StatCard from "@/components/admin/StatCard";
import { useNotification } from "@/components/Notification";

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
    isBlocked?: boolean;
    createdAt?: string;
    followHistory?: unknown[];
    blockHistory?: unknown[];
    [key: string]: unknown;
}

interface ActivityEvent {
    id: string;
    type: "joined" | "followed" | "unfollowed" | "blocked" | "unblocked" | "updated";
    label: string;
    at: string;
    detail: string;
}

type ViewMode = "all" | "new" | "active" | "blocked";
const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];

function validDate(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function eventType(key: string): ActivityEvent["type"] {
    const normalized = key.toLowerCase();
    if (normalized.includes("unblock")) return "unblocked";
    if (normalized.includes("block")) return "blocked";
    if (normalized.includes("unfollow") || normalized.includes("remove")) return "unfollowed";
    if (normalized.includes("follow")) return "followed";
    if (normalized.includes("creat") || normalized.includes("join") || normalized.includes("register")) return "joined";
    return "updated";
}

function makeActivity(user: UserProfile): ActivityEvent[] {
    const events: ActivityEvent[] = [];
    const seen = new Set<string>();
    const addEvent = (key: string, value: unknown, detail: string) => {
        const date = validDate(value);
        if (!date) return;
        const id = `${user.id}-${key}-${date.toISOString()}`;
        if (seen.has(id)) return;
        seen.add(id);
        const type = eventType(key);
        const labels: Record<ActivityEvent["type"], string> = {
            joined: "Yangi user qo'shildi",
            followed: "Follow bosildi",
            unfollowed: "Follow olib tashlandi",
            blocked: "User bloklandi",
            unblocked: "User blokdan chiqarildi",
            updated: "Profil yangilandi",
        };
        events.push({ id, type, label: labels[type], at: date.toISOString(), detail });
    };
    addEvent("createdAt", user.createdAt, "Ro'yxatdan o'tgan vaqt");
    const addHistory = (history: unknown, key: "follow" | "block", detail: string) => {
        if (!Array.isArray(history)) return;
        history.forEach((timestamp, index) => {
            addEvent(`${index % 2 === 0 ? key : `un${key}`}-${index}`, timestamp, detail);
        });
    };
    addHistory(user.followHistory, "follow", "Followlar tarixi");
    addHistory(user.blockHistory, "block", "Bloklash tarixi");
    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function formatDate(value?: string) {
    const date = validDate(value);
    if (!date) return "Vaqt kiritilmagan";
    return new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function UsersContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const notify = useNotification();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const dark = useThemeStore((state) => state.theme) === "dark";
    const params = useParams();
    const market = (params?.market as string) || "";
    const token = useTokenStore((state) => state.getActiveToken());
    const view = (searchParams.get("view") as ViewMode) || "all";
    const query = searchParams.get("q") || "";
    const sort = searchParams.get("sort") || "recent";
    const [now] = useState(() => Date.now());
    const newCutoff = now - 30 * 24 * 60 * 60 * 1000;

    const updateQuery = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams.toString());
        if (value && value !== "all" && !(key === "sort" && value === "recent")) next.set(key, value);
        else next.delete(key);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    };

    const getUsers = async () => {
        if (!market) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dashboard/users/${market}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
            setUsers(data.map((item: Record<string, unknown>) => {
                const userInfo = (item.user || {}) as Record<string, unknown>;
                const blockHistory = Array.isArray(item.block) ? item.block : [];
                return {
                    ...userInfo,
                    id: String(userInfo.id || item.id),
                    userName: String(userInfo.userName || "user"),
                    firstName: String(userInfo.firstName || ""),
                    lastName: String(userInfo.lastName || ""),
                    image: String(userInfo.image || ""),
                    email: String(userInfo.email || "Email kiritilmagan"),
                    name: `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim() || "Ism kiritilmagan",
                    phone: String(userInfo.phone || "Kiritilmagan"),
                    bio: String(userInfo.bio || "Kiritilmagan"),
                    isBlocked: blockHistory.length % 2 === 1,
                    followHistory: Array.isArray(item.follow) ? item.follow : [],
                    blockHistory,
                    createdAt: String(item.createdAt || userInfo.createdAt || ""),
                } as UserProfile;
            }));
        } catch (error) {
            notify.show(error instanceof Error ? error.message : "So'rov yuborilmadi", "error", dark ? "dark" : "light");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { getUsers(); }, [market, token]);

    const userRows = useMemo(() => users.map((user) => ({ user, events: makeActivity(user) })), [users]);
    const filteredRows = useMemo(() => userRows.filter(({ user, events }) => {
        const matchesQuery = !query || `${user.name} ${user.email} ${user.userName}`.toLowerCase().includes(query.toLowerCase());
        const latest = events[0]?.at ? new Date(events[0].at).getTime() : 0;
        const matchesView = view === "all" || (view === "blocked" && user.isBlocked) || (view === "new" && new Date(user.createdAt || 0).getTime() >= newCutoff) || (view === "active" && latest >= newCutoff);
        return matchesQuery && matchesView;
    }).sort((a, b) => sort === "name" ? a.user.name.localeCompare(b.user.name) : new Date(b.events[0]?.at || 0).getTime() - new Date(a.events[0]?.at || 0).getTime()), [userRows, query, view, sort, newCutoff]);

    const stats = useMemo(() => ({ all: users.length, newUsers: users.filter((user) => new Date(user.createdAt || 0).getTime() >= newCutoff).length, active: userRows.filter(({ events }) => new Date(events[0]?.at || 0).getTime() >= newCutoff).length, blocked: users.filter((user) => user.isBlocked).length, events: userRows.reduce((total, row) => total + row.events.length, 0) }), [users, userRows, newCutoff]);
    const chartData = useMemo(() => {
        const map = new Map<string, { day: string; allUsers: number; activeUsers: number; newRegistrations: number }>();
        userRows.forEach(({ events }) => events.forEach((event) => {
            const date = new Date(event.at);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const row = map.get(key) || { day: `${monthNames[date.getMonth()]} ${date.getFullYear()}`, allUsers: 0, activeUsers: 0, newRegistrations: 0 };
            row.allUsers += 1;
            if (date.getTime() >= newCutoff) row.activeUsers += 1;
            if (event.type === "joined") row.newRegistrations += 1;
            map.set(key, row);
        }));
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row).slice(-12);
    }, [userRows, newCutoff]);

    const handleBlockToggle = async (email: string) => {
        try {
            const targetUser = users.find(user => user.email === email);
            if (!targetUser) throw new Error("Foydalanuvchi topilmadi");
            const res = await fetch(`${API_URL}/followings/block/${market}`, {
                method: "PATCH",
                headers: {
                    Authorization: ["Bearer", token].join(" "),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ targetUserId: targetUser.id }),
            });
            if (!res.ok) throw new Error("User holatini yangilab bo'lmadi");
            const data: unknown = await res.json();
            if (
                typeof data !== "object" ||
                data === null ||
                !("block" in data) ||
                !Array.isArray(data.block) ||
                !data.block.every(timestamp => typeof timestamp === "string")
            ) {
                throw new Error("Server javobi noto'g'ri");
            }
            const blockHistory = data.block;
            const isBlocked = blockHistory.length % 2 === 1;
            setUsers(current => current.map(user =>
                user.id === targetUser.id ? { ...user, blockHistory, isBlocked } : user
            ));
            setSelectedUser(current =>
                current?.id === targetUser.id ? { ...current, blockHistory, isBlocked } : current
            );
            notify.show("User holati yangilandi", "success", dark ? "dark" : "light");
        } catch (error) {
            notify.show(error instanceof Error ? error.message : "So'rov yuborilmadi", "error", dark ? "dark" : "light");
        }
    };

    const viewOptions: { key: ViewMode; label: string; count: number; icon: typeof Users }[] = [{ key: "all", label: "All users", count: stats.all, icon: Users }, { key: "new", label: "New users", count: stats.newUsers, icon: UserPlus }, { key: "active", label: "Active users", count: stats.active, icon: UserCheck }, { key: "blocked", label: "Blocked", count: stats.blocked, icon: ShieldBan }];

    return <div className="w-full max-w-[1560px] mx-auto p-5 sm:p-8 space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-5"><div><div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-[0.22em]"><Activity className="w-4 h-4" /> User intelligence</div><h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">Foydalanuvchilar</h1><p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">Market {market || "tanlanmagan"} · Oxirgi 30 kunlik real activity</p></div><div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400"><Clock3 className="w-4 h-4 text-emerald-400" /> Live overview <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /></div></header>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4"><StatCard title="All users" value={stats.all} icon={Users} trend="Jami baza" delay={0} /><StatCard title="New users" value={stats.newUsers} icon={UserPlus} trend="30 kun ichida" delay={0.05} /><StatCard title="Active users" value={stats.active} icon={UserCheck} trend="So'nggi activity" delay={0.1} /><StatCard title="Blocked" value={stats.blocked} icon={UserX} trend="Nazorat kerak" delay={0.15} /><StatCard title="Events" value={stats.events} icon={ArrowUpRight} trend="Kuzatilgan action" delay={0.2} /></div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6"><UltimateGlassDiagram title="Userlar harakati" description="Qo'shilish, follow va boshqa activity lar bo'yicha oyma-oy ko'rinish" data={chartData} xAxisKey="day" height={360} series={[{ key: "allUsers", label: "Barcha activity", color: "#38bdf8" }, { key: "activeUsers", label: "Faol userlar", color: "#34d399" }, { key: "newRegistrations", label: "Yangi userlar", color: "#fb7185" }]} defaultChartType="area" customThemes={[{ name: "Sky", primary: "#38bdf8", secondary: "#0284c7", glowClass: "bg-sky-500" }, { name: "Emerald", primary: "#34d399", secondary: "#059669", glowClass: "bg-emerald-500" }, { name: "Rose", primary: "#fb7185", secondary: "#e11d48", glowClass: "bg-rose-500" }]} showTimeRangeFilter showCopyButton showDownloadButton enableZoomBrush /><GlassCard className="h-full"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-widest text-gray-400">Activity stream</p><h2 className="mt-2 text-xl font-bold">So'nggi voqealar</h2></div><CalendarDays className="w-5 h-5 text-sky-400" /></div><div className="mt-6 space-y-5">{userRows.flatMap(({ user, events }) => events.slice(0, 1).map((event) => ({ user, event }))).sort((a, b) => new Date(b.event.at).getTime() - new Date(a.event.at).getTime()).slice(0, 5).map(({ user, event }) => <button key={event.id} onClick={() => setSelectedUser(user)} className="w-full text-left flex gap-3 group"><span className="mt-1 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,.8)] shrink-0" /><span className="min-w-0"><span className="block text-sm font-semibold truncate group-hover:text-sky-400 transition-colors">{user.name}</span><span className="block text-xs text-gray-500 dark:text-neutral-400 mt-1">{event.label}</span><span className="block text-[11px] text-gray-400 mt-1">{formatDate(event.at)}</span></span></button>)}{!users.length && <p className="text-sm text-gray-500">Activity hali yo'q.</p>}</div></GlassCard></div>
        <section><div className="flex flex-col lg:flex-row gap-4 justify-between mb-5"><div className="flex gap-2 overflow-x-auto pb-1">{viewOptions.map(({ key, label, count, icon: Icon }) => <button key={key} onClick={() => updateQuery("view", key)} className={`shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-sm transition ${view === key ? "bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/20" : "border-white/10 text-gray-500 dark:text-neutral-400 hover:bg-white/10"}`}><Icon className="w-4 h-4" />{label}<span className="opacity-70">{count}</span></button>)}</div><div className="flex gap-2"><label className="flex items-center gap-2 min-w-0 px-3 rounded-2xl border border-white/10 bg-white/5"><Search className="w-4 h-4 text-gray-400" /><input value={query} onChange={(event) => updateQuery("q", event.target.value)} placeholder="Ism yoki email..." className="w-full sm:w-48 bg-transparent py-2.5 outline-none text-sm text-gray-900 dark:text-white" /></label><select value={sort} onChange={(event) => updateQuery("sort", event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-gray-600 dark:text-neutral-300 outline-none"><option value="recent">Eng yangi</option><option value="name">Ism bo'yicha</option></select></div></div>
            <div className="rounded-[24px] border border-white/10 overflow-hidden bg-white/5 backdrop-blur-xl"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-white/5 text-left text-[11px] uppercase tracking-widest text-gray-400"><th className="px-5 py-4">User</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Qo'shilgan</th><th className="px-5 py-4">Oxirgi activity</th><th className="px-5 py-4 text-right">Amallar</th></tr></thead><tbody>{filteredRows.map(({ user, events }) => <tr key={user.id} className="border-t border-white/5 hover:bg-white/5 transition"><td className="px-5 py-4"><div className="flex items-center gap-3 min-w-[220px]"><Image width={40} height={40} src={user.image || "https://i.ibb.co/nNZrjBSD/user.png"} alt={user.name} className="w-10 h-10 rounded-2xl object-cover bg-sky-500/10" /><div><p className="font-semibold text-gray-800 dark:text-white">{user.name}</p><p className="text-xs text-gray-500 mt-1">{user.email}</p></div></div></td><td className="px-5 py-4"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${user.isBlocked ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"}`}>{user.isBlocked ? "Blocked" : "Active"}</span></td><td className="px-5 py-4 text-gray-500 dark:text-neutral-400 whitespace-nowrap">{formatDate(user.createdAt)}</td><td className="px-5 py-4 text-gray-500 dark:text-neutral-400 whitespace-nowrap">{events[0] ? formatDate(events[0].at) : "Activity yo'q"}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button title="Profil va activity" onClick={() => setSelectedUser(user)} className="p-2 rounded-xl bg-sky-500/15 text-sky-400 hover:bg-sky-500/25"><Eye className="w-4 h-4" /></button><button title={user.isBlocked ? "Unblock" : "Block"} onClick={() => handleBlockToggle(user.email)} className={`p-2 rounded-xl ${user.isBlocked ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}><ShieldBan className="w-4 h-4" /></button></div></td></tr>)}</tbody></table></div>{!loading && !filteredRows.length && <div className="p-12 text-center text-sm text-gray-500">Bu filter bo'yicha user topilmadi.</div>}</div></section>
        {loading && <div className="fixed inset-0 pointer-events-none flex items-end justify-center pb-8"><div className="rounded-full bg-neutral-950/80 px-5 py-3 text-sm text-white shadow-2xl">Userlar yuklanmoqda...</div></div>}
        {selectedUser && <GlassModal title="User activity" open={!!selectedUser} size="3xl" onClose={() => setSelectedUser(null)}><div className="space-y-6"><div className="flex items-center gap-4"><Image width={72} height={72} src={selectedUser.image || "https://i.ibb.co/nNZrjBSD/user.png"} alt={selectedUser.name} className="w-[72px] h-[72px] rounded-3xl object-cover" /><div><h2 className="text-2xl font-bold">{selectedUser.name}</h2><p className="text-sky-400">@{selectedUser.userName || "user"}</p><p className="text-xs text-gray-500 mt-1">{selectedUser.email}</p></div></div><div className="grid grid-cols-2 gap-3"><GlassCard><p className="text-xs text-gray-400">Ro'yxatdan o'tgan</p><p className="mt-2 font-semibold">{formatDate(selectedUser.createdAt)}</p></GlassCard><GlassCard><p className="text-xs text-gray-400">Status</p><p className={`mt-2 font-semibold ${selectedUser.isBlocked ? "text-rose-400" : "text-emerald-400"}`}>{selectedUser.isBlocked ? "Blocked" : "Active"}</p></GlassCard></div><div><div className="flex items-center justify-between mb-3"><h3 className="font-bold">Aniq activity vaqtlari</h3><span className="text-xs text-gray-500">{makeActivity(selectedUser).length} ta event</span></div><div className="space-y-3">{makeActivity(selectedUser).map((event) => <div key={event.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"><span className="mt-1 w-2 h-2 rounded-full bg-sky-400 shrink-0" /><div className="min-w-0"><p className="text-sm font-semibold">{event.label}</p><p className="text-xs text-gray-500 mt-1">{event.detail}</p><p className="text-xs text-sky-400 mt-1">{formatDate(event.at)}</p></div></div>)}{!makeActivity(selectedUser).length && <p className="text-sm text-gray-500">Activity ma'lumoti mavjud emas.</p>}</div></div><button onClick={() => setSelectedUser(null)} className="w-full rounded-2xl border border-white/10 py-3 text-sm hover:bg-white/10 transition">Yopish <X className="inline w-4 h-4 ml-1" /></button></div></GlassModal>}
    </div>;
}

export default function UsersPage() {
    return <Suspense fallback={<div className="p-8 text-center">Loading...</div>}><UsersContent /></Suspense>;
}
