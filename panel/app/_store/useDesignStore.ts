'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DesignTheme = 'dark' | 'light';
export type GlassLevel = 'soft' | 'balanced' | 'strong';
export type HeaderStyle = 'glass' | 'solid' | 'transparent';
export type IconTone = 'accent' | 'neutral';

export interface DesignState {
    theme: DesignTheme;
    accentColor: string;
    color: string;
    glassLevel: GlassLevel;
    headerStyle: HeaderStyle;
    iconTone: IconTone;
    setTheme: (theme: DesignTheme) => void;
    setAccentColor: (color: string) => void;
    setColor: (color: string) => void;
    setGlassLevel: (level: GlassLevel) => void;
    setHeaderStyle: (style: HeaderStyle) => void;
    setIconTone: (tone: IconTone) => void;
    resetDesign: () => void;
}

export const DEFAULT_DESIGN = {
    theme: 'dark',
    accentColor: '#0EA5E9',
    glassLevel: 'balanced',
    headerStyle: 'glass',
    iconTone: 'accent',
} as const;

const isAccentColor = (value: unknown): value is string =>
    typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
const isGlassLevel = (value: unknown): value is GlassLevel =>
    value === 'soft' || value === 'balanced' || value === 'strong';
const isHeaderStyle = (value: unknown): value is HeaderStyle =>
    value === 'glass' || value === 'solid' || value === 'transparent';
const isIconTone = (value: unknown): value is IconTone =>
    value === 'accent' || value === 'neutral';

export const useDesignStore = create<DesignState>()(
    persist(
        (set) => ({
            ...DEFAULT_DESIGN,
            color: DEFAULT_DESIGN.accentColor,
            setTheme: (theme) => set({ theme }),
            setAccentColor: (accentColor) => set({ accentColor, color: accentColor }),
            setColor: (accentColor) => set({ accentColor, color: accentColor }),
            setGlassLevel: (glassLevel) => set({ glassLevel }),
            setHeaderStyle: (headerStyle) => set({ headerStyle }),
            setIconTone: (iconTone) => set({ iconTone }),
            resetDesign: () => set({ ...DEFAULT_DESIGN, color: DEFAULT_DESIGN.accentColor }),
        }),
        {
            name: 'theme-storage',
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<DesignState> | undefined;
                const accentColor = isAccentColor(persisted?.accentColor)
                    ? persisted.accentColor
                    : isAccentColor(persisted?.color)
                        ? persisted.color
                        : currentState.accentColor;

                return {
                    ...currentState,
                    theme: persisted?.theme === 'light' ? 'light' : 'dark',
                    accentColor,
                    color: accentColor,
                    glassLevel: isGlassLevel(persisted?.glassLevel)
                        ? persisted.glassLevel
                        : currentState.glassLevel,
                    headerStyle: isHeaderStyle(persisted?.headerStyle)
                        ? persisted.headerStyle
                        : currentState.headerStyle,
                    iconTone: isIconTone(persisted?.iconTone)
                        ? persisted.iconTone
                        : currentState.iconTone,
                };
            },
        },
    ),
);
