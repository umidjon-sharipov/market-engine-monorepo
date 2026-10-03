"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassTable from "@/components/admin/GlassTable";
import GlassInput from "@/components/admin/GlassInput";
import GlassButton from "@/components/admin/GlassButton";
import GlassModal from "@/components/admin/GlassModal";
import { useNotification } from "@/components/Notification";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { Trash2, Edit3, Plus, Layers, Upload, ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { API_URL } from "@/lib/api";

interface CategoryItem {
    id?: string;
    title: string;
    image: string | File;
    hidden: boolean;
    children: CategoryItem[];
}

interface CategoryOption {
    id?: string;
    title: string;
    hidden: boolean;
    items: CategoryItem[];
}

interface Category {
    id: string;
    title: string;
    hidden: boolean;
    marketId?: string;
    marketid?: string;
    options: CategoryOption[];
    createdAt: string;
    [key: string]: unknown;
}

const emptyItem = (): CategoryItem => ({ title: "", image: "", hidden: false, children: [] });

function HiddenSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
    return (
        <label className="inline-flex items-center gap-2 text-xs text-neutral-400 cursor-pointer whitespace-nowrap">
            <span>Hidden</span>
            <input
                type="checkbox"
                role="switch"
                checked={ checked }
                onChange={ (event) => onChange(event.target.checked) }
                className="peer sr-only"
            />
            <span className="relative h-5 w-9 rounded-full bg-neutral-600 transition peer-checked:bg-sky-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
        </label>
    );
}

function ItemEditor({
    item,
    onChange,
    onRemove,
    fileKey,
}: {
    item: CategoryItem;
    onChange: (item: CategoryItem) => void;
    onRemove: () => void;
    fileKey: string;
}) {
    const imageSrc = item.image instanceof File ? URL.createObjectURL(item.image) : item.image;
    const updateChild = (index: number, child: CategoryItem) => {
        onChange({ ...item, children: item.children.map((entry, childIndex) => childIndex === index ? child : entry) });
    };

    return (
        <div className="space-y-3 border-l-2 border-sky-500/30 pl-3">
            <div className="flex flex-wrap items-center gap-2">
                <input
                    placeholder="Item nomi..."
                    value={ item.title }
                    onChange={ (event) => onChange({ ...item, title: event.target.value }) }
                    className="min-w-[150px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                />
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300">
                    <span>{ item.image ? "Rasm yuklandi ✓" : "Rasm yuklash" }</span>
                    <Upload className="h-3.5 w-3.5 text-sky-400" />
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={ (event) => {
                            const file = event.target.files?.[0];
                            if (file) onChange({ ...item, image: file });
                        } }
                    />
                </label>
                { imageSrc && (
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image src={ imageSrc } alt={ item.title || "Item preview" } fill className="object-cover" unoptimized />
                    </div>
                ) }
                <HiddenSwitch checked={ item.hidden } onChange={ (hidden) => onChange({ ...item, hidden }) } />
                <button type="button" onClick={ onRemove } className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20" aria-label="Itemni o'chirish">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
            <div className="ml-2 space-y-3">
                { item.children.map((child, index) => (
                    <ItemEditor
                        key={ index }
                        item={ child }
                        fileKey={ `${fileKey}_${index}` }
                        onChange={ (updated) => updateChild(index, updated) }
                        onRemove={ () => onChange({ ...item, children: item.children.filter((_, childIndex) => childIndex !== index) }) }
                    />
                )) }
                <button
                    type="button"
                    onClick={ () => onChange({ ...item, children: [...item.children, emptyItem()] }) }
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-sky-400 hover:bg-sky-500/10"
                >
                    <Plus className="h-3.5 w-3.5" /> Ichki item qo'shish
                </button>
            </div>
        </div>
    );
}

