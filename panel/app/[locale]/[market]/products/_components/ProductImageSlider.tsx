"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ProductItem {
    id: string | number;
    title: string;
    images?: string[];
}

interface ProductImageSliderProps {
    item: ProductItem;
    activeIndex: number;
    setActiveIndex: React.Dispatch<React.SetStateAction<number>> | ((index: number | ((prev: number) => number)) => void);
    theme: string;
}

export default function ProductImageSlider({
    item,
    activeIndex,
    setActiveIndex,
    theme,
}: ProductImageSliderProps) {
    const images = item.images?.length
        ? item.images
        : ["https://dummyimage.com/600x600/18181b/a1a1aa"];
    const [dragStartX, setDragStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const thumbContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const activeThumb = thumbContainerRef.current?.children[activeIndex] as HTMLElement | undefined;
        activeThumb?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
        });
    }, [activeIndex]);

    const move = (direction: -1 | 1) => {
        setActiveIndex((current) => (current + direction + images.length) % images.length);
    };

    const startDrag = (clientX: number) => {
        setIsDragging(true);
        setDragStartX(clientX);
    };

    const finishDrag = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragOffset < -50) move(1);
        else if (dragOffset > 50) move(-1);
        setDragOffset(0);
    };

    return (
        <div className="lg:col-span-5 z-10 select-none">
            <div className="grid grid-cols-12 items-center gap-3">
                <div
                    ref={thumbContainerRef}
                    className="col-span-12 flex max-h-[140px] gap-2 overflow-x-auto pr-0.5 sm:col-span-3 sm:max-h-[350px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {images.map((image, index) => (
                        <button
                            key={`${item.id}-thumb-${index}`}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={`relative aspect-square w-14 shrink-0 overflow-hidden rounded-xl border transition sm:w-full ${
                                index === activeIndex
                                    ? "scale-[1.02] border-sky-500 opacity-100 ring-2 ring-sky-500/30"
                                    : theme === "dark"
                                        ? "border-zinc-800 bg-zinc-900/50 opacity-50 hover:opacity-80"
                                        : "border-zinc-200 bg-white opacity-50 hover:opacity-90"
                            }`}
                        >
                            <Image src={image} alt={`${item.title} thumbnail ${index + 1}`} fill className="object-cover" sizes="70px" />
                        </button>
                    ))}
                </div>

                <div
                    className={`group/slider relative col-span-12 flex aspect-square cursor-grab items-center justify-center overflow-hidden rounded-2xl border shadow-lg active:cursor-grabbing sm:col-span-9 ${
                        theme === "dark" ? "border-zinc-800/80 bg-zinc-950/60" : "border-zinc-200 bg-gray-100/80"
                    }`}
                    onTouchStart={(event) => startDrag(event.touches[0]?.clientX ?? 0)}
                    onTouchMove={(event) => {
                        if (isDragging) setDragOffset((event.touches[0]?.clientX ?? dragStartX) - dragStartX);
                    }}
                    onTouchEnd={finishDrag}
                    onMouseDown={(event) => startDrag(event.clientX)}
                    onMouseMove={(event) => {
                        if (isDragging) setDragOffset(event.clientX - dragStartX);
                    }}
                    onMouseUp={finishDrag}
                    onMouseLeave={finishDrag}
                >
                    {images.length > 1 && (
                        <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/90">
                            {activeIndex + 1} / {images.length}
                        </span>
                    )}
                    <div
                        className="flex h-full w-full"
                        style={{
                            transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
                            transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                    >
                        {images.map((image, index) => (
                            <div key={`${item.id}-image-${index}`} className="relative h-full w-full shrink-0 p-3">
                                <Image
                                    src={image}
                                    alt={`${item.title} ${index + 1}`}
                                    fill
                                    priority={index === activeIndex}
                                    className="pointer-events-none object-contain p-2 drop-shadow-sm"
                                    sizes="(max-width: 640px) 100vw, 400px"
                                />
                            </div>
                        ))}
                    </div>
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                aria-label="Oldingi rasm"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    move(-1);
                                }}
                                className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white opacity-0 transition hover:scale-110 group-hover/slider:opacity-100"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                aria-label="Keyingi rasm"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    move(1);
                                }}
                                className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white opacity-0 transition hover:scale-110 group-hover/slider:opacity-100"
                            >
                                ›
                            </button>
                            <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 backdrop-blur-md">
                                {images.map((_, index) => (
                                    <button
                                        key={`${item.id}-dot-${index}`}
                                        type="button"
                                        aria-label={`Rasm ${index + 1}`}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setActiveIndex(index);
                                        }}
                                        className={`h-1.5 rounded-full transition ${
                                            index === activeIndex ? "w-5 bg-sky-400" : "w-1.5 bg-white/40"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
