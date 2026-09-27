'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';
import {
    ResponsiveContainer,
    AreaChart,
    BarChart,
    LineChart,
    Area,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Brush,
    Legend,
} from 'recharts';
import { 
    TrendingUp, 
    BarChart3, 
    Activity, 
    Copy, 
    Check, 
    Download, 
    RefreshCw 
} from 'lucide-react';

export interface SeriesConfig {
    key: string;
    label: string;
    color: string;
}

export interface CustomThemeColor {
    name: string;
    primary: string;
    secondary: string;
    glowClass: string;
}

interface UltimateGlassDiagramProps {
    title?: string;
    description?: string;
    data: Record<string, unknown>[];
    xAxisKey: string;
    series: SeriesConfig[];
    height?: number | string;
    snapToCursor?: boolean;
    
    defaultChartType?: 'area' | 'bar' | 'line';
    allowedChartTypes?: ('area' | 'bar' | 'line')[];
    
    customThemes?: CustomThemeColor[];
    defaultThemeIndex?: number;
    
    showChartSwitcher?: boolean;
    showThemeSelector?: boolean;
    showTimeRangeFilter?: boolean;
    showRefreshButton?: boolean;
    showCopyButton?: boolean;
    showDownloadButton?: boolean;
    enableZoomBrush?: boolean;
}

