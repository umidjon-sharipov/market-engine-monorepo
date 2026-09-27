'use client';

import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export default function GlassCard({ children, className, hover = false }: GlassCardProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    return (
        <div
            className={cn(
                'rounded-[24px] p-6 transition-all duration-300 backdrop-blur-2xl',
                dark ? 'bg-neutral-900/20 border-white/10 text-white shadow-xl shadow-black/20' : 'bg-white/20 border-white/60 text-neutral-900 shadow-xl shadow-black/20',
                hover && 'hover:shadow-[0_12px_40px_0_rgba(14,165,233,0.15)] hover:-translate-y-0.5',
                className
            )}
        >
            {children}
        </div>
    );
}
