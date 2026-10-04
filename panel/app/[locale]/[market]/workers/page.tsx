"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { useThemeStore } from "@/app/_store/useThemeStore";
import { useRoleStore } from "@/app/_store/useRoleStore";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/components/Notification";

const ROLE_PERMISSIONS: Record<string, string[]> = {
    warehouse: [
        "product:get", "product:update", "stock:get", "stock:update",
        "warehouse:get", "warehouse:income", "warehouse:expense", "order:get",
    ],
    seller: ["product:get", "order:create", "order:get", "order:update"],
    manager: [
        "dashboard:get", "category:get", "category:create", "category:update", "category:delete",
        "product:get", "product:create", "product:update", "product:delete",
        "order:get", "order:update", "warehouse:get",
        "vacancy:get", "vacancy:create", "vacancy:update", "vacancy:delete",
        "slider:get", "slider:create", "slider:update", "slider:delete",
    ],
    admin: [
        "category:get", "category:create", "category:update", "category:delete",
        "comment:get", "comment:create", "comment:update", "comment:delete", "dashboard:get",
        "discount:get", "discount:create", "discount:update", "discount:delete",
        "message:get", "message:create", "message:update", "message:delete",
        "order:get", "order:create", "order:update", "order:delete",
        "product:get", "product:create", "product:update", "product:delete",
        "reaction:get", "reaction:create", "reaction:delete",
        "slider:get", "slider:create", "slider:update", "slider:delete",
        "stock:get", "stock:update",
        "user:show", "user:block",
        "vacancy:get", "vacancy:create", "vacancy:update", "vacancy:delete", "vacancy:rate",
        "warehouse:get", "warehouse:create", "warehouse:update", "warehouse:delete",
        "warehouse:income", "warehouse:expense",
        "worker:get", "worker:create", "worker:update", "worker:delete",
    ],
};

type Worker = {
    id: string;
    role: string;
    permissions: string[];
    user: {
        id: string;
        email: string;
        userName: string | null;
        firstName: string | null;
        lastName: string | null;
        image: string | null;
    };
};

type WorkerResponse = { data: Worker[]; total: number; page: number; limit: number; totalPages: number };

function WorkersContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { market = "" } = useParams<{ market: string }>();
    const token = useTokenStore((state) => state.getActiveToken());
    const dark = useThemeStore((state) => state.theme === "dark");
    const currentRole = useRoleStore((state) => state.role);
    const notification = useNotification();
    const [result, setResult] = useState<WorkerResponse>({
        data: [], total: 0, page: 1, limit: 20, totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [role, setRole] = useState("warehouse");
    const [permissions, setPermissions] = useState<string[]>(ROLE_PERMISSIONS.warehouse);
    const [myPermissions, setMyPermissions] = useState<string[]>([]);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const [editing, setEditing] = useState<Worker | null>(null);
    const [editRole, setEditRole] = useState("warehouse");
    const [editPermissions, setEditPermissions] = useState<string[]>([]);

    const query = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";
    const permissionsParam = searchParams.get("permissions") || "";
    const permissionFilters = useMemo(
        () => permissionsParam.split(",").map((permission) => permission.trim()).filter(Boolean),
        [permissionsParam],
    );
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = [10, 20, 50].includes(Number(searchParams.get("limit"))) ? Number(searchParams.get("limit")) : 20;
    const allPermissions = useMemo(
        () => [...new Set(Object.values(ROLE_PERMISSIONS).flat())].sort(),
        [],
    );
    const can = useCallback((action: string) => currentRole === "owner" || (permissionsLoaded && (myPermissions.includes("*") || myPermissions.includes(`worker:${action}`))), [currentRole, myPermissions, permissionsLoaded]);

    useEffect(() => {
        let active = true;
        const loadPermissions = async () => {
            if (!token || !market) {
                if (active) setPermissionsLoaded(true);
                return;
            }
            try {
                const response = await fetch(`${API_URL}/workers/get`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (currentRole === "owner") {
                    if (active) setMyPermissions(["*"]);
                    return;
                }
                const workers = response.ok ? await response.json() : [];
                const worker = Array.isArray(workers)
                    ? workers.find((item: { marketId?: string }) => item.marketId === market)
                    : undefined;
                if (active) setMyPermissions(Array.isArray(worker?.permissions) ? worker.permissions : []);
            } catch {
                if (active) setMyPermissions([]);
            } finally {
                if (active) setPermissionsLoaded(true);
            }
        };
        void loadPermissions();
        return () => { active = false; };
    }, [currentRole, market, token]);

    const updateFilter = useCallback((key: string, value: string, resetPage = true) => {
        const next = new URLSearchParams(searchParams.toString());
        next.delete("q");
        next.delete("permission");
        if (value) next.set(key, value);
        else next.delete(key);
        if (resetPage && key !== "page") next.delete("page");
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, [pathname, router, searchParams]);

    const loadWorkers = useCallback(async () => {
        if (!market || !token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({
                marketId: market,
                page: String(page),
                limit: String(limit),
            });
            if (query) params.set("search", query);
            if (roleFilter) params.set("role", roleFilter);
            if (permissionsParam) params.set("permissions", permissionsParam);
            const response = await fetch(`${API_URL}/workers?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Ishchilarni yuklab bo‘lmadi.");
            setResult(data);
        } catch (error) {
            notification.show(
                error instanceof Error ? error.message : "So‘rov yuborilmadi.",
                "error",
                dark ? "dark" : "light",
            );
        } finally {
            setLoading(false);
        }
    }, [dark, limit, market, notification, page, permissionsParam, query, roleFilter, token]);

    useEffect(() => {
        const timeout = window.setTimeout(() => { void loadWorkers(); }, 0);
        return () => window.clearTimeout(timeout);
    }, [loadWorkers]);

    const request = async (url: string, init: RequestInit) => {
        const response = await fetch(url, {
            ...init,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                ...init.headers,
            },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
            throw new Error(message || "So‘rov bajarilmadi.");
        }
        return data;
    };

    const submitNew = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            await request(`${API_URL}/workers`, {
                method: "POST",
                body: JSON.stringify({ marketId: market, identifier: identifier.trim(), role, permissions }),
            });
            setIdentifier("");
            setFormOpen(false);
            notification.show("Ishchi qo‘shildi.", "success", dark ? "dark" : "light");
            await loadWorkers();
        } catch (error) {
            notification.show(error instanceof Error ? error.message : "Ishchini qo‘shib bo‘lmadi.", "error", dark ? "dark" : "light");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (worker: Worker) => {
        setEditing(worker);
        setEditRole(worker.role);
        setEditPermissions(worker.permissions);
    };

    const saveEdit = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            await request(`${API_URL}/workers/${editing.id}?marketId=${encodeURIComponent(market)}`, {
                method: "PATCH",
                body: JSON.stringify({ role: editRole, permissions: editPermissions }),
            });
            setEditing(null);
            notification.show("Ishchi ma’lumotlari yangilandi.", "success", dark ? "dark" : "light");
            await loadWorkers();
        } catch (error) {
            notification.show(error instanceof Error ? error.message : "Ishchini yangilab bo‘lmadi.", "error", dark ? "dark" : "light");
        } finally {
            setSaving(false);
        }
    };

    const deleteWorker = async (worker: Worker) => {
        if (!window.confirm(`${worker.user.userName || worker.user.email} ishchilar ro‘yxatidan o‘chirilsinmi?`)) return;
        try {
            await request(`${API_URL}/workers/${worker.id}?marketId=${encodeURIComponent(market)}`, { method: "DELETE" });
            notification.show("Ishchi o‘chirildi.", "success", dark ? "dark" : "light");
            await loadWorkers();
        } catch (error) {
            notification.show(error instanceof Error ? error.message : "Ishchini o‘chirib bo‘lmadi.", "error", dark ? "dark" : "light");
        }
    };

    const togglePermission = (
        permission: string,
        selected: string[],
        setter: (permissions: string[]) => void,
    ) => setter(selected.includes(permission)
        ? selected.filter((item) => item !== permission)
        : [...selected, permission]);

    const cardClass = dark
        ? "border-white/10 bg-neutral-900/45 text-white"
        : "border-black/10 bg-white/65 text-neutral-900";
    const inputClass = dark
        ? "border-white/10 bg-black/20 text-white placeholder:text-neutral-500"
        : "border-black/10 bg-white text-neutral-900 placeholder:text-neutral-400";

    if (!market) return <div className="p-8">Market tanlanmagan.</div>;

    return (
        <section className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-semibold"><Users className="h-6 w-6 text-sky-500" /> Ishchilar</h1>
                    <p className="mt-1 text-sm opacity-65">Market xodimlari, rollari va ruxsatlarini boshqaring.</p>
                </div>
                {can("create") && <button
                    type="button"
                    onClick={() => setFormOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500"
                >
                    {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {formOpen ? "Yopish" : "Ishchi qo‘shish"}
                </button>}
            </header>

            {formOpen && can("create") && (
                <form onSubmit={submitNew} className={`grid gap-4 rounded-2xl border p-5 md:grid-cols-2 ${cardClass}`}>
                    <label className="space-y-1.5 text-sm">
                        <span>Email yoki username</span>
                        <input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} className={`w-full rounded-xl border px-3 py-2.5 outline-none focus:border-sky-500 ${inputClass}`} placeholder="name@example.com yoki username" />
                    </label>
                    <label className="space-y-1.5 text-sm">
                        <span>Rol</span>
                        <select value={role} onChange={(event) => {
                            setRole(event.target.value);
                            setPermissions(ROLE_PERMISSIONS[event.target.value]);
                        }} className={`w-full rounded-xl border px-3 py-2.5 ${inputClass}`}>
                            {Object.keys(ROLE_PERMISSIONS).map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </label>
                    <PermissionPicker
                        permissions={ROLE_PERMISSIONS[role]}
                        selected={permissions}
                        onToggle={(permission) => togglePermission(permission, permissions, setPermissions)}
                        dark={dark}
                    />
                    <div className="flex items-end">
                        <button disabled={saving} className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saqlanmoqda…" : "Qo‘shish"}</button>
                    </div>
                </form>
            )}

            <div className={`grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(220px,1fr)_180px_220px_120px] ${cardClass}`}>
                <label className={`flex items-center gap-2 rounded-xl border px-3 ${inputClass}`}>
                    <Search className="h-4 w-4 shrink-0 opacity-50" />
                    <input value={query} onChange={(event) => updateFilter("search", event.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" placeholder="Email, username yoki ism..." />
                </label>
                <select value={roleFilter} onChange={(event) => updateFilter("role", event.target.value)} className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`}>
                    <option value="">Barcha rollar</option>
                    {Object.keys(ROLE_PERMISSIONS).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <fieldset className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`}>
                    <legend className="px-1 opacity-65">Ruxsatlar ({permissionFilters.length})</legend>
                    <div className="flex max-h-28 flex-wrap gap-x-3 gap-y-1 overflow-y-auto">
                        {allPermissions.map((permission) => (
                            <label key={permission} className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs">
                                <input
                                    type="checkbox"
                                    checked={permissionFilters.includes(permission)}
                                    onChange={() => {
                                        const nextPermissions = permissionFilters.includes(permission)
                                            ? permissionFilters.filter((value) => value !== permission)
                                            : [...permissionFilters, permission].sort();
                                        updateFilter("permissions", nextPermissions.join(","));
                                    }}
                                    className="accent-sky-500"
                                />
                                {permission}
                            </label>
                        ))}
                    </div>
                </fieldset>
                <select value={limit} onChange={(event) => updateFilter("limit", event.target.value)} className={`rounded-xl border px-3 py-2 text-sm ${inputClass}`}>
                    {[10, 20, 50].map((value) => <option key={value} value={value}>{value} / sahifa</option>)}
                </select>
            </div>

            <div className={`overflow-hidden rounded-2xl border ${cardClass}`}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className={dark ? "bg-white/5 text-neutral-400" : "bg-black/5 text-neutral-500"}>
                            <tr>
                                <th className="px-5 py-3 font-medium">Foydalanuvchi</th>
                                <th className="px-5 py-3 font-medium">Rol</th>
                                <th className="px-5 py-3 font-medium">Ruxsatlar</th>
                                <th className="px-5 py-3 text-right font-medium">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-current/10">
                            {loading ? (
                                <tr><td colSpan={4} className="px-5 py-10 text-center opacity-60">Yuklanmoqda…</td></tr>
                            ) : result.data.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-10 text-center opacity-60">Ishchi topilmadi.</td></tr>
                            ) : result.data.map((worker) => (
                                <tr key={worker.id} className="align-top">
                                    <td className="px-5 py-4">
                                        <div className="font-medium">{[worker.user.firstName, worker.user.lastName].filter(Boolean).join(" ") || worker.user.userName || worker.user.email}</div>
                                        <div className="mt-1 text-xs opacity-60">{worker.user.email}{worker.user.userName ? ` · @${worker.user.userName}` : ""}</div>
                                    </td>
                                    <td className="px-5 py-4"><span className="rounded-lg bg-sky-500/10 px-2.5 py-1 text-sky-500">{worker.role}</span></td>
                                    <td className="px-5 py-4"><div className="flex max-w-xl flex-wrap gap-1.5">{worker.permissions.map((permission) => <span key={permission} className="rounded-md bg-current/5 px-2 py-1 text-xs opacity-75">{permission}</span>)}</div></td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-2">
                                            {can("update") && <button aria-label="Tahrirlash" onClick={() => startEdit(worker)} className="rounded-lg border border-current/10 p-2 hover:bg-current/5"><Pencil className="h-4 w-4" /></button>}
                                            {can("delete") && <button aria-label="O‘chirish" onClick={() => void deleteWorker(worker)} className="rounded-lg border border-rose-500/20 p-2 text-rose-500 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-current/10 px-5 py-3 text-sm">
                    <span className="opacity-60">{result.total} ta ishchi</span>
                    <div className="flex items-center gap-3">
                        <button disabled={page <= 1} onClick={() => updateFilter("page", String(page - 1), false)} className="rounded-lg border border-current/10 px-3 py-1.5 disabled:opacity-40">Oldingi</button>
                        <span>{page} / {Math.max(result.totalPages, 1)}</span>
                        <button disabled={page >= result.totalPages} onClick={() => updateFilter("page", String(page + 1), false)} className="rounded-lg border border-current/10 px-3 py-1.5 disabled:opacity-40">Keyingi</button>
                    </div>
                </footer>
            </div>

            {editing && can("update") && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
                    <div className={`max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl border p-5 ${cardClass}`}>
                        <div className="flex items-center justify-between">
                            <div><h2 className="text-lg font-semibold">Ishchini tahrirlash</h2><p className="mt-1 text-sm opacity-60">{editing.user.email}</p></div>
                            <button aria-label="Yopish" onClick={() => setEditing(null)} className="rounded-lg p-2 hover:bg-current/5"><X className="h-5 w-5" /></button>
                        </div>
                        <label className="block space-y-1.5 text-sm">
                            <span>Rol</span>
                            <select value={editRole} onChange={(event) => {
                                const nextRole = event.target.value;
                                setEditRole(nextRole);
                                setEditPermissions((current) => current.filter((permission) => ROLE_PERMISSIONS[nextRole].includes(permission)));
                            }} className={`w-full rounded-xl border px-3 py-2.5 ${inputClass}`}>
                                {Object.keys(ROLE_PERMISSIONS).map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </label>
                        <PermissionPicker
                            permissions={ROLE_PERMISSIONS[editRole]}
                            selected={editPermissions}
                            onToggle={(permission) => togglePermission(permission, editPermissions, setEditPermissions)}
                            dark={dark}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditing(null)} className="rounded-xl border border-current/10 px-4 py-2 text-sm">Bekor qilish</button>
                            <button disabled={saving} onClick={() => void saveEdit()} className="rounded-xl bg-sky-600 px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? "Saqlanmoqda…" : "Saqlash"}</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function PermissionPicker({
    permissions,
    selected,
    onToggle,
    dark,
}: {
    permissions: string[];
    selected: string[];
    onToggle: (permission: string) => void;
    dark: boolean;
}) {
    return (
        <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-sm font-medium">Ruxsatlar</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {permissions.map((permission) => (
                    <label key={permission} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${dark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
                        <input type="checkbox" checked={selected.includes(permission)} onChange={() => onToggle(permission)} className="accent-sky-500" />
                        {permission}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

export default function WorkersPage() {
    return <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}><WorkersContent /></Suspense>;
}
