'use client'
import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface OrderItem {
    id: string
    customerName: string
    customerPhone: string
    customerEmail: string
    productTitle: string
    quantity: number
    totalPrice: number
    status: 'Yangi' | 'Yetkazilmoqda' | 'Bajarildi' | 'Bekor qilindi'
    date: string
}

export default function WarehouseOrdersPage() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale || 'uz'

    const [orders, setOrders] = useState<OrderItem[]>([
        {
            id: 'ord-101',
            customerName: 'Jasur Karimov',
            customerPhone: '+998 90 123 45 67',
            customerEmail: 'jasur@gmail.com',
            productTitle: 'iPhone 15 Pro Max',
            quantity: 1,
            totalPrice: 1200,
            status: 'Yangi',
            date: '2026-07-28'
        },
        {
            id: 'ord-102',
            customerName: 'Malika Aliyeva',
            customerPhone: '+998 91 987 65 43',
            customerEmail: 'malika@gmail.com',
            productTitle: 'AirPods Pro 2',
            quantity: 2,
            totalPrice: 500,
            status: 'Yetkazilmoqda',
            date: '2026-07-27'
        },
    ])

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleDelete = (id: string) => {
        setOrders(orders.filter(o => o.id !== id))
        setDeleteId(null)
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 relative min-h-[80vh] animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Mijozlar Buyurtmalari (Orders)
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Do'konga kelib tushgan barcha buyurtmalar, xaridor ma'lumotlari va to'lovlar tarixi
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
                {orders.length === 0 ? (
                    <div className="text-center py-16 p-8 rounded-[28px] bg-white/10 dark:bg-[#121214]/40 backdrop-blur-3xl border border-white/20 dark:border-white/10">
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium">Hozircha buyurtmalar mavjud emas.</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div
                            key={order.id}
                            className="p-6 rounded-[28px] bg-white/10 dark:bg-[#121214]/40 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-sky-500/40 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center justify-between md:justify-start gap-4">
                                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 font-semibold border border-sky-500/20">
                                        #{order.id}
                                    </span>
                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                        order.status === 'Yangi' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        order.status === 'Yetkazilmoqda' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    }`}>
                                        {order.status}
                                    </span>
                                    <span className="text-xs text-neutral-400">{order.date}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                    <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5 space-y-1">
                                        <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">Xaridor</span>
                                        <h4 className="font-bold text-neutral-900 dark:text-white text-sm">
                                            {order.customerName}
                                        </h4>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                                            📞 {order.customerPhone}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                            ✉️ {order.customerEmail}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5 space-y-1">
                                        <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">Buyurtma qilingan mahsulot</span>
                                        <h4 className="font-bold text-neutral-900 dark:text-white text-sm truncate">
                                            {order.productTitle}
                                        </h4>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                                                Miqdor: <strong className="text-neutral-900 dark:text-white">{order.quantity} dona</strong>
                                            </span>
                                            <span className="text-xs font-bold text-sky-500">
                                                Umumiy: ${order.totalPrice}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center justify-end">
                                <button
                                    onClick={() => setDeleteId(order.id)}
                                    className="px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium text-sm transition-all active:scale-95 border border-red-500/20 flex items-center gap-2"
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
                        <h4 className="text-lg font-bold text-white">Buyurtmani o'chirish</h4>
                        <p className="text-sm text-neutral-400">Rostdan ham ushbu buyurtmani arxivdan o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
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