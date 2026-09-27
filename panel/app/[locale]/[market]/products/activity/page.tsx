'use client'
import React, { useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

interface CommentItem {
    id: string
    author: string
    text: string
    date: string
    isAdmin: boolean
}

interface RequestItem {
    id: string
    author: string
    requestText: string
    status: 'Kutilmoqda' | 'Bajarildi' | 'Rad etildi'
}

interface ReactionItem {
    id: string
    type: 'like' | 'love' | 'fire' | 'sad'
    count: number
}

export default function ProductActivityPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const locale = params.locale || 'uz'
    const productId = searchParams.get('id') || '4'

    const [activeTab, setActiveTab] = useState<'comments' | 'requests' | 'reactions'>('comments')

    const [comments, setComments] = useState<CommentItem[]>([
        { id: '1', author: 'Market Admin (Siz)', text: 'Mahsulot narxi va sifati bo\'yicha barcha talablar bajarildi.', date: '2026-07-28', isAdmin: true },
        { id: '2', author: 'Mijoz #42', text: 'Yetkazib berish tezligi juda zo\'r ekan, rahmat!', date: '2026-07-27', isAdmin: false }
    ])
    const [newComment, setNewComment] = useState('')

    const [requests, setRequests] = useState<RequestItem[]>([
        { id: '1', author: 'Mijoz #12', requestText: 'Qora ranglisini ham sotuvga qo\'shinglar.', status: 'Kutilmoqda' }
    ])
    const [newRequest, setNewRequest] = useState('')

    const [reactions, setReactions] = useState<ReactionItem[]>([
        { id: 'l1', type: 'like', count: 14 },
        { id: 'l2', type: 'love', count: 8 },
        { id: 'l3', type: 'fire', count: 25 },
        { id: 'l4', type: 'sad', count: 2 }
    ])

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault()
        if (newComment.trim()) {
            setComments([
                { id: Date.now().toString(), author: 'Market Admin (Siz)', text: newComment, date: new Date().toISOString().split('T')[0], isAdmin: true },
                ...comments
            ])
            setNewComment('')
        }
    }

    const handleAddRequest = (e: React.FormEvent) => {
        e.preventDefault()
        if (newRequest.trim()) {
            setRequests([
                { id: Date.now().toString(), author: 'Market Admin', requestText: newRequest, status: 'Kutilmoqda' },
                ...requests
            ])
            setNewRequest('')
        }
    }

    const handleReact = (id: string) => {
        setReactions(reactions.map(r => r.id === id ? { ...r, count: r.count + 1 } : r))
    }

    const handleDeleteComment = (id: string) => {
        setComments(comments.filter(c => c.id !== id))
    }

    return (
        <div className="mx-auto py-8 px-4 relative min-h-[85vh] animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Mahsulot Muloqot Markazi
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Mahsulot ID: <span className="text-sky-500 font-mono">#{productId}</span> bo'yicha izohlar, shikoyatlar va reaksiyalar
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/${locale}/warehouse/products`)}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-all w-fit"
                >
                    &larr; Mahsulotlarga qaytish
                </button>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/10 dark:bg-[#121214]/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 mb-8 w-fit">
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'comments' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                    Izohlar (Comments)
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'requests' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                    Shikoyat/Takliflar (Features)
                </button>
                <button
                    onClick={() => setActiveTab('reactions')}
                    className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'reactions' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                >
                    Reaksiyalar (Reactions)
                </button>
            </div>

            <div className="p-6 md:p-8 rounded-[32px] bg-white/10 dark:bg-[#121214]/40 backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300">
                
                {activeTab === 'comments' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Mahsulot izohlari</h3>
                            <span className="text-xs px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 font-semibold border border-sky-500/20">{comments.length} ta izoh</span>
                        </div>

                        <form onSubmit={handleAddComment} className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Admin sifatida izoh qoldiring..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 text-sm font-medium"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-90 active:scale-95 transition-all text-sm shadow-lg shadow-sky-500/20"
                            >
                                Yuborish
                            </button>
                        </form>

                        <div className="space-y-4 pt-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/10 flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${comment.isAdmin ? 'bg-sky-500/20 text-sky-500' : 'bg-neutral-500/20 text-neutral-400'}`}>
                                                {comment.author}
                                            </span>
                                            <span className="text-xs text-neutral-400">{comment.date}</span>
                                        </div>
                                        <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium pt-1">
                                            {comment.text}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all text-xs"
                                        title="O'chirish"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Mijozlar shikoyat va takliflari</h3>
                            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">{requests.length} ta talab</span>
                        </div>

                        <form onSubmit={handleAddRequest} className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Yangi taklif yoki shikoyat qo'shish..."
                                value={newRequest}
                                onChange={(e) => setNewRequest(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-500 hover:opacity-90 active:scale-95 transition-all text-sm shadow-lg shadow-amber-500/20"
                            >
                                Qo'shish
                            </button>
                        </form>

                        <div className="space-y-4 pt-4">
                            {requests.map((req) => (
                                <div key={req.id} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-neutral-400">{req.author}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-semibold">{req.status}</span>
                                        </div>
                                        <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium">
                                            {req.requestText}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'reactions' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Mahsulot Reaksiyalari</h3>
                            <p className="text-xs text-neutral-400 mt-1">Mijozlar va siz qoldirgan emotsional munosabatlar (Like, Love, Fire, Sad)</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                            {reactions.map((react) => (
                                <button
                                    key={react.id}
                                    onClick={() => handleReact(react.id)}
                                    className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-white/10 hover:border-sky-500/50 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group"
                                >
                                    <span className="text-4xl group-hover:scale-125 transition-transform duration-300">
                                        {react.type === 'like' && '👍'}
                                        {react.type === 'love' && '❤️'}
                                        {react.type === 'fire' && '🔥'}
                                        {react.type === 'sad' && '😢'}
                                    </span>
                                    <div className="text-center">
                                        <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">{react.count}</span>
                                        <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mt-0.5">{react.type}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}