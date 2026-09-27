"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassTable from "@/components/admin/GlassTable";
import GlassModal from "@/components/admin/GlassModal";
import GlassButton from "@/components/admin/GlassButton";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { useNotification } from "@/components/Notification";
import { useParams } from "next/navigation";
import GlassInput from "@/components/admin/GlassInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Edit3, Trash2, Plus, Calendar, MousePointerClick } from "lucide-react";
import { API_URL } from '@/lib/api';

interface Discount {
    id: string;
    title: string;
    percentage: number;
    startDate: string;
    endDate: string;
    market: string;
    [key: string]: unknown;
}

function DiscountContent({ setDiscountId, discountId }: { setDiscountId: React.Dispatch<React.SetStateAction<string>>, discountId: string }) {
    const [loading, setLoading] = useState<boolean>(true);

    const dark = useThemeStore((state) => state.theme) === "dark";
    const params = useParams();
    const market = (params?.market as string) || "";

    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/discounts`);
            const req = await res.json();

            if (res.ok && Array.isArray(req)) {
                const filteredData = req.filter((item: Discount) => item.market === market);
                setDiscounts(filteredData);
            }
        } catch (err) {
            console.error("Xatolik:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [market]);

    return (
        loading ? (
            <div className="text-center py-12 text-gray-500 text-lg">Loading...</div>
        ) : discounts.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-base bg-white/5 rounded-2xl border border-white/10">
                Bu market uchun chegirmalar topilmadi.
            </div>
        ) : (
            <GlassTable
                columns={[
                    { key: "title", label: "Chegirma Nomi" },
                    { key: "percentage", label: "Foiz (%)" },
                    { key: "startDate", label: "Boshlanish Vaqti" },
                    { key: "endDate", label: "Tugash Vaqti" },
                ]}
                data={discounts.map((disc) => ({
                    ...disc,
                    percentage: `-${disc.percentage}%`,
                    startDate: disc.startDate ? new Date(disc.startDate).toLocaleString() : "-",
                    endDate: disc.endDate ? new Date(disc.endDate).toLocaleString() : "-",
                })) as Record<string, unknown>[]}
                actions={(row) => {
                    const disc = row as unknown as Discount;
                    const originalDisc = discounts.find(d => d.title === disc.title && d.market === market) || disc;

                    return (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setDiscountId(originalDisc.id)}
                                className={`p-2 ${discountId === originalDisc.id ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-white/10 text-white hover:bg-white/20'} rounded-xl duration-300`}
                                title="Select"
                            >
                                <MousePointerClick className="w-4 h-4" />
                            </button>
                        </div>
                    );
                }}
            />
        )
    );
}

export default function ApplicationsPage({ setDiscountId, discountId }: { setDiscountId: React.Dispatch<React.SetStateAction<string>>, discountId: string }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-white">Loading...</div>}>
            <DiscountContent setDiscountId={setDiscountId} discountId={discountId} />
        </Suspense>
    );
}