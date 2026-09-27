'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import GlassCard from './GlassCard';
import { useThemeStore } from '@/app/_store/useThemeStore';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    delay?: number;
}

export default function StatCard({ title, value, icon: Icon, trend, delay = 0 }: StatCardProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <GlassCard hover className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className={cn('text-xs font-semibold uppercase tracking-widest', dark ? 'text-neutral-500' : 'text-neutral-400')}>
                            {title}
                        </p>
                        <p className={cn('text-2xl sm:text-3xl font-bold', dark ? 'text-white' : 'text-neutral-900')}>
                            {value}
                        </p>
                        {trend && (
                            <p className="text-xs text-emerald-400 font-medium">{trend}</p>
                        )}
                    </div>
                    <div className="p-3 rounded-2xl bg-sky-500/15 border border-sky-500/20">
                        <Icon className="w-5 h-5 text-sky-400" />
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    );
}
