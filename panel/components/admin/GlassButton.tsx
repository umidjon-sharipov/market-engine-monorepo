'use client';

import { cn } from '@/lib/utils/cn';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export default function GlassButton({
    children,
    className,
    variant = 'primary',
    size = 'md',
    ...props
}: GlassButtonProps) {
    const variants = {
        primary: 'bg-gradient-to-r from-sky-600/90 to-blue-600/90 text-white shadow-[0_4px_20px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_28px_rgba(14,165,233,0.45)]',
        danger: 'bg-gradient-to-r from-rose-600/90 to-red-600/90 text-white shadow-[0_4px_20px_rgba(244,63,94,0.3)]',
        ghost: 'bg-white/5 text-neutral-300 hover:bg-white/10 border border-white/10',
        outline: 'bg-transparent border border-sky-500/40 text-sky-400 hover:bg-sky-500/10',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs rounded-xl',
        md: 'px-5 py-2.5 text-sm rounded-2xl',
        lg: 'px-8 py-3.5 text-base rounded-2xl',
    };

    return (
        <button
            className={cn(
                'font-medium tracking-wide transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
