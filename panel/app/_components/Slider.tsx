'use client'
import React, { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Rating {
    rate: number;
    count: number;
}

interface Product {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
    rating: Rating;
}

const Slider = ({ products }: { products: Product[] }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDown(true);
        setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
        setScrollLeft(sliderRef.current?.scrollLeft || 0);
    };

    const onMouseLeave = () => setIsDown(false);
    const onMouseUp = () => setIsDown(false);
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 1.5;
        if (sliderRef.current) sliderRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div className="relative w-full bg-sky-500 rounded-[40px] p-6 flex items-center overflow-hidden">

            <div
                ref={sliderRef}
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                className="flex gap-4 overflow-x-auto cursor-grab active:cursor-grabbing w-full scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {products.map((item) => (
                    <div
                        key={item.id}
                        className="min-w-[80%] md:min-w-[300px] h-[300px] bg-white rounded-[24px] flex items-center justify-center p-4 select-none"
                    >
                        <Link href={`/${item.id}`} className="w-full h-full flex items-center justify-center">
                            <Image
                                src={item.image}
                                alt={item.title}
                                width={250}
                                height={250}
                                className="object-contain"
                                draggable={false}
                            />
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Slider