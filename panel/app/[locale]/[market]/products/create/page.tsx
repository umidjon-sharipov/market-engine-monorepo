'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'

export default function CreateProductPage() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale || 'uz'

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState(0)
    const [uom, setUom] = useState('PCS')
    const [selectedImage] = useState('https://i.ibb.co/nNZrjBSD/user.png')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log({ title, description, price, uom, selectedImage })
        router.push(`/${locale}/warehouse/products`)
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    Yangi Mahsulot Qo&apos;shish
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Mahsulot ma&apos;lumotlarini quyidagi interaktiv karta orqali to&apos;ldiring
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-8 rounded-[32px] bg-white/10 dark:bg-[#121214]/40 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                        <div className="space-y-4">
                            <label className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                                Mahsulot Rasmi (Slider / Gallery)
                            </label>

                            <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/10 border border-white/10 group shadow-inner">
                                <Image
                                    src={selectedImage}
                                    alt="Product Preview"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-xs text-white font-medium">Joriy tanlangan rasm</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="flex-1 py-3 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>+ Rasm qo&apos;shish</span>
                                </button>
                                <button
                                    type="button"
                                    className="py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-medium text-sm transition-all active:scale-95"
                                >
                                    - O&apos;chirish
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 flex flex-col justify-between h-full">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                                        Mahsulot nomi (Title)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Masalan: iPhone 15 Pro Max"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 backdrop-blur-md transition-all font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                                            Narxi ($)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={price}
                                            onChange={(e) => setPrice(Number(e.target.value))}
                                            className="w-full px-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 backdrop-blur-md transition-all font-medium"
                                        />
                                    </div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        O&apos;lchov birligi
                                        <select value={uom} onChange={(e) => setUom(e.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3.5 text-neutral-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                                            <option value="PCS">PCS — dona</option>
                                            <option value="KG">KG — kilogramm</option>
                                            <option value="LITRE">LITRE — litr</option>
                                            <option value="METER">METER — metr</option>
                                        </select>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                                        Tavsif (Description)
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Mahsulot haqida to'liq ma'lumot yozing..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 backdrop-blur-md transition-all resize-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    className="px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-90 active:scale-95 shadow-lg shadow-sky-500/30 transition-all duration-200 flex items-center gap-2"
                                >
                                    <span>Saqlash (Post)</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </button>
                            </div>

                        </div>

                    </div>
                </div>
            </form>
        </div>
    )
}