function CategoryItemPreview({ item }: { item: CategoryItem }) {
    return (
        <div className="ml-3 border-l border-white/10 pl-3">
            <div className="flex items-center gap-2 py-1">
                { item.image && typeof item.image === "string" ? (
                    <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-md">
                        <Image src={ item.image } alt={ item.title } fill className="object-cover" />
                    </div>
                ) : null }
                <span className="truncate text-xs text-neutral-200">{ item.title }</span>
                { item.hidden && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">Hidden</span> }
            </div>
            { item.children.map((child) => <CategoryItemPreview key={ child.id ?? child.title } item={ child } />) }
        </div>
    );
}

function CategoriesContent() {
    const notify = useNotification();
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    const { getActiveToken } = useTokenStore((state) => state);
    const token = getActiveToken();
    const dark = useThemeStore((state) => state.theme) === "dark";
    const params = useParams();
    const market = (params?.market as string) || "";
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryTitle, setCategoryTitle] = useState("");
    const [categoryHidden, setCategoryHidden] = useState(false);
    const [optionsList, setOptionsList] = useState<CategoryOption[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/categories`);
            const req = await res.json();
            if (!res.ok) throw new Error(req.message || "Kategoriyalarni yuklab bo'lmadi");
            if (Array.isArray(req)) {
                setCategories(req.filter((item: Category) => (item.marketId || item.marketid) === market));
            }
        } catch (error) {
            console.error("Kategoriya yuklashda xatolik:", error);
            notify.show("Kategoriyalarni yuklab bo'lmadi", "error", dark ? "dark" : "light");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, [market]);

    const resetForm = () => {
        setCategoryTitle("");
        setCategoryHidden(false);
        setOptionsList([]);
    };

    const mapItemPayload = (item: CategoryItem, fileKey: string, formData: FormData): Omit<CategoryItem, "id" | "image"> & { image: string } => {
        const image = item.image instanceof File ? "" : item.image;
        if (item.image instanceof File) formData.append(`file_${fileKey}`, item.image);
        return {
            title: item.title,
            image,
            hidden: item.hidden,
            children: item.children
                .filter((child) => child.title.trim())
                .map((child, index) => mapItemPayload(child, `${fileKey}_${index}`, formData)),
        };
    };

    const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!market) {
            notify.show("Marketni tanlang!", "error", dark ? "dark" : "light");
            return;
        }

        const formData = new FormData();
        formData.append("title", categoryTitle);
        formData.append("marketId", market);
        formData.append("hidden", String(categoryHidden));

        const optionsPayload = optionsList
            .filter((option) => option.title.trim())
            .map((option, optionIndex) => ({
                title: option.title.trim(),
                hidden: option.hidden,
                items: option.items
                    .filter((item) => item.title.trim())
                    .map((item, itemIndex) => mapItemPayload(item, `${optionIndex}_${itemIndex}`, formData)),
            }));
        formData.append("options", JSON.stringify(optionsPayload));

        try {
            const res = await fetch(editId ? `${API_URL}/categories/${editId}` : `${API_URL}/categories`, {
                method: editId ? "PATCH" : "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const req = await res.json();
            if (!res.ok) {
                notify.show(Array.isArray(req.message) ? req.message.join(", ") : req.message || "Xatolik yuz berdi", "error", dark ? "dark" : "light");
                return;
            }

            setIsOpen(false);
            setEditId(null);
            resetForm();
            notify.show(editId ? "Kategoriya yangilandi" : "Yangi kategoriya qo'shildi", "success", dark ? "dark" : "light");
            await fetchData();
        } catch (error) {
            console.error("Kategoriya saqlashda xatolik:", error);
            notify.show("Serverga ulanishda xatolik", "error", dark ? "dark" : "light");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/categories/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Kategoriyani o'chirib bo'lmadi");
            setDeleteModal(null);
            notify.show("Kategoriya o'chirildi", "success", dark ? "dark" : "light");
            await fetchData();
        } catch (error) {
            console.error("Kategoriya o'chirishda xatolik:", error);
            notify.show("O'chirishda xatolik", "error", dark ? "dark" : "light");
        }
    };

    const openEdit = (category: Category) => {
        setEditId(category.id);
        setCategoryTitle(category.title);
        setCategoryHidden(category.hidden ?? false);
        setOptionsList(category.options.map((option) => ({
            ...option,
            hidden: option.hidden ?? false,
            items: option.items.map((item) => normalizeItem(item)),
        })));
        setIsOpen(true);
    };

    const normalizeItem = (item: CategoryItem): CategoryItem => ({
        ...item,
        hidden: item.hidden ?? false,
        children: (item.children ?? []).map(normalizeItem),
    });

    const openCreate = () => {
        setEditId(null);
        resetForm();
        setIsOpen(true);
    };

    return (
        <div className="mx-auto w-full max-w-[1500px] p-8">
            <div className="mb-10 flex items-center justify-between border-l-4 border-sky-500 pl-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Categories</h1>
                    <p className="mt-1 text-sm text-neutral-400">Do'kon kategoriyalari va ularning ichki elementlari</p>
                </div>
                <GlassButton onClick={ openCreate }><Plus className="mr-2 inline h-4 w-4" /> Create Category</GlassButton>
            </div>

            { loading ? (
                <div className="py-12 text-center text-lg text-gray-500">Loading...</div>
            ) : categories.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-base text-neutral-400">
                    Bu market uchun kategoriyalar topilmadi.
                </div>
            ) : (
                <GlassTable
                    columns={ [
                        { key: "title", label: "Kategoriya Nomi" },
                        { key: "createdAt", label: "Yaratilgan Vaqti" },
                    ] }
                    data={ categories.map((category) => ({ ...category, createdAt: new Date(category.createdAt).toLocaleString() })) as Record<string, unknown>[] }
                    actions={ (row) => {
                        const category = row as unknown as Category;
                        const expanded = expandedRow === category.id;
                        return (
                            <div className="flex w-full flex-col gap-2">
                                <div className="flex items-center justify-between gap-4">
                                    <button
                                        onClick={ () => setExpandedRow(expanded ? null : category.id) }
                                        className={ cn("flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition", dark ? "border-white/10 bg-white/5 text-sky-400 hover:bg-white/10" : "border-sky-200 bg-sky-50 text-sky-600") }
                                    >
                                        <Layers className="h-3.5 w-3.5" />
                                        <span>{ category.options?.length || 0 } ta Option</span>
                                        { category.hidden && <span className="text-amber-400">Hidden</span> }
                                        <ChevronDown className={ cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180") } />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button onClick={ () => openEdit(category) } className="rounded-xl bg-sky-500/10 p-2 text-sky-400 hover:bg-sky-500/20" title="Edit"><Edit3 className="h-4 w-4" /></button>
                                        <button onClick={ () => setDeleteModal(category.id) } className="rounded-xl bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    { expanded && (
                                        <motion.div initial={ { opacity: 0, height: 0 } } animate={ { opacity: 1, height: "auto" } } exit={ { opacity: 0, height: 0 } } className="space-y-2 overflow-hidden border-t border-white/10 pt-2">
                                            { category.options?.map((option) => (
                                                <div key={ option.id ?? option.title } className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-sky-400">{ option.title }</span>
                                                        { option.hidden && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">Hidden</span> }
                                                    </div>
                                                    { option.items?.map((item) => <CategoryItemPreview key={ item.id ?? item.title } item={ item } />) }
                                                </div>
                                            )) }
                                        </motion.div>
                                    ) }
                                </AnimatePresence>
                            </div>
                        );
                    } }
                />
            ) }

            <GlassModal size="2xl" title={ editId ? "Kategoriyani Tahrirlash" : "Create Category" } open={ isOpen } onClose={ () => setIsOpen(false) }>
                <form className="relative max-h-[75vh] w-full space-y-4 overflow-y-auto px-1 pb-20" onSubmit={ handleSubmitForm }>
                    <GlassInput label="Kategoriya Nomi" placeholder="Masalan: Elektronika, Kiyim-kechak..." value={ categoryTitle } onChange={ (event) => setCategoryTitle(event.target.value) } required />
                    <HiddenSwitch checked={ categoryHidden } onChange={ setCategoryHidden } />
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-semibold text-sky-400"><Layers className="h-4 w-4" /> Options & Items</label>
                            <button type="button" onClick={ () => setOptionsList([...optionsList, { title: "", hidden: false, items: [] }]) } className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-sky-400 hover:bg-sky-500/10"><Plus className="h-3.5 w-3.5" /> Option</button>
                        </div>
                        { optionsList.map((option, optionIndex) => (
                            <div key={ optionIndex } className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        placeholder="Option nomi..."
                                        value={ option.title }
                                        onChange={ (event) => setOptionsList(optionsList.map((entry, index) => index === optionIndex ? { ...entry, title: event.target.value } : entry)) }
                                        className="min-w-[150px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
                                    />
                                    <HiddenSwitch checked={ option.hidden } onChange={ (hidden) => setOptionsList(optionsList.map((entry, index) => index === optionIndex ? { ...entry, hidden } : entry)) } />
                                    <button type="button" onClick={ () => setOptionsList(optionsList.filter((_, index) => index !== optionIndex)) } className="rounded-xl bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20" aria-label="Optionni o'chirish"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                <div className="space-y-3 pl-2">
                                    { option.items.map((item, itemIndex) => (
                                        <ItemEditor
                                            key={ itemIndex }
                                            item={ item }
                                            fileKey={ `${optionIndex}_${itemIndex}` }
                                            onChange={ (updated) => setOptionsList(optionsList.map((entry, index) => index === optionIndex ? { ...entry, items: entry.items.map((current, childIndex) => childIndex === itemIndex ? updated : current) } : entry)) }
                                            onRemove={ () => setOptionsList(optionsList.map((entry, index) => index === optionIndex ? { ...entry, items: entry.items.filter((_, childIndex) => childIndex !== itemIndex) } : entry)) }
                                        />
                                    )) }
                                    <button type="button" onClick={ () => setOptionsList(optionsList.map((entry, index) => index === optionIndex ? { ...entry, items: [...entry.items, emptyItem()] } : entry)) } className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-sky-400 hover:bg-sky-500/10">
                                        <Plus className="h-3.5 w-3.5" /> Item qo'shish
                                    </button>
                                </div>
                            </div>
                        )) }
                    </div>
                    <div className="absolute bottom-0 left-0 z-[999] flex w-full items-center justify-end gap-3 rounded-b-[28px] bg-black/20 p-6 pt-3 backdrop-blur-sm">
                        <button type="button" onClick={ () => setIsOpen(false) } className="rounded-xl px-4 py-2 text-sm text-neutral-300 hover:bg-white/10">Bekor qilish</button>
                        <button type="submit" className="rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-600">{ editId ? "Saqlash" : "Yaratish" }</button>
                    </div>
                </form>
            </GlassModal>

            <GlassModal size="sm" title="Kategoriyani o'chirish" open={ !!deleteModal } onClose={ () => setDeleteModal(null) }>
                <p className="mb-6 text-sm text-neutral-400">Haqiqatan ham bu kategoriyani o'chirmoqchimisiz?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={ () => setDeleteModal(null) } className="rounded-xl px-4 py-2 text-sm text-neutral-300 hover:bg-white/10">Bekor qilish</button>
                    <button onClick={ () => deleteModal && void handleDeleteCategory(deleteModal) } className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">O'chirish</button>
                </div>
            </GlassModal>
        </div>
    );
}

export default function CategoriesPage() {
    return <CategoriesContent />;
}
