"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { API_URL } from "@/lib/api";

interface ProductComment {
    id: string;
    comment: string;
    reply: string | null;
    rate: number;
    createdAt: string;
    user: { userName: string | null };
    product: { id: string; title: string };
}

interface CommentResponse {
    data: ProductComment[];
    total: number;
    page: number;
    hasMore: boolean;
}

export default function CommentManagement() {
    const params = useParams();
    const searchParams = useSearchParams();
    const marketId = String(params.market ?? "");
    const productId = searchParams.get("id") ?? undefined;
    const token = useTokenStore((state) => state.getActiveToken());
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<CommentResponse>({
        data: [],
        total: 0,
        page: 1,
        hasMore: false,
    });
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadComments = useCallback(async () => {
        if (!marketId || !token) {
            setLoading(false);
            setError(!marketId ? "Market ID topilmadi." : "Sharhlarni boshqarish uchun tizimga kiring.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const query = new URLSearchParams({ page: String(page), limit: "20" });
            if (productId) query.set("productId", productId);
            const response = await fetch(
                `${API_URL}/comments/market/${encodeURIComponent(marketId)}?${query}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const payload: unknown = await response.json();
            if (!response.ok) {
                const message = payload && typeof payload === "object" && "message" in payload
                    ? String(payload.message)
                    : `Sharhlarni yuklab bo‘lmadi: ${response.status}`;
                throw new Error(message);
            }
            if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
                throw new Error("Sharhlar javobi noto‘g‘ri formatda.");
            }
            const comments = payload as CommentResponse;
            setResult(comments);
            setDrafts(Object.fromEntries(comments.data.map((comment) => [comment.id, comment.reply ?? ""])));
        } catch (requestError) {
            console.error("Panel sharhlarini yuklashda xatolik:", requestError);
            setError(requestError instanceof Error ? requestError.message : "Sharhlarni yuklab bo‘lmadi.");
        } finally {
            setLoading(false);
        }
    }, [marketId, page, productId, token]);

    useEffect(() => {
        void loadComments();
    }, [loadComments]);

    const saveReply = async (commentId: string) => {
        setSavingId(commentId);
        setError("");
        setNotice("");
        try {
            const response = await fetch(`${API_URL}/comments/${commentId}/reply`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reply: drafts[commentId] ?? "" }),
            });
            const payload: unknown = await response.json();
            if (!response.ok) {
                const message = payload && typeof payload === "object" && "message" in payload
                    ? String(payload.message)
                    : `Javobni saqlab bo‘lmadi: ${response.status}`;
                throw new Error(message);
            }
            setNotice("Javob saqlandi.");
            await loadComments();
        } catch (requestError) {
            console.error("Sharh javobini saqlashda xatolik:", requestError);
            setError(requestError instanceof Error ? requestError.message : "Javobni saqlab bo‘lmadi.");
        } finally {
            setSavingId(null);
        }
    };

    const deleteComment = async (commentId: string) => {
        if (!window.confirm("Ushbu sharhni o‘chirmoqchimisiz?")) return;
        setError("");
        setNotice("");
        try {
            const response = await fetch(`${API_URL}/comments/market/${commentId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error(`Sharhni o‘chirib bo‘lmadi: ${response.status}`);
            if (result.data.length === 1 && page > 1) setPage((current) => current - 1);
            else await loadComments();
        } catch (requestError) {
            console.error("Sharhni o‘chirishda xatolik:", requestError);
            setError(requestError instanceof Error ? requestError.message : "Sharhni o‘chirib bo‘lmadi.");
        }
    };

    return (
        <main className="mx-auto min-h-[70vh] max-w-6xl space-y-6 p-4 py-8 sm:p-8">
            <header>
                <h1 className="text-2xl font-bold text-white">Mahsulot sharhlari</h1>
                <p className="mt-1 text-sm text-neutral-400">
                    Xaridor sharhlariga market nomidan javob bering yoki qoidalarga zid sharhlarni o‘chiring.
                </p>
            </header>

            {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}

            {loading ? (
                <p className="py-12 text-center text-neutral-400">Sharhlar yuklanmoqda…</p>
            ) : result.data.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-neutral-400">Hozircha sharhlar yo‘q.</p>
            ) : (
                <div className="space-y-4">
                    {result.data.map((comment) => (
                        <article key={comment.id} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-white">{comment.product.title}</p>
                                    <p className="mt-1 text-sm text-neutral-400">
                                        {comment.user.userName || "Xaridor"} · {new Date(comment.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span aria-label={`${comment.rate} / 5 yulduz`} className="text-amber-400">
                                    {"★".repeat(Math.max(0, Math.min(5, comment.rate)))}
                                    <span className="ml-1 text-neutral-500">{comment.rate}/5</span>
                                </span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-200">{comment.comment}</p>
                            <label className="block space-y-2 text-sm text-neutral-300">
                                <span>Market javobi</span>
                                <textarea
                                    value={drafts[comment.id] ?? ""}
                                    maxLength={1000}
                                    rows={3}
                                    onChange={(event) => setDrafts((current) => ({
                                        ...current,
                                        [comment.id]: event.target.value,
                                    }))}
                                    className="w-full resize-y rounded-xl border border-white/10 bg-black/20 p-3 text-white outline-none focus:border-sky-500"
                                    placeholder="Xaridorga javob yozing..."
                                />
                            </label>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => void deleteComment(comment.id)}
                                    className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                                >
                                    Sharhni o‘chirish
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void saveReply(comment.id)}
                                    disabled={savingId === comment.id}
                                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {savingId === comment.id ? "Saqlanmoqda…" : "Javobni saqlash"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <footer className="flex items-center justify-between text-sm text-neutral-400">
                <span>Jami: {result.total} ta</span>
                <div className="flex gap-2">
                    <button
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((current) => current - 1)}
                        className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40"
                    >
                        Oldingi
                    </button>
                    <span className="px-2 py-2">{page}</span>
                    <button
                        disabled={!result.hasMore || loading}
                        onClick={() => setPage((current) => current + 1)}
                        className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40"
                    >
                        Keyingi
                    </button>
                </div>
            </footer>
        </main>
    );
}
