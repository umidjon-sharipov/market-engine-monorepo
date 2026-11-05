'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    Check,
    Circle,
    Layers3,
    Moon,
    PanelTop,
    RotateCcw,
    Sparkles,
    Sun,
    WandSparkles,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
    useDesignStore,
    type GlassLevel,
    type HeaderStyle,
    type IconTone,
} from '@/app/_store/useDesignStore';
import { cn } from '@/lib/utils/cn';
import enMessages from '@/messages/en.json';
import ruMessages from '@/messages/ru.json';
import uzMessages from '@/messages/uz.json';

const presets = [
    { color: '#0EA5E9', label: 'Ocean' },
    { color: '#6366F1', label: 'Indigo' },
    { color: '#8B5CF6', label: 'Violet' },
    { color: '#EC4899', label: 'Rose' },
    { color: '#F97316', label: 'Amber' },
    { color: '#10B981', label: 'Emerald' },
    { color: '#EAB308', label: 'Solar' },
    { color: '#14B8A6', label: 'Mint' },
];

const headerStyles: HeaderStyle[] = ['glass', 'solid', 'transparent'];
const iconTones: IconTone[] = ['accent', 'neutral'];
const translations = {
    uz: uzMessages.settings,
    en: enMessages.settings,
    ru: ruMessages.settings,
} as const;

