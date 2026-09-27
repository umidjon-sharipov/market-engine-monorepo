'use client';

import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    type?: string;
}

export default function GlassInput({ label, className, type, ...props }: GlassInputProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    return (
        <div className="space-y-1.5">
            {label && (
                <label className={cn('text-sm font-medium', dark ? 'text-neutral-400' : 'text-neutral-600')}>
                    {label}
                </label>
            )}
            <input
                onKeyDown={(e) => {
                    if (type === 'number' && ['+', '-', '*', '/', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                    }
                }}
                className={cn(
                    'w-full rounded-2xl py-3 px-4 outline-none transition-all duration-200',
                    'border focus:border-sky-500/60 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)]',
                    dark
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-neutral-500'
                        : 'bg-white/60 border-sky-200/60 text-neutral-900 placeholder:text-neutral-400',
                    className
                )}
                type={type}
                {...props}
            />
        </div>
    );
}
