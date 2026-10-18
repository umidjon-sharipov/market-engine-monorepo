import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface CommentType {
    id: string;
    text: string;
    createdAt: string;
    parentId?: string | null;
}

interface ProductItem {
    id: string | number;
    title: string;
    images?: string[];
    description: {
        uz: string;
        [key: string]: string;
    };
    options?: Array<{
        title: string;
        options: Array<{
            key: string;
            value: number;
        }>;
    }>;
    gradient?: string[];
    categoryPath?: string;
}

interface ProductImageSliderProps {
    item: ProductItem;
    activeIndex: number;
    setActiveIndex: React.Dispatch<React.SetStateAction<number>> | ((index: number | ((prev: number) => number)) => void);
    theme: string;
}

export default function ProductImageSlider({ item, activeIndex, setActiveIndex, theme }: ProductImageSliderProps) {
    const images = item.images && item.images.length > 0 ? item.images : ["https://dummyimage.com/600x600/18181b/a1a1aa"];

    const [dragStartX, setDragStartX] = useState<number>(0);
    const [dragOffset, setDragOffset] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Izohlar uchun State-lar
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newCommentText, setNewCommentText] = useState<string>('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState<string>('');
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState<string>('');

    const thumbContainerRef = useRef<HTMLDivElement>(null);
    const commentsSliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (thumbContainerRef.current) {
            const activeThumb = thumbContainerRef.current.children[activeIndex] as HTMLElement;
            if (activeThumb) {
                activeThumb.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }
        }
    }, [activeIndex]);

    const handlePrev = (e?: React.MouseEvent | React.TouchEvent) => {
        e?.stopPropagation();
        setActiveIndex((prev: number) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = (e?: React.MouseEvent | React.TouchEvent) => {
        e?.stopPropagation();
        setActiveIndex((prev: number) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setDragStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        setDragOffset(e.touches[0].clientX - dragStartX);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragOffset < -50) handleNext();
        else if (dragOffset > 50) handlePrev();
        setDragOffset(0);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setDragOffset(e.clientX - dragStartX);
    };

    const handleMouseUpOrLeave = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (dragOffset < -50) handleNext();
        else if (dragOffset > 50) handlePrev();
        setDragOffset(0);
    };

    // Izoh qo'shish
    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim()) return;
        const newComment: CommentType = {
            id: Date.now().toString(),
            text: newCommentText.slice(0, 250),
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            parentId: null
        };
        setComments([newComment, ...comments]);
        setNewCommentText('');

        // Avto scroll birinchi izohga
        setTimeout(() => {
            if (commentsSliderRef.current) {
                commentsSliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
        }, 100);
    };

    // Javob yozish
    const handleAddReply = (parentId: string) => {
        if (!replyText.trim()) return;
        const replyComment: CommentType = {
            id: Date.now().toString(),
            text: replyText.slice(0, 250),
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            parentId: parentId
        };
        setComments([...comments, replyComment]);
        setReplyingToId(null);
        setReplyText('');
    };

    // O'chirish
    const handleDelete = (id: string) => {
        setComments(comments.filter(c => c.id !== id && c.parentId !== id));
    };

    // Tahrirlash
    const startEdit = (c: CommentType) => {
        setEditingId(c.id);
        setEditText(c.text);
    };

    const saveEdit = (id: string) => {
        setComments(comments.map(c => c.id === id ? { ...c, text: editText.slice(0, 250) } : c));
        setEditingId(null);
        setEditText('');
    };

    // Izohlar sliderini tugma bilan surish
    const scrollComments = (direction: 'left' | 'right') => {
        if (commentsSliderRef.current) {
            const scrollAmount = direction === 'left' ? -220 : 220;
            commentsSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="lg:col-span-5 flex flex-col gap-3 z-10 select-none">
            {/* RASM SLIDER VA THUMBNAILS GRID */ }
            <div className="grid grid-cols-12 gap-3 items-center">
                {/* Chap Thumbnails */ }
                <div
                    ref={ thumbContainerRef }
                    className="col-span-12 sm:col-span-3 flex sm:flex-col gap-2 max-h-[140px] sm:max-h-[350px] overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden pr-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    { images.map((img: string, index: number) => (
                        <button
                            key={ index }
                            onClick={ () => setActiveIndex(index) }
                            className={ `relative aspect-square w-14 sm:w-full flex-shrink-0 rounded-xl overflow-hidden border transition-all duration-300 group/thumb ${index === activeIndex
                                ? "border-sky-500 scale-[1.02] shadow-md shadow-sky-500/20 ring-2 ring-sky-500/30 opacity-100"
                                : theme === 'dark'
                                    ? "border-zinc-800/80 hover:border-zinc-600 opacity-40 hover:opacity-80 bg-zinc-900/50"
                                    : "border-zinc-200 hover:border-zinc-400 opacity-50 hover:opacity-90 bg-white"
                                }` }
                        >
                            <Image src={ img } alt={ `thumb-${index}` } fill className="object-cover transition-transform duration-300 group-hover/thumb:scale-110" sizes="70px" />
                        </button>
                    )) }
                </div>

                {/* Asosiy Rasm Slider */ }
                <div
                    className={ `col-span-12 sm:col-span-9 relative aspect-square rounded-2xl border overflow-hidden flex items-center justify-center group/slider cursor-grab active:cursor-grabbing shadow-lg ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-gray-100/80 border-zinc-200'
                        }` }
                    onTouchStart={ handleTouchStart }
                    onTouchMove={ handleTouchMove }
                    onTouchEnd={ handleTouchEnd }
                    onMouseDown={ handleMouseDown }
                    onMouseMove={ handleMouseMove }
                    onMouseUp={ handleMouseUpOrLeave }
                    onMouseLeave={ handleMouseUpOrLeave }
                >
                    { images.length > 1 && (
                        <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md bg-black/40 border border-white/10 text-white/90 shadow-sm pointer-events-none">
                            { activeIndex + 1 } / { images.length }
                        </div>
                    ) }

                    <div
                        className="flex w-full h-full"
                        style={ {
                            transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
                            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        } }
                    >
                        { images.map((imgUrl: string, idx: number) => (
                            <div key={ idx } className="w-full h-full flex-shrink-0 relative p-3">
                                <Image
                                    src={ imgUrl }
                                    alt={ `${item.title}-${idx}` }
                                    fill
                                    priority={ idx === activeIndex }
                                    className="object-contain p-2 transition-transform duration-500 hover:scale-105 pointer-events-none drop-shadow-sm"
                                    sizes="(max-width: 640px) 100vw, 400px"
                                />
                            </div>
                        )) }
                    </div>

                    { images.length > 1 && (
                        <>
                            <button
                                onClick={ handlePrev }
                                className={ `absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 opacity-0 group-hover/slider:opacity-100 shadow-lg hover:scale-110 active:scale-95 ${theme === 'dark'
                                    ? 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:text-white'
                                    : 'bg-white/90 border-zinc-300 text-zinc-800'
                                    }` }
                            >
                                <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <button
                                onClick={ handleNext }
                                className={ `absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 opacity-0 group-hover/slider:opacity-100 shadow-lg hover:scale-110 active:scale-95 ${theme === 'dark'
                                    ? 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:text-white'
                                    : 'bg-white/90 border-zinc-300 text-zinc-800'
                                    }` }
                            >
                                <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md bg-black/30 border border-white/10 z-10">
                                { images.map((_, idx: number) => (
                                    <button
                                        key={ idx }
                                        onClick={ (e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            setActiveIndex(idx);
                                        } }
                                        className={ `h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex
                                            ? 'w-5 bg-sky-400 shadow-sm shadow-sky-400/50'
                                            : 'w-1.5 bg-white/40 hover:bg-white/70'
                                            }` }
                                    />
                                )) }
                            </div>
                        </>
                    ) }
                </div>
            </div>

            {/* --- GORIZONTAL IZOHLAR SLIDERI (Slider ostida) --- */ }
            <div className={ `p-3 rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-zinc-200'}` }>
                <div className="flex justify-between items-center mb-2">
                    <span className={ `text-[11px] font-semibold tracking-wide uppercase ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}` }>
                        Izohlar ({ comments.length })
                    </span>

                    {/* Slider tugmalari */ }
                    { comments.length > 0 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={ () => scrollComments('left') }
                                className={ `p-1 rounded-full border transition ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-gray-100'
                                    }` }
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={ () => scrollComments('right') }
                                className={ `p-1 rounded-full border transition ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-gray-100'
                                    }` }
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    ) }
                </div>

                {/* Izoh kiritish Formasi */ }
                <form onSubmit={ handleAddComment } className="relative mb-2.5">
                    <input
                        type="text"
                        maxLength={ 250 }
                        value={ newCommentText }
                        onChange={ (e) => setNewCommentText(e.target.value) }
                        placeholder="Izoh qoldiring (max 250 belgi)..."
                        className={ `w-full text-xs pl-3 pr-16 py-1.5 rounded-xl border outline-none transition-all ${theme === 'dark'
                            ? 'bg-zinc-950/70 border-zinc-800 text-zinc-200 focus:border-sky-500'
                            : 'bg-white border-zinc-300 text-zinc-800 focus:border-sky-500'
                            }` }
                    />
                    <button
                        type="submit"
                        className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[10px] font-semibold bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                    >
                        Yuborish
                    </button>
                </form>

                {/* GORIZONTAL SCROLL SLIDER AREA */ }
                <div
                    ref={ commentsSliderRef }
                    className="flex gap-2.5 overflow-x-auto pb-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    { comments.filter(c => !c.parentId).map((comment) => (
                        <div
                            key={ comment.id }
                            className={ `flex-shrink-0 w-[200px] sm:w-[220px] p-2.5 rounded-xl border flex flex-col justify-between transition-all ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-800'
                                }` }
                        >
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] opacity-50 font-medium">{ comment.createdAt }</span>
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={ () => setReplyingToId(replyingToId === comment.id ? null : comment.id) } className="text-sky-400 hover:underline text-[9px]">Javob</button>
                                        <button onClick={ () => startEdit(comment) } className="text-amber-400 hover:underline text-[9px]">Tahrir</button>
                                        <button onClick={ () => handleDelete(comment.id) } className="text-red-400 hover:underline text-[9px]">O&apos;chirish</button>
                                    </div>
                                </div>

                                { editingId === comment.id ? (
                                    <div className="flex flex-col gap-1 mt-1">
                                        <input
                                            type="text"
                                            maxLength={ 250 }
                                            value={ editText }
                                            onChange={ (e) => setEditText(e.target.value) }
                                            className="w-full text-[11px] p-1 rounded border bg-transparent outline-none border-amber-500"
                                        />
                                        <button onClick={ () => saveEdit(comment.id) } className="px-2 py-0.5 bg-amber-500 text-white rounded text-[9px] self-end">Saqlash</button>
                                    </div>
                                ) : (
                                    <p className="text-[11px] leading-snug break-words line-clamp-3">{ comment.text }</p>
                                ) }

                                {/* Javoblar ro'yxati (Nested inside card) */ }
                                { comments.filter(r => r.parentId === comment.id).map(reply => (
                                    <div key={ reply.id } className={ `mt-1.5 p-1 rounded border-l-2 border-sky-500 text-[10px] ${theme === 'dark' ? 'bg-zinc-900/60' : 'bg-gray-100'}` }>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] opacity-50">{ reply.createdAt }</span>
                                            <button onClick={ () => handleDelete(reply.id) } className="text-red-400 text-[8px]">✕</button>
                                        </div>
                                        <p className="break-words line-clamp-2">{ reply.text }</p>
                                    </div>
                                )) }
                            </div>

                            {/* Javob Yozish Modali/Inputi */ }
                            { replyingToId === comment.id && (
                                <div className="flex gap-1 mt-2 pt-1 border-t border-zinc-800">
                                    <input
                                        type="text"
                                        maxLength={ 250 }
                                        value={ replyText }
                                        onChange={ (e) => setReplyText(e.target.value) }
                                        placeholder="Javob..."
                                        className="w-full text-[10px] p-1 rounded border bg-transparent outline-none border-sky-500"
                                    />
                                    <button onClick={ () => handleAddReply(comment.id) } className="px-1.5 py-0.5 bg-sky-500 text-white rounded text-[9px]">Ok</button>
                                </div>
                            ) }
                        </div>
                    )) }

                    { comments.length === 0 && (
                        <div className="w-full py-2 text-center text-[10px] text-zinc-500">
                            Izoh yo&apos;q, birinchi izohni qoldiring!
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
}