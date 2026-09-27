'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useParams } from 'next/navigation';

interface MenuItem {
    label: string;
    href: string;
}

interface GlassMenuProps {
    title: string;
    items: MenuItem[];
    defaultOpen?: boolean;
}

export default function GlassMenu({ title, items, defaultOpen = true }: GlassMenuProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const pathname = usePathname();
    const params = useParams();
    const market = (params?.market as string) || pathname.split('/')[2] || '';
    const locale = (params?.locale as string) || pathname.split('/')[1] || 'uz';

    return (
        <div className={cn(
            'rounded-3xl overflow-scroll border backdrop-blur-xl transition-all duration-300 relative',
            dark ? 'border-white/10 bg-[#0c1322]/5 text-white' : 'border-sky-200/60 bg-white/70 text-slate-800'
        )}>
            
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'px-4 py-3.5 font-semibold uppercase tracking-wider text-xs flex items-center justify-between cursor-pointer select-none transition-colors relative z-20',
                    dark ? 'bg-white/5 text-neutral-300 hover:bg-white/8' : 'bg-sky-50/5 text-slate-700 hover:bg-sky-100/10'
                )}
            >
                <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', dark ? 'bg-sky-400' : 'bg-sky-500')} />
                    <span>{title}</span>
                </div>
                <motion.span 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="text-[10px] opacity-70"
                >
                    ▼
                </motion.span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden relative pb-2 pt-1"
                    >
                        <svg className="absolute left-[24px] top-0 bottom-4 w-8 h-full pointer-events-none z-0 overflow-visible">
                            {items.map((_, i) => {
                                const yOffset = i * 44 + 26;
                                return (
                                    <path
                                        key={i}
                                        d={`M 0 ${i === 0 ? 0 : yOffset - 44} L 0 ${yOffset - 6} Q 0 ${yOffset} 8 ${yOffset} L 16 ${yOffset}`}
                                        fill="none"
                                        stroke={dark ? "rgba(255, 255, 255, 0.35)" : "rgba(14, 165, 233, 0.35)"}
                                        strokeWidth="1.5"
                                    />
                                );
                            })}
                        </svg>

                        <div className="flex flex-col pl-7 pr-2 space-y-1 relative z-10">
                            {items.map((item, i) => {
                                const targetHref = `/${locale}/${market}${item.href}`;
                                const isActive = pathname === targetHref || pathname.startsWith(`${targetHref}/`);

                                return (
                                    <Link
                                        key={i}
                                        href={targetHref}
                                        className={cn(
                                            'relative z-10 flex items-center py-2.5 px-3.5 text-sm rounded-xl transition-all duration-200 group ml-3',
                                            dark 
                                                ? 'text-neutral-300 hover:text-white hover:bg-white/[0.06]' 
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/80',
                                            isActive && (dark ? 'bg-white/[0.08] text-white font-medium shadow-inner' : 'bg-sky-100/70 text-slate-900 font-medium')
                                        )}
                                    >
                                        {isActive && (
                                            <motion.span 
                                                layoutId="activeGlow"
                                                className="absolute left-[-16px] top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-sky-500 shadow-[0_0_10px_#0ea5e9]" 
                                            />
                                        )}

                                        <span className="relative z-10 tracking-wide transition-transform duration-200 group-hover:translate-x-1">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}