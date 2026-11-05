'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ExternalLink, Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buildNavTree, bottomNavItems, type NavItem, type NavChild, type NavCrudItem } from '@/lib/navigation';
import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/app/_store/useThemeStore';
import LocaleSwitcher from './LocaleSwitcher';
import ThemeToggle from './ThemeToggle';

function ConnectorLine({ dark, depth }: { dark: boolean; depth: number }) {
    return (
        <div
            className={cn('absolute left-0 top-0 bottom-0 w-px', dark ? 'bg-white/10' : 'bg-sky-300/40')}
            style={{ marginLeft: `${depth * 16 + 20}px` }}
        />
    );
}

function CrudLinks({
    items,
    pathname,
    dark,
    depth,
    t,
}: {
    items: NavCrudItem[];
    pathname: string;
    dark: boolean;
    depth: number;
    t: ReturnType<typeof useTranslations>;
}) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden relative"
            >
                <ConnectorLine dark={dark} depth={depth} />
                <div className="space-y-0.5 py-1" style={{ paddingLeft: `${depth * 16 + 28}px` }}>
                    {items.map((crud, i) => {
                        const isActive = pathname === crud.href || pathname.startsWith(crud.href + '/');
                        const Icon = crud.icon;
                        return (
                            <motion.div
                                key={crud.key}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05, duration: 0.3 }}
                            >
                                <Link
                                    href={crud.href}
                                    className={cn(
                                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300',
                                        isActive
                                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                            : dark
                                                ? 'text-neutral-500 hover:text-white hover:bg-white/5'
                                                : 'text-neutral-400 hover:text-neutral-900 hover:bg-black/5'
                                    )}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="capitalize">{t(`crud.${crud.key}`)}</span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function ChildNav({
    child,
    pathname,
    dark,
    locale,
    expandedChild,
    setExpandedChild,
    t,
}: {
    child: NavChild;
    pathname: string;
    dark: boolean;
    locale: string;
    expandedChild: string | null;
    setExpandedChild: (key: string | null) => void;
    t: ReturnType<typeof useTranslations>;
}) {
    const isChildActive = pathname.startsWith(child.href);
    const isExpanded = expandedChild === child.key || isChildActive;
    const Icon = child.icon;

    return (
        <div className="relative">
            <button
                onClick={() => setExpandedChild(isExpanded && !isChildActive ? null : child.key)}
                className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
                    isChildActive
                        ? 'bg-sky-500/15 text-sky-400'
                        : dark
                            ? 'text-neutral-400 hover:text-white hover:bg-white/5'
                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/5'
                )}
                style={{ paddingLeft: '44px' }}
            >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="capitalize flex-1 text-left">{t(`nav.${child.key}`)}</span>
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && child.crud && (
                    <CrudLinks items={child.crud} pathname={pathname} dark={dark} depth={2} t={t} />
                )}
            </AnimatePresence>
        </div>
    );
}

