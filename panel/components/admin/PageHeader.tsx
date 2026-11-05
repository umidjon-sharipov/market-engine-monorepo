'use client';

import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
                <h1 className={cn('text-3xl sm:text-4xl font-extrabold tracking-tight', dark ? 'text-white' : 'text-neutral-900')}>
                    {title}
                </h1>
                {subtitle && (
                    <p className={cn('text-sm', dark ? 'text-neutral-400' : 'text-neutral-500')}>
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
