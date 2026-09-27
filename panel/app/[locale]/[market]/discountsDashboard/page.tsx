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
import { Edit3, Trash2, Plus, Calendar } from "lucide-react";
import { API_URL } from '@/lib/api';

interface Discount {
    id: string;
    title: string;
    percentage: number;
    startDate: string;
    endDate: string;
    marketId: string;
    [key: string]: unknown;
}

function ApplicationsContent() {
    const notify = useNotification();
    const [loading, setLoading] = useState<boolean>(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<string | null>(null);

    const {getActiveToken} = useTokenStore((state) => state);
    const token = getActiveToken()
    const dark = useThemeStore((state) => state.theme) === "dark";
    const params = useParams();
    const market = (params?.market as string) || "";

    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [discountTitle, setDiscountTitle] = useState("");
    const [discountPercentage, setDiscountPercentage] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/discounts`);
            const req = await res.json();

            if (res.ok && Array.isArray(req)) {
                const filteredData = req.filter((item: Discount) => item.marketId === market);
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

    const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const url = editId
                ? `${API_URL}/discounts/${editId}`
                : `${API_URL}/discounts`;

            const method = editId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: discountTitle,
                    percentage: Number(discountPercentage),
                    startDate: startDate ? startDate.toISOString() : null,
                    endDate: endDate ? endDate.toISOString() : null,
                    marketId: market,
                }),
            });

            const req = await res.json();

            if (res.ok) {
                setIsOpen(false);
                setEditId(null);
                notify.show(
                    editId ? "Chegirma muvaffaqiyatli yangilandi" : "Yangi chegirma muvaffaqiyatli qo'shildi",
                    "success",
                    dark ? "dark" : "light"
                );
                resetForm();
                fetchData();
            } else {
                notify.show(req.message || "Nimadir xato ketdi", "error", dark ? "dark" : "light");
            }
        } catch (err) {
            notify.show("Serverga ulanishda xatolik", "error", dark ? "dark" : "light");
            console.log(err);
        }
    };

    const handleDeleteDiscount = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/discounts/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                notify.show("Chegirma o'chirildi", "success", dark ? "dark" : "light");
                fetchData();
            } else {
                notify.show("O'chirishda xatolik yuz berdi", "error", dark ? "dark" : "light");
            }
        } catch (err) {
            console.log(err);
            notify.show("Serverda xatolik", "error", dark ? "dark" : "light");
        }
    };

    const handleOpenEdit = (disc: Discount) => {
        setEditId(disc.id);
        setDiscountTitle(disc.title);
        setDiscountPercentage(disc.percentage.toString());
        setStartDate(disc.startDate ? new Date(disc.startDate) : null);
        setEndDate(disc.endDate ? new Date(disc.endDate) : null);
        setIsOpen(true);
    };

    const handleOpenCreate = () => {
        setEditId(null);
        resetForm();
        setIsOpen(true);
    };

    const resetForm = () => {
        setDiscountTitle("");
        setDiscountPercentage("");
        setStartDate(null);
        setEndDate(null);
    };

    return (
        <div className="w-full max-w-[1500px] mx-auto p-8">
            <div className="mb-10 border-l-4 border-sky-500 pl-6 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Discounts</h1>
                    <p className="text-sm text-neutral-400 mt-1">Do'kon chegirmalari va aksiyalarni boshqarish</p>
                </div>

                <GlassButton onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4 mr-2 inline" /> Create Discount
                </GlassButton>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 text-lg">Yuklanmoqda...</div>
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
                                    onClick={() => handleOpenEdit(originalDisc as Discount)}
                                    className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition"
                                    title="Edit"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteModal(originalDisc.id)}
                                    className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    }}
                />
            )}

            <GlassModal
                overflow="visible"
                title={editId ? "Discount update" : "Create Discount"}
                open={isOpen}
                onClose={() => setIsOpen(false)}
            >
                <form className="space-y-4 max-h-[80vh] w-full overflow-visible pb-10" onSubmit={handleSubmitForm}>
                    <GlassInput
                        label="Chegirma Nomi"
                        placeholder="Chegirma nomi..."
                        value={discountTitle}
                        onChange={(e) => setDiscountTitle(e.target.value)}
                        required
                    />
                    <GlassInput
                        label="Chegirma Foizi"
                        placeholder="Foiz miqdori (masalan: 20)..."
                        type="number"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        required
                    />

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium">Boshlanish sanasi</label>
                        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                            <Calendar className="w-4 h-4 text-sky-400 mr-2" />
                            <DatePicker
                                selected={startDate}
                                onChange={(date: Date | null) => setStartDate(date)}
                                showTimeSelect
                                dateFormat="Pp"
                                placeholderText="Boshlanish vaqtini tanlang"
                                className="bg-transparent text-xs text-white outline-none w-full placeholder:text-neutral-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium">Tugash sanasi</label>
                        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                            <Calendar className="w-4 h-4 text-sky-400 mr-2" />
                            <DatePicker
                                selected={endDate}
                                onChange={(date: Date | null) => setEndDate(date)}
                                showTimeSelect
                                dateFormat="Pp"
                                placeholderText="Tugash vaqtini tanlang"
                                className="bg-transparent text-xs text-white outline-none w-full placeholder:text-neutral-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                        <button
                            onClick={() => setIsOpen(false)}
                            type="button"
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <GlassButton
                            type="submit"
                            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20"
                        >
                            {editId ? "Update" : "Save"}
                        </GlassButton>
                    </div>
                </form>
            </GlassModal>

            <GlassModal title="Delete discount" open={!!deleteModal} onClose={() => setDeleteModal(null)}>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Haqiqatan ham bu chegirmani o'chirib yubormoqchimisiz?</p>

                    <div className="z-[999] flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                        <button
                            onClick={() => setDeleteModal(null)}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (deleteModal) {
                                    handleDeleteDiscount(deleteModal);
                                    setDeleteModal(null);
                                }
                            }}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </GlassModal>
        </div>
    );
}

export default function ApplicationsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-white">Yuklanmoqda...</div>}>
            <ApplicationsContent />
        </Suspense>
    );
}