'use client';
import React, { useState, useEffect } from "react";
import { useThemeStore } from "@/app/_store/useThemeStore";
import ProductOptionGroup from "@/app/_components/ProductOptionGroup";
import ColorPicker from "@/app/_components/Color";
import Image from "next/image";
import { useApikeyStore } from "@/app/_store/useApikeyStore";
const API_URL = process.env.NEXT_PUBLIC_API_URL
import GlassInput from "@/components/admin/GlassInput";
import GlassModal from "@/components/admin/GlassModal";
import GlassButton from "@/components/admin/GlassButton";
import GlassCard from "@/components/admin/GlassCard";
import GlassTable from "@/components/admin/GlassTable";

const ProductsPost = () => {
    const apikey = useApikeyStore(state => state.apikey);
    const [gradientSelect, setGradientSelect] = useState("none");
    const [customColors, setCustomColors] = useState<string[]>([]);
    const [chegirmaSelect, setChegirmaSelect] = useState("none");
    const [optionsNum, setOptionsNum] = useState(1);
    const theme = useThemeStore(state => state.theme);
    const [tab, setTab] = useState('auto');
    const [range, setRange] = useState(2);
    const [descr, setDescr] = useState('uz');
    const [imageNum, setImageNum] = useState(2)
    const [lans, setLans] = useState(['uz', 'en', 'ru']);
    let dark = theme === 'dark';

    useEffect(() => {
        descr === 'uz' ? setLans(['uz', 'en', 'ru']) :
            descr === 'en' ? setLans(['en', 'uz', 'ru']) :
                descr === 'ru' ? setLans(['ru', 'en', 'uz']) : '';
    }, [descr]);

    const handleColorChange = (index: number, color: string) => {
        setCustomColors(prev => {
            const updatedColors = [...prev];
            updatedColors[index] = color;
            return updatedColors;
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const rawFormData = new FormData(e.currentTarget);
        const data = Object.fromEntries(rawFormData.entries());

        const dynamicOptions = [];
        for (let i = 0; i < optionsNum; i++) {
            const groupIndex = i + 1;
            const groupName = data[`option${groupIndex}Name`] as string;

            if (!groupName) continue;

            const subOptions = [];
            let subIndex = 1;

            while (data[`option${groupIndex}Name${subIndex}`] !== undefined) {
                const subName = data[`option${groupIndex}Name${subIndex}`] as string;
                const subValue = data[`option${groupIndex}Value${subIndex}`];

                if (subName) {
                    subOptions.push({
                        name: subName,
                        value: subValue ? Number(subValue) : 0
                    });
                }
                subIndex++;
            }

            dynamicOptions.push({
                name: groupName,
                options: subOptions
            });
        }

        const sendFormData = new FormData();

        sendFormData.append('title', (data.title as string) || '');
        sendFormData.append('foiz', data.foiz ? String(Number(data.foiz)) : '0');
        sendFormData.append('tab', tab);
        sendFormData.append('gradientSelect', gradientSelect);
        sendFormData.append('chegirmaSelect', chegirmaSelect);
        sendFormData.append('price', (data.price as string) || '0');

        sendFormData.append('description', JSON.stringify({
            uz: data.descriptionUz || '',
            en: data.descriptionEn || '',
            ru: data.descriptionRu || '',
        }));

        sendFormData.append('options', JSON.stringify(dynamicOptions));

        if (gradientSelect === 'custom') {
            const validColors = Array.from({ length: range }, (_, i) => customColors[i] || '#ffffff');
            sendFormData.append('gradient', JSON.stringify(validColors));
        }

        let fileIndex = 0;
        while (fileIndex < imageNum) {
            const fileInput = e.currentTarget.querySelector(`input[name="image${fileIndex}"]`) as HTMLInputElement;
            if (fileInput && fileInput.files && fileInput.files[0]) {
                sendFormData.append('images', fileInput.files[0]);
            }
            fileIndex++;
        }

        console.log(Array.from(sendFormData.entries()));

        try {
            const response = await fetch(`${API_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'api-key': apikey
                },
                body: sendFormData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Mahsulot yaratishda xatolik yuz berdi');
            }

            const result = await response.json();
            console.log("Muvaffaqiyatli saqlandi! 🎉", result);
            alert("Mahsulot muvaffaqiyatli qo'shildi!");
        } catch (error: any) {
            console.error('Error creating product:', error);
            alert(`Xatolik: ${error.message}`);
        }
    };

    const columns = [
        { key: 'name', label: 'Foydalanuvchi' },
        { key: 'role', label: 'Rol' },
        { key: 'status', label: 'Status' },
        { key: 'balance', label: 'Balans' },
    ];

    const [users, setUsers] = useState([
        { id: 1, user: 'Alisher Navoiy', email: 'alisher@example.com', role: 'Admin', status: 'Faol', balance: '$1,240.00' },
        { id: 2, user: 'Zahiriddin Bobur', email: 'bobur@example.com', role: 'Moderator', status: 'Kutilmoqda', balance: '$450.00' },
        { id: 3, user: 'Amir Temur', email: 'temur@example.com', role: 'Super Admin', status: 'Faol', balance: '$12,800.00' },
    ]);

    const renderActions = (row: Record<string, unknown>) => {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => alert(`Tahrirlanmoqda: ${row.name}`)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 transition-colors"
                >
                    Tahrirlash
                </button>
                <button
                    onClick={() => setUsers(users.filter(u => u.id !== row.id))}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                    O'chirish
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1.5">
                <h1 className="text-4xl font-extrabold tracking-tight dark:text-white text-neutral-900">Yangi mahsulot qo'shish</h1>
            </div>

            <form className="flex gap-4 flex-col" onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="relative">
                    <input type="text" name='title' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="mahsulot titlesini yozing..." required />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/title.png' alt="title" width={20} height={20} />
                    </div>
                </div>

                <div>
                    <div className="flex w-full">
                        {lans.map(item => (
                            <button key={item} type="button" className={`relative px-4 py-2 text-sm ${descr === item ? 'bg-sky-200/10 border-t border-l border-r border-sky-500/40' : ''} translate-y-[2px] z-[10] rounded-xl rounded-bl-[0] rounded-br-[0]`} onClick={() => setDescr(item)}>
                                {item === 'uz' ? 'O\'zbek' : item === 'en' ? 'English' : item === 'ru' ? 'Русский' : ''}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-4">
                        <textarea name='descriptionUz' className={`${descr === 'uz' ? '' : 'hidden'} rounded-[1rem] rounded-tl-[0] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none text-sm`} placeholder="mahsulot descriptionini UZ yozing..." rows={6}></textarea>
                        <textarea name='descriptionEn' className={`${descr === 'en' ? '' : 'hidden'} rounded-[1rem] rounded-tl-[0] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none text-sm`} placeholder="mahsulot descriptionini EN yozing..." rows={6}></textarea>
                        <textarea name='descriptionRu' className={`${descr === 'ru' ? '' : 'hidden'} rounded-[1rem] rounded-tl-[0] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none text-sm`} placeholder="mahsulot descriptionini RU yozing..." rows={6}></textarea>
                    </div>
                </div>

                <label className="font-semibold mt-2">Mahsulot rasmlari</label>
                <div className="flex flex-wrap w-full gap-2 rounded-[2rem] bg-sky-100/10 p-6 border border-solid border-sky-500/40">

                    <div className="flex gap-4 w-full">
                        <button
                            type='button'
                            className="px-2 py-2 rounded-xl max-[500px]:p-1 max-[500px]:text-sm capitalize active:scale-[0.9] hover:bg-sky-600/40 duration-200 font-semibold w-full bg-sky-600/60"
                            onClick={() => setImageNum(prev => prev + 1)}
                        >
                            qo'shish
                        </button>
                        <button
                            type='button'
                            className="px-2 py-2 rounded-xl max-[500px]:p-1 max-[500px]:text-sm capitalize active:scale-[0.9] hover:bg-rose-600/40 duration-200 font-semibold w-full bg-rose-600/60"
                            onClick={() => { imageNum > 1 && setImageNum(prev => prev - 1) }}
                        >
                            o'chirish
                        </button>
                    </div>
                    {Array(imageNum).fill(null).map((_, index) => (
                        <input type="file" accept="image/*" key={index} name={`image${index}`} className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-4 w-full outline-none" />
                    ))}
                </div>

                <div className="relative">
                    <input type="number" name='foiz' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="mahsulot foizini yozing..." />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/percent.png' alt="foiz" width={20} height={20} />
                    </div>
                </div>

                <GlassInput />
                <GlassButton><h1>submit</h1></GlassButton>
                <GlassCard><h1>hello</h1></GlassCard>
                <GlassTable
                    columns={columns}
                    data={users}
                    actions={renderActions}
                />

                <label htmlFor="gradientSelect" className="font-semibold">Mahsulot gradienti</label>
                <select
                    name="gradientSelect"
                    onChange={(e) => setGradientSelect(e.target.value)}
                    value={gradientSelect}
                    className={`rounded-[1rem] py-2 px-4 w-full outline-none border transition-all duration-200 cursor-pointer focus:border-sky-500 bg-sky-400/20
                    ${dark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`}
                >
                    <option value="auto">Auto</option>
                    <option value="custom">Custom</option>
                    <option value="none">None</option>
                </select>

                {gradientSelect === "custom" ? (
                    <div className="space-y-4 bg-sky-500/5 p-4 rounded-2xl border border-sky-500/20">
                        <div className="w-full gap-6 flex">
                            <button type="button" className="capitalize px-4 py-2 rounded-xl active:scale-[0.95] hover:bg-sky-600/40 duration-200 font-semibold w-full bg-sky-600/60 text-sm" onClick={() => setRange(prev => prev + 1)}>Rang qo'shish</button>
                            <button type="button" className="capitalize px-4 py-2 rounded-xl active:scale-[0.95] hover:bg-rose-600/40 duration-200 font-semibold w-full bg-rose-600/60 text-sm" onClick={() => { range > 1 && setRange(prev => prev - 1) }}>Rang o'chirish</button>
                        </div>
                        {Array(range).fill(null).map((_, index) => (
                            <div key={index} className="flex flex-wrap w-full">
                                <ColorPicker num={index} onChangeColor={handleColorChange} />
                            </div>
                        ))}
                    </div>
                ) : null}

                <label htmlFor="chegirmaSelect" className="font-semibold">Mahsulot chegirmasi</label>
                <select
                    name="chegirmaSelect"
                    onChange={(e) => setChegirmaSelect(e.target.value)}
                    value={chegirmaSelect}
                    className={`rounded-[1rem] py-2 px-4 w-full outline-none border transition-all duration-200 cursor-pointer focus:border-sky-500 bg-sky-400/20
                    ${dark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`}
                >
                    <option value="select">Select</option>
                    <option value="none">None</option>
                </select>

                {chegirmaSelect === 'select' && (
                    <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
                        <h3 className="font-semibold text-sky-400">Chegirma turi faollashtirildi!</h3>
                    </div>
                )}

                <label className="font-semibold">Mahsulot qismlari</label>
                <div className="w-full p-2 bg-white/10 rounded-full flex relative border border-sky-500/20">
                    <div className={`w-1/2 rounded-full bg-sky-500/30 absolute top-2 bottom-2 left-0 scale-x-[0.95] duration-300 ${tab === 'auto' ? 'translate-x-0' : 'translate-x-full'}`}></div>
                    <button type="button" className="w-1/2 rounded-full py-3 px-4 capitalize relative z-10 font-bold" onClick={() => setTab('auto')}>auto</button>
                    <button type="button" className="w-1/2 rounded-full py-3 px-4 capitalize relative z-10 font-bold" onClick={() => setTab('custom')}>custom</button>
                </div>

                <div className={`flex flex-col gap-4 ${tab === 'auto' ? 'hidden' : ''}`}>
                    {Array.from({ length: optionsNum }).map((_, index) => (
                        <ProductOptionGroup key={index} groupIndex={index} />
                    ))}
                </div>

                <div className={`flex gap-4 w-full ${tab === 'auto' ? 'hidden' : ''}`}>
                    <button type="button" className="capitalize px-4 py-3 rounded-2xl active:scale-[0.95] hover:bg-sky-600/40 duration-200 font-semibold w-full bg-sky-600/60" onClick={() => setOptionsNum(prev => prev + 1)}>Qism qo'shish</button>
                    <button type="button" className="capitalize px-4 py-3 rounded-2xl active:scale-[0.95] hover:bg-rose-600/40 duration-200 font-semibold w-full bg-rose-600/60" onClick={() => { optionsNum > 1 && setOptionsNum(prev => prev - 1) }}>Qism o'chirish</button>
                </div>

                <div className={`${tab === 'custom' ? 'hidden' : ''}`}>
                    <div className="relative">
                        <input type="text" name='price' className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="mahsulot narxini yozing..." />
                        <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                            <Image src='/dollar.png' alt="price" width={20} height={20} />
                        </div>
                    </div>
                </div>

                <button type="submit" className="w-full bg-sky-700 hover:bg-sky-900 duration-300 text-white rounded-2xl py-3 text-xl font-semibold select-none capitalize mt-4 flex items-center justify-center gap-4">
                    <h1>databasega yozish</h1>
                    <Image src='/database.png' alt="database" width={20} height={20} />
                </button>
            </form>
        </div>
    );
};

export default ProductsPost;