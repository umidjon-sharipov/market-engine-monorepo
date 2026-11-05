'use client';

import { useThemeStore } from '@/app/_store/useThemeStore';
import { useDesignStore } from '@/app/_store/useDesignStore';
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
    const accentColor = useDesignStore(s => s.accentColor);
    const glassLevel = useDesignStore(s => s.glassLevel);
    const iconTone = useDesignStore(s => s.iconTone);
    const dark = theme === 'dark';
    const glassBlur = glassLevel === 'soft' ? '12px' : glassLevel === 'strong' ? '30px' : '22px';
    const glowBlur = glassLevel === 'soft' ? '90px' : glassLevel === 'strong' ? '180px' : '130px';

    return (
        <div
            data-theme={theme}
            data-icon-tone={iconTone}
            style={{
                '--design-accent': accentColor,
                '--design-glass-blur': glassBlur,
            } as React.CSSProperties & { '--design-accent': string; '--design-glass-blur': string }}
            className={cn(
                'relative min-h-screen transition-colors duration-300',
                dark ? 'dark bg-[#09090b] text-[#f5f5f7]' : 'bg-[#f0f2f5] text-[#1d1d1f]'
            )}
        >
            <div className="liquid-blob top-[-10%] left-[-10%] h-[50vw] w-[50vw]" style={{ background: `radial-gradient(circle, ${accentColor}55 0%, transparent 70%)`, filter: `blur(${glowBlur})` }} />
            <div className="liquid-blob bottom-[-10%] right-[-10%] h-[60vw] w-[60vw]" style={{ background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`, filter: `blur(${glowBlur})` }} />
            <div className="liquid-blob top-[30%] right-[-5%] h-[35vw] w-[35vw]" style={{ background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`, filter: `blur(${glowBlur})` }} />

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
