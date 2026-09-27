'use client'
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
const API_URL = process.env.NEXT_PUBLIC_API_URL

interface ProductOption {
    name: string;
    value: number;
}

interface ProductOptionGroup {
    name: string;
    options: ProductOption[];
}

interface Product {
    id: number;
    title: string;
    description: {
        uz: string;
        en: string;
        ru: string;
    };
    foiz: number;
    tab: string;
    gradient_select: string;
    gradient: string[];
    chegirma_select: string;
    options: ProductOptionGroup[];
    images: string[];
    created_at: string;
}

const ProductsGet = () => {
    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const theme = useThemeStore(state => state.theme)

    const [activeImageIndices, setActiveImageIndices] = useState<{ [key: number]: number }>({});

    const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: { [groupName: string]: number } }>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/products`);
                if (!response.ok) throw new Error('Failed to fetch data');
                const result: Product[] = await response.json();
                setData(result);

                const initialIndices: { [key: number]: number } = {};
                const initialSelectedOpts: typeof selectedOptions = {};

                result.forEach(item => {
                    initialIndices[item.id] = 0;
                    initialSelectedOpts[item.id] = {};
                    item.options?.forEach(group => {
                        if (group.options && group.options.length > 0) {
                            initialSelectedOpts[item.id][group.name] = group.options[0].value;
                        }
                    });
                });

                setActiveImageIndices(initialIndices);
                setSelectedOptions(initialSelectedOpts);
            } catch (error) {
                console.error('Xatolik:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleOptionSelect = (productId: number, groupName: string, value: number) => {
        setSelectedOptions(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || {}),
                [groupName]: value
            }
        }));
    };

    const handleNextImage = (productId: number, totalImages: number) => {
        setActiveImageIndices(prev => {
            const currentIndex = prev[productId] ?? 0;
            return { ...prev, [productId]: (currentIndex + 1) % totalImages };
        });
    };

    const handlePrevImage = (productId: number, totalImages: number) => {
        setActiveImageIndices(prev => {
            const currentIndex = prev[productId] ?? 0;
            return { ...prev, [productId]: (currentIndex - 1 + totalImages) % totalImages };
        });
    };

    const calculateTotalPrice = (product: Product) => {
        const productSelections = selectedOptions[product.id] || {};
        let optionsSum = 0;

        Object.values(productSelections).forEach(value => {
            optionsSum += value;
        });

        if (product.foiz > 0) {
            const discountAmount = (optionsSum * product.foiz) / 100;
            return optionsSum - discountAmount;
        }

        return optionsSum;
    };

    return (
        <div className="min-h-screen text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl space-y-10">

                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                    Mahsulotlar
                </h1>

                {loading || data.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(12).fill(null).map((_, index) => (
                            <div key={index} className="bg-[#111113] border border-zinc-800/80 rounded-3xl p-5 space-y-4 animate-pulse">
                                <div className="aspect-square w-full bg-zinc-800/60 rounded-2xl"></div>
                                <div className="h-3 bg-zinc-800/60 rounded w-1/4"></div>
                                <div className="h-6 bg-zinc-800/60 rounded w-3/4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-zinc-800/60 rounded w-full"></div>
                                    <div className="h-4 bg-zinc-800/60 rounded w-5/6"></div>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <div className="h-5 bg-zinc-800/60 rounded w-1/3"></div>
                                    <div className="h-5 bg-zinc-800/60 rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {data.map((item) => {
                            const activeIndex = activeImageIndices[item.id] ?? 0;
                            const hasImages = item.images && item.images.length > 0;
                            const currentImageUrl = hasImages ? item.images[activeIndex] : "https://dummyimage.com/600x600/18181b/a1a1aa";
                            const totalPrice = calculateTotalPrice(item);

                            const gradientStyle = item.gradient_select === 'custom' && item.gradient?.length > 0
                                ? {
                                    background: `linear-gradient(45deg, ${item.gradient.join(', ')})`,
                                }
                                : undefined;

                            return (
                                <div
                                    key={item.id}
                                    className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-8 rounded-3xl border border-snow-500/80 shadow-2xl overflow-hidden"
                                >

                                    {gradientStyle && (
                                        <div
                                            className="absolute inset-0 opacity-15 pointer-events-none blur-[100px] animate-spin-slow"
                                            style={gradientStyle}
                                        />
                                    )}

                                    <div className="lg:col-span-6 grid grid-cols-12 gap-4 z-10">

                                        <div className="col-span-2 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                                            {item.images?.map((img, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setActiveImageIndices(prev => ({ ...prev, [item.id]: index }))}
                                                    className={`relative aspect-square w-full rounded-xl overflow-hidden border-2 transition-all duration-200 ${index === activeIndex
                                                        ? "border-sky-500 scale-95 shadow-lg shadow-sky-500/20"
                                                        : "border-zinc-800 hover:border-zinc-700"
                                                        }`}
                                                >
                                                    <Image src={img} alt={`thumb-${index}`} fill className="object-cover" sizes="80px" />
                                                </button>
                                            ))}
                                        </div>

                                        <div className="col-span-10 relative aspect-square bg-snow-200/10 rounded-2xl border border-zinc-800/60 overflow-hidden flex items-center justify-center group/slider">

                                            <div className="relative w-full h-full p-4 transition-transform duration-500 ease-out group-hover/slider:scale-105">
                                                <Image
                                                    src={currentImageUrl}
                                                    alt={item.title}
                                                    fill
                                                    className="object-contain p-4"
                                                    sizes="500px"
                                                />
                                            </div>

                                            {item.images && item.images.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={() => handlePrevImage(item.id, item.images.length)}
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-950/60 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900/90 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/slider:opacity-100 shadow-xl"
                                                        aria-label="Oldingi rasm"
                                                    >
                                                        <svg className="w-5 h-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        onClick={() => handleNextImage(item.id, item.images.length)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-950/60 backdrop-blur-md border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900/90 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/slider:opacity-100 shadow-xl"
                                                        aria-label="Keyingi rasm"
                                                    >
                                                        <svg className="w-5 h-5 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}

                                            {item.foiz > 0 && (
                                                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg z-20 shadow-md">
                                                    -{item.foiz}% Chegirma
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="lg:col-span-6 flex flex-col justify-between space-y-6 z-10">
                                        <div>
                                            <span className="text-xs text-zinc-500">ID: {item.id} • Turi: <span className="capitalize text-zinc-400">{item.tab}</span></span>
                                            <h2 className="text-2xl font-bold text-white mt-1 mb-3 tracking-tight">{item.title}</h2>

                                            <div className="mb-4 bg-sky-400/10 p-4 rounded-2xl border border-zinc-800/50">
                                                <span className="text-xs text-zinc-400 block mb-1">Tanlangan Konfiguratsiya Narxi:</span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-extrabold text-emerald-400">
                                                        {totalPrice.toLocaleString()} UZS
                                                    </span>
                                                    {item.foiz > 0 && (
                                                        <span className="text-sm text-zinc-500 line-through">
                                                            {(totalPrice / (1 - item.foiz / 100)).toLocaleString()} UZS
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-sm text-zinc-400 leading-relaxed bg-sky-400/10 p-4 rounded-xl border border-zinc-800/40">
                                                {item.description.uz}
                                            </p>
                                        </div>

                                        {item.options && item.options.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Konfiguratsiyani o'zgartirish:</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {item.options.map((optGroup, optIdx) => {
                                                        const activeVal = selectedOptions[item.id]?.[optGroup.name];
                                                        return (
                                                            <div key={optIdx} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
                                                                <span className="text-xs text-zinc-400 font-semibold block capitalize mb-3 tracking-wider">
                                                                    {optGroup.name}
                                                                </span>
                                                                <div className="flex flex-col gap-2">
                                                                    {optGroup.options.map((opt, valIdx) => {
                                                                        const isSelected = activeVal === opt.value;
                                                                        return (
                                                                            <button
                                                                                key={valIdx}
                                                                                onClick={() => handleOptionSelect(item.id, optGroup.name, opt.value)}
                                                                                className={`flex justify-between items-center text-xs font-medium px-4 py-3 rounded-lg border transition-all duration-200 ${isSelected
                                                                                    ? "bg-sky-500/10 text-sky-400 border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.1)]"
                                                                                    : "bg-zinc-800/20 text-zinc-300 border-zinc-805/50 hover:bg-zinc-800/40 hover:border-zinc-700"
                                                                                    }`}
                                                                            >
                                                                                <span className="capitalize">{opt.name}</span>
                                                                                <span className={`font-semibold ${isSelected ? "text-sky-400" : "text-zinc-500"}`}>
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

                                </div>
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
        </div>
    );
};

export default ProductsGet;