"use client";

import Image from "next/image";
import React, { useCallback, useState, useEffect, Suspense } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassTable from "@/components/admin/GlassTable";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { useParams } from "next/navigation";
import { Layers, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { API_URL } from '@/lib/api';

interface SubItem {
    id: string;
    title: string;
    image: string;
    children: SubItem[];
}

interface CategoryOption {
    id: string;
    title: string;
    items: SubItem[];
}

interface Categorie {
    id: string;
    title: string;
    marketId?: string;
    marketid?: string;
    options: CategoryOption[];
    createdAt: string;
    [key: string]: unknown;
}

const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function CategoriesContent({ setCategoryId, categoryId }: { setCategoryId: React.Dispatch<React.SetStateAction<string>>, categoryId: string }) {
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const {getActiveToken} = useTokenStore((state) => state);
    const token = getActiveToken()
    const dark = useThemeStore((state) => state.theme) === "dark";
    const params = useParams();
    const market = (params?.market as string) || "";
    const [categories, setCategories] = useState<Categorie[]>([]);

    const fetchData = useCallback(async () => {
        if (!isUuid(market)) {
            throw new Error('URL parametrida yaroqli market UUID topilmadi.');
        }
        const res = await fetch(`${API_URL}/categories?marketId=${encodeURIComponent(market)}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const req = await res.json();
        if (!res.ok) throw new Error(req.message || "Kategoriyalarni yuklab bo'lmadi");
        return Array.isArray(req)
            ? req.filter((item: Categorie) => {
                const mId = item.marketId || item.marketid;
                return mId === market;
            })
            : [];
    }, [market, token]);

    useEffect(() => {
        let active = true;
        fetchData()
            .then((data) => {
                if (active) setCategories(data);
            })
            .catch((error) => console.error("Xatolik:", error))
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [fetchData, market]);

    const renderItem = (
        category: Categorie,
        option: CategoryOption,
        item: SubItem,
        parentIds: string[] = [],
    ): React.ReactNode => {
        const itemIds = [...parentIds, item.id];
        const selectedValue = [category.id, option.id, ...itemIds].join("|");
        return (
            <div key={item.id} className="space-y-1">
                <button
                    type="button"
                    onClick={() => setCategoryId(selectedValue)}
                    aria-pressed={categoryId === selectedValue}
                    className={`${categoryId === selectedValue ? "bg-sky-700/10 border-sky-500" : "bg-black/20 border-white/5"} flex w-full items-center gap-2 rounded-lg border p-1.5`}
                >
                    {item.image ? (
                        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                            <Image src={item.image} alt={item.title} fill className="object-cover" />
                        </div>
                    ) : <span className="h-8 w-8" />}
                    <span className="truncate text-xs text-neutral-200">{item.title}</span>
                    <span className="ml-auto text-[10px] text-neutral-500">
                        {item.children?.length ? "Oraliq kategoriya" : "Mahsulot tanlovi"}
                    </span>
                </button>
                {item.children?.map((child) => renderItem(category, option, child, itemIds))}
            </div>
        );
    };

    return (
        loading ? (
            <div className="text-center py-12 text-gray-500 text-lg">Yuklanmoqda...</div>
        ) : categories.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-base bg-white/5 rounded-2xl border border-white/10">
                Bu market uchun kategoriyalar topilmadi.
            </div>
        ) : (
            <GlassTable
                columns={[
                    { key: "title", label: "Kategoriya Nomi" },
                    { key: "createdAt", label: "Yaratilgan Vaqti" },
                ]}
                data={categories.map(cat => ({
                    ...cat,
                    createdAt: new Date(cat.createdAt).toLocaleString()
                })) as Record<string, unknown>[]}
                
                actions={(row) => {
                    const cat = row as unknown as Categorie;
                    const isExpanded = expandedRow === cat.id;
                    const originalDisc = categories.find(c => c.title === cat.title && c.market === market) || cat;

                    return (
                        <div className="flex flex-col gap-2 w-full">
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    onClick={() => setExpandedRow(isExpanded ? null : cat.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border transition",
                                        dark ? "bg-white/5 border-white/10 hover:bg-white/10 text-sky-400" : "bg-sky-50 border-sky-200 text-sky-600"
                                    )}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>{cat.options?.length || 0} ta Option</span>
                                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                                </button>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden space-y-2 pt-2 border-t border-white/10"
                                    >
                                        {cat.options?.map((opt, idx) => (
                                            <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
                                                <span className="font-bold text-xs text-sky-400">{opt.title}</span>
                                                <div className="space-y-2">
                                                    {opt.items?.map((item) => renderItem(originalDisc, opt, item))}
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                }}
            />
        )
    );
}

export default function CategoriesPage({ setCategoryId, categoryId }: { setCategoryId: React.Dispatch<React.SetStateAction<string>>, categoryId: string }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-white">Yuklanmoqda...</div>}>
            <CategoriesContent setCategoryId={setCategoryId} categoryId={categoryId} />
        </Suspense>
    );
}