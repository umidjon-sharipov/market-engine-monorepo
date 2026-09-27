import {
    LayoutDashboard,
    Users,
    MessageSquareWarning,
    Heart,
    MessageCircle,
    Package,
    Boxes,
    ShoppingCart,
    User,
    Settings,
    List,
    Plus,
    Pencil,
    Trash2,
    Eye,
    SlidersHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CrudAction = 'list' | 'create' | 'edit' | 'delete' | 'view' | 'adjust';

export interface NavCrudItem {
    key: CrudAction;
    href: string;
    icon: LucideIcon;
}

export interface NavChild {
    key: string;
    href: string;
    icon: LucideIcon;
    crud?: NavCrudItem[];
}

export interface NavItem {
    key: string;
    href: string;
    icon: LucideIcon;
    children?: NavChild[];
    crud?: NavCrudItem[];
}

export function buildNavTree(locale: string): NavItem[] {
    const base = `/site/${locale}`;

    return [
        {
            key: 'dashboard',
            href: base,
            icon: LayoutDashboard,
        },
        {
            key: 'users',
            href: `${base}/users`,
            icon: Users,
            crud: [
                { key: 'list', href: `${base}/users`, icon: List },
                { key: 'create', href: `${base}/users/create`, icon: Plus },
                { key: 'edit', href: `${base}/users/edit/1`, icon: Pencil },
                { key: 'delete', href: `${base}/users/delete`, icon: Trash2 },
            ],
        },
        {
            key: 'complaints',
            href: `${base}/complaints`,
            icon: MessageSquareWarning,
            crud: [
                { key: 'list', href: `${base}/complaints`, icon: List },
                { key: 'view', href: `${base}/complaints/1`, icon: Eye },
            ],
        },
        {
            key: 'reactions',
            href: `${base}/reactions`,
            icon: Heart,
            children: [
                {
                    key: 'reactions',
                    href: `${base}/reactions`,
                    icon: Heart,
                    crud: [{ key: 'list', href: `${base}/reactions`, icon: List }],
                },
                {
                    key: 'comments',
                    href: `${base}/reactions/comments`,
                    icon: MessageCircle,
                    crud: [
                        { key: 'list', href: `${base}/reactions/comments`, icon: List },
                        { key: 'delete', href: `${base}/reactions/comments/delete`, icon: Trash2 },
                    ],
                },
            ],
        },
        {
            key: 'warehouse',
            href: `${base}/warehouse/products`,
            icon: Package,
            children: [
                {
                    key: 'products',
                    href: `${base}/warehouse/products`,
                    icon: Package,
                    crud: [
                        { key: 'list', href: `${base}/warehouse/products`, icon: List },
                        { key: 'create', href: `${base}/warehouse/products/create`, icon: Plus },
                        { key: 'edit', href: `${base}/warehouse/products/edit`, icon: Pencil },
                        { key: 'delete', href: `${base}/warehouse/products/delete`, icon: Trash2 },
                    ],
                },
                {
                    key: 'stock',
                    href: `${base}/warehouse/stock`,
                    icon: Boxes,
                    crud: [
                        { key: 'list', href: `${base}/warehouse/stock`, icon: List },
                        { key: 'adjust', href: `${base}/warehouse/stock/adjust`, icon: SlidersHorizontal },
                    ],
                },
            ],
        },
        {
            key: 'orders',
            href: `${base}/orders`,
            icon: ShoppingCart,
            crud: [
                { key: 'list', href: `${base}/orders`, icon: List },
                { key: 'view', href: `${base}/orders/1`, icon: Eye },
            ],
        },
    ];
}

export const bottomNavItems = (locale: string) => [
    { key: 'profile', href: `/site/${locale}/profile`, icon: User },
    { key: 'settings', href: `/site/${locale}/settings`, icon: Settings },
];
