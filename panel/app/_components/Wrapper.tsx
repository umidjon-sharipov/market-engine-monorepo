'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useThemeStore } from "@/app/_store/useThemeStore";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import GlassMenu from "@/components/GlassNavItem";
import { useTokenStore } from "../_store/useTokenStore";
import { useParams } from "next/navigation";
import { usePermissionsStore } from "../_store/usePermissionsStore";
import {
    Menu,
    X,
    ChevronRight,
    LayoutDashboard,
    Package,
    TrendingUp,
    FolderTree,
    Briefcase,
    Users,
    MessageSquareText,
    Settings,
    LogOut,
    Bell,
    Mail,
    Store,
    BrainCircuit,
    Maximize
} from "lucide-react";
import { useNotification } from "@/components/Notification";
import { API_URL } from '@/lib/api';
import { useRouter } from "next/navigation";
import toggleTheme from "./toggleTheme";
import { cn } from "@/lib/utils/cn";


const MCL_EXAMPLES = `MCL/1;

READ Product FIELDS [id,title,price,quantity] LIMIT 20;
READ Product WHERE title CONTAINS "mouse" FIELDS [id,title,price,options] LIMIT 10;
COUNT Product WHERE quantity LTE 5;

CREATE Product DATA {
  "title": "Wireless Mouse",
  "price": 29.99,
  "uom": "PCS",
  "description": [{ "language": "uz", "text": "Simsiz sichqoncha" }],
  "options": [{
    "title": "Color",
    "items": [{ "key": "Black", "value": 0 }, { "key": "White", "value": 2 }]
  }]
};

// UPDATE Product WHERE id = "UUID" DATA { "price": 24.99 };
// DELETE Product WHERE id = "UUID" CONFIRM "UUID";`;

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, []);

    const inputRef = useRef<HTMLTextAreaElement | null>(null)
    const [consoleValue, setConsoleValue] = useState("")
    const [consoleOutput, setConsoleOutput] = useState<string[]>([])
    const [consoleBusy, setConsoleBusy] = useState(false)

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    const router = useRouter()
    const { switchAccount, removeAccount } = useTokenStore(state => state)

    const runConsoleScript = async (source: string) => {
        if (!source.trim() || consoleBusy) return;
        if (!token || !market) {
            notify.show("AI terminal uchun token yoki marketId topilmadi", "error", dark ? "dark" : "light");
            return;
        }

        setConsoleBusy(true);
        try {
            const apiBase = API_URL.replace(/\/+$/, '');
            const response = await fetch(`${apiBase}/ai/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ marketId: market, script: source }),
            });
            const payload: { results?: unknown[]; message?: string; error?: string } = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.message || payload.error || `AI backend xatosi (${response.status})`);
            }

            const results: unknown[] = Array.isArray(payload.results) ? payload.results : [];
            const timestamp = new Date().toLocaleTimeString();
            const lines = results.map((item: unknown, index: number) => `#${index + 1}\n${JSON.stringify(item, null, 2)}`);
            setConsoleOutput(prev => [`✓ MCL/1 · ${results.length} ta natija · ${timestamp}`, ...lines.reverse(), ...prev].slice(0, 24));
            setConsoleValue("");
            notify.show(`MCL/1 muvaffaqiyatli bajarildi: ${results.length} ta natija`, "success", dark ? "dark" : "light");
        } catch (error) {
            const message = error instanceof Error ? error.message : "MCL bajarishda noma'lum xatolik";
            setConsoleOutput(prev => [`✕ ${message}`, ...prev].slice(0, 30));
            notify.show(message, "error", dark ? "dark" : "light");
        } finally {
            setConsoleBusy(false);
        }
    };

    const handleKeyDownInput = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Enter" || (isFullScreenConsole ? !(event.ctrlKey || event.metaKey) : event.shiftKey)) return;
        event.preventDefault();
        const value = consoleValue.trim();
        if (!value) return;
        if (isFullScreenConsole) { void runConsoleScript(value); return; }
        if (value === "@Back") router.back();
        else if (value === "@Next") router.forward();
        else if (value === "@Reload" || value === "@Refresh") router.refresh();
        else if (value === "@Home") router.push(`/${locale}`);
        else if (value === "@Theme") toggleTheme();
        else if (value === "@Clear") { setConsoleValue(""); return; }
        else if (value === "@Help") notify.show(`Mavjud: @Back, @Next, @Home, @Reload, @Theme, @Clear. MCL terminalini kengaytiring.`, "success", mode === 'dark' ? 'dark' : 'light');
        else if (value === "@Logout") { removeAccount(); router.push(useTokenStore.getState().accounts.length > 0 ? `/${locale}` : `/${locale}/auth`); }
        else if (value === "@Auth") router.push(`/${locale}/auth`);
        else if (value.startsWith("@Lang ")) {
            const langCode = value.split(" ")[1];
            if (["uz", "ru", "en"].includes(langCode)) router.push(`/${langCode}/${market}/dashboard`);
            else notify.show("Til kodi: @Lang uz", "error", mode === 'dark' ? 'dark' : 'light');
        } else if (value === "@New") router.push(`${pathname}?create=true`);
        else window.location.href = `/${locale}/${market}/${value}`;
        setConsoleValue("");
    };

    const mode = useThemeStore(state => state.theme)
    const pathname = usePathname()

    const { getActiveToken } = useTokenStore(state => state)
    const token = getActiveToken()

    const [menu, setMenu] = useState(true)
    const [navOpen, setNavOpen] = useState(false)
    const [tab, setTab] = useState(-1)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isFullScreenConsole, setIsFullScreenConsole] = useState(false)
    const notify = useNotification()

    const params = useParams()
    const locale = (params?.locale as string) || pathname.split('/')[1] || 'uz'
    const market = (params?.market as string) || pathname.split('/')[2] || ''
    const dark = mode === 'dark'
    const { permissions, setPermissions } = usePermissionsStore()

    const renderToken = async (token: string | null) => {
        if (!token) {
            return;
        }
        try {
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': ['Bearer', token].join(' ')
                }
            });

            if (!res.ok) {
                return;
            }

            const req = await res.json();
        } catch (err) {
        }
    }

    const handleRole = async () => {
        if (!token || !market) {
            return
        }
        try {
            const res = await fetch(`${API_URL}/role`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': ['Bearer', token].join(' ')
                },
                body: JSON.stringify({ marketId: market })
            })

            const req = await res.json()

            if (res.ok) {
                setPermissions(req.permissions)
                notify.show(`${req.role || 'owner'}`, "success", dark ? 'dark' : 'light')
            } else {
                notify.show(`${req.message}`, "error", dark ? 'dark' : 'light')
            }
        } catch (err) {
            notify.show(`So'rov yuborilmadi`, "error", dark ? 'dark' : 'light')
        }
    }

    useEffect(() => {
        const isHome = (['/uz', '/en', '/ru'].includes(pathname) || ['/uz/auth', '/en/auth', '/ru/auth'].includes(pathname))
        setNavOpen(!isHome)
    }, [pathname])

    useEffect(() => {
        if (['/uz', '/en', '/ru'].includes(pathname)) {
            notify.show('home page', "success", dark ? 'dark' : 'light')
        } else if (['/uz/auth', '/en/auth', '/ru/auth'].includes(pathname)) {
            notify.show('auth page', "success", dark ? 'dark' : 'light')
        } else {
            handleRole()
        }
    }, [market, token])

    useEffect(() => {
        renderToken(token);
    }, [token]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setMenu(false)
            } else {
                setMenu(true)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const newPath = pathname.split('/')[3]

        if (newPath === 'dashboard') setTab(1)
        else if (newPath === 'products' || newPath === 'warehouses' || newPath === 'pickpoints') setTab(2)
        else if (newPath === 'nimadir') setTab(3)
        else if (['categories', 'discounts', 'discountsDashboard', 'sliders'].includes(newPath)) setTab(4)
        else if (newPath === 'vacancy') setTab(5)
        else if (newPath === 'users' || newPath === 'workers') setTab(6)
        else if (['inquiries-all', 'complaints-all', 'work-all-chats'].includes(newPath)) setTab(7)
        else if (newPath === 'ai') setTab(8)
        else if (newPath === 'settings') setTab(9)
        else { setTab(1) }
    }, [pathname])

    // ===============================================================

    const warehouses = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Warehouses', href: '/warehouses' },
    ]

    const pickPoints = [
        { label: "PickPoints", href: '/pickpoints'}
    ]

    const products = [
        { label: 'Products', href: '/products' },
        { label: 'Comments', href: '/comments' },
        { label: 'Reactions', href: '/reactions' },
        { label: 'Reports', href: '/reports' },
    ]

    const stockLevels = [
        { label: 'Real-time Stock', href: '/real-time-stock' },
        { label: 'Dead Stock', href: '/dead-stock' },
        { label: 'Low Stock Alerts', href: '/low-stock-alerts' },
    ]

    const stockMovement = [
        { label: 'Incoming Flow', href: '/incoming-flow' },
        { label: 'Outgoing Flow', href: '/outgoing-flow' },
        { label: 'Internal Transfers', href: '/internal-transfers' },
    ]

    const salesPerformance = [
        { label: 'Top Products', href: '/top-products' },
        { label: 'Category Sales', href: '/category-sales' },
        { label: 'Peak Hours/Days', href: '/peak-hours-days' },
    ]

    const demandForecasting = [
        { label: 'Predicted Shortages', href: '/predicted-shortages' },
        { label: 'Seasonal Trends', href: '/seasonal-trends' },
    ];

    const valueAndCost = [
        { label: 'Total Stock Value', href: '/total-stock-value' },
        { label: 'Holding Costs', href: '/holding-costs' },
    ];

    const profitability = [
        { label: 'Margin Analysis', href: '/margin-analysis' },
        { label: 'Revenue Reports', href: '/revenue-reports' },
    ];

    const inventoryTurnover = [
        { label: 'Inventory Turnover Rate', href: '/inventory-turnover-rate' },
        { label: 'Days in Warehouse', href: '/days-in-warehouse' },
    ];

    const fulfillment = [
        { label: 'Order Processing Time', href: '/order-processing-time' },
        { label: 'Return Rates', href: '/return-rates' },
    ];

    const catalogCategories = [
        { label: 'Categories List', href: '/categories' },
        { label: 'Category CRUD', href: '/categories/manage' },
    ]

    const catalogSearch = [
        { label: 'Search Keywords', href: '/search-keywords' },
        { label: 'Filters & Attributes', href: '/attributes' },
    ]

    const discounts = [
        { label: 'Dashboard', href: '/discountsDashboard' },
        { label: 'Discounts', href: '/discounts' }
    ]

    const sliders = [
        { label: 'Sliders', href: '/sliders' }
    ]

    const users = [
        { label: 'All Users', href: '/users' },
        ...([{ label: 'Blocked Users', href: '/blocked-users' }]),
    ]

    const workers = [
        { label: 'Manage workers', href: `/workers` }
    ];

    const workRelated = [
        { label: 'All Chats', href: '/work-all-chats' },
        { label: 'General Work Group', href: '/work-general-group' },
        { label: 'Direct Messages', href: '/work-direct-messages' },
    ]

    const customerInquiries = [
        { label: 'All Inquiries', href: '/inquiries-all' },
        { label: 'Important Inquiries', href: '/inquiries-important' },
        { label: 'Unimportant Inquiries', href: '/inquiries-unimportant' },
    ]

    const complaints = [
        { label: 'All Complaints', href: '/complaints-all' },
        { label: 'New Complaints', href: '/complaints-new' },
    ]

    const hasSubMenu = [2, 3, 4, 6, 7].includes(tab);

    const renderSubMenuContent = (onItemClick?: () => void) => {
        if (tab === 2) {
            return (
                <div onClick={ onItemClick } className="flex flex-col gap-3">
                    { warehouses.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Warehouses" items={ warehouses } defaultOpen={ true } />
                    </div> }
                    { products.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Products" items={ products } defaultOpen={ true } />
                    </div> }
                    { pickPoints.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="PickPoints" items={ pickPoints } defaultOpen={ true } />
                    </div> }
                </div>
            );
        }
        if (tab === 3) {
            return (
                <div onClick={ onItemClick } className="flex flex-col gap-3">
                    <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Stock Levels" items={ stockLevels } defaultOpen={ true } />
                    </div>
                    <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Stock Movement" items={ stockMovement } defaultOpen={ true } />
                    </div>
                    <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Performance" items={ salesPerformance } defaultOpen={ true } />
                    </div>
                    <>
                        <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                            <GlassMenu title="Demand Forecasting" items={ demandForecasting } defaultOpen={ true } />
                        </div>
                        <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                            <GlassMenu title="Value & Cost" items={ valueAndCost } defaultOpen={ true } />
                        </div>
                        <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                            <GlassMenu title="Profitability" items={ profitability } defaultOpen={ true } />
                        </div>
                        <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                            <GlassMenu title="Turnover" items={ inventoryTurnover } defaultOpen={ true } />
                        </div>
                        <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                            <GlassMenu title="Fulfillment" items={ fulfillment } defaultOpen={ true } />
                        </div>
                    </>
                </div>
            );
        }
        if (tab === 4) {
            return (
                <div onClick={ onItemClick } className="flex flex-col gap-3">
                    { catalogCategories.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Catalog Categories" items={ catalogCategories } defaultOpen={ true } />
                    </div> }
                    { catalogSearch.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Catalog Search" items={ catalogSearch } defaultOpen={ true } />
                    </div> }
                    { discounts.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Discounts" items={ discounts } defaultOpen={ true } />
                    </div> }
                    { sliders.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Sliders" items={ sliders } defaultOpen={ true } />
                    </div> }
                </div>
            );
        }
        if (tab === 6) {
            return (
                <div onClick={ onItemClick } className="flex flex-col gap-3">
                    <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Workers" items={ workers } defaultOpen={ true } />
                    </div>
                    { users.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Users" items={ users } defaultOpen={ true } />
                    </div> }
                </div>
            );
        }
        if (tab === 7) {
            return (
                <div onClick={ onItemClick } className="flex flex-col gap-3">
                    { workRelated.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Work Related" items={ workRelated } defaultOpen={ true } />
                    </div> }
                    { customerInquiries.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Customer Inquiries" items={ customerInquiries } defaultOpen={ true } />
                    </div> }
                    { complaints.length > 0 && <div className={ `backdrop-blur-2xl rounded-3xl ${dark ? "bg-neutral-900/40 border-white/10 text-white shadow-xl shadow-black/20" : "bg-white/40 border-white/60 text-neutral-900 shadow-xl shadow-black/5"}` }>
                        <GlassMenu title="Complaints" items={ complaints } defaultOpen={ true } />
                    </div> }
                </div>
            );
        }
        return null;
    };

    const renderNavItems = (isMobile = false) => {
        const handleTabClick = (newTab: number) => {
            setTab(tab === newTab ? -1 : newTab);
            if (!isMobile) {
                if (!menu) setMenu(true);
            }
        };

        const handleDirectNav = (t: number) => {
            setTab(t);
            if (isMobile) setIsMobileMenuOpen(false);
        };

        return (
            <>
                { (permissions.includes('all:all') || permissions.includes('dashboard:get')) && <Link
                    href={ `/${locale}/${market.replaceAll(' ', '_')}/dashboard` }
                    onClick={ () => handleDirectNav(1) }
                    title="Dashboard"
                    className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark
                        ? "hover:bg-white/10 text-neutral-300 hover:text-white"
                        : "hover:bg-black/5 text-neutral-700 hover:text-neutral-900"
                        }` }
                >
                    { tab === 1 && (
                        <motion.div
                            layoutId={ isMobile ? "mobileActiveTab" : "activeTabIndicator" }
                            className="absolute inset-0 rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        />
                    ) }
                    <LayoutDashboard className={ `w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${tab === 1 ? 'text-sky-400' : ''}` } />
                </Link> }

                { (permissions.includes('all:all') || permissions.includes('warehouse:get')) && <button
                    onClick={ () => handleTabClick(2) }
                    title="Products & Warehouses"
                    className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark ? "hover:bg-white/10 text-neutral-300 hover:text-white" : "hover:bg-black/5 text-neutral-700 hover:text-neutral-900"}` }
                >
                    { tab === 2 && (
                        <motion.div
                            layoutId={ isMobile ? "mobileActiveTab" : "activeTabIndicator" }
                            className="absolute inset-0 rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        />
                    ) }
                    <Package className={ `w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${tab === 2 ? 'text-sky-400' : ''}` } />
                </button> }

                { (permissions.includes('all:all') || permissions.includes('analytics:get')) && <button
                    onClick={ () => handleTabClick(3) }
                    title="Analytics & Stock"
                    className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark ? "hover:bg-white/10 text-neutral-300 hover:text-white" : "hover:bg-black/5 text-neutral-700 hover:text-neutral-900"}` }
                >
                    { tab === 3 && (
                        <motion.div
                            layoutId={ isMobile ? "mobileActiveTab" : "activeTabIndicator" }
                            className="absolute inset-0 rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        />
                    ) }
                    <TrendingUp className={ `w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${tab === 3 ? 'text-sky-400' : ''}` } />
                </button> }

                { (permissions.includes('all:all') || permissions.includes('categories:get')) && <button
                    onClick={ () => handleTabClick(4) }
                    title="Categories & Discounts"
                    className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark ? "hover:bg-white/10 text-neutral-300 hover:text-white" : "hover:bg-black/5 text-neutral-700 hover:text-neutral-900"}` }
                >
                    { tab === 4 && (
                        <motion.div
                            layoutId={ isMobile ? "mobileActiveTab" : "activeTabIndicator" }
                            className="absolute inset-0 rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        />
                    ) }
                    <FolderTree className={ `w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${tab === 4 ? 'text-sky-400' : ''}` } />
                </button> }

                <Link
                    href={ `/${locale}/${market.replaceAll(' ', '_')}/vacancy` }
                    onClick={ () => handleDirectNav(5) }
                    title="Vacancies"
                    className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark
                        ? "hover:bg-white/10 text-neutral-300 hover:text-white"
                        : "hover:bg-black/5 text-neutral-700 hover:text-neutral-900"
                        }` }
                >
                    { tab === 5 && (
                        <motion.div
                            layoutId={ isMobile ? "mobileActiveTab" : "activeTabIndicator" }
                            className="absolute inset-0 rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        />
                    ) }
                    <Briefcase className={ `w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${tab === 5 ? 'text-sky-400' : ''}` } />
                </Link>

                { (permissions.includes('all:all') || permissions.includes('users:get')) && (
                    <button
                        onClick={ () => handleTabClick(6) }
                        title="Users & Workers"
                        className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark ? "hover:bg-white/10 text-neutral-300 hover:text-white" : "hover:bg-black/5 text-neutral-700 hover:text-neutral-900"}` }
                    >
                        { tab === 6 && (
                            <motion.div
                                layoutId={ isMobile ? "mobileActiveTab" : "activeTabIndicator" }
                                className="absolute inset-0 rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                            />
                        ) }
                        <Users className={ `w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${tab === 6 ? 'text-sky-400' : ''}` } />
                    </button>)
                }

                { market && <button
                    onClick={ () => handleTabClick(7) }
                    title="Messages & Inquiries"
                    className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark ? "hover:bg-white/10 text-neutral-300 hover:text-white" : "hover:bg-black/5 text-neutral-700 hover:text-neutral-900"}` }
                >
                    { tab === 7 && (
                        <motion.div
                            layoutId={ isMobile ? "mobileActiveTab" : "activeTabIndicator" }
                            className="absolute inset-0 rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        />
                    ) }
                    <MessageSquareText className={ `w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${tab === 7 ? 'text-sky-400' : ''}` } />
                </button> }

                <Link
                    href={ `/${locale}/${market.replaceAll(' ', '_')}/ai` }
                    onClick={ () => handleDirectNav(8) }
                    title="AI"
                    className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark
                        ? "hover:bg-white/10 text-neutral-300 hover:text-white"
                        : "hover:bg-black/5 text-neutral-700 hover:text-neutral-900"
                        }` }
                >
                    { tab === 8 && (
                        <motion.div
                            layoutId={ isMobile ? "mobileActiveTab" : "activeTabIndicator" }
                            className="absolute inset-0 rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        />
                    ) }
                    <BrainCircuit className={ `w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${tab === 8 ? 'text-sky-400' : ''}` } />
                </Link>

                <Link
                    href={ `/${locale}/settings` }
                    onClick={ () => handleDirectNav(9) }
                    title="Settings"
                    className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark ? "hover:bg-white/10 text-neutral-300 hover:text-white" : "hover:bg-black/5 text-neutral-700 hover:text-neutral-900"}` }
                >
                    { tab === 9 && (
                        <motion.div
                            layoutId={ isMobile ? "mobileActiveTab" : "activeTabIndicator" }
                            className="absolute inset-0 rounded-2xl bg-sky-500/20 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        />
                    ) }
                    <Settings className={ `w-5 h-5 relative z-10 transition-transform group-hover:scale-110 ${tab === 9 ? 'text-sky-400' : ''}` } />
                </Link>

                <div className="w-8 h-[1px] bg-white/10 my-1 self-center" />

                <Link
                    href={ `/${locale}` }
                    onClick={ () => handleDirectNav(10) }
                    title="Exit / Home"
                    className={ `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ease-out active:scale-90 ${dark
                        ? "hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400"
                        : "hover:bg-rose-500/10 text-neutral-500 hover:text-rose-600"
                        }` }
                >
                    <LogOut className="w-5 h-5 relative z-10 transition-transform group-hover:scale-110" />
                </Link>
            </>
        )
    };

    return (
        <div className={ `${dark ? 'bg-[#09090b] text-[#f5f5f7]' : 'bg-[#f0f2f5] text-[#1d1d1f]'} antialiased duration-300 relative h-screen w-screen overflow-hidden` }>
            {/* Ambient Background Glows */ }
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-sky-600/25 to-sky-600/0 blur-[130px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-blue-600/20 to-cyan-600/0 blur-[150px] pointer-events-none z-0" />
            <div className={ `absolute top-[30%] right-[-5%] w-[35vw] h-[35vw] rounded-full ${dark ? 'bg-sky-500/10' : 'bg-sky-500/15'} blur-[110px] pointer-events-none z-0` } />

            {/* Mobile Drawer (When Opened on small screens) */ }
            <AnimatePresence>
                { isMobileMenuOpen && (
                    <>
                        {/* Backdrop Blur Overlay */ }
                        <motion.div
                            initial={ { opacity: 0 } }
                            animate={ { opacity: 1 } }
                            exit={ { opacity: 0 } }
                            transition={ { duration: 0.25 } }
                            onClick={ () => setIsMobileMenuOpen(false) }
                            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 lg:hidden"
                        />

                        {/* Slide-in Drawer Container */ }
                        <motion.div
                            initial={ { opacity: 0, x: -320 } }
                            animate={ { opacity: 1, x: 0 } }
                            exit={ { opacity: 0, x: -320 } }
                            transition={ { type: 'spring', damping: 26, stiffness: 280 } }
                            className="fixed inset-y-0 left-0 z-50 flex h-full max-h-screen p-3 sm:p-4 gap-3 pointer-events-auto lg:hidden"
                        >
                            {/* Primary Rail in Mobile */ }
                            <div className={ `flex flex-col items-center justify-between py-4 px-2 w-16 rounded-3xl backdrop-blur-3xl border shadow-2xl ${dark
                                ? "bg-neutral-900/90 border-white/10 text-white"
                                : "bg-white/90 border-black/10 text-neutral-900"
                                }` }>
                                <div className="flex flex-col items-center gap-3">
                                    <button
                                        onClick={ () => setIsMobileMenuOpen(false) }
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-90 transition-all"
                                        title="Yopish"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div className="w-8 h-[1px] bg-white/10" />
                                </div>

                                <div className="flex flex-col items-center space-y-2 overflow-y-auto py-2">
                                    { renderNavItems(true) }
                                </div>

                                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-xs font-bold text-sky-400">
                                    { (market || "A")[0].toUpperCase() }
                                </div>
                            </div>

                            {/* Submenu Panel sliding out on the right side in Mobile */ }
                            <AnimatePresence>
                                { hasSubMenu && (
                                    <motion.div
                                        initial={ { opacity: 0, x: -20, width: 0 } }
                                        animate={ { opacity: 1, x: 0, width: 260 } }
                                        exit={ { opacity: 0, x: -20, width: 0 } }
                                        transition={ { type: 'spring', damping: 25, stiffness: 270 } }
                                        className="h-full overflow-y-auto overflow-x-hidden flex flex-col gap-3 py-1 pr-1"
                                    >
                                        <div className="flex items-center justify-between px-3 py-2 rounded-2xl backdrop-blur-xl border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider">
                                            <span>Submenu</span>
                                            <span className="text-sky-400">{ (market || "Panel").slice(0, 15) }</span>
                                        </div>
                                        { renderSubMenuContent(() => setIsMobileMenuOpen(false)) }
                                    </motion.div>
                                ) }
                            </AnimatePresence>
                        </motion.div>
                    </>
                ) }
            </AnimatePresence>

            {/* Main Application Layout */ }
            <div className="relative z-10 flex h-full w-full p-2 lg:p-4 gap-3 lg:gap-4 overflow-hidden max-w-[1920px] mx-auto">
                {/* Desktop Docked Sidebar */ }
                { navOpen && (
                    <aside className="hidden lg:flex items-stretch gap-3 flex-shrink-0 z-40 h-full select-none">
                        {/* Primary Icon Rail */ }
                        <motion.nav
                            initial={ { opacity: 0, x: -20 } }
                            animate={ { opacity: 1, x: 0 } }
                            transition={ { duration: 0.3 } }
                            className={ `flex flex-col items-center justify-between py-4 px-2.5 rounded-3xl backdrop-blur-2xl border shadow-2xl shadow-black/10 ${dark
                                ? "bg-neutral-900/40 border-white/10 text-white"
                                : "bg-white/40 border-white/70 text-neutral-900"
                                }` }
                        >
                            {/* Top Market Logo / Home */ }
                            <div className="flex flex-col items-center gap-4">
                                <Link
                                    href={ `/${locale}/${market.replaceAll(' ', '_')}/dashboard` }
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold text-lg shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all"
                                    title={ market || "Dashboard" }
                                >
                                    { (market || "A")[0].toUpperCase() }
                                </Link>
                                <div className="w-8 h-[1px] bg-white/10" />
                            </div>

                            {/* Nav Action Icons */ }
                            <div className="flex flex-col items-center space-y-2.5 overflow-y-auto py-2">
                                { renderNavItems(false) }
                            </div>

                            {/* Bottom Collapse Toggle */ }
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={ () => setMenu(prev => !prev) }
                                    className={ `w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${dark ? 'hover:bg-white/10 text-neutral-400 hover:text-white' : 'hover:bg-black/5 text-neutral-600 hover:text-neutral-900'}` }
                                    title={ menu ? "Submenuni yashirish" : "Submenuni ko'rsatish" }
                                >
                                    <ChevronRight className={ `w-4 h-4 transition-transform duration-300 ${menu ? 'rotate-180' : ''}` } />
                                </button>
                            </div>
                        </motion.nav>

                        {/* Secondary Submenu Drawer / Flyout */ }
                        <AnimatePresence>
                            { menu && hasSubMenu && (
                                <motion.div
                                    initial={ { opacity: 0, width: 0, scale: 0.95 } }
                                    animate={ { opacity: 1, width: 280, scale: 1 } }
                                    exit={ { opacity: 0, width: 0, scale: 0.95 } }
                                    transition={ { type: 'spring', damping: 26, stiffness: 280 } }
                                    ref={ containerRef }
                                    className="h-full overflow-y-auto overflow-x-hidden flex flex-col gap-3.5 pr-1"
                                >
                                    { renderSubMenuContent() }
                                </motion.div>
                            ) }
                        </AnimatePresence>
                    </aside>
                ) }

                {/* Main Content Area Container */ }
                <div className={ `flex-1 flex flex-col h-full min-w-0 overflow-hidden relative rounded-3xl backdrop-blur-xl border transition-all duration-300 ${dark
                    ? "bg-neutral-900/20 border-white/10 shadow-2xl shadow-black/20"
                    : "bg-white/30 border-white/60 shadow-xl shadow-black/5"
                    }` }>

                    {/* Scrollable Parent for Content + Sticky Glass Header */ }
                    <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden relative">
                        {/* Sticky Translucent Blur Header */ }
                        <header className={ `sticky top-0 z-30 w-full flex items-center justify-between px-4 lg:px-6 py-3.5 border-b backdrop-blur-2xl transition-all duration-300 ${dark
                            ? "bg-[#09090b]/60 border-white/10 text-white"
                            : "bg-white/60 border-black/5 text-neutral-900"
                            }` }>
                            {/* Left Header Info */ }
                            <div className="flex items-center gap-3 min-w-0">
                                { navOpen && (
                                    <button
                                        onClick={ () => setIsMobileMenuOpen(true) }
                                        className={ `lg:hidden p-2 rounded-2xl backdrop-blur-xl border transition-all active:scale-90 ${dark
                                            ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                            : "bg-black/5 border-black/10 text-neutral-900 hover:bg-black/10"
                                            }` }
                                        aria-label="Open Navigation"
                                    >
                                        <Menu className="w-5 h-5" />
                                    </button>
                                ) }

                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-400/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                                        <Store className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-sm tracking-tight truncate max-w-[140px] sm:max-w-xs capitalize">
                                            { market || "Admin Panel" }
                                        </span>
                                        { ['/uz', '/en', '/ru'].includes(pathname) ? <span className="text-[10px] font-semibold uppercase text-sky-400">
                                            Admin Panel
                                        </span> :
                                            <div className="w-full overflow-hidden relative flex whitespace-nowrap">
                                                <div className="animate-marquee space-x-6">
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                                                        { permissions.length === 0 ? 'Access Denied' : JSON.stringify(permissions) }
                                                    </span>
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                                                        { permissions.length === 0 ? 'Access Denied' : JSON.stringify(permissions) }
                                                    </span>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                            {/* Right Header Actions */ }
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                {/* Messages (Desktop / Tablet) */ }

                                <motion.div layout transition={ { layout: { type: "spring", stiffness: 260, damping: 30 } } } className={ cn("relative z-[60] flex min-w-0 flex-col", isFullScreenConsole ? "fixed inset-2 sm:inset-4 lg:inset-y-[7vh] lg:inset-x-[10vw] z-[100] rounded-3xl" : "w-[min(38vw,280px)] sm:w-[min(32vw,340px)]") }>
                                    <AnimatePresence>{ isFullScreenConsole && <motion.button key="console-backdrop" initial={ { opacity: 0 } } animate={ { opacity: 1 } } exit={ { opacity: 0 } } onClick={ () => setIsFullScreenConsole(false) } className="fixed inset-0 -z-10 bg-black/65 backdrop-blur-md" aria-label="Konsolni yopish" /> }</AnimatePresence>
                                    <motion.div layout className={ cn("relative flex min-h-10 flex-col overflow-hidden border shadow-2xl backdrop-blur-3xl", isFullScreenConsole ? "h-full rounded-3xl" : "rounded-2xl", dark ? "border-sky-400/20 bg-[#090d16]/95 text-slate-100 shadow-sky-950/40" : "border-sky-300/70 bg-white/95 text-slate-900 shadow-sky-900/10") }>
                                        <div className={ cn("flex items-center gap-2 border-b px-3 py-2", dark ? "border-white/10" : "border-black/5") }>
                                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,.8)]" /><span className="font-mono text-[11px] font-semibold tracking-wide text-sky-400">MCL / MARKET AI</span>
                                            <span className="ml-auto font-mono text-[10px] opacity-50">{ consoleBusy ? 'RUNNING' : 'API READY' }</span>
                                            <button type="button" onClick={ () => setIsFullScreenConsole(prev => !prev) } className={ cn("flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95", dark ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-black/5 hover:text-slate-950") } aria-label={ isFullScreenConsole ? "Konsolni kichraytirish" : "Konsolni kengaytirish" } title={ isFullScreenConsole ? "Kichraytirish" : "Kengaytirish" }>{ isFullScreenConsole ? <X className="h-4 w-4" /> : <Maximize className="h-4 w-4" /> }</button>
                                        </div>
                                        { isFullScreenConsole ? (
                                            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.42fr)]">
                                                <div className="flex min-h-[45vh] flex-col overflow-hidden rounded-2xl border border-sky-400/15 bg-black/20">
                                                    <div className="flex items-center justify-between border-b border-white/10 px-3 py-2"><span className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wide text-sky-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> script.console <span className="rounded border border-sky-400/20 bg-sky-400/10 px-1.5 py-0.5 text-[9px] text-sky-200/70">MCL/1</span></span><span className="font-mono text-[10px] text-slate-500">JWT protected · Ctrl/⌘ + Enter</span></div>
                                                    <div className="relative flex-1">
                                                        <pre aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-6 text-slate-400">{ consoleValue.split(/(\b(?:READ|COUNT|CREATE|UPDATE|DELETE|WHERE|FIELDS|LIMIT|AFTER|CONFIRM|DATA|AND|Product|Slider|Discount|Category|Warehouse|WarehouseInventory|StockMovement|WarehouseTask|Worker|Vacancy|Comment|true|false|null)\b|"[^"]*"|'[^']*'|-?\d+(?:\.\d+)?|\/\/.*|#.*)/g).map((part, index) => { const keyword = /^(READ|COUNT|CREATE|UPDATE|DELETE|WHERE|FIELDS|LIMIT|AFTER|CONFIRM|DATA|AND|Product|Slider|Discount|Category|Warehouse|WarehouseInventory|StockMovement|WarehouseTask|Worker|Vacancy|Comment|true|false|null)$/.test(part); const string = /^".*"$/.test(part), comment = /^(\/\/|#)/.test(part), number = /^-?\d+(?:\.\d+)?$/.test(part); return <span key={ index } className={ keyword ? "text-sky-300" : string ? "text-emerald-300" : comment ? "text-slate-600 italic" : number ? "text-amber-300" : "" }>{ part }</span>; }) }</pre>
                                                        <textarea ref={ inputRef } value={ consoleValue } onChange={ event => setConsoleValue(event.target.value) } onKeyDown={ handleKeyDownInput } spellCheck={ false } autoCapitalize="off" autoCorrect="off" aria-label="ORM script editor" placeholder={ MCL_EXAMPLES } className="absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent p-4 font-mono text-[13px] leading-6 text-transparent caret-sky-300 outline-none placeholder:text-slate-600 selection:bg-sky-500/30" />
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2"><span className="text-[10px] text-slate-500">JWT · market scope · permissions backendda tekshiriladi</span><button disabled={ consoleBusy || !consoleValue.trim() } onClick={ () => { void runConsoleScript(consoleValue); } } className="rounded-xl bg-sky-500 px-4 py-2 font-mono text-xs font-bold text-white shadow-lg shadow-sky-950/30 transition hover:bg-sky-400 active:scale-95 disabled:opacity-50">{ consoleBusy ? 'Running…' : '▶ Run MCL' }</button></div>
                                                </div>
                                                <div className="flex min-h-[260px] flex-col gap-3">
                                                    <section className={ cn("rounded-2xl border p-3", dark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]") }>
                                                        <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">MCL / 1</h3><span className="text-[10px] opacity-50">server-side parser</span></div>
                                                        <div className="space-y-2 font-mono text-[10px] leading-relaxed opacity-80">
                                                            <p>READ Product FIELDS [id,title,price] LIMIT 20;</p>
                                                            <p>READ Product WHERE title CONTAINS "mouse" LIMIT 10;</p>
                                                            <p>COUNT Product WHERE quantity LTE 5;</p>
                                                            <p>CREATE Product DATA {`{ JSON }`};</p>
                                                            <p>UPDATE Product WHERE id = "UUID" DATA {`{ JSON }`};</p>
                                                            <p>DELETE Product WHERE id = "UUID" CONFIRM "UUID";</p>
                                                        </div>
                                                        <p className="mt-3 text-[10px] leading-relaxed opacity-55">JSONB va Product.options ichidagi nested items qo‘llanadi. LIMIT maksimal 50; barcha buyruqlar market scope va permission bilan tekshiriladi.</p>
                                                    </section>
                                                    <section className={ cn("min-h-0 flex-1 overflow-hidden rounded-2xl border p-3", dark ? "border-white/10 bg-black/20" : "border-black/10 bg-white/60") }>
                                                        <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Output</h3><button onClick={ () => setConsoleOutput([]) } className="text-[10px] opacity-50 hover:opacity-100">Clear</button></div>
                                                        <div className="max-h-56 space-y-2 overflow-auto font-mono text-[10px] leading-relaxed">{ consoleOutput.length ? consoleOutput.map((line, index) => <pre key={ `${index}-${line}` } className={ cn("whitespace-pre-wrap break-words", line.startsWith("✕") ? "text-rose-400" : line.startsWith("✓") ? "text-sky-300" : "text-emerald-300") }>{ line }</pre>) : <p className="opacity-40">Natijalar shu yerda ko'rinadi…</p> }</div>
                                                    </section>
                                                </div>
                                            </div>
                                        ) : <textarea ref={ inputRef } value={ consoleValue } onChange={ event => setConsoleValue(event.target.value) } onKeyDown={ handleKeyDownInput } rows={ 1 } spellCheck={ false } aria-label="Terminal command" placeholder=">_" className={ cn("w-full resize-none bg-transparent px-3 py-2 font-mono text-xs outline-none placeholder:text-slate-500", dark ? "text-white" : "text-slate-900") } /> }
                                    </motion.div>
                                </motion.div>

                                <Link
                                    href={ `/${locale}/${market.replaceAll(' ', '_')}/messages` }
                                    className={ `hidden sm:flex relative items-center justify-center w-10 h-10 rounded-2xl backdrop-blur-xl border transition-all active:scale-90 ${dark
                                        ? "bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10"
                                        : "bg-white/60 border-black/10 text-neutral-700 hover:text-neutral-900 hover:bg-white/90"
                                        }` }
                                    title="Xabarlar"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                                </Link>

                                {/* Notifications (Mobile & Desktop) */ }
                                <button
                                    onClick={ () => notify.show("Yangi bildirishnomalar mavjud emas", "success", dark ? 'dark' : 'light') }
                                    className={ `relative flex items-center justify-center w-10 h-10 rounded-2xl backdrop-blur-xl border transition-all active:scale-90 ${dark
                                        ? "bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10"
                                        : "bg-white/60 border-black/10 text-neutral-700 hover:text-neutral-900 hover:bg-white/90"
                                        }` }
                                    title="Bildirishnomalar"
                                >
                                    <Bell className="w-4 h-4" />
                                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                </button>

                                {/* Settings Button (Desktop / Tablet) */ }
                                <Link
                                    href={ `/${locale}/settings` }
                                    className={ `hidden sm:flex items-center justify-center w-10 h-10 rounded-2xl backdrop-blur-xl border transition-all active:scale-90 ${dark
                                        ? "bg-white/5 border-white/10 text-neutral-300 hover:text-white hover:bg-white/10"
                                        : "bg-white/60 border-black/10 text-neutral-700 hover:text-neutral-900 hover:bg-white/90"
                                        }` }
                                    title="Sozlamalar"
                                >
                                    <Settings className="w-4 h-4" />
                                </Link>
                            </div>
                        </header>

                        {/* Page Content (Scrolls smoothly under the sticky header) */ }
                        <main className="p-3.5 sm:p-5 lg:p-6 min-h-[calc(100%-60px)]">
                            { children }
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}