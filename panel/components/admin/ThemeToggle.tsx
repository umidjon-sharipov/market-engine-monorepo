'use client';

import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/app/_store/useThemeStore';
import { cn } from '@/lib/utils/cn';
import { useTranslations } from 'next-intl';

export default function ThemeToggle() {
    const theme = useThemeStore(s => s.theme);
    const setTheme = useThemeStore(s => s.setTheme);
    const dark = theme === 'dark';
    const t = useTranslations('settings');

    return (
        <button
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            className={cn(
                'flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 group',
                dark ? 'bg-white/5 border border-white/5 hover:bg-white/10' : 'bg-black/5 border border-black/5 hover:bg-black/10'
            )}
        >
            <span className={dark ? 'text-neutral-300' : 'text-neutral-700'}>
                {t('theme')}: {dark ? 'Dark' : 'Light'}
            </span>
            <div className={cn('p-1.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300', dark ? 'bg-[#1a1a1e]' : 'bg-white')}>
                {dark ? <Sun className="w-4 h-4 text-sky-400" /> : <Moon className="w-4 h-4 text-sky-500" />}
            </div>
        </button>
    );
}
