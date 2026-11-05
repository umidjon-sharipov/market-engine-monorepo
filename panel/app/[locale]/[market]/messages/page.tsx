'use client'
import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface MessageItem {
    id: string
    senderName: string
    senderEmail: string
    subject: string
    message: string
    date: string
}

export default function WarehouseMessagesPage() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale || 'uz'

    const [messages, setMessages] = useState<MessageItem[]>([
        { 
            id: '1', 
            senderName: 'Aziz Rahimov', 
            senderEmail: 'aziz@gmail.com', 
            subject: 'Ulgurji xarid bo\'yicha savol', 
            message: 'Assalomu alaykum, do\'koningizdan katta miqdorda mahsulot olmoqchi edim. Chegirma bormi?', 
            date: '2026-07-28' 
        },
        { 
            id: '2', 
            senderName: 'Dilshodbek Tursunov', 
            senderEmail: 'dilshod@gmail.com', 
            subject: 'Yetkazib berish vaqti', 
            message: 'Qashqadaryo viloyatiga yetkazib berish necha kun davom etadi?', 
            date: '2026-07-27' 
        },
    ])

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleDelete = (id: string) => {
        setMessages(messages.filter(m => m.id !== id))
        setDeleteId(null)
    }

    return (
        <div className="mx-auto py-8 px-4 relative min-h-[80vh] animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Do'kon Xabarlari (Messages)
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Mijozlar tomonidan to'g'ridan-to'g'ri do'konga yuborilgan xatlar va murojaatlar
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/${locale}/warehouse/products`)}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-all"
                >
                    &larr; Mahsulotlarga qaytish
                </button>
            </div>

            <div className="space-y-4 pb-20">
                {messages.length === 0 ? (
                    <div className="text-center py-16 p-8 rounded-[28px] bg-white/10 dark:bg-[#121214]/40 backdrop-blur-3xl border border-white/20 dark:border-white/10">
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium">Hozircha xabarlar mavjud emas.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="p-6 rounded-[28px] bg-white/10 dark:bg-[#121214]/40 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-sky-500/40 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center justify-between md:justify-start gap-4">
                                    <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                                        {msg.senderName} <span className="text-xs font-normal text-sky-500">({msg.senderEmail})</span>
                                    </h3>
                                    <span className="text-xs text-neutral-400">{msg.date}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                    Mavzu: {msg.subject}
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-300 bg-black/5 dark:bg-white/5 p-3.5 rounded-2xl border border-white/5">
                                    {msg.message}
                                </p>
                            </div>

                            <div className="shrink-0 flex items-center justify-end">
                                <button
                                    onClick={() => setDeleteId(msg.id)}
                                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium text-sm transition-all active:scale-95 border border-red-500/20 flex items-center gap-2"
                                >
                                    <span>🗑️ O'chirish</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-sm p-6 rounded-3xl bg-[#121214] border border-white/10 shadow-2xl space-y-4">
                        <h4 className="text-lg font-bold text-white">Xatni o'chirish</h4>
                        <p className="text-sm text-neutral-400">Rostdan ham ushbu xatni o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/15 transition-all"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/30"
                            >
                                O'chirish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}