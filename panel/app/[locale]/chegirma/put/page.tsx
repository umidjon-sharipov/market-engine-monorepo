'use client'
import React, { useState, useEffect } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import ProductOptionGroup from "@/app/_components/ProductOptionGroup";
import ColorPicker from "@/app/_components/Color";
import Image from "next/image";
const API_URL = process.env.NEXT_PUBLIC_API_URL

const ProductsPut = () => {
    const [gradient, setGradient] = useState("auto");
    const [optionsNum, setOptionsNum] = useState(1)
    const theme = useThemeStore(state => state.theme)
    const [tab, setTab] = useState('auto')
    const [range, setRange] = useState(4)
    const [descr, setDescr] = useState('uz')
    const [lans, setLans] = useState(['uz', 'en', 'ru'])
    const [customColors, setCustomColors] = useState<string[]>([])

    let dark = theme === 'dark' ? true : false

    useEffect(() => {
        descr === 'uz' ? setLans(['uz', 'en', 'ru']) :
            descr === 'en' ? setLans(['en', 'uz', 'ru']) :
                descr === 'ru' ? setLans(['ru', 'en', 'uz']) : ''
    }, [descr])

    const handleColorChange = (index: number, color: string) => {
        setCustomColors(prev => {
            const updatedColors = [...prev];
            updatedColors[index] = color;
            return updatedColors;
        });
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        console.log(data);

        const productData = {
            ID: data.ID,
            title: data.title,
            description: {
                uz: data.description_uz,
                en: data.description_en,
                ru: data.description_ru,
            },
            price: data.price,
        }

        e.currentTarget.reset();

        try {
            const response = await fetch(`${API_URL}/api/products`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            const result = await response.json();
            console.log(result);
        } catch (error) {
            console.error('Error creating product:', error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1.5">
                <h1 className="text-4xl font-extrabold tracking-tight dark:text-white text-neutral-900">PUT Request</h1>
            </div>

            <form className="flex gap-4 flex-col" onSubmit={handleUpdate}>
                <div className="relative">
                    <input type="text" name='ID' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="mahsulot ID sini yozing..." />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/key.png' alt="key" width={20} height={20} />
                    </div>
                </div>
                <div className="relative">
                    <input type="text" name='title' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="mahsulot titlesini yozing..." />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/title.png' alt="title" width={20} height={20} />
                    </div>
                </div>
                <div>
                    <div className="flex w-full">
                        {
                            lans.map(item => (
                                <button key={item} type="button" className={`relative px-4 py-2 text-sm ${descr === item ? 'bg-sky-200/10 border-t border-l border-r border-sky-500/40' : ''} translate-y-[2px] z-[10] rounded-xl rounded-bl-[0] rounded-br-[0]`} onClick={() => setDescr(item)}>
                                    {item === 'uz' ? 'O\'zbek' : item === 'en' ? 'English' : item === 'ru' ? 'Русский' : ''}
                                </button>
                            ))
                        }
                    </div>
                    <div className="flex gap-4">
                        <textarea name='descriptionUz' className={`${descr === 'uz' ? '' : 'hidden'} rounded-[1rem] rounded-tl-[0] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none text-[10px]`} placeholder="mahsulot descriptionini UZ yozing..." rows={10}></textarea>
                        <textarea name='descriptionEn' className={`${descr === 'en' ? '' : 'hidden'} rounded-[1rem] rounded-tl-[0] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none text-[10px]`} placeholder="mahsulot descriptionini EN yozing..." rows={10}></textarea>
                        <textarea name='descriptionRu' className={`${descr === 'ru' ? '' : 'hidden'} rounded-[1rem] rounded-tl-[0] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none text-[10px]`} placeholder="mahsulot descriptionini RU yozing..." rows={10}></textarea>
                    </div>
                </div>
                <div className="relative">
                    <input type="number" name='foiz' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="mahsulot foizini yozing..." />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/percent.png' alt="foiz" width={20} height={20} />
                    </div>
                </div>

                <div className="relative">
                    <input type="number" name='oy' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="bo'lib to'lash oyini max yozing..." />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/moon.png' alt="moon" width={20} height={20} />
                    </div>
                </div>
                <div className="relative">
                    <input type="text" name='keywords' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="qidiruv uchun kalit so'zlarni o'rtada , bilan yozing..." />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/search.png' alt="search" width={20} height={20} />
                    </div>
                </div>
                <label htmlFor="gradient">mahsulot gradienti</label>
                <select
                    name="gradient"
                    onChange={(e) => setGradient(e.target.value)}
                    value={gradient}
                    className={`rounded-[1rem] py-2 px-4 w-full outline-none border transition-all duration-200 cursor-pointer focus:border-sky-500 bg-sky-200/10
                    ${dark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`}
                >
                    <option value="auto" className="bg-sky-200/10 text-slate-800">
                        Auto
                    </option>
                    <option value="custom" className="bg-sky-200/10 text-slate-800">
                        Custom
                    </option>
                </select>
                {gradient === "custom" ? (
                    <>
                        <input type="range" name="range" max={10} min={2} onChange={e => setRange(Number(e.target.value))} value={range} className="duration-300" />
                        {Array(range).fill(null).map((_, index) => (
                            <div key={index} className="flex flex-wrap w-full">
                                <ColorPicker num={index} onChangeColor={handleColorChange} />
                            </div>
                        ))}
                    </>
                ) : null}
                <label htmlFor="">mahsulot qisimlari</label>
                <div className="w-full p-2 bg-white/40 rounded-full flex max-[500px]:p-1 relative">
                    <div className={`w-1/2 rounded-full bg-white/30 absolute top-2 bottom-2 left-0 scale-x-[0.9] duration-300 ${tab === 'auto' ? 'translate-x-0' : 'translate-x-full'}`}></div>

                    <button type="button" className="w-1/2 rounded-full py-3 px-4 capitalize relative max-[500px]:text-sm max-[500px]:p-2 z-10" onClick={() => setTab('auto')}>auto</button>
                    <button type="button" className="w-1/2 rounded-full py-3 px-4 capitalize relative max-[500px]:text-sm max-[500px]:p-2 z-10" onClick={() => setTab('custom')}>custom</button>
                </div>
                <div className={`flex flex-col gap-4 ${tab === 'auto' ? 'hidden' : ''}`}>
                    {Array(optionsNum).fill(null).map((_, index) => (
                        <ProductOptionGroup key={index} groupIndex={index} />
                    ))}
                </div>
                <div className={`flex gap-4 w-full ${tab === 'auto' ? 'hidden' : ''}`}>
                    <button type="button" className="capitalize px-4 py-4 rounded-3xl active:scale-[0.95] hover:bg-sky-600/40 duration-200 font-semibold w-full bg-sky-600/60 max-[500px]:text-sm max-[500px]:p-2" onClick={() => setOptionsNum(prev => prev + 1)}>qo'shish</button>
                    <button type="button" className="capitalize px-4 py-4 rounded-3xl active:scale-[0.95] hover:bg-rose-600/40 duration-200 font-semibold w-full bg-rose-600/60 max-[500px]:text-sm max-[500px]:p-2" onClick={() => { optionsNum > 1 && setOptionsNum(prev => prev - 1) }}>o'chirish</button>
                </div>
                <button type="submit" className="f-full bg-sky-600 hover:bg-sky-700 duration-300 text-white rounded-2xl py-2 text-2xl font-semibold select-none capitalize">databasega yozish</button>
            </form>
        </div>
    );
}

export default ProductsPut