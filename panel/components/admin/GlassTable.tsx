'use client';

import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';

interface GlassTableProps {
    columns: { key: string; label: string }[];
    data: Record<string, unknown>[];
    actions?: (row: Record<string, unknown>) => React.ReactNode;
}

export default function GlassTable({ columns, data, actions }: GlassTableProps) {
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';

    return (
        <div className={cn('rounded-[20px] overflow-hidden border', dark ? 'border-white/10' : 'border-sky-200/40')}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className={cn(dark ? 'bg-white/5' : 'bg-sky-50/80')}>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs',
                                        dark ? 'text-neutral-400' : 'text-neutral-500'
                                    )}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {actions && (
                                <th className={cn('px-4 py-3 text-left font-semibold uppercase tracking-wider text-xs', dark ? 'text-neutral-400' : 'text-neutral-500')}>
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr
                                key={i}
                                className={cn(
                                    'border-t transition-colors duration-200',
                                    dark ? 'border-white/5 hover:bg-white/5' : 'border-sky-100 hover:bg-sky-50/50'
                                )}
                            >
                                {columns.map(col => (
                                    <td key={col.key} className={cn('px-4 py-3.5', dark ? 'text-neutral-300' : 'text-neutral-700')}>
                                        {String(row[col.key] ?? '')}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-4 py-3.5">{actions(row)}</td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