function NavItemComponent({
    item,
    pathname,
    dark,
    locale,
    expandedItem,
    setExpandedItem,
    expandedChild,
    setExpandedChild,
    t,
}: {
    item: NavItem;
    pathname: string;
    dark: boolean;
    locale: string;
    expandedItem: string | null;
    setExpandedItem: (key: string | null) => void;
    expandedChild: string | null;
    setExpandedChild: (key: string | null) => void;
    t: ReturnType<typeof useTranslations>;
}) {
    const hasChildren = item.children && item.children.length > 0;
    const hasCrud = item.crud && item.crud.length > 0;
    const isActive = hasChildren
        ? item.children!.some(c => pathname.startsWith(c.href))
        : pathname === item.href || (item.href !== `/site/${locale}` && pathname.startsWith(item.href));
    const isExpanded = expandedItem === item.key || isActive;
    const Icon = item.icon;

    if (!hasChildren && !hasCrud) {
        return (
            <Link
                href={item.href}
                className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300',
                    isActive
                        ? 'bg-gradient-to-r from-sky-600/90 to-blue-600/90 text-white shadow-[0_4px_30px_10px_rgba(138,204,255,0.25)] translate-x-1'
                        : dark
                            ? 'text-neutral-500 hover:bg-white/5 hover:text-white'
                            : 'text-neutral-400 hover:bg-black/5 hover:text-neutral-900'
                )}
            >
                <Icon className="w-4 h-4" />
                <span className="capitalize">{t(`nav.${item.key}`)}</span>
            </Link>
        );
    }

    return (
        <div>
            <button
                onClick={() => setExpandedItem(isExpanded && !isActive ? null : item.key)}
                className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300',
                    isActive
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                        : dark
                            ? 'text-neutral-500 hover:bg-white/5 hover:text-white'
                            : 'text-neutral-400 hover:bg-black/5 hover:text-neutral-900'
                )}
            >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="capitalize flex-1 text-left">{t(`nav.${item.key}`)}</span>
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden relative"
                    >
                        <div className={cn('absolute left-[28px] top-2 bottom-2 w-px', dark ? 'bg-white/10' : 'bg-sky-300/40')} />
                        <div className="py-1 space-y-0.5">
                            {item.children!.map(child => (
                                <ChildNav
                                    key={child.key}
                                    child={child}
                                    pathname={pathname}
                                    dark={dark}
                                    locale={locale}
                                    expandedChild={expandedChild}
                                    setExpandedChild={setExpandedChild}
                                    t={t}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {isExpanded && !hasChildren && hasCrud && (
                    <CrudLinks items={item.crud!} pathname={pathname} dark={dark} depth={1} t={t} />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Sidebar({ locale }: { locale: string }) {
    const pathname = usePathname();
    const theme = useThemeStore(s => s.theme);
    const dark = theme === 'dark';
    const t = useTranslations();
    const navTree = buildNavTree(locale);
    const bottomItems = bottomNavItems(locale);

    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [expandedChild, setExpandedChild] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-2 mb-8">
                <Link href={`/site/${locale}`} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-900 to-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-500/25">
                        IM
                    </div>
                    <span className={cn('font-bold text-lg tracking-tight', dark ? 'text-white' : 'text-neutral-900')}>
                        Admin
                    </span>
                </Link>
                <button className="lg:hidden p-2 rounded-xl hover:bg-white/10" onClick={() => setMobileOpen(false)}>
                    <X className="w-5 h-5" />
                </button>
            </div>

            <LocaleSwitcher />

            <nav className="flex-1 space-y-1 mt-6 overflow-y-auto pr-1">
                {navTree.map(item => (
                    <NavItemComponent
                        key={item.key}
                        item={item}
                        pathname={pathname}
                        dark={dark}
                        locale={locale}
                        expandedItem={expandedItem}
                        setExpandedItem={setExpandedItem}
                        expandedChild={expandedChild}
                        setExpandedChild={setExpandedChild}
                        t={t}
                    />
                ))}
            </nav>

            <div className="space-y-1.5 mt-4 pt-4 border-t border-white/5">
                {bottomItems.map(item => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300',
                                isActive
                                    ? 'bg-sky-500/15 text-sky-400'
                                    : dark
                                        ? 'text-neutral-500 hover:bg-white/5 hover:text-white'
                                        : 'text-neutral-400 hover:bg-black/5 hover:text-neutral-900'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="capitalize">{t(`nav.${item.key}`)}</span>
                        </Link>
                    );
                })}

                <ThemeToggle />

                <Link
                    href="https://internet-magazin-uzum.vercel.app"
                    target="_blank"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-sky-600 to-blue-600 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition-all duration-300 active:scale-[0.98] mt-2"
                >
                    <span>{t('nav.goToSite')}</span>
                    <ExternalLink className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );

    return (
        <>
            <button
                onClick={() => setMobileOpen(true)}
                className={cn(
                    'lg:hidden fixed top-4 left-4 z-40 p-3 rounded-2xl backdrop-blur-xl',
                    dark ? 'glass-panel' : 'glass-panel-light'
                )}
            >
                <Menu className="w-5 h-5" />
            </button>

            <aside className={cn(
                'hidden lg:flex w-72 shrink-0 rounded-[28px] p-6 flex-col',
                dark ? 'glass-panel' : 'glass-panel-light'
            )}>
                {sidebarContent}
            </aside>

            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className={cn(
                                'lg:hidden fixed left-0 top-0 bottom-0 w-80 z-50 p-6 flex flex-col',
                                dark ? 'glass-panel' : 'glass-panel-light'
                            )}
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
