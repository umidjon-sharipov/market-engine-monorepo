'use client';

import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';
import React from 'react';

interface Column {
    key: string;
    label: string;
}

interface GlassCustomTableProps {
    columns: Column[];
    data: Record<string, React.ReactNode>[];
    actions?: (row: Record<string, React.ReactNode>) => React.ReactNode;
}

export default function GlassCustomTable({ columns, data, actions }: GlassCustomTableProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    return (
        <div className={cn('rounded-[20px] overflow-hidden border shadow-xl backdrop-blur-md', dark ? 'border-white/10 bg-black/20' : 'border-sky-200/40 bg-white/40')}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className={cn(dark ? 'bg-white/5' : 'bg-sky-50/80')}>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'px-6 py-4 text-left font-bold uppercase tracking-wider text-xs',
                                        dark ? 'text-neutral-400' : 'text-neutral-600'
                                    )}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {actions && (
                                <th className={cn('px-6 py-4 text-left font-bold uppercase tracking-wider text-xs', dark ? 'text-neutral-400' : 'text-neutral-600')}>
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((row, i) => (
                            <tr
                                key={i}
                                className={cn(
                                    'transition-colors duration-200',
                                    dark ? 'hover:bg-white/5' : 'hover:bg-sky-50/50'
                                )}
                            >
                                {columns.map(col => (
                                    <td key={col.key} className={cn('px-6 py-4 align-middle', dark ? 'text-neutral-300' : 'text-neutral-700')}>
                                        {row[col.key]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-6 py-4 align-middle">{actions(row)}</td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}