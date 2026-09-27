"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassTable from "@/components/admin/GlassTable";
import GlassModal from "@/components/admin/GlassModal";
import GlassButton from "@/components/admin/GlassButton";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { useNotification } from "@/components/Notification";
import { useParams } from "next/navigation";
import GlassInput from "@/components/admin/GlassInput";
import {
    Edit3, Trash2, Plus, ExternalLink,
    ChevronLeft, ChevronRight, LayoutGrid, Table as TableIcon, Upload, Image as ImageIcon
} from "lucide-react";
import GlassCustomTable from "@/components/admin/GlassCustomTable";
import { API_URL } from '@/lib/api';

interface Slider {
    id: string;
    image: string;
    link: string;
    marketId: string;
    [key: string]: unknown;
}

function SlidersContent() {
    const notify = useNotification();
    const [loading, setLoading] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState<"slider" | "table">("slider");
    const [isOpen, setIsOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<string | null>(null);

    const {getActiveToken} = useTokenStore((state) => state);
    const token = getActiveToken()
    const dark = useThemeStore((state) => state.theme) === "dark";
    const params = useParams();
    const market = (params?.market as string) || "";

    const [sliders, setSliders] = useState<Slider[]>([]);
    const [link, setLink] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/sliders`);
            const req = await res.json();

            if (res.ok && Array.isArray(req)) {
                const filteredData = req.filter((item: Slider) => item.marketId === market);
                setSliders(filteredData);
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
            const formData = new FormData();
            formData.append("link", link);
            formData.append("marketId", market);
            if (imageFile) {
                formData.append("image", imageFile);
            }

            const url = editId
                ? `${API_URL}/sliders/${editId}`
                : `${API_URL}/sliders`;

            const method = editId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const req = await res.json();

            if (res.ok) {
                setIsOpen(false);
                setEditId(null);
                notify.show(
                    editId ? "Slider muvaffaqiyatli yangilandi" : "Yangi slider muvaffaqiyatli qo'shildi",
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

    const handleDeleteSlider = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/sliders/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                notify.show("Slider o'chirildi", "success", dark ? "dark" : "light");
                fetchData();
            } else {
                notify.show("O'chirishda xatolik yuz berdi", "error", dark ? "dark" : "light");
            }
        } catch (err) {
            console.log(err);
            notify.show("Serverda xatolik", "error", dark ? "dark" : "light");
        }
    };

    const handleOpenEdit = (slider: Slider) => {
        setEditId(slider.id);
        setLink(slider.link);
        setImagePreview(slider.image);
        setImageFile(null);
        setIsOpen(true);
    };

    const handleOpenCreate = () => {
        setEditId(null);
        resetForm();
        setIsOpen(true);
    };

    const resetForm = () => {
        setLink("");
        setImageFile(null);
        setImagePreview("");
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
        setScrollLeft(sliderRef.current?.scrollLeft || 0);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 2;
        if (sliderRef.current) {
            sliderRef.current.scrollLeft = scrollLeft - walk;
        }
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    const scrollSlider = (direction: "left" | "right") => {
        if (sliderRef.current) {
            const { clientWidth } = sliderRef.current;
            sliderRef.current.scrollBy({
                left: direction === "left" ? -clientWidth / 2 : clientWidth / 2,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className="w-full max-w-[1500px] mx-auto p-8">
            <div className="mb-8 border-l-4 border-sky-500 pl-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Sliders (Bannerlar)</h1>
                    <p className="text-sm text-neutral-400 mt-1">Do'kon uchun reklama bannerlarini boshqarish</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode("slider")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "slider" ? "bg-sky-500 text-white shadow" : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" /> Slider
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "table" ? "bg-sky-500 text-white shadow" : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            <TableIcon className="w-3.5 h-3.5" /> Table
                        </button>
                    </div>

                    <GlassButton onClick={handleOpenCreate}>
                        <Plus className="w-4 h-4 mr-2 inline" /> Create Slider
                    </GlassButton>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 text-lg">Yuklanmoqda...</div>
            ) : sliders.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-base bg-white/5 rounded-2xl border border-white/10">
                    Bu market uchun sliderlar topilmadi.
                </div>
            ) : viewMode === "slider" ? (
                <div className="relative group">
                    <button
                        onClick={() => scrollSlider("left")}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/60 hover:bg-sky-500 text-white rounded-full backdrop-blur-md transition shadow-lg opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scrollSlider("right")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/60 hover:bg-sky-500 text-white rounded-full backdrop-blur-md transition shadow-lg opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div
                        ref={sliderRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        className="flex gap-6 overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing pb-6 pt-2 px-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {sliders.map((slider) => (
                            <div
                                key={slider.id}
                                className="min-w-[380px] md:min-w-[450px] h-[240px] rounded-2xl overflow-hidden relative group/card border border-white/10 bg-white/5 flex-shrink-0 shadow-xl"
                            >
                                <img src={slider.image} alt="Slider" className="w-full h-full object-cover pointer-events-none" />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(slider)}
                                            className="p-2 bg-sky-500/80 hover:bg-sky-500 text-white rounded-xl backdrop-blur-md transition shadow"
                                            title="Tahrirlash"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal(slider.id)}
                                            className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl backdrop-blur-md transition shadow"
                                            title="O'chirish"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                                        <a
                                            href={slider.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-sky-300 truncate max-w-[300px] hover:underline flex items-center gap-1.5"
                                        >
                                            {slider.link} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <GlassCustomTable
                    columns={[
                        { key: "image", label: "Image" },
                        { key: "link", label: "Link" },
                    ]}
                    data={sliders.map((slider) => ({
                        id: slider.id,
                        marketId: slider.marketId,
                        image: (
                            <div className="flex items-center gap-4">
                                <img
                                    src={slider.image}
                                    alt="Slider"
                                    className="w-32 h-16 object-cover rounded-xl border border-white/20 shadow-md flex-shrink-0"
                                />
                                <span className="text-xs text-neutral-400 truncate max-w-[250px] font-mono">{slider.image}</span>
                            </div>
                        ),
                        link: (
                            <a
                                href={slider.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-400 hover:underline flex items-center gap-1.5 text-xs font-medium truncate max-w-[350px]"
                            >
                                {slider.link} <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                            </a>
                        )
                    })) as Record<string, React.ReactNode>[]}
                    actions={(row) => {
                        const slider = sliders.find(s => s.id === row.id) || (row as unknown as Slider);

                        return (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenEdit(slider)}
                                    className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition"
                                    title="Tahrirlash"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteModal(slider.id)}
                                    className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                                    title="O'chirish"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    }}
                />
            )}

            <GlassModal
                title={editId ? "Sliderni Tahrirlash" : "Create Slider"}
                open={isOpen}
                onClose={() => setIsOpen(false)}
            >
                <form className="space-y-4 w-full pb-4" onSubmit={handleSubmitForm}>
                    <GlassInput
                        label="Yo'naltirish havolasi (Link)"
                        placeholder="https://example.com/category/..."
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        required
                    />

                    <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 font-medium">Banner Rasmi</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 transition">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                <Upload className="w-6 h-6 text-sky-400 mb-2" />
                                <p className="text-xs text-neutral-300">
                                    <span className="font-semibold text-sky-400">Rasm yuklash uchun bosing</span>
                                </p>
                                <p className="text-[10px] text-neutral-500 mt-1">PNG, JPG, WEBP (Cloudinaryga yuklanadi)</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        setImageFile(file);
                                        setImagePreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </label>
                    </div>

                    {imagePreview && (
                        <div className="space-y-1.5">
                            <label className="text-xs text-neutral-400 font-medium">Tanlangan rasm ko'rinishi</label>
                            <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            onClick={() => setIsOpen(false)}
                            type="button"
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Bekor qilish
                        </button>
                        <GlassButton
                            type="submit"
                            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20"
                        >
                            {editId ? "Yangilash" : "Saqlash"}
                        </GlassButton>
                    </div>
                </form>
            </GlassModal>

            <GlassModal title="Delete slider" open={!!deleteModal} onClose={() => setDeleteModal(null)}>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Haqiqatan ham bu sliderni o'chirib yubormoqchimisiz?</p>

                    <div className="flex items-center justify-end gap-3 pt-6">
                        <button
                            onClick={() => setDeleteModal(null)}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (deleteModal) {
                                    handleDeleteSlider(deleteModal);
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

export default function SlidersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-white">Yuklanmoqda...</div>}>
            <SlidersContent />
        </Suspense>
    );
}