export default function UltimateGlassDiagram({
    title = "Kengaytirilgan Global Analitika",
    description = "Yirik hisob-kitoblar va ma'lumotlar bazasi",
    data,
    xAxisKey,
    series,
    height = 400,
    snapToCursor,
    
    defaultChartType = 'area',
    allowedChartTypes = ['area', 'bar', 'line'],
    
    customThemes,
    defaultThemeIndex = 0,
    
    showChartSwitcher = true,
    showThemeSelector = true,
    showTimeRangeFilter = true,
    showRefreshButton = true,
    showCopyButton = true,
    showDownloadButton = true,
    enableZoomBrush = true,
}: UltimateGlassDiagramProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const defaultPalettes: CustomThemeColor[] = [
        { name: 'Sky', primary: '#38bdf8', secondary: '#0284c7', glowClass: 'bg-sky-500' },
        { name: 'Emerald', primary: '#34d399', secondary: '#059669', glowClass: 'bg-emerald-500' },
        { name: 'Violet', primary: '#a78bfa', secondary: '#7c3aed', glowClass: 'bg-violet-500' },
        { name: 'Amber', primary: '#fbbf24', secondary: '#d97706', glowClass: 'bg-amber-500' },
    ];

    const themesList = customThemes && customThemes.length > 0 ? customThemes : defaultPalettes;
    
    const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>(defaultChartType);
    const [activeThemeIdx, setActiveThemeIdx] = useState(defaultThemeIndex);
    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState<'all' | '3m' | '6m' | '1y'>('all');

    const currentPalette = themesList[activeThemeIdx] || themesList[0];

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (timeRange === '3m') return data.slice(-3);
        if (timeRange === '6m') return data.slice(-6);
        if (timeRange === '1y') return data.slice(-12);
        return data;
    }, [data, timeRange]);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(filteredData, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCSV = () => {
        if (!filteredData.length) return;
        const keys = Object.keys(filteredData[0]);
        const csvContent = [
            keys.join(','),
            ...filteredData.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 800);
    };

    if (!mounted) {
        return <div className="w-full rounded-[32px] bg-neutral-900/10 animate-pulse" style={{ height: typeof height === 'number' ? `${height}px` : height }} />;
    }

    return (
        <div
            className={cn(
                'rounded-[32px] p-6 sm:p-8 diogram border backdrop-blur-2xl transition-all duration-500 shadow-2xl relative overflow-hidden group w-full',
                dark
                    ? 'bg-neutral-950/70 border-white/10 text-white shadow-black/80'
                    : 'bg-white/90 border-sky-200/60 text-neutral-900 shadow-sky-100/60'
            )}
        >
            <div className={cn(
                'absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-20 transition-all duration-700 group-hover:opacity-40',
                currentPalette.glowClass
            )} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 relative z-10">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <span className={cn('w-3 h-3 rounded-full animate-pulse', currentPalette.glowClass)} />
                        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
                    </div>
                    {description && (
                        <p className={cn('text-xs sm:text-sm', dark ? 'text-neutral-400' : 'text-neutral-500')}>
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    
                    {showChartSwitcher && allowedChartTypes.length > 0 && (
                        <div className={cn('flex items-center p-1 rounded-2xl border backdrop-blur-md', dark ? 'bg-white/5 border-white/10' : 'bg-white/50 border-sky-100')}>
                            {allowedChartTypes.includes('area') && (
                                <button
                                    onClick={() => setChartType('area')}
                                    className={cn('p-2 rounded-xl transition-all text-xs font-medium flex items-center gap-1.5', chartType === 'area' ? (dark ? 'bg-white/20 text-white shadow-lg' : 'bg-sky-500 text-white shadow-md') : 'opacity-60 hover:opacity-100')}
                                    title="Area Chart"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                </button>
                            )}
                            {allowedChartTypes.includes('bar') && (
                                <button
                                    onClick={() => setChartType('bar')}
                                    className={cn('p-2 rounded-xl transition-all text-xs font-medium flex items-center gap-1.5', chartType === 'bar' ? (dark ? 'bg-white/20 text-white shadow-lg' : 'bg-sky-500 text-white shadow-md') : 'opacity-60 hover:opacity-100')}
                                    title="Bar Chart"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                </button>
                            )}
                            {allowedChartTypes.includes('line') && (
                                <button
                                    onClick={() => setChartType('line')}
                                    className={cn('p-2 rounded-xl transition-all text-xs font-medium flex items-center gap-1.5', chartType === 'line' ? (dark ? 'bg-white/20 text-white shadow-lg' : 'bg-sky-500 text-white shadow-md') : 'opacity-60 hover:opacity-100')}
                                    title="Line Chart"
                                >
                                    <Activity className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {showThemeSelector && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                            {themesList.map((t, idx) => (
                                <button
                                    key={t.name}
                                    onClick={() => setActiveThemeIdx(idx)}
                                    className={cn(
                                        'w-4 h-4 rounded-full transition-transform',
                                        activeThemeIdx === idx ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                                    )}
                                    style={{ backgroundColor: t.primary }}
                                    title={t.name}
                                />
                            ))}
                        </div>
                    )}

                    {showTimeRangeFilter && (
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className={cn(
                                'px-3 py-2 rounded-2xl text-xs font-medium border outline-none cursor-pointer backdrop-blur-md transition-all',
                                dark ? 'bg-neutral-900 border-white/10 text-white hover:bg-neutral-800' : 'bg-white/80 border-sky-200 text-neutral-800'
                            )}
                        >
                            <option value="all">Barcha davr</option>
                            <option value="1y">Oxirgi 1 yil</option>
                            <option value="6m">Oxirgi 6 oy</option>
                            <option value="3m">Oxirgi 3 oy</option>
                        </select>
                    )}

                    <div className="flex items-center gap-1.5">
                        {showRefreshButton && (
                            <button
                                onClick={handleRefresh}
                                className={cn('p-2.5 rounded-2xl border transition-all active:scale-95', dark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300' : 'bg-white/80 border-sky-200 hover:bg-sky-50 text-neutral-700')}
                                title="Yangilash"
                            >
                                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                            </button>
                        )}
                        {showCopyButton && (
                            <button
                                onClick={handleCopy}
                                className={cn('p-2.5 rounded-2xl border transition-all active:scale-95', dark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300' : 'bg-white/80 border-sky-200 hover:bg-sky-50 text-neutral-700')}
                                title="Nusxalash"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        )}
                        {showDownloadButton && (
                            <button
                                onClick={handleDownloadCSV}
                                className={cn('p-2.5 rounded-2xl border transition-all active:scale-95', dark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300' : 'bg-white/80 border-sky-200 hover:bg-sky-50 text-neutral-700')}
                                title="CSV export"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full relative z-10" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                        <AreaChart data={filteredData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                            <defs>
                                {series.map((s) => (
                                    <linearGradient key={s.key} id={`ultimate-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={currentPalette.primary} stopOpacity={dark ? 0.5 : 0.4} />
                                        <stop offset="95%" stopColor={currentPalette.primary} stopOpacity={0.0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(14, 165, 233, 0.1)'} vertical={false} />
                            <XAxis dataKey={xAxisKey} stroke={dark ? '#737373' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke={dark ? '#737373' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val} />
                            <Tooltip 
                                cursor={snapToCursor ? { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.4)', fill: 'rgba(255,255,255,0.05)' } : true} 
                                content={<CustomTooltip dark={dark} />} 
                            />
                            <Legend verticalAlign="top" align="right" height={36} formatter={(val) => <span className={cn('text-xs font-semibold', dark ? 'text-neutral-300' : 'text-neutral-700')}>{val}</span>} />
                            {series.map((s, idx) => (
                                <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={idx === 0 ? currentPalette.primary : s.color} strokeWidth={3} fillOpacity={1} fill={`url(#ultimate-grad-${s.key})`} isAnimationActive animationDuration={1000} />
                            ))}
                            {enableZoomBrush && <Brush dataKey={xAxisKey} height={25} stroke={currentPalette.primary} fill={dark ? '#171717' : '#f0f9ff'} travellerWidth={10} />}
                        </AreaChart>
                    ) : chartType === 'bar' ? (
                        <BarChart data={filteredData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(14, 165, 233, 0.1)'} vertical={false} />
                            <XAxis dataKey={xAxisKey} stroke={dark ? '#737373' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke={dark ? '#737373' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip 
                                cursor={snapToCursor ? { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.4)', fill: 'rgba(255,255,255,0.05)' } : true} 
                                content={<CustomTooltip dark={dark} />} 
                            />
                            <Legend verticalAlign="top" align="right" height={36} formatter={(val) => <span className={cn('text-xs font-semibold', dark ? 'text-neutral-300' : 'text-neutral-700')}>{val}</span>} />
                            {series.map((s, idx) => (
                                <Bar key={s.key} dataKey={s.key} name={s.label} fill={idx === 0 ? currentPalette.primary : s.color} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1000} />
                            ))}
                            {enableZoomBrush && <Brush dataKey={xAxisKey} height={25} stroke={currentPalette.primary} fill={dark ? '#171717' : '#f0f9ff'} travellerWidth={10} />}
                        </BarChart>
                    ) : (
                        <LineChart data={filteredData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(14, 165, 233, 0.1)'} vertical={false} />
                            <XAxis dataKey={xAxisKey} stroke={dark ? '#737373' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke={dark ? '#737373' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip 
                                cursor={snapToCursor ? { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.4)', fill: 'rgba(255,255,255,0.05)' } : true} 
                                content={<CustomTooltip dark={dark} />} 
                            />
                            <Legend verticalAlign="top" align="right" height={36} formatter={(val) => <span className={cn('text-xs font-semibold', dark ? 'text-neutral-300' : 'text-neutral-700')}>{val}</span>} />
                            {series.map((s, idx) => (
                                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={idx === 0 ? currentPalette.primary : s.color} strokeWidth={3} dot={{ r: 4, fill: currentPalette.primary }} activeDot={{ r: 8 }} isAnimationActive animationDuration={1000} />
                            ))}
                            {enableZoomBrush && <Brush dataKey={xAxisKey} height={25} stroke={currentPalette.primary} fill={dark ? '#171717' : '#f0f9ff'} travellerWidth={10} />}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload, label, dark }: any) {
    if (active && payload && payload.length) {
        return (
            <div
                className={cn(
                    'rounded-2xl p-4 border backdrop-blur-2xl shadow-2xl text-xs space-y-2 min-w-[180px]',
                    dark
                        ? 'bg-neutral-900/95 border-white/10 text-white shadow-black/80'
                        : 'bg-white/95 border-sky-100 text-neutral-800 shadow-sky-200/50'
                )}
            >
                <p className="font-bold text-neutral-400 border-b border-white/10 pb-1.5 flex items-center justify-between">
                    <span>{label}</span>
                    <span className="text-[10px] opacity-60">Real-time</span>
                </p>
                <div className="space-y-1.5 pt-1">
                    {payload.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6">
                            <span className="flex items-center gap-2 font-medium">
                                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                {item.name}:
                            </span>
                            <span className="font-extrabold text-sm">
                                {Number(item.value).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}