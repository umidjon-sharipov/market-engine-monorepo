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
import { useThemeStore } from '@/app/_store/useThemeStore';

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
    const isDark = useThemeStore((state) => state.theme === 'dark');

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
    const colors = isDark
        ? {
            page: 'bg-[#080c13] text-slate-100',
            sidebar: 'bg-[#0b1019]',
            surface: 'bg-[#111722]',
            subtleSurface: 'bg-white/[0.035]',
            border: 'border-white/[0.07]',
            strongBorder: 'border-white/[0.11]',
            text: 'text-slate-100',
            secondaryText: 'text-slate-300',
            mutedText: 'text-slate-500',
            faintText: 'text-slate-600',
            selectedThread: 'border-white/10 bg-white/[0.07]',
            idleThread: 'border-transparent hover:bg-white/[0.035]',
            assistantBubble: 'border-white/[0.07] bg-[#111722] text-slate-200',
            userBubble: 'border-indigo-400/15 bg-indigo-500/[0.13] text-indigo-50',
            composer: 'bg-[#0a0e16]/95',
            overlay: 'bg-black/70',
            prose: 'prose-invert prose-headings:text-slate-100 prose-strong:text-white prose-code:bg-black/30 prose-code:text-indigo-200 prose-pre:border-white/10 prose-pre:bg-black/35',
        }
        : {
            page: 'bg-slate-50 text-slate-900',
            sidebar: 'bg-white',
            surface: 'bg-white',
            subtleSurface: 'bg-slate-100/80',
            border: 'border-slate-200',
            strongBorder: 'border-slate-200',
            text: 'text-slate-900',
            secondaryText: 'text-slate-700',
            mutedText: 'text-slate-500',
            faintText: 'text-slate-400',
            selectedThread: 'border-indigo-200 bg-indigo-50',
            idleThread: 'border-transparent hover:bg-slate-100',
            assistantBubble: 'border-slate-200 bg-white text-slate-700',
            userBubble: 'border-indigo-200 bg-indigo-50 text-indigo-950',
            composer: 'bg-white/95',
            overlay: 'bg-slate-950/40',
            prose: 'prose-headings:text-slate-900 prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:text-indigo-700 prose-pre:border-slate-200 prose-pre:bg-slate-50',
        };

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
        <aside className={`flex h-full w-full flex-col ${colors.sidebar} lg:w-[272px] lg:shrink-0`}>
            <div className={`flex items-center gap-3 border-b ${colors.border} px-4 py-4 sm:px-5 sm:py-5`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-950/30">
                    <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold tracking-wide ${colors.text}`}>MARKET AI</p>
                    <p className={`mt-0.5 text-[10px] uppercase tracking-[0.18em] ${colors.mutedText}`}>MCL agent workspace</p>
                </div>
                <button
                    type="button"
                    onClick={ () => setMobileHistoryOpen(false) }
                    className={`rounded-lg p-1.5 ${colors.mutedText} hover:bg-indigo-500/10 hover:text-indigo-500 lg:hidden`}
                    aria-label="Tarixni yopish"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="px-4 py-4">
                <button
                    type="button"
                    onClick={ startNewChat }
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-3 text-xs font-semibold transition hover:border-indigo-300/40 hover:bg-indigo-500/15 ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}
                >
                    <Plus className="h-4 w-4" />
                    Yangi suhbat
                </button>
            </div>

            <div className="flex items-center justify-between px-5 pb-2">
                <span className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${colors.mutedText}`}>So‘nggi suhbatlar</span>
                <span className={`rounded-md ${colors.subtleSurface} px-1.5 py-0.5 text-[10px] tabular-nums ${colors.mutedText}`}>{ threads.length }</span>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                { threads.length === 0 ? (
                    <p className={`px-3 py-5 text-xs leading-5 ${colors.faintText}`}>Hozircha suhbatlar yo‘q. Yangi suhbat boshlang.</p>
                ) : threads.map((thread) => (
                    <div
                        key={ thread.id }
                        className={ `group flex items-center gap-1 rounded-xl border px-2 py-2 transition ${activeThreadId === thread.id
                            ? colors.selectedThread
                            : colors.idleThread}` }
                    >
                        <button
                            type="button"
                            onClick={ () => { setActiveThreadId(thread.id); setRequestError(null); setMobileHistoryOpen(false); } }
                            className="min-w-0 flex-1 px-1.5 py-1 text-left"
                        >
                            <span className={`block truncate text-xs font-medium ${colors.secondaryText}`}>{ thread.title || 'Yangi suhbat' }</span>
                            <span className={`mt-1 block text-[10px] ${colors.faintText}`}>{ formatDate(thread.updatedAt) } · { thread.messages.length } xabar</span>
                        </button>
                        <button
                            type="button"
                            onClick={ () => removeThread(thread.id) }
                            className={`rounded-lg p-1.5 ${colors.faintText} opacity-0 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100 focus:opacity-100`}
                            aria-label="Suhbatni o‘chirish"
                            title="Suhbatni o‘chirish"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )) }
            </div>

            <div className={`border-t ${colors.border} p-4`}>
                <div className="flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-emerald-300">Server-side access control</p>
                        <p className={`mt-0.5 truncate text-[9px] ${colors.mutedText}`}>JWT · market scope · permissions</p>
                    </div>
                </div>
                <p className={`mt-3 px-1 text-[9px] leading-4 ${colors.faintText}`}>Chat tarixi ushbu brauzerda saqlanadi. Backenddagi ma’lumotlarga ruxsat NestJS tomonidan tekshiriladi.</p>
            </div>
        </aside>
    );

    return (
        <div
            data-theme={isDark ? 'dark' : 'light'}
            className={`flex h-[calc(100dvh-7.5rem)] min-h-[min(460px,calc(100dvh-7.5rem))] w-full flex-col overflow-hidden rounded-2xl border ${colors.border} ${colors.page} font-sans shadow-xl shadow-black/5 transition-colors duration-200 sm:rounded-[26px] lg:flex-row`}
        >
            <div className={`hidden border-r ${colors.border} lg:block`}>{ historyPanel }</div>

            { mobileHistoryOpen && (
                <div className="fixed inset-0 z-[120] flex lg:hidden">
                    <button
                        type="button"
                        aria-label="Chat tarixini yopish"
                        className={`absolute inset-0 ${colors.overlay} backdrop-blur-sm`}
                        onClick={ () => setMobileHistoryOpen(false) }
                    />
                    <div className={`relative z-10 h-full w-[min(88vw,340px)] border-r ${colors.border} shadow-2xl`}>{ historyPanel }</div>
                </div>
            ) }

            <main className={`flex min-h-0 min-w-0 flex-1 flex-col ${isDark ? 'bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.09),_transparent_48%)]' : 'bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08),_transparent_52%)]'}`}>
                <header className={`flex min-h-[62px] shrink-0 items-center gap-3 border-b ${colors.border} px-3 sm:px-5`}>
                    <button
                        type="button"
                        onClick={ () => setMobileHistoryOpen(true) }
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${colors.strongBorder} ${colors.subtleSurface} ${colors.secondaryText} transition hover:border-indigo-400/30 hover:text-indigo-500 lg:hidden`}
                        aria-label="Chat tarixini ochish"
                    >
                        <MessageSquarePlus className="h-4 w-4" />
                    </button>
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500"><Bot className="h-4 w-4" /></span>
                        <div className="min-w-0">
                            <p className={`truncate text-xs font-semibold ${colors.text}`}>{activeThread?.title || 'Market AI'}</p>
                            <p className={`mt-0.5 flex items-center gap-1.5 truncate text-[10px] ${colors.mutedText}`}>
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <span className="truncate">{modelName}</span>
                                <span className="hidden sm:inline">· {marketId ? `Market ${marketId.slice(0, 8)}…` : 'Market aniqlanmagan'}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={ startNewChat }
                        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl border ${colors.strongBorder} px-2.5 text-[11px] font-medium ${colors.secondaryText} transition hover:border-indigo-400/30 hover:text-indigo-500 sm:px-3`}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Yangi chat</span>
                    </button>
                </header>

                <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 sm:gap-6">
                        { messages.length === 0 && (
                            <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center py-6 text-center sm:min-h-[360px] sm:py-8">
                                <div className="relative mb-6 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 to-sky-500/[0.06] text-indigo-200 shadow-[0_0_60px_rgba(79,70,229,0.12)]">
                                    <Bot className="h-9 w-9" />
                                    <span className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${isDark ? 'border-[#080c13]' : 'border-slate-50'} bg-emerald-400 text-[#07110d]`}><Sparkles className="h-3 w-3" /></span>
                                </div>
                                <p className={`text-lg font-semibold tracking-tight sm:text-xl ${colors.text}`}>Market boshqaruvi, bir joyda.</p>
                                <p className={`mt-2 max-w-lg px-2 text-xs leading-6 ${colors.mutedText}`}>Mahsulotlar, katalog, chegirmalar va ombor bo‘yicha savol bering. AI kerak bo‘lganda MCL amallarini backendda, sizning huquqlaringiz doirasida bajaradi.</p>
                                <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 sm:mt-8 sm:grid-cols-2">
                                    { SUGGESTIONS.map((suggestion) => {
                                        const Icon = suggestion.icon;
                                        return (
                                            <button
                                                key={ suggestion.title }
                                                type="button"
                                                onClick={ () => { setInput(suggestion.prompt); inputRef.current?.focus(); } }
                                                className={`group flex items-start gap-3 rounded-2xl border ${colors.border} ${isDark ? 'bg-white/[0.025]' : 'bg-white/80'} p-3.5 text-left shadow-sm transition hover:border-indigo-400/30 hover:bg-indigo-500/[0.055] sm:p-4`}
                                            >
                                                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${colors.border} ${colors.subtleSurface} text-indigo-500 transition group-hover:border-indigo-400/20 group-hover:bg-indigo-500/10`}><Icon className="h-4 w-4" /></span>
                                                <span className="min-w-0"><span className={`block text-xs font-semibold ${colors.secondaryText}`}>{ suggestion.title }</span><span className={`mt-1 block text-[10px] leading-5 ${colors.mutedText}`}>{ suggestion.prompt }</span></span>
                                            </button>
                                        );
                                    }) }
                                </div>
                            </div>
                        ) }

                        { messages.map((message) => (
                            <article key={ message.id } className={ `group flex gap-3 sm:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}` }>
                                <div className={ `mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${message.role === 'assistant'
                                    ? 'border-indigo-400/20 bg-indigo-500/10 text-indigo-500'
                                    : isDark
                                        ? 'border-white/10 bg-white/[0.06] text-slate-300'
                                        : 'border-slate-200 bg-slate-100 text-slate-600'}` }>
                                    { message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" /> }
                                </div>
                                <div className={ `min-w-0 max-w-[calc(100%-48px)] sm:max-w-[82%] ${message.role === 'user' ? 'text-right' : ''}` }>
                                    <div className={ `mb-1.5 flex items-center gap-2 text-[10px] ${colors.faintText} ${message.role === 'user' ? 'justify-end' : ''}` }>
                                        <span>{ message.role === 'assistant' ? 'MARKET AI' : 'SIZ' }</span>
                                        <span>·</span>
                                        <span>{ formatTime(message.createdAt) }</span>
                                    </div>
                                    <div className={ `inline-block max-w-full rounded-2xl px-3.5 py-3 text-left text-[13px] leading-6 sm:px-4 sm:py-3.5 ${message.role === 'user'
                                        ? `rounded-tr-md ${colors.userBubble}`
                                        : `rounded-tl-md shadow-lg shadow-black/5 ${colors.assistantBubble}`}` }>
                                        <div className={`prose max-w-none break-words text-[13px] leading-6 prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-li:my-1 ${colors.prose}`}>
                                            <ReactMarkdown>{ message.content }</ReactMarkdown>
                                        </div>
                                        { message.role === 'assistant' && (message.toolExecutions || 0) > 0 && (
                                            <div className={`mt-3 flex items-center gap-2 border-t ${colors.border} pt-2.5 text-[10px] text-emerald-600 dark:text-emerald-300/80`}>
                                                <Activity className="h-3.5 w-3.5" />
                                                { message.toolExecutions } ta backend amal bajarildi
                                            </div>
                                        ) }
                                    </div>
                                    <div className={ `mt-1.5 flex items-center gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 ${message.role === 'user' ? 'justify-end' : ''}` }>
                                        <button type="button" onClick={ () => void copyMessage(message) } className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] ${colors.mutedText} hover:bg-indigo-500/5 hover:text-indigo-500`}>
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
                                <div className={`rounded-2xl rounded-tl-md border ${colors.border} ${colors.surface} px-4 py-3.5`}>
                                    <div className={`flex items-center gap-2 text-xs ${colors.secondaryText}`}><Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" /> Market ma’lumotlari tekshirilmoqda…</div>
                                    <div className={`mt-2 text-[10px] ${colors.mutedText}`}>AI vazifaga qarab ruxsat etilgan MCL amallarini bajarishi mumkin.</div>
                                </div>
                            </div>
                        ) }
                        <div ref={ messagesEndRef } />
                    </div>
                </section>

                <footer className={`shrink-0 border-t ${colors.border} ${colors.composer} px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-5`}>
                    <div className="mx-auto max-w-4xl">
                        { (!token || !marketId) && (
                            <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:text-amber-100/80">
                                { !token ? 'Faol JWT token topilmadi. Tizimga qayta kiring.' : 'Market UUID topilmadi. Sahifani market route ichida oching yoki ?marketId=<UUID> parametrini yuboring.' }
                            </div>
                        ) }
                        { requestError && (
                            <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/[0.07] px-3 py-2.5 text-xs text-rose-700 dark:text-rose-200">
                                <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span className="min-w-0 flex-1">{ requestError }</span>
                                <button type="button" onClick={ () => setRequestError(null) } className="text-rose-200/60 hover:text-rose-100" aria-label="Xatolikni yopish"><X className="h-3.5 w-3.5" /></button>
                            </div>
                        ) }
                        <form onSubmit={ (event) => void handleSend(event) } className={`relative rounded-2xl border ${colors.strongBorder} ${colors.surface} shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition focus-within:border-indigo-400/50 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]`}>
                            <textarea
                                ref={ inputRef }
                                value={ input }
                                onChange={ (event) => setInput(event.target.value) }
                                onKeyDown={ handleComposerKeyDown }
                                rows={ 2 }
                                maxLength={ MAX_MESSAGE_CHARS }
                                disabled={ loading || !token || !marketId }
                                placeholder="Market AI ga topshiriq yoki savolingizni yozing…"
                                className={`max-h-36 min-h-[54px] w-full resize-none bg-transparent px-3 pb-2 pt-3.5 text-[13px] leading-6 outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:pt-4 ${isDark ? 'text-slate-100 placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
                            />
                            <div className="flex items-center justify-between gap-3 px-3 pb-3">
                                <div className={`flex min-w-0 items-center gap-2 text-[9px] ${colors.mutedText}`}>
                                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500/70" />
                                    <span className="truncate">Market huquqlari backendda tekshiriladi</span>
                                    <span className="hidden sm:inline">·</span>
                                    <span className="hidden sm:inline">Shift + Enter — yangi qator</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={ loading || !input.trim() || !token || !marketId }
                                    className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-[11px] font-semibold text-white shadow-lg shadow-indigo-950/15 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    { loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" /> }
                                    <span>Yuborish</span>
                                </button>
                            </div>
                        </form>
                        <p className={`mt-2 hidden text-center text-[9px] ${colors.faintText} sm:block`}>AI javoblari tekshiruvni talab qilishi mumkin. Muhim amallar backenddagi ruxsatlar va qoidalar bilan cheklanadi.</p>
                    </div>
                </footer>
            </main>
        </div>
    );
}