const itemMotion = {
    hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

function ColorDot({ color, selected, onSelect, label }: {
    color: string;
    selected: boolean;
    onSelect: () => void;
    label: string;
}) {
    return (
        <motion.button
            type="button"
            aria-label={label}
            aria-pressed={selected}
            onClick={onSelect}
            whileHover={{ scale: 1.14, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="relative grid h-10 w-10 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: color, '--tw-ring-color': color } as React.CSSProperties & { '--tw-ring-color': string }}
        >
            <AnimatePresence>
                {selected && (
                    <motion.span
                        initial={{ scale: 0, rotate: -35 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 35 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        className="text-white drop-shadow"
                    >
                        <Check className="h-4 w-4" strokeWidth={3} />
                    </motion.span>
                )}
            </AnimatePresence>
            {selected && <motion.span layoutId="selected-color-ring" className="absolute -inset-1 rounded-full border-2" style={{ borderColor: color }} />}
        </motion.button>
    );
}

export default function DesignSettings() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] as keyof typeof translations;
    const t = (key: keyof typeof translations.uz) => translations[locale]?.[key] ?? translations.uz[key];
    const theme = useDesignStore((state) => state.theme);
    const accentColor = useDesignStore((state) => state.accentColor);
    const glassLevel = useDesignStore((state) => state.glassLevel);
    const headerStyle = useDesignStore((state) => state.headerStyle);
    const iconTone = useDesignStore((state) => state.iconTone);
    const setTheme = useDesignStore((state) => state.setTheme);
    const setAccentColor = useDesignStore((state) => state.setAccentColor);
    const setGlassLevel = useDesignStore((state) => state.setGlassLevel);
    const setHeaderStyle = useDesignStore((state) => state.setHeaderStyle);
    const setIconTone = useDesignStore((state) => state.setIconTone);
    const resetDesign = useDesignStore((state) => state.resetDesign);
    const [resetPulse, setResetPulse] = useState(false);
    const dark = theme === 'dark';
    const glassValue = glassLevel === 'soft' ? 8 : glassLevel === 'strong' ? 32 : 20;
    const previewSurface = useMemo(() => {
        if (headerStyle === 'solid') return dark ? 'rgba(20,25,38,.96)' : 'rgba(255,255,255,.96)';
        if (headerStyle === 'transparent') return 'transparent';
        return dark ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.68)';
    }, [dark, headerStyle]);
    const card = cn(
        'rounded-[26px] border backdrop-blur-2xl transition-colors duration-500',
        dark ? 'border-white/[0.09] bg-[#11141c]/75 text-white shadow-[0_24px_70px_-38px_rgba(0,0,0,.7)]' : 'border-white/80 bg-white/75 text-slate-900 shadow-[0_24px_70px_-38px_rgba(15,23,42,.24)]',
    );
    const muted = dark ? 'text-slate-400' : 'text-slate-500';
    const glassProgress = (value: number) => {
        const next: GlassLevel = value < 14 ? 'soft' : value < 27 ? 'balanced' : 'strong';
        if (next !== glassLevel) setGlassLevel(next);
    };

    return (
        <motion.section
            className="relative isolate space-y-6 overflow-hidden"
            style={{ '--design-accent': accentColor } as React.CSSProperties & { '--design-accent': string }}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.085, delayChildren: 0.05 } } }}
        >
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -right-32 -top-32 -z-10 h-80 w-80 rounded-full opacity-20 blur-[100px]"
                animate={{ backgroundColor: accentColor, scale: [0.9, 1.12, 0.9], x: [0, -22, 0], y: [0, 20, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div variants={itemMotion} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--design-accent)]/20 bg-[var(--design-accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.18em] text-[var(--design-accent)]">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t('designStudio')}
                    </div>
                    <h2 className={cn('text-2xl font-semibold tracking-tight sm:text-3xl', dark ? 'text-white' : 'text-slate-950')}>
                        {t('appearanceTitle')}
                        <span className="ml-2 text-[var(--design-accent)]">.</span>
                    </h2>
                    <p className={cn('mt-2 max-w-xl text-sm leading-6', muted)}>{t('appearanceSubtitle')}</p>
                </div>
                <motion.button
                    type="button"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                        resetDesign();
                        setResetPulse(true);
                        window.setTimeout(() => setResetPulse(false), 700);
                    }}
                    className={cn(
                        'inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl border px-4 text-sm font-medium transition-colors sm:self-auto',
                        dark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.09]' : 'border-slate-200 bg-white/65 text-slate-600 hover:bg-white',
                    )}
                >
                    <motion.span animate={resetPulse ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.55 }}>
                        <RotateCcw className="h-4 w-4" />
                    </motion.span>
                    {t('resetDesign')}
                </motion.button>
            </motion.div>

            <motion.div variants={itemMotion} className={cn(card, 'relative overflow-hidden p-3 sm:p-5')}>
                <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-20 -top-28 h-72 w-72 rounded-full blur-[90px]"
                    animate={{ backgroundColor: accentColor, opacity: dark ? [0.2, 0.34, 0.2] : [0.12, 0.23, 0.12], scale: [0.92, 1.08, 0.92] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative flex items-center justify-between gap-3 px-1 pb-4">
                    <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-lg" style={{ backgroundColor: accentColor }}>
                            <WandSparkles className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold">{t('livePreview')}</p>
                            <p className={cn('text-xs', muted)}>{t('previewSubtitle')}</p>
                        </div>
                    </div>
                    <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-500 sm:inline-flex">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        {t('live')}
                    </span>
                </div>

                <motion.div
                    layout
                    className={cn(
                        'relative overflow-hidden rounded-[22px] border p-3 transition-colors duration-500 sm:p-4',
                        dark ? 'border-white/10 bg-[#0b0e15]/70' : 'border-slate-200/80 bg-slate-100/70',
                    )}
                >
                    <div
                        className="relative flex items-center justify-between rounded-2xl border px-3 py-2.5 transition-all duration-500 sm:px-4"
                        style={{
                            backgroundColor: previewSurface,
                            borderColor: dark ? 'rgba(255,255,255,.1)' : 'rgba(148,163,184,.24)',
                            backdropFilter: headerStyle === 'glass' ? `blur(${glassValue}px) saturate(180%)` : 'none',
                            boxShadow: `0 12px 35px -22px ${accentColor}88`,
                        }}
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center rounded-xl text-white" style={{ backgroundColor: accentColor }}>
                                <Layers3 className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-semibold sm:text-sm">Market<span className="opacity-60">Flow</span></span>
                        </div>
                        <div className="hidden items-center gap-5 md:flex">
                            {[t('previewOverview'), t('previewProducts'), t('previewOrders')].map((label, index) => (
                                <span key={label} className={cn('text-xs', index === 0 ? 'font-semibold' : muted)} style={index === 0 ? { color: accentColor } : undefined}>
                                    {label}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.span
                                key={theme}
                                initial={{ rotate: -30, scale: 0.7, opacity: 0 }}
                                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                                className={cn('grid h-8 w-8 place-items-center rounded-full border', dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white')}
                            >
                                {dark ? <Moon className="h-3.5 w-3.5" style={{ color: iconTone === 'accent' ? accentColor : undefined }} /> : <Sun className="h-3.5 w-3.5" style={{ color: iconTone === 'accent' ? accentColor : undefined }} />}
                            </motion.span>
                            <span className="h-8 w-8 rounded-full border-2" style={{ borderColor: dark ? 'rgba(255,255,255,.15)' : '#fff', background: `linear-gradient(145deg, ${accentColor}, ${accentColor}55)` }} />
                        </div>
                    </div>

                    <div className="relative grid gap-3 pt-3 sm:grid-cols-[1.15fr_.85fr]">
                        <motion.div layout className={cn(
                            'relative overflow-hidden rounded-2xl border p-4 sm:p-5',
                            dark ? 'border-white/[0.08] bg-white/[0.035]' : 'border-white bg-white/75',
                        )}>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className={cn('text-[11px] font-medium', muted)}>{t('previewRevenue')}</p>
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={theme + accentColor}
                                            initial={{ opacity: 0, y: 8, filter: 'blur(5px)' }}
                                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, y: -5, filter: 'blur(5px)' }}
                                            transition={{ duration: 0.28 }}
                                            className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
                                        >
                                            $24,680<span className="ml-2 text-xs font-medium" style={{ color: accentColor }}>+12.8%</span>
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                                <span className="rounded-lg px-2 py-1 text-[10px] font-medium" style={{ color: accentColor, backgroundColor: `${accentColor}18` }}>7 days</span>
                            </div>
                            <div className="mt-4 flex h-14 items-end gap-1.5 sm:h-16">
                                {[30, 45, 37, 65, 50, 78, 61, 90, 68, 100, 79, 94, 72, 110, 88, 125].map((height, index) => (
                                    <motion.span
                                        key={`${accentColor}-${index}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: `${height / 1.35}%`, opacity: 1 }}
                                        transition={{ delay: index * 0.025, type: 'spring', stiffness: 180, damping: 20 }}
                                        className="min-w-1 flex-1 rounded-full"
                                        style={{ background: `linear-gradient(180deg, ${accentColor}, ${accentColor}24)` }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: t('previewOrders'), value: '1,284', icon: Circle },
                                { label: t('previewCustomers'), value: '846', icon: Sparkles },
                            ].map(({ label, value, icon: Icon }) => (
                                <motion.div
                                    key={label}
                                    layout
                                    whileHover={{ y: -3, scale: 1.025 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                    className={cn(
                                        'rounded-2xl border p-3 sm:p-4',
                                        dark ? 'border-white/[0.08] bg-white/[0.035]' : 'border-white bg-white/75',
                                    )}
                                >
                                    <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ backgroundColor: `${accentColor}18`, color: iconTone === 'accent' ? accentColor : undefined }}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    <p className="mt-3 text-lg font-semibold">{value}</p>
                                    <p className={cn('mt-0.5 text-[10px]', muted)}>{label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_.9fr]">
                <motion.div variants={itemMotion} className={cn(card, 'space-y-6 p-4 sm:p-6')}>
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <Sun className="h-4 w-4" style={{ color: accentColor }} />
                            <h3 className="text-sm font-semibold">{t('theme')}</h3>
                        </div>
                        <div className={cn('grid grid-cols-2 gap-2 rounded-2xl p-1.5', dark ? 'bg-black/25' : 'bg-slate-100')}>
                            {(['dark', 'light'] as const).map((value) => (
                                <motion.button
                                    key={value}
                                    type="button"
                                    aria-pressed={theme === value}
                                    onClick={() => setTheme(value)}
                                    whileTap={{ scale: 0.97 }}
                                    className={cn(
                                        'relative flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors',
                                        theme === value ? 'text-white' : muted,
                                    )}
                                >
                                    {theme === value && (
                                        <motion.span
                                            layoutId="theme-pill"
                                            className="absolute inset-0 rounded-xl shadow-lg"
                                            style={{ backgroundColor: accentColor }}
                                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                        />
                                    )}
                                    <span className="relative z-10 inline-flex items-center gap-2">
                                        {value === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                        {t(value)}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="h-4 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
                                <h3 className="text-sm font-semibold">{t('accentColor')}</h3>
                            </div>
                            <span className={cn('font-mono text-[11px]', muted)}>{accentColor.toUpperCase()}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            {presets.map(({ color, label }) => (
                                <ColorDot
                                    key={color}
                                    color={color}
                                    label={`${label} ${t('accentColor')}`}
                                    selected={accentColor.toLowerCase() === color.toLowerCase()}
                                    onSelect={() => setAccentColor(color)}
                                />
                            ))}
                            <label
                                className="relative grid h-10 w-10 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed transition-transform hover:scale-110"
                                style={{ borderColor: dark ? 'rgba(255,255,255,.3)' : '#94a3b8' }}
                                title={t('customColor')}
                            >
                                <input
                                    type="color"
                                    aria-label={t('customColor')}
                                    value={accentColor}
                                    onChange={(event) => setAccentColor(event.target.value)}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                                <span className="text-xl leading-none" style={{ color: accentColor }}>+</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Layers3 className="h-4 w-4" style={{ color: accentColor }} />
                                <h3 className="text-sm font-semibold">{t('glassLevel')}</h3>
                            </div>
                            <motion.span
                                key={glassLevel}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                                style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                            >
                                {t(glassLevel)}
                            </motion.span>
                        </div>
                        <input
                            type="range"
                            min={8}
                            max={32}
                            value={glassValue}
                            aria-label={t('glassLevel')}
                            onChange={(event) => glassProgress(Number(event.target.value))}
                            className="design-range h-1.5 w-full cursor-pointer appearance-none rounded-full"
                            style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} ${((glassValue - 8) / 24) * 100}%, ${dark ? 'rgba(255,255,255,.12)' : '#e2e8f0'} ${((glassValue - 8) / 24) * 100}%)` }}
                        />
                        <div className={cn('mt-2 flex justify-between text-[10px]', muted)}>
                            <span>{t('soft')}</span>
                            <span>{t('strong')}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemMotion} className={cn(card, 'space-y-6 p-4 sm:p-6')}>
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <PanelTop className="h-4 w-4" style={{ color: accentColor }} />
                            <h3 className="text-sm font-semibold">{t('headerStyle')}</h3>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {headerStyles.map((value) => (
                                <motion.button
                                    key={value}
                                    type="button"
                                    aria-pressed={headerStyle === value}
                                    onClick={() => setHeaderStyle(value)}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={cn(
                                        'rounded-2xl border p-3 text-left transition-colors',
                                        headerStyle === value
                                            ? 'border-[var(--design-accent)]/60 bg-[var(--design-accent)]/10'
                                            : dark ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-white/50',
                                    )}
                                >
                                    <span className="mb-3 block h-8 rounded-lg border" style={{
                                        borderColor: `${accentColor}55`,
                                        backgroundColor: value === 'solid' ? (dark ? '#202638' : '#fff') : value === 'transparent' ? 'transparent' : `${accentColor}14`,
                                        backdropFilter: value === 'glass' ? `blur(${glassValue}px)` : 'none',
                                    }} />
                                    <span className="block text-xs font-semibold">{t(`${value}Header`)}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" style={{ color: accentColor }} />
                            <h3 className="text-sm font-semibold">{t('iconColor')}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {iconTones.map((value) => (
                                <motion.button
                                    key={value}
                                    type="button"
                                    aria-pressed={iconTone === value}
                                    onClick={() => setIconTone(value)}
                                    whileTap={{ scale: 0.97 }}
                                    className={cn(
                                        'flex min-h-12 items-center gap-3 rounded-2xl border px-3 text-sm transition-colors',
                                        iconTone === value ? 'border-[var(--design-accent)]/50 bg-[var(--design-accent)]/10' : dark ? 'border-white/10' : 'border-slate-200',
                                    )}
                                >
                                    <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ backgroundColor: `${accentColor}18`, color: value === 'accent' ? accentColor : undefined }}>
                                        <Circle className="h-3.5 w-3.5" />
                                    </span>
                                    {t(`${value}Icons`)}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.section>
    );
}
