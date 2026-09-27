'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';

interface GlassModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    overflow?: string
    className?: string;
}

export default function GlassModal({ open, onClose, title, children, size = 'md', overflow = 'hidden', className }: GlassModalProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        'full': 'max-w-full'
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-99999999999999 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={cn(
                            `relative w-full rounded-[28px] flex flex-col max-h-[90vh] overflow-${overflow} shadow-2xl z-10`,
                            dark ? 'glass-panel' : 'glass-panel-light',
                            sizes[size],
                            className
                        )}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5 absolute top-0 left-0 w-full p-6 backdrop-blur-sm rounded-t-[28px] z-9999">
                            {title && (
                                <h2 className={cn('text-xl font-bold', dark ? 'text-white' : 'text-neutral-900')}>
                                    {title}
                                </h2>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/10 transition-colors ml-auto"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className={`p-6 overflow-y-${overflow === 'hidden' ? 'auto' : overflow} flex-1`}>
                            <div className="py-8 w-full"></div>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
