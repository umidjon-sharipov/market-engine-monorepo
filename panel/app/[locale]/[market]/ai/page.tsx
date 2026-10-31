'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import {
    Activity,
    Bot,
    Check,
    Copy,
    Database,
    Loader2,
    MessageSquarePlus,
    Plus,
    Send,
    ShieldCheck,
    Sparkles,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useTokenStore } from '@/app/_store/useTokenStore';

type MessageRole = 'user' | 'assistant';

interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    createdAt: string;
    toolExecutions?: number;
    model?: string;
}

interface ChatThread {
    id: string;
    title: string;
    updatedAt: string;
    messages: ChatMessage[];
}

interface ChatApiResponse {
    success?: boolean;
    result?: string;
    toolExecutions?: number;
    model?: string;
    error?: string;
    message?: string;
}

const MAX_SAVED_THREADS = 24;
const MAX_SAVED_MESSAGES = 80;
const MAX_CONTEXT_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4_000;

const SUGGESTIONS = [
    {
        icon: Database,
        title: 'Mahsulotlarni ko‘rish',
        prompt: 'Marketimdagi oxirgi 10 ta mahsulotni nomi, narxi va ID si bilan ko‘rsat.',
    },
    {
        icon: Sparkles,
        title: 'Mahsulot yaratish',
        prompt: 'Yangi mahsulot yarat: Wireless Mouse, narxi 29.99, o‘lchov birligi PCS.',
    },
    {
        icon: Activity,
        title: 'Ombor holati',
        prompt: 'Ombordagi kam qolgan mahsulotlarni tekshir va natijani qisqacha tahlil qil.',
    },
    {
        icon: ShieldCheck,
        title: 'Chegirmalar',
        prompt: 'Marketimdagi faol chegirmalarni ko‘rsat.',
    },
];

function createId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isChatMessage(value: unknown): value is ChatMessage {
    if (!value || typeof value !== 'object') return false;
    const item = value as Record<string, unknown>;
    return typeof item.id === 'string'
        && (item.role === 'user' || item.role === 'assistant')
        && typeof item.content === 'string'
        && typeof item.createdAt === 'string';
}

function isChatThread(value: unknown): value is ChatThread {
    if (!value || typeof value !== 'object') return false;
    const item = value as Record<string, unknown>;
    return typeof item.id === 'string'
        && typeof item.title === 'string'
        && typeof item.updatedAt === 'string'
        && Array.isArray(item.messages)
        && item.messages.every(isChatMessage);
}

function formatTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

export default function AdminAIChatPage() {
    const params = useParams<Record<string, string | string[]>>();
    const searchParams = useSearchParams();
    const rawMarket = params?.market ?? params?.marketId;
    const marketId = (Array.isArray(rawMarket) ? rawMarket[0] : rawMarket || '') || searchParams.get('marketId') || '';
    const token = useTokenStore((state) => state.getActiveToken());

    const storageKey = `market-ai-chat:v1:${marketId || 'no-market'}`;
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
    const [modelName, setModelName] = useState('openai/gpt-oss-120b');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const activeThread = useMemo(
        () => threads.find((thread) => thread.id === activeThreadId) || null,
        [threads, activeThreadId],
    );
    const messages = activeThread?.messages || [];

    useEffect(() => {
        let restored: ChatThread[] = [];
        try {
            const raw = window.localStorage.getItem(storageKey);
            const parsed: unknown = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) {
                restored = parsed
                    .filter(isChatThread)
                    .slice(0, MAX_SAVED_THREADS)
                    .map((thread) => ({
                        ...thread,
                        messages: thread.messages.slice(-MAX_SAVED_MESSAGES) as ChatMessage[],
                    }));
            }
        } catch {
            restored = [];
        }

        setThreads(restored);
        setActiveThreadId(restored[0]?.id || null);
        setLoadedStorageKey(storageKey);
        setRequestError(null);
    }, [storageKey]);

    useEffect(() => {
        if (loadedStorageKey !== storageKey) return;
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(threads.slice(0, MAX_SAVED_THREADS)));
        } catch {
            setRequestError('Chat tarixini brauzer xotirasiga saqlab bo‘lmadi.');
        }
    }, [threads, storageKey, loadedStorageKey]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, loading]);

    const upsertThread = (thread: ChatThread) => {
        setThreads((current) => [
            thread,
            ...current.filter((item) => item.id !== thread.id),
        ].slice(0, MAX_SAVED_THREADS));
    };

    const startNewChat = () => {
        setActiveThreadId(null);
        setInput('');
        setRequestError(null);
        setMobileHistoryOpen(false);
        inputRef.current?.focus();
    };

    const removeThread = (threadId: string) => {
        const next = threads.filter((thread) => thread.id !== threadId);
        setThreads(next);
        if (activeThreadId === threadId) {
            setActiveThreadId(next[0]?.id || null);
        }
    };

    const handleSend = async (event?: FormEvent) => {
        event?.preventDefault();
        const text = input.trim();
        if (!text || loading) return;

        if (!token) {
            setRequestError('Faol JWT token topilmadi. Qayta tizimga kiring.');
            return;
        }
        if (!marketId) {
            setRequestError('Market ID URL parametrida topilmadi. AI sahifasini market kontekstida oching.');
            return;
        }

        const timestamp = new Date().toISOString();
        const threadId = activeThread?.id || createId();
        const userMessage: ChatMessage = {
            id: createId(),
            role: 'user',
            content: text,
            createdAt: timestamp,
        };
        const nextMessages = [...messages, userMessage].slice(-MAX_SAVED_MESSAGES);
        const nextThread: ChatThread = {
            id: threadId,
            title: activeThread?.title || text.replace(/\s+/g, ' ').slice(0, 54),
            updatedAt: timestamp,
            messages: nextMessages,
        };

        setActiveThreadId(threadId);
        upsertThread(nextThread);
        setInput('');
        setLoading(true);
        setRequestError(null);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    marketId,
                    messages: nextMessages.slice(-MAX_CONTEXT_MESSAGES).map(({ role, content }) => ({ role, content })),
                }),
                cache: 'no-store',
            });

            const payload = await response.json() as ChatApiResponse;
            if (!response.ok) {
                throw new Error(payload.message || payload.error || `AI server xatosi (${response.status}).`);
            }

            const assistantMessage: ChatMessage = {
                id: createId(),
                role: 'assistant',
                content: typeof payload.result === 'string' && payload.result.trim()
                    ? payload.result
                    : 'AI javob qaytarmadi.',
                createdAt: new Date().toISOString(),
                toolExecutions: typeof payload.toolExecutions === 'number' ? payload.toolExecutions : 0,
                model: typeof payload.model === 'string' ? payload.model : undefined,
            };

            const completedThread: ChatThread = {
                ...nextThread,
                updatedAt: assistantMessage.createdAt,
                messages: [...nextMessages, assistantMessage].slice(-MAX_SAVED_MESSAGES),
            };
            upsertThread(completedThread);
            if (payload.model) setModelName(payload.model);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Noma’lum xatolik yuz berdi.';
            setRequestError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void handleSend();
        }
    };

    const copyMessage = async (message: ChatMessage) => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopiedId(message.id);
            window.setTimeout(() => setCopiedId(null), 1600);
        } catch {
            setRequestError('Clipboard ruxsati berilmadi.');
        }
    };

    const historyPanel = (
        <aside className="flex h-full w-full flex-col border-r border-white/[0.07] bg-[#0b1019] lg:w-[272px] lg:shrink-0">
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-950/30">
                    <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold tracking-wide text-white">MARKET AI</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">MCL agent workspace</p>
                </div>
                <button
                    type="button"
                    onClick={ () => setMobileHistoryOpen(false) }
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white lg:hidden"
                    aria-label="Tarixni yopish"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="px-4 py-4">
                <button
                    type="button"
                    onClick={ startNewChat }
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-3 text-xs font-semibold text-indigo-200 transition hover:border-indigo-300/40 hover:bg-indigo-500/15"
                >
                    <Plus className="h-4 w-4" />
                    Yangi suhbat
                </button>
            </div>

            <div className="flex items-center justify-between px-5 pb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">So‘nggi suhbatlar</span>
                <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] tabular-nums text-slate-500">{ threads.length }</span>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                { threads.length === 0 ? (
                    <p className="px-3 py-5 text-xs leading-5 text-slate-600">Hozircha suhbatlar yo‘q. Yangi suhbat boshlang.</p>
                ) : threads.map((thread) => (
                    <div
                        key={ thread.id }
                        className={ `group flex items-center gap-1 rounded-xl border px-2 py-2 transition ${activeThreadId === thread.id
                            ? 'border-white/10 bg-white/[0.07]'
                            : 'border-transparent hover:bg-white/[0.035]'}` }
                    >
                        <button
                            type="button"
                            onClick={ () => { setActiveThreadId(thread.id); setRequestError(null); setMobileHistoryOpen(false); } }
                            className="min-w-0 flex-1 px-1.5 py-1 text-left"
                        >
                            <span className="block truncate text-xs font-medium text-slate-300">{ thread.title || 'Yangi suhbat' }</span>
                            <span className="mt-1 block text-[10px] text-slate-600">{ formatDate(thread.updatedAt) } · { thread.messages.length } xabar</span>
                        </button>
                        <button
                            type="button"
                            onClick={ () => removeThread(thread.id) }
                            className="rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Suhbatni o‘chirish"
                            title="Suhbatni o‘chirish"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )) }
            </div>

            <div className="border-t border-white/[0.07] p-4">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-emerald-300">Server-side access control</p>
                        <p className="mt-0.5 truncate text-[9px] text-slate-500">JWT · market scope · permissions</p>
                    </div>
                </div>
                <p className="mt-3 px-1 text-[9px] leading-4 text-slate-600">Chat tarixi ushbu brauzerda saqlanadi. Backenddagi ma’lumotlarga ruxsat NestJS tomonidan tekshiriladi.</p>
            </div>
        </aside>
    );

    return (
        <div className="mx-auto flex h-[calc(100dvh-112px)] min-h-[540px] max-w-[1500px] overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#080c13] font-sans text-slate-100 shadow-2xl shadow-black/30">
            <div className="hidden lg:block">{ historyPanel }</div>

            { mobileHistoryOpen && (
                <div className="fixed inset-0 z-[120] flex lg:hidden">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={ () => setMobileHistoryOpen(false) } />
                    <div className="relative z-10 h-full w-[min(88vw,320px)]">{ historyPanel }</div>
                </div>
            ) }

            <main className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.09),_transparent_48%)]">
                <header className="flex min-h-[72px] items-center gap-3 border-b border-white/[0.07] px-4 sm:px-6">
                    <button
                        type="button"
                        onClick={ () => setMobileHistoryOpen(true) }
                        className="rounded-xl border border-white/10 bg-white/[0.035] p-2 text-slate-400 hover:bg-white/[0.07] hover:text-white lg:hidden"
                        aria-label="Chat tarixini ochish"
                    >
                        <MessageSquarePlus className="h-4 w-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-sm font-semibold tracking-tight text-white">{ activeThread?.title || 'Yangi suhbat' }</h1>
                            <span className="hidden rounded-md border border-indigo-400/15 bg-indigo-400/[0.06] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-300 sm:inline-flex">Agent</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.6)]" /> { modelName }</span>
                            <span className="hidden sm:inline">Market: { marketId ? `${marketId.slice(0, 8)}…` : 'aniqlanmagan' }</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={ startNewChat }
                        className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-[11px] font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Yangi chat</span>
                    </button>
                </header>

                <section className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-7">
                    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                        { messages.length === 0 && (
                            <div className="flex min-h-[390px] flex-col items-center justify-center py-8 text-center">
                                <div className="relative mb-6 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 to-sky-500/[0.06] text-indigo-200 shadow-[0_0_60px_rgba(79,70,229,0.12)]">
                                    <Bot className="h-9 w-9" />
                                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#080c13] bg-emerald-400 text-[#07110d]"><Sparkles className="h-3 w-3" /></span>
                                </div>
                                <p className="text-xl font-semibold tracking-tight text-white">Market boshqaruvi, bir joyda.</p>
                                <p className="mt-2 max-w-lg text-xs leading-6 text-slate-500">Mahsulotlar, katalog, chegirmalar va ombor bo‘yicha savol bering. AI kerak bo‘lganda MCL amallarini backendda, sizning huquqlaringiz doirasida bajaradi.</p>
                                <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                                    { SUGGESTIONS.map((suggestion) => {
                                        const Icon = suggestion.icon;
                                        return (
                                            <button
                                                key={ suggestion.title }
                                                type="button"
                                                onClick={ () => { setInput(suggestion.prompt); inputRef.current?.focus(); } }
                                                className="group flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition hover:border-indigo-400/25 hover:bg-indigo-500/[0.055]"
                                            >
                                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-indigo-300 transition group-hover:border-indigo-400/20 group-hover:bg-indigo-500/10"><Icon className="h-4 w-4" /></span>
                                                <span className="min-w-0"><span className="block text-xs font-semibold text-slate-200">{ suggestion.title }</span><span className="mt-1 block text-[10px] leading-5 text-slate-500">{ suggestion.prompt }</span></span>
                                            </button>
                                        );
                                    }) }
                                </div>
                            </div>
                        ) }

                        { messages.map((message) => (
                            <article key={ message.id } className={ `group flex gap-3 sm:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}` }>
                                <div className={ `mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${message.role === 'assistant'
                                    ? 'border-indigo-400/20 bg-indigo-500/10 text-indigo-300'
                                    : 'border-white/10 bg-white/[0.06] text-slate-300'}` }>
                                    { message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" /> }
                                </div>
                                <div className={ `min-w-0 max-w-[calc(100%-48px)] sm:max-w-[82%] ${message.role === 'user' ? 'text-right' : ''}` }>
                                    <div className={ `mb-1.5 flex items-center gap-2 text-[10px] text-slate-600 ${message.role === 'user' ? 'justify-end' : ''}` }>
                                        <span>{ message.role === 'assistant' ? 'MARKET AI' : 'SIZ' }</span>
                                        <span>·</span>
                                        <span>{ formatTime(message.createdAt) }</span>
                                    </div>
                                    <div className={ `inline-block max-w-full rounded-2xl px-4 py-3.5 text-left text-[13px] leading-6 ${message.role === 'user'
                                        ? 'rounded-tr-md border border-indigo-400/15 bg-indigo-500/[0.13] text-indigo-50'
                                        : 'rounded-tl-md border border-white/[0.07] bg-[#111722] text-slate-200 shadow-lg shadow-black/10'}` }>
                                        <div className="prose prose-invert max-w-none break-words text-[13px] leading-6 prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-slate-100 prose-strong:text-white prose-code:rounded prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:text-indigo-200 prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/35 prose-li:my-1">
                                            <ReactMarkdown>{ message.content }</ReactMarkdown>
                                        </div>
                                        { message.role === 'assistant' && (message.toolExecutions || 0) > 0 && (
                                            <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-2.5 text-[10px] text-emerald-300/80">
                                                <Activity className="h-3.5 w-3.5" />
                                                { message.toolExecutions } ta backend amal bajarildi
                                            </div>
                                        ) }
                                    </div>
                                    <div className={ `mt-1.5 flex items-center gap-2 opacity-0 transition group-hover:opacity-100 ${message.role === 'user' ? 'justify-end' : ''}` }>
                                        <button type="button" onClick={ () => void copyMessage(message) } className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] text-slate-500 hover:bg-white/[0.05] hover:text-slate-300">
                                            { copiedId === message.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" /> }
                                            { copiedId === message.id ? 'Nusxalandi' : 'Nusxalash' }
                                        </button>
                                    </div>
                                </div>
                            </article>
                        )) }

                        { loading && (
                            <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300"><Bot className="h-4 w-4" /></div>
                                <div className="rounded-2xl rounded-tl-md border border-white/[0.07] bg-[#111722] px-4 py-3.5">
                                    <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-300" /> Market ma’lumotlari tekshirilmoqda…</div>
                                    <div className="mt-2 text-[10px] text-slate-600">AI vazifaga qarab ruxsat etilgan MCL amallarini bajarishi mumkin.</div>
                                </div>
                            </div>
                        ) }
                        <div ref={ messagesEndRef } />
                    </div>
                </section>

                <footer className="border-t border-white/[0.07] bg-[#0a0e16]/90 px-3 pb-4 pt-3 sm:px-6 sm:pb-5">
                    <div className="mx-auto max-w-4xl">
                        { (!token || !marketId) && (
                            <div className="mb-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-3 py-2.5 text-xs leading-5 text-amber-100/80">
                                { !token ? 'Faol JWT token topilmadi. Tizimga qayta kiring.' : 'Market UUID topilmadi. Sahifani market route ichida oching yoki ?marketId=<UUID> parametrini yuboring.' }
                            </div>
                        ) }
                        { requestError && (
                            <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] px-3 py-2.5 text-xs text-rose-200">
                                <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span className="min-w-0 flex-1">{ requestError }</span>
                                <button type="button" onClick={ () => setRequestError(null) } className="text-rose-200/60 hover:text-rose-100" aria-label="Xatolikni yopish"><X className="h-3.5 w-3.5" /></button>
                            </div>
                        ) }
                        <form onSubmit={ (event) => void handleSend(event) } className="relative rounded-2xl border border-white/[0.11] bg-[#111722] shadow-[0_12px_40px_rgba(0,0,0,0.24)] transition focus-within:border-indigo-400/35 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.07)]">
                            <textarea
                                ref={ inputRef }
                                value={ input }
                                onChange={ (event) => setInput(event.target.value) }
                                onKeyDown={ handleComposerKeyDown }
                                rows={ 2 }
                                maxLength={ MAX_MESSAGE_CHARS }
                                disabled={ loading || !token || !marketId }
                                placeholder="Market AI ga topshiriq yoki savolingizni yozing…"
                                className="max-h-40 min-h-[58px] w-full resize-y bg-transparent px-4 pb-2 pt-4 pr-14 text-[13px] leading-6 text-slate-100 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <div className="flex items-center justify-between gap-3 px-3 pb-3">
                                <div className="flex min-w-0 items-center gap-2 text-[9px] text-slate-600">
                                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500/70" />
                                    <span className="truncate">Market huquqlari backendda tekshiriladi</span>
                                    <span className="hidden sm:inline">·</span>
                                    <span className="hidden sm:inline">Shift + Enter — yangi qator</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={ loading || !input.trim() || !token || !marketId }
                                    className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-indigo-500 px-3.5 text-[11px] font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    { loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" /> }
                                    <span>Yuborish</span>
                                </button>
                            </div>
                        </form>
                        <p className="mt-2 text-center text-[9px] text-slate-700">AI javoblari tekshiruvni talab qilishi mumkin. Muhim amallar backenddagi ruxsatlar va qoidalar bilan cheklanadi.</p>
                    </div>
                </footer>
            </main>
        </div>
    );
}