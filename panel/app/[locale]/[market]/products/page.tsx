'use client'
import Image from "next/image";
import React, { useCallback, useState, useEffect } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import GlassCard from "@/components/admin/GlassCard";
import GlassInput from "@/components/admin/GlassInput";
import GlassButton from "@/components/admin/GlassButton";
import GlassModal from "@/components/admin/GlassModal";
import { useNotification } from "@/components/Notification";
import { useTokenStore } from "@/app/_store/useTokenStore";
import { Trash2, Edit3 } from "lucide-react";
import Item from "./_components/item";
import ImageUpload from "./_components/image";
import { useParams } from "next/navigation";
import GradientColor from "./_components/gradientColor";
import Category from "./_components/category";
import { API_URL } from '@/lib/api';
import { usePermissionsStore } from "@/app/_store/usePermissionsStore";

interface ProductOption {
    id: string;
    key: string;
    value: number;
    image?: string | null;
}

interface ProductOptionGroup {
    id: string;
    title: string;
    searchKeys?: string[];
    searchEnabled?: boolean;
    options: ProductOption[];
}

interface Product {
    id: string;
    title: string;
    description: {
        uz: string;
        en: string;
        ru: string;
    };
    price?: number;
    categoryId: string;
    categoryItemId?: string | null;
    marketId: string;
    uom: 'PCS' | 'KG' | 'LITRE' | 'METER';
    gradient: string[];
    options: ProductOptionGroup[];
    images: string[];
    createdAt: string;
}

interface CategoryItem {
    id: string;
    title: string;
    image: string;
    children: CategoryItem[];
}

interface CategoryOption {
    id: string;
    title: string;
    items: CategoryItem[];
}

interface CategoryData {
    id: string;
    title: string;
    marketId?: string;
    marketid?: string;
    options: CategoryOption[];
}

const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const resolveCategoryLabel = (categoryId: string, categories: CategoryData[]): string => {
    if (!categoryId || categoryId === 'NULL') return 'Tanlanmagan';

    const parts = categoryId.split('|');
    if (parts.length < 2) return categoryId;
    const [catId, optId, ...itemIds] = parts;
    const category = categories.find(c => c.id === catId);
    if (!category) return categoryId;
    const option = category.options?.find(o => o.id === optId);
    if (!option) return category.title;
    const titles = [category.title, option.title];
    let items = option.items ?? [];
    for (const itemId of itemIds) {
        const selected = items.find(item => item.id === itemId);
        if (!selected) break;
        titles.push(selected.title);
        items = selected.children ?? [];
    }
    return titles.join(' › ');
};

const resolveStoredCategoryLabel = (
    categoryId: string,
    categoryItemId: string | null | undefined,
    categories: CategoryData[],
) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return categoryId || 'Tanlanmagan';
    if (!categoryItemId) return category.title;

    for (const option of category.options ?? []) {
        const visit = (items: CategoryItem[], path: string[]): string[] | null => {
            for (const item of items) {
                const nextPath = [...path, item.title];
                if (item.id === categoryItemId) return nextPath;
                const found = visit(item.children ?? [], nextPath);
                if (found) return found;
            }
            return null;
        };
        const itemPath = visit(option.items ?? [], []);
        if (itemPath) return [category.title, option.title, ...itemPath].join(' › ');
    }
    return category.title;
};

const ProductsGet = () => {
    const permissions = usePermissionsStore(state => state.permissions);
    const theme = useThemeStore(state => state.theme);
    const dark = theme === 'dark';
    const notify = useNotification()
    const {getActiveToken} = useTokenStore((state) => state);
    const token = getActiveToken()
    const params = useParams();
    const market = (params?.market as string) || "";

    const [data, setData] = useState<Product[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false)
    const [deleteModal, setDeleteModal] = useState<string | null>(null);

    const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
    const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, number>>>({});

    const [imagesLength, setImagesLength] = useState(1)
    const [descr, setDescr] = useState('uz');
    const lans = descr === 'uz' ? ['uz', 'en', 'ru'] : descr === 'en' ? ['en', 'uz', 'ru'] : ['ru', 'en', 'uz'];
    const [itemsLenght, setItemsLenght] = useState(1)
    const [editOptions, setEditOptions] = useState<ProductOptionGroup[]>([])
    const [gradientIsOpen, setGradientIsOpen] = useState(false);
    const [categoryOpen, setCategoryOpen] = useState(false)
    const [categoryId, setCategoryId] = useState('NULL')
    const [productTitle, setProductTitle] = useState('')
    const [descriptionUz, setDescriptionUz] = useState('')
    const [descriptionEn, setDescriptionEn] = useState('')
    const [descriptionRu, setDescriptionRu] = useState('')
    const [price, setPrice] = useState('')
    const [uom, setUom] = useState<Product['uom']>('PCS')
    const [existingImages, setExistingImages] = useState<string[]>([])

    const [colors, setColors] = useState<string[]>(['#3b82f6', '#3b82f6']);

    const handleColorChange = (index: number, newColor: string) => {
        const updated = [...colors];
        updated[index] = newColor;
        setColors(updated);
    };

    const handleAddColor = () => {
        setColors(prev => [...prev, '#3b82f6']);
    };

    const handleRemoveColor = (index: number) => {
        setColors(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveGradient = () => {
        setGradientIsOpen(false);
    };

    const fetchData = useCallback(async () => {
        try {
            setLoadError('');
            if (!isUuid(market)) {
                throw new Error('URL parametrida yaroqli market UUID topilmadi.');
            }
            const [productsRes, categoriesRes] = await Promise.all([
                fetch(`${API_URL}/products?marketId=${encodeURIComponent(market)}`),
                fetch(`${API_URL}/categories?marketId=${encodeURIComponent(market)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            if (!productsRes.ok || !categoriesRes.ok) {
                throw new Error('Mahsulot yoki kategoriya ma’lumotlarini yuklab bo‘lmadi.');
            }

            const req: Product[] = await productsRes.json();
            const result = req.filter(item => item.marketId === market);
            setData(result);

            const categoriesReq: CategoryData[] = await categoriesRes.json();
            setCategories(categoriesReq.filter(item => (item.marketId || item.marketid) === market));
        } catch (error) {
            console.error('Xatolik:', error);
            setLoadError(error instanceof Error ? error.message : 'Mahsulot ma’lumotlarini yuklab bo‘lmadi.');
        } finally {
            setLoading(false);
        }
    }, [market, token]);

    useEffect(() => {
        if (isUuid(market)) {
            void Promise.resolve().then(() => fetchData());
        }
    }, [fetchData, market]);

    const handleOptionSelect = (productId: string, groupName: string, value: number) => {
        setSelectedOptions(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || {}),
                [groupName]: value
            }
        }));
    };

    const handleNextImage = (productId: string, totalImages: number) => {
        setActiveImageIndices(prev => {
            const currentIndex = prev[productId] ?? 0;
            return { ...prev, [productId]: (currentIndex + 1) % totalImages };
        });
    };

    const handlePrevImage = (productId: string, totalImages: number) => {
        setActiveImageIndices(prev => {
            const currentIndex = prev[productId] ?? 0;
            return { ...prev, [productId]: (currentIndex - 1 + totalImages) % totalImages };
        });
    };

    const calculateTotalPrice = (product: Product) => {
        const productSelections = selectedOptions[product.id] || {};
        let optionsSum = product.price || 0;

        Object.values(productSelections).forEach(value => {
            optionsSum += value;
        });

        return optionsSum;
    };

    const resetForm = () => {
        setEditId(null);
        setProductTitle('');
        setDescriptionUz('');
        setDescriptionEn('');
        setDescriptionRu('');
        setPrice('');
        setCategoryId('NULL');
        setUom('PCS');
        setExistingImages([]);
        setColors(['#3b82f6', '#3b82f6']);
        setImagesLength(1);
        setItemsLenght(1);
        setEditOptions([]);
    };

    const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isUuid(market)) {
            notify.show("Marketni tanlang!", 'error', dark ? 'dark' : 'light');
            return;
        }

        try {
            const url = editId
                ? `${API_URL}/products/${editId}`
                : `${API_URL}/products`;

            const method = editId ? "PATCH" : "POST";

            const formData = new FormData(e.currentTarget);
            formData.set('title', productTitle);
            formData.set('descriptionUz', descriptionUz);
            formData.set('descriptionEn', descriptionEn);
            formData.set('descriptionRu', descriptionRu);
            formData.set('price', price);
            formData.set('uom', uom);
            formData.set('images', JSON.stringify(existingImages));
            formData.append('gradient', JSON.stringify(colors));
            const selectedCategoryParts = categoryId === 'NULL' ? [] : categoryId.split('|');
            if (selectedCategoryParts.length >= 3) {
                formData.set('categoryId', selectedCategoryParts[0]);
                formData.set('categoryItemId', selectedCategoryParts[selectedCategoryParts.length - 1]);
                formData.set('categoryPath', categoryId);
            } else if (categoryId !== 'NULL') {
                formData.set('categoryId', categoryId);
                formData.delete('categoryItemId');
                formData.delete('categoryPath');
            } else {
                formData.delete('categoryId');
                formData.delete('categoryItemId');
                formData.delete('categoryPath');
            }
            formData.set('marketId', market);

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    marketId: market,
                },
                body: formData
            });

            const req = await res.json();

            if (res.ok) {
                notify.show(
                    editId ? "Mahsulot muvaffaqiyatli yangilandi." : "Mahsulot muvaffaqiyatli yaratildi.",
                    'success',
                    dark ? 'dark' : 'light'
                );
                setIsOpen(false);
                resetForm();
                void fetchData();
            } else {
                notify.show(`${req.message || 'xatolik yuz berdi'}`, 'error', dark ? 'dark' : 'light');
            }
        } catch {
            notify.show("So'rov yuborilmadi", 'error', dark ? 'dark' : 'light');
        }
    };

    const handleDeleteProduct = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    marketId: market,
                }
            });
            if (res.ok) {
                notify.show("Mahsulot o'chirildi", "success", dark ? "dark" : "light");
                void fetchData();
            } else {
                notify.show("O'chirishda xatolik", "error", dark ? "dark" : "light");
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handleOpenEdit = (product: Product) => {
        setEditId(product.id);
        setProductTitle(product.title);
        setDescriptionUz(product.description?.uz || '');
        setDescriptionEn(product.description?.en || '');
        setDescriptionRu(product.description?.ru || '');
        setPrice(product.price?.toString() || '');
        setUom(product.uom ?? 'PCS');
        const itemSelection = categories
            .flatMap((category) => category.options.flatMap((option) => {
                const findPath = (items: CategoryItem[], parents: string[]): string[] | null => {
                    for (const item of items) {
                        const path = [...parents, item.id];
                        if (item.id === product.categoryItemId) return path;
                        const nested = findPath(item.children ?? [], path);
                        if (nested) return nested;
                    }
                    return null;
                };
                const ids = findPath(option.items ?? [], []);
                return ids ? [[category.id, option.id, ...ids].join('|')] : [];
            }))
            .find(Boolean);
        setCategoryId(itemSelection || product.categoryId || 'NULL');
        setExistingImages(Array.isArray(product.images) ? product.images : []);
        setColors(product.gradient?.length ? product.gradient : ['#3b82f6', '#3b82f6']);
        setEditOptions(product.options || []);
        setItemsLenght(product.options?.length ? product.options.length + 1 : 1);
        setImagesLength(product.images?.length ? product.images.length + 1 : 1);
        setIsOpen(true);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsOpen(true);
    };

    const handleCloseModal = () => {
        setIsOpen(false);
        resetForm();
    };

    if (!isUuid(market)) {
        return (
            <div role="alert" className="p-10 text-center text-rose-400">
                URL parametrida yaroqli market UUID topilmadi.
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 py-6 sm:py-12 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
            <div className="space-y-6 sm:space-y-10 mx-auto max-w-[1500px]">

                <GlassCard className='flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 w-full p-4'>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <h1 className='text-xl sm:text-2xl font-bold'>Products</h1>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="relative flex items-center flex-1 sm:flex-initial">
                            <GlassInput
                                type="text"
                                placeholder="Search..."
                                className="w-full sm:w-48 sm:focus:w-72 transition-all duration-300 text-xs py-2"
                            />
                        </div>
                        <GlassButton className="whitespace-nowrap" onClick={handleOpenCreate}>
                            Create Product
                        </GlassButton>
                    </div>
                </GlassCard>

                {loadError && (
                    <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {loadError}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6).fill(null).map((_, index) => (
                            <GlassCard key={index} className="space-y-4 animate-pulse">
                                <div className={`aspect-square w-full rounded-2xl ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-200'}`}></div>
                                <div className={`h-3 rounded w-1/4 ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-200'}`}></div>
                                <div className={`h-6 rounded w-3/4 ${theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-200'}`}></div>
                            </GlassCard>
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400 text-base bg-white/5 rounded-2xl border border-white/10">
                        Bu market uchun mahsulotlar topilmadi.
                    </div>
                ) : (
                    <div className="space-y-6 sm:space-y-10">
                        {data.map((item) => {
                            const activeIndex = activeImageIndices[item.id] ?? 0;
                            const hasImages = item.images && item.images.length > 0;
                            const currentImageUrl = hasImages ? item.images[activeIndex] : "https://dummyimage.com/600x600/18181b/a1a1aa";
                            const totalPrice = calculateTotalPrice(item);
                            const categoryLabel = resolveStoredCategoryLabel(item.categoryId, item.categoryItemId, categories);

                            const gradientStyle = item.gradient?.length > 0
                                ? { background: `linear-gradient(45deg, ${item.gradient.join(', ')})` }
                                : undefined;

                            return (
                                <GlassCard
                                    key={item.id}
                                    className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 overflow-hidden transition-colors duration-300 p-4 sm:p-6"
                                >
                                    {gradientStyle && (
                                        <div
                                            className="absolute inset-0 opacity-15 pointer-events-none blur-[100px] animate-spin-slow"
                                            style={gradientStyle}
                                        />
                                    )}

                                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2 sm:gap-4">
                                        <button
                                            onClick={() => handleOpenEdit(item)}
                                            className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition"
                                            title="Edit"
                                        >
                                            <Edit3 className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal(item.id)}
                                            className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </button>
                                    </div>

                                    <div className="lg:col-span-6 grid grid-cols-12 gap-3 sm:gap-4 z-10 mt-10 sm:mt-0">
                                        <div className="col-span-12 sm:col-span-2 flex sm:flex-col gap-2 max-h-[120px] sm:max-h-[380px] overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden sm:pr-1 scrollbar-thin">
                                            {item.images?.map((img, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setActiveImageIndices(prev => ({ ...prev, [item.id]: index }))}
                                                    className={`relative aspect-square w-16 sm:w-full flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${index === activeIndex
                                                        ? "border-sky-500 scale-95 shadow-lg shadow-sky-500/20"
                                                        : theme === 'dark' ? "border-zinc-800 hover:border-zinc-700" : "border-zinc-200 hover:border-zinc-300"
                                                        }`}
                                                >
                                                    <Image src={img} alt={`thumb-${index}`} fill className="object-cover" sizes="80px" />
                                                </button>
                                            ))}
                                        </div>

                                        <div className={`col-span-12 sm:col-span-10 relative aspect-square rounded-2xl border overflow-hidden flex items-center justify-center group/slider ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-gray-50 border-zinc-200'
                                            }`}>
                                            <div className="relative w-full h-full p-4 transition-transform duration-500 ease-out group-hover/slider:scale-105">
                                                <Image
                                                    src={currentImageUrl}
                                                    alt={item.title}
                                                    fill
                                                    className="object-contain p-4"
                                                    sizes="(max-width: 640px) 100vw, 500px"
                                                />
                                            </div>

                                            {item.images && item.images.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={() => handlePrevImage(item.id, item.images.length)}
                                                        className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-all opacity-100 sm:opacity-0 sm:group-hover/slider:opacity-100 shadow-xl ${theme === 'dark'
                                                            ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900/90'
                                                            : 'bg-white/80 border-zinc-200 text-zinc-700 hover:text-black hover:bg-white'
                                                            }`}
                                                        aria-label="Oldingi rasm"
                                                    >
                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        onClick={() => handleNextImage(item.id, item.images.length)}
                                                        className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-all opacity-100 sm:opacity-0 sm:group-hover/slider:opacity-100 shadow-xl ${theme === 'dark'
                                                            ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900/90'
                                                            : 'bg-white/80 border-zinc-200 text-zinc-700 hover:text-black hover:bg-white'
                                                            }`}
                                                        aria-label="Keyingi rasm"
                                                    >
                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}

                                        </div>
                                    </div>

                                    <div className="lg:col-span-6 flex flex-col justify-between space-y-4 sm:space-y-6 z-10">
                                        <div>
                                            <span className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                ID: {item.id}
                                            </span>
                                            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                                Kategoriya: <span className={`font-medium ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`}>{categoryLabel}</span>
                                            </p>
                                            <h2 className={`text-xl sm:text-2xl font-bold mt-1 mb-3 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{item.title}</h2>

                                            <div className={`mb-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-sky-400/10 border-zinc-800/50' : 'bg-sky-50 border-sky-100'
                                                }`}>
                                                <span className={`text-xs block mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>Tanlangan Konfiguratsiya Narxi:</span>
                                                <div className="flex items-baseline gap-2 flex-wrap">
                                                    <span className={`text-xl sm:text-2xl font-extrabold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                        {totalPrice.toLocaleString()} UZS
                                                    </span>
                                                </div>
                                            </div>

                                            <p className={`text-sm leading-relaxed p-4 rounded-xl border ${theme === 'dark' ? 'text-zinc-400 bg-sky-400/10 border-zinc-800/40' : 'text-zinc-600 bg-gray-50 border-gray-200'
                                                }`}>
                                                {item.description.uz}
                                            </p>
                                        </div>

                                        {item.options && item.options.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Konfiguratsiyani o&apos;zgartirish:</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {item.options.map((optGroup, optIdx) => {
                                                        const activeVal = selectedOptions[item.id]?.[optGroup.title];
                                                        return (
                                                            <div key={optIdx} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gray-50 border-zinc-200'
                                                                }`}>
                                                                <span className={`text-xs font-semibold block capitalize mb-3 tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                                                                    }`}>
                                                                    {optGroup.title}
                                                                </span>
                                                                <div className="flex flex-col gap-2">
                                                                    {optGroup.options.map((opt, valIdx) => {
                                                                        const isSelected = activeVal === opt.value;

                                                                        return (
                                                                            <button
                                                                                key={valIdx}
                                                                                onClick={() => handleOptionSelect(item.id, optGroup.title, opt.value)}
                                                                                className={`flex justify-between items-center text-xs font-medium px-4 py-3 rounded-lg border transition-all duration-200 ${isSelected
                                                                                    ? "bg-sky-500/10 text-sky-500 border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.1)]"
                                                                                    : theme === 'dark'
                                                                                        ? "bg-zinc-800/20 text-zinc-300 border-zinc-800 hover:bg-zinc-800/40 hover:border-zinc-700"
                                                                                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300"
                                                                                    }`}
                                                                            >
                                                                                <span className="capitalize">{opt.key}</span>
                                                                                <span className={`font-semibold ${isSelected ? "text-sky-500" : theme === 'dark' ? "text-zinc-500" : "text-zinc-400"}`}>
                                                                                    +{opt.value.toLocaleString()} UZS
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                  animation: spin-slow 22s linear infinite;
                }
            `}</style>

            <GlassModal open={isOpen} onClose={handleCloseModal} title={editId ? 'Edit Product' : 'Create Product'} size="full">
                <form onSubmit={handleCreateProduct}>
                    <div className="w-full flex gap-4 max-[650px]:flex-col min-h-[50vh] sm:h-[70vh]">
                        <div className="w-full p-2 flex gap-4 h-full max-[650px]:flex-col">
                            <div className="flex flex-row sm:flex-col gap-3 overflow-auto">
                                {Array.from({ length: imagesLength }).map((_, index) => (
                                    <ImageUpload
                                        key={`img-${editId ?? 'new'}-${index}`}
                                        setImagesLength={setImagesLength}
                                        index={index}
                                        defaultImage={existingImages[index] ?? ''}
                                    />
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 h-full overflow-auto flex-1">
                                <GlassInput label='price' name='price' placeholder="price..." value={price} onChange={(e) => setPrice(e.target.value)} />
                                <label className="flex flex-col gap-2 text-sm">
                                    <span>O&apos;lchov birligi</span>
                                    <select
                                        name="uom"
                                        value={uom}
                                        onChange={(event) => setUom(event.target.value as Product['uom'])}
                                        className={`rounded-xl border px-3 py-2.5 outline-none ${dark ? 'border-white/10 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-900'}`}
                                    >
                                        <option value="PCS">PCS — dona</option>
                                        <option value="KG">KG — kilogramm</option>
                                        <option value="LITRE">LITRE — litr</option>
                                        <option value="METER">METER — metr</option>
                                    </select>
                                </label>
                                <GlassButton type="button" onClick={() => setCategoryOpen(true)}>
                                    category select {categoryId !== 'NULL' && `(${resolveCategoryLabel(categoryId, categories)})`}
                                </GlassButton>
                                <GlassButton type="button" onClick={() => setGradientIsOpen(true)}>gradient</GlassButton>
                            </div>
                        </div>
                        <div className="w-full p-2 flex gap-4 flex-col overflow-auto h-full">
                            <GlassInput placeholder='title' name='title' label='title' value={productTitle} onChange={(e) => setProductTitle(e.target.value)} />

                            <div>
                                <div className="flex w-full overflow-x-auto">
                                    {lans.map(item => (
                                        <button key={item} type="button" className={`relative px-4 py-2 duration-200 text-sm whitespace-nowrap ${item === descr ? 'border-sky-500/60 shadow-[0_0_0_3px_rgba(14,165,233,0.15)]' : ''} ${descr === item ? `bg-sky-200/10 border-t border-l border-r ${dark
                                            ? 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500'
                                            : 'bg-white/60 border-sky-200/60 text-neutral-900 placeholder:text-neutral-400'}` : ''} translate-y-[2px] z-[10] rounded-xl rounded-bl-[0] rounded-br-[0]`} onClick={() => setDescr(item)}>
                                            {item === 'uz' ? 'O\'zbek' : item === 'en' ? 'English' : item === 'ru' ? 'Русский' : ''}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-4">
                                    <textarea name='descriptionUz' value={descriptionUz} onChange={(e) => setDescriptionUz(e.target.value)} className={`${descr === 'uz' ? '' : 'hidden'} rounded-[1rem] duration-200 focus:border-sky-500/60 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] rounded-tl-[0] bg-sky-200/10 border py-2 px-4 w-full outline-none text-sm ${dark
                                        ? 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500'
                                        : 'bg-white/60 border-sky-200/60 text-neutral-900 placeholder:text-neutral-400'
                                        }`} placeholder="UZ description..." rows={6}></textarea>
                                    <textarea name='descriptionEn' value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className={`${descr === 'en' ? '' : 'hidden'} rounded-[1rem] duration-200 focus:border-sky-500/60 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] rounded-tl-[0] bg-sky-200/10 border py-2 px-4 w-full outline-none text-sm ${dark
                                        ? 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500'
                                        : 'bg-white/60 border-sky-200/60 text-neutral-900 placeholder:text-neutral-400'
                                        }`} placeholder="EN description..." rows={6}></textarea>
                                    <textarea name='descriptionRu' value={descriptionRu} onChange={(e) => setDescriptionRu(e.target.value)} className={`${descr === 'ru' ? '' : 'hidden'} rounded-[1rem] duration-200 focus:border-sky-500/60 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] rounded-tl-[0] bg-sky-200/10 border py-2 px-4 w-full outline-none text-sm ${dark
                                        ? 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500'
                                        : 'bg-white/60 border-sky-200/60 text-neutral-900 placeholder:text-neutral-400'
                                        }`} placeholder="RU description..." rows={6}></textarea>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {Array.from({ length: itemsLenght }).map((_, index) => (
                                    <Item
                                        key={`${editId ?? 'new'}-opt-${index}`}
                                        cIndex={index}
                                        setItemsLenght={setItemsLenght}
                                        defaultTitle={editOptions[index]?.title ?? ''}
                                        defaultItems={editOptions[index]?.options?.map(o => ({ key: o.key, value: o.value, image: o.image })) ?? []}
                                        defaultSearchEnabled={editOptions[index]?.searchEnabled ?? false}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6"></div>

                    <div className="z-[999] flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-4 sm:p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                        <button
                            onClick={handleCloseModal}
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

            <GlassModal
                open={gradientIsOpen}
                onClose={() => setGradientIsOpen(false)}
                title="gradient"
            >
                <div className="flex flex-col gap-4">
                    {colors.map((color, index) => (
                        <GradientColor
                            key={index}
                            index={index}
                            color={color}
                            onChange={(newColor) => handleColorChange(index, newColor)}
                            onRemove={() => handleRemoveColor(index)}
                            canDelete={colors.length > 1}
                        />
                    ))}

                    <GlassButton onClick={handleAddColor}>+</GlassButton>
                </div>

                <div className="p-6"></div>

                <div className="z-[999] flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                    <button
                        onClick={() => setGradientIsOpen(false)}
                        type="button"
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <GlassButton
                        onClick={handleSaveGradient}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                    >
                        Save
                    </GlassButton>
                </div>
            </GlassModal>

            <GlassModal open={categoryOpen} onClose={() => setCategoryOpen(false)} title='Category' size="full">
                <Category setCategoryId={setCategoryId} categoryId={categoryId} />

                <div className="p-6"></div>

                <div className="z-[999] flex items-center justify-end gap-3 absolute bottom-0 left-0 w-full p-6 pt-0 backdrop-blur-sm rounded-b-[28px]">
                    <button
                        onClick={() => setCategoryOpen(false)}
                        type="button"
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Close
                    </button>
                    <GlassButton
                        onClick={() => setCategoryOpen(false)}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                    >
                        Save
                    </GlassButton>
                </div>
            </GlassModal>

            <GlassModal title="Delete product" open={!!deleteModal} onClose={() => setDeleteModal(null)}>
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Haqiqatan ham bu mahsulotni o&apos;chirib yubormoqchimisiz?</p>

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
                                    handleDeleteProduct(deleteModal);
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
};

export default ProductsGet;
