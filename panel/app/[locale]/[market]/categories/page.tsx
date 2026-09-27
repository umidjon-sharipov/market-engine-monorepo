"use client";

import Image from "next/image";
import React, { useState, useEffect, Suspense } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassTable from "@/components/admin/GlassTable";
import GlassModal from "@/components/admin/GlassModal";
import GlassButton from "@/components/admin/GlassButton";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { useNotification } from "@/components/Notification";
import { useParams } from "next/navigation";
import GlassInput from "@/components/admin/GlassInput";
import { Plus, Trash2, Edit3, Layers, Upload, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { API_URL } from '@/lib/api';

interface SubItem {
    title: string;
    image: string | File;
}

interface CategoryOption {
    title: string;
    items: SubItem[];
}

interface Categorie {
    id: string;
    title: string;
    marketId?: string;
    options: CategoryOption[];
    createdAt: string;
    [key: string]: unknown;
}

function CategoriesContent() {
    const notify = useNotification();
    const [loading, setLoading] = useState<boolean>(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<string | null>(null);

    const {getActiveToken} = useTokenStore((state) => state);
    const token = getActiveToken()
    const dark = useThemeStore((state) => state.theme) === "dark";
    const params = useParams();
    const market = (params?.market as string) || "";
    const [categories, setCategories] = useState<Categorie[]>([]);

    const [categoryTitle, setCategoryTitle] = useState("");
    const [optionsList, setOptionsList] = useState<CategoryOption[]>([
        { title: "", items: [{ title: "", image: "" }] },
    ]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/categories`);
            const req = await res.json();

            if (res.ok && Array.isArray(req)) {
                const filteredData = req.filter((item: Categorie) => {
                    const mId = item.marketId || item.marketid;
                    return mId === market;
                });
                setCategories(filteredData);
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

    const handleAddOptionBlock = () => {
        setOptionsList([...optionsList, { title: "", items: [{ title: "", image: "" }] }]);
    };

    const handleRemoveOptionBlock = (index: number) => {
        setOptionsList(optionsList.filter((_, i) => i !== index));
    };

    const handleItemChange = (optIndex: number, itemIndex: number, field: 'title' | 'image', value: string | File) => {
        const updated = [...optionsList];
        updated[optIndex].items[itemIndex][field] = value as any;

        const isLastItem = itemIndex === updated[optIndex].items.length - 1;
        const hasTitle = updated[optIndex].items[itemIndex].title.trim() !== '';
        const hasImage = updated[optIndex].items[itemIndex].image !== "";

        if (isLastItem && (hasTitle || hasImage)) {
            updated[optIndex].items.push({ title: "", image: "" });
        }

        setOptionsList(updated);
    };

    const handleRemoveSubItem = (optIndex: number, itemIndex: number) => {
        const updated = [...optionsList];
        updated[optIndex].items = updated[optIndex].items.filter((_, i) => i !== itemIndex);
        if (updated[optIndex].items.length === 0) {
            updated[optIndex].items.push({ title: "", image: "" });
        }
        setOptionsList(updated);
    };

    const handleImageUpload = (optIndex: number, itemIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleItemChange(optIndex, itemIndex, 'image', file);
        }
    };

    const getImageSrc = (image: string | File) => {
        if (!image) return "";
        if (typeof image === "object") {
            return URL.createObjectURL(image);
        }
        return image;
    };

    const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!market) {
            notify.show("Marketni tanlang!", "error", dark ? "dark" : "light");
            return;
        }

        const formData = new FormData();
        formData.append("title", categoryTitle);
        if (market) {
            formData.append("marketId", market);
        }

        const cleanedOptions = optionsList.map(opt => ({
            ...opt,
            items: opt.items.filter(item => item.title.trim() !== "" || item.image !== "")
        })).filter(opt => opt.title.trim() !== "" && opt.items.length > 0);

        const optionsPayload = cleanedOptions.map((opt, optIndex) => ({
            title: opt.title,
            items: opt.items.map((item, itemIndex) => {
                if (item.image instanceof File) {
                    formData.append(`file_${optIndex}_${itemIndex}`, item.image);
                    return { title: item.title, image: "" };
                }
                return { title: item.title, image: item.image };
            })
        }));

        formData.append("options", JSON.stringify(optionsPayload));

        try {
            const url = editId
                ? `${API_URL}/categories/${editId}`
                : `${API_URL}/categories`;

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
                notify.show(editId ? "Kategoriya yangilandi" : "Yangi kategoriya qo'shildi", "success", dark ? "dark" : "light");
                setCategoryTitle("");
                setOptionsList([{ title: "", items: [{ title: "", image: "" }] }]);
                fetchData();
            } else {
                notify.show(req.message || "Xatolik yuz berdi", "error", dark ? "dark" : "light");
            }
        } catch (err) {
            notify.show("Serverga ulanishda xatolik", "error", dark ? "dark" : "light");
            console.log(err);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/categories/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                notify.show("Kategoriya o'chirildi", "success", dark ? "dark" : "light");
                fetchData();
            } else {
                notify.show("O'chirishda xatolik", "error", dark ? "dark" : "light");
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handleOpenEdit = (cat: Categorie) => {
        setEditId(cat.id);
        setCategoryTitle(cat.title);
        const formattedOptions = cat.options.map(opt => ({
            ...opt,
            items: [...opt.items, { title: "", image: "" }]
        }));
        setOptionsList(formattedOptions);
        setIsOpen(true);
    };

    const handleOpenCreate = () => {
        setEditId(null);
        setCategoryTitle("");
        setOptionsList([{ title: "", items: [{ title: "", image: "" }] }]);
        setIsOpen(true);
    };

    return (
        <div className="w-full max-w-[1500px] mx-auto p-8">
            <div className="mb-10 border-l-4 border-sky-500 pl-6 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Categories</h1>
                    <p className="text-sm text-neutral-400 mt-1">Do'kon kategoriyalari va ularning filter optionlari</p>
                </div>

                <GlassButton onClick={handleOpenCreate}>
                    <Plus className="w-4 h-4 mr-2 inline" /> Create Category
                </GlassButton>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500 text-lg">Loading...</div>
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
                                        <button
                                            onClick={() => handleOpenEdit(cat)}
                                            className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition"
                                            title="Edit"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal(cat.id)}
                                            className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
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
                                            {cat.options?.map((opt, idx) => (
                                                <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
                                                    <span className="font-bold text-xs text-sky-400">{opt.title}</span>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {opt.items?.map((item, iIdx) => (
                                                            <div key={iIdx} className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5">
                                                                {item.image ? (
                                                                    <div className="relative w-8 h-8 rounded-md overflow-hidden bg-neutral-800 flex-shrink-0">
                                                                        <Image src={typeof item.image === 'string' ? item.image : URL.createObjectURL(item.image)} alt={item.title} fill className="object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-[10px]">Rasm yo'q</div>
                                                                )}
                                                                <span className="text-xs truncate text-neutral-200">{item.title}</span>
                                                            </div>
                                                        ))}
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
            )}

            <GlassModal size="2xl" title={editId ? "Kategoriyani Tahrirlash" : "Create Category with Options"} open={isOpen} onClose={() => setIsOpen(false)}>
                <form className="space-y-4 max-h-[75vh] w-full px-1 pb-20" onSubmit={handleSubmitForm}>
                    <GlassInput
                        label="Kategoriya Nomi"
                        placeholder="Masalan: Elektronika, Kiyim-kechak..."
                        value={categoryTitle}
                        onChange={(e) => setCategoryTitle(e.target.value)}
                        required
                    />
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                                <Layers className="w-4 h-4" /> Options & SubItems
                            </label>
                        </div>

                        {optionsList.map((opt, optIndex) => (
                            <div
                                key={optIndex}
                                className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-4 relative"
                            >
                                <div className="flex items-center gap-3">
                                    <GlassInput
                                        placeholder="Option nomi..."
                                        value={opt.title}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            let newOptions = [...optionsList];

                                            if (value.trim() === "" && newOptions.length > 1) {
                                                newOptions = newOptions.filter((_, i) => i !== optIndex);
                                            } else {
                                                newOptions = newOptions.map((item, i) => {
                                                    if (i === optIndex) {
                                                        return { ...item, title: value };
                                                    }
                                                    return item;
                                                });

                                                const lastOpt = newOptions[newOptions.length - 1];
                                                if (optIndex === newOptions.length - 1 && value.trim() !== "" && lastOpt.title.trim() !== "") {
                                                    newOptions.push({ title: "", items: [{ title: "", image: "" }] });
                                                }
                                            }

                                            setOptionsList(newOptions.length > 0 ? newOptions : [{ title: "", items: [{ title: "", image: "" }] }]);
                                        }}
                                    />
                                    
                                    {optionsList.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newOptions = optionsList.filter((_, i) => i !== optIndex);
                                                setOptionsList(newOptions.length > 0 ? newOptions : [{ title: "", items: [{ title: "", image: "" }] }]);
                                            }}
                                            className="p-3 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/30 transition flex-shrink-0"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="pl-4 border-l-2 border-sky-500/30 space-y-3">
                                    <span className="text-xs text-neutral-400 font-medium block">Ichki elementlar</span>

                                    {opt.items.map((subItem, subIndex) => (
                                        <div key={subIndex} className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    placeholder="Item nomi..."
                                                    value={subItem.title}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        let newOptions = [...optionsList];

                                                        newOptions = newOptions.map((o, i) => {
                                                            if (i === optIndex) {
                                                                let updatedItems = [...o.items];

                                                                if (value.trim() === "" && updatedItems.length > 1) {
                                                                    updatedItems = updatedItems.filter((_, j) => j !== subIndex);
                                                                } else {
                                                                    updatedItems = updatedItems.map((item, j) => {
                                                                        if (j === subIndex) {
                                                                            return { ...item, title: value };
                                                                        }
                                                                        return item;
                                                                    });

                                                                    const lastItem = updatedItems[updatedItems.length - 1];
                                                                    if (subIndex === updatedItems.length - 1 && value.trim() !== "" && lastItem.title.trim() !== "") {
                                                                        updatedItems.push({ title: "", image: "" });
                                                                    }
                                                                }

                                                                return { ...o, items: updatedItems.length > 0 ? updatedItems : [{ title: "", image: "" }] };
                                                            }
                                                            return o;
                                                        });

                                                        setOptionsList(newOptions);
                                                    }}
                                                    className="w-full rounded-xl py-2 px-3 text-xs outline-none bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-sky-500"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 flex-1">
                                                <label className="flex-1 cursor-pointer flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/10 hover:bg-white/10 transition text-neutral-300">
                                                    <span className="truncate">{subItem.image ? "Rasm yuklandi ✓" : "rasm yuklash"}</span>
                                                    <Upload className="w-3.5 h-3.5 text-sky-400 ml-1" />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleImageUpload(optIndex, subIndex, e)}
                                                    />
                                                </label>
                                                {subItem.image && (
                                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 flex-shrink-0">
                                                        <Image src={getImageSrc(subItem.image)} alt="Preview" fill className="object-cover" />
                                                    </div>
                                                )}
                                            </div>

                                            {opt.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newOptions = optionsList.map((o, i) => {
                                                            if (i === optIndex) {
                                                                const updatedItems = o.items.filter((_, j) => j !== subIndex);
                                                                return { 
                                                                    ...o, 
                                                                    items: updatedItems.length > 0 ? updatedItems : [{ title: "", image: "" }] 
                                                                };
                                                            }
                                                            return o;
                                                        });
                                                        setOptionsList(newOptions);
                                                    }}
                                                    className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition flex-shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='p-8'/>

                    <div className="z-[999] flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                        <button
                            onClick={() => setIsOpen(false)}
                            type="button"
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <GlassButton
                            type="submit"
                            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                        >
                            {editId ? "Update" : "Save"}
                        </GlassButton>
                    </div>
                </form>
            </GlassModal>

            <GlassModal title="Delete category" open={!!deleteModal} onClose={() => setDeleteModal(null)}>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Haqiqatan ham bu categoryni o'chirib yubormoqchimisiz?</p>

                    <div className="p-6"></div>

                    <div className="flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                        <button
                            onClick={() => setDeleteModal(null)}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (deleteModal) {
                                    handleDeleteCategory(deleteModal);
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

export default function CategoriesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-white">Yuklanmoqda...</div>}>
            <CategoriesContent />
        </Suspense>
    );
}