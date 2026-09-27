'use client';

import { useThemeStore } from '@/app/_store/useThemeStore';
import { cn } from '@/lib/utils/cn';
import Sidebar from './Sidebar';
import PageTransition from './PageTransition';

export default function AdminShell({
    locale,
    children,
}: {
    locale: string;
    children: React.ReactNode;
}) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    return (
        <div className={cn(
            'relative min-h-screen transition-colors duration-300',
            dark ? 'bg-[#09090b] text-[#f5f5f7]' : 'bg-[#f0f2f5] text-[#1d1d1f]'
        )}>
            <div className="liquid-blob top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-gradient-to-br from-sky-600/30 to-sky-600/0" />
            <div className="liquid-blob bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-gradient-to-tl from-blue-600/20 to-cyan-600/0" style={{ filter: 'blur(150px)' }} />
            <div className={cn('liquid-blob top-[30%] right-[-5%] w-[35vw] h-[35vw]', dark ? 'bg-sky-500/10' : 'bg-sky-500/20')} style={{ filter: 'blur(100px)' }} />

            <div className="relative z-10 flex min-h-screen p-3 lg:p-4 gap-4 lg:gap-5">
                <Sidebar locale={locale} />

                <main className={cn(
                    'flex-1 rounded-[28px] p-4 lg:p-8 overflow-y-auto overflow-x-hidden min-h-[calc(100vh-2rem)]',
                    dark ? 'glass-panel' : 'glass-panel-light'
                )}>
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}
