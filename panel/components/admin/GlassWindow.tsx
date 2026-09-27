'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';

interface GlassWindowProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    onMenuClick?: () => void;
}

export default function GlassWindow({
    open,
    onClose,
    title,
    children,
    size = 'md',
    onMenuClick
}: GlassWindowProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    const sizes = {
        sm: 'max-w-xl',
        md: 'max-w-2xl',
        lg: 'max-w-3xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-5xl',
        '3xl': 'max-w-6xl',
        'full': 'max-w-[95vw]'
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className={cn(
                        'fixed inset-0 z-[999] flex flex-col backdrop-blur-3xl overflow-hidden',
                        dark
                            ? 'bg-neutral-950/10 text-white'
                            : 'bg-white/10 text-neutral-900'
                    )}
                >
                    <header className={cn(
                        'grid grid-cols-[auto_1fr_auto] z-9999999 items-center shrink-0 gap-4 w-19/20 mx-auto rounded-full fixed top-3 left-1/40'
                    )}>
                        <div className="flex items-center">
                            <button
                                onClick={onClose}
                                className={cn(
                                    "p-2.5 rounded-full backdrop-blur-xl duration-200 transition-colors border-b",
                                    !dark
                                        ? "bg-white/40 hover:bg-white/55  text-neutral-800 border-white/10"
                                        : "bg-black/20 hover:bg-black/30 text-white border-black/10"
                                )}
                                title="Ortga"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="min-w-0 flex justify-center">
                            {title && (
                                <h1 className={cn(
                                    "text-xl font-bold tracking-tight truncate px-4 py-2.5 rounded-full backdrop-blur-xl duration-200 transition-colors w-full text-center",
                                    !dark
                                        ? "bg-white/40 hover:bg-white/55 text-neutral-800 border-white/10"
                                        : "bg-black/20 hover:bg-black/30 text-white border-black/10"
                                )}>
                                    {title}
                                </h1>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={onMenuClick}
                                className={cn(
                                    "p-2.5 rounded-full backdrop-blur-xl duration-200 transition-colors",
                                    !dark
                                        ? "bg-white/40 hover:bg-white/55 text-neutral-800 border-white/10"
                                        : "bg-black/20 hover:bg-black/30 text-white border-black/10"
                                )}
                                title="Menyu"
                            >
                                <MoreVertical className="w-6 h-6" />
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 sm:p-8 mt-16">
                        <div className={cn('w-full mx-auto flex flex-col', sizes[size])}>
                            {children}
                        </div>
                    </main>
                </motion.div>
            )}
        </AnimatePresence>
    );
}