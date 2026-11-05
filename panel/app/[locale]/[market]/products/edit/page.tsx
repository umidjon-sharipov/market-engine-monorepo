'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const locale = params.locale || 'uz'
    const productId = searchParams.get('id')

    const [title, setTitle] = useState(productId ? 'iPhone 15 Pro Max' : '')
    const [description, setDescription] = useState(productId ? 'Yangi avlod flagman smartfon, titanium korpus.' : '')
    const [price, setPrice] = useState(productId ? 1200 : 0)
    const [uom, setUom] = useState('PCS')
    const [selectedImage] = useState('https://i.ibb.co/nNZrjBSD/user.png')

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Updated product:', { id: productId, title, description, price, uom, selectedImage })
        router.push(`/${locale}/warehouse/products`)
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Mahsulotni Tahrirlash (Put / Edit)
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Mahsulot ID: <span className="text-sky-500 font-mono">{productId || 'Noma\'lum'}</span>
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/${locale}/warehouse/products`)}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-all"
                >
                    Orqaga qaytish
                </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
                <div className="p-8 rounded-[32px] bg-white/10 dark:bg-[#121214]/40 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        
                        <div className="space-y-4">
                            <label className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                                Joriy Mahsulot Rasmi
                            </label>
                            
                            <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/10 border border-white/10 group shadow-inner">
                                <Image 
                                    src={selectedImage} 
                                    alt="Product Preview" 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-xs text-white font-medium">Rasmni o&apos;zgartirish</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                               <button
                                    type="button"
                                    className="flex-1 py-3 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span>Yangi rasm yuklash</span>
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
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 backdrop-blur-md transition-all font-medium"
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
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 backdrop-blur-md transition-all resize-none font-medium"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/${locale}/warehouse/products`)}
                                    className="px-6 py-4 rounded-2xl font-medium text-neutral-700 dark:text-neutral-300 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-90 active:scale-95 shadow-lg shadow-sky-500/30 transition-all duration-200 flex items-center gap-2"
                                >
                                    <span>O&apos;zgarishlarni saqlash (Put)</span>
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