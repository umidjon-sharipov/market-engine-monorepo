"use client";

import Image from "next/image";
import React, { useCallback, useState, useEffect, Suspense } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassTable from "@/components/admin/GlassTable";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { useParams } from "next/navigation";
import { Layers, ChevronDown, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { API_URL } from '@/lib/api';

interface SubItem {
    id: string;
    title: string;
    image?: string | null;
    hidden?: boolean;
    children?: SubItem[];
}

interface CategoryOption {
    id: string;
    title: string;
    hidden?: boolean;
    items: SubItem[];
}

interface Categorie {
    id: string;
    title: string;
    marketId?: string;
    marketid?: string;
    market?: string;
    options: CategoryOption[];
    createdAt: string;
    [key: string]: unknown;
}

interface Category {
    id: string;
    title: string;
    image: string | null;
    hidden: boolean;
    marketId?: string;
    marketid?: string;
    options: CategoryOption[];
    createdAt: string;
    [key: string]: unknown;
}

function CategoryItemPreview({ 
    item, 
    setExpandedRow, 
    expandedRow 
}: { 
    item: SubItem; 
    setExpandedRow: React.Dispatch<React.SetStateAction<string | null>>; 
    expandedRow: string | null;
}) {
    const isExpanded = expandedRow === item.id;

    return (
        <div className="ml-3 border-l border-white/10 pl-3">
            <button 
                onClick={() => { setExpandedRow(isExpanded ? null : item.id); console.log(item.id); }} 
                className="flex items-center gap-2 py-1"
            >
                { item.image && typeof item.image === "string" ? (
                    <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-md">
                        <Image src={ item.image } alt={ item.title } fill className="object-cover" />
                    </div>
                ) : null }
                <span className="truncate text-xs text-neutral-200">{ item.title }</span>
                { item.hidden && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">Hidden</span> }
            </button>
            
            {/* Ichma-ich joylashgan barcha bolalarni (children) rekursiv ko'rsatish */}
            { item.children && item.children.map((child) => (
                <CategoryItemPreview 
                    key={ child.id ?? child.title } 
                    item={ child } 
                    expandedRow={ expandedRow } 
                    setExpandedRow={ setExpandedRow } 
                />
            )) }
        </div>
    );
}

const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function CategoriesContent({ setCategoryId, categoryId }: { setCategoryId: React.Dispatch<React.SetStateAction<string>>, categoryId: string }) {
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const { getActiveToken } = useTokenStore((state) => state);
    const token = getActiveToken();
    const dark = useThemeStore((state) => state.theme) === "dark";
    const params = useParams();
    const market = (params?.market as string) || "";
    const [categories, setCategories] = useState<Categorie[]>([]);

    const fetchData = useCallback(async () => {
        if (!isUuid(market)) {
            throw new Error('URL parametrida yaroqli market UUID topilmadi.');
        }
        const res = await fetch(`${API_URL}/categories/market/${encodeURIComponent(market)}`, {
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

    // Rekursiv ko'rinishda cheksiz chuqurlikdagi ID'larni yig'ib boruvchi render funksiyasi
    const renderItem = (
        category: Categorie,
        option: CategoryOption,
        item: SubItem,
        parentIds: string[] = []
    ): React.ReactNode => {
        // Har bir qatlamdagi item.id larni massivga qo'shib boramiz
        const itemIds = [...parentIds, item.id];
        
        // category.id | option.id | item.id | subitem.id | subsubitem.id ... ko'rinishida hosil qilamiz
        const selectedValue = [category.id, option.id, ...itemIds].join("|");

        return (
            <div key={item.id} className="space-y-1 ml-2 border-l border-white/5 pl-2">
                <button
                    type="button"
                    onClick={() => {
                        console.log("Selected Value:", selectedValue);
                        setCategoryId(selectedValue);
                    }}
                    aria-pressed={categoryId === selectedValue}
                    className={`${
                        categoryId === selectedValue 
                            ? "bg-sky-700/20 border-sky-500 text-sky-300" 
                            : "bg-black/20 border-white/5 text-neutral-200 hover:bg-white/5"
                    } flex w-full items-center gap-2 rounded-lg border p-1.5 transition`}
                >
                    {item.image ? (
                        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                            <Image src={item.image} alt={item.title} fill className="object-cover" />
                        </div>
                    ) : <span className="h-8 w-8 rounded-md bg-white/5 flex items-center justify-center text-[10px]">No Img</span>}
                    
                    <span className="truncate text-xs font-medium">{item.title}</span>
                    
                    <span className="ml-auto text-[10px] text-neutral-500">
                        {item.children && item.children.length > 0 ? "Oraliq kategoriya" : "Mahsulot tanlovi"}
                    </span>
                </button>

                {/* Agarda child mavjud bo'lsa, rekursiv ravishda yana chaqiriladi va itemIds uzatiladi */}
                {item.children && item.children.map((child) => renderItem(category, option, child, itemIds))}
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
                                <div className="flex items-center gap-2">
                                    <button className="rounded-xl bg-sky-500/10 p-2 text-sky-400 hover:bg-sky-500/20" title="Edit">
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden space-y-2 pt-2 border-t border-white/10"
                                    >
                                        {cat.options?.map((opt) => (
                                            <div key={opt.id ?? opt.title} className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs text-sky-400">{opt.title}</span>
                                                    {opt.hidden && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">Hidden</span>}
                                                </div>
                                                <div className="space-y-2">
                                                    {opt.items?.map((item) => renderItem(cat, opt, item))}
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