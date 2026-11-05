import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { getAppStorage } from 'app/storage';

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
    theme: 'light',
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

function createDesignStorage(): StateStorage {
    return {
        getItem: async (name) => {
            const storage = getAppStorage();
            const [current, legacyColor] = await Promise.all([
                storage.getItem(name),
                storage.getItem('color-storage'),
            ]);

            if (!current && !legacyColor) return null;

            const persisted = current
                ? JSON.parse(current) as { state?: Record<string, unknown>; version?: number }
                : { state: {}, version: 0 };
            const state = persisted.state ?? {};

            if (!isAccentColor(state.accentColor) && legacyColor) {
                const legacy = JSON.parse(legacyColor) as { state?: { color?: unknown } };
                if (isAccentColor(legacy.state?.color)) {
                    state.accentColor = legacy.state.color;
                    state.color = legacy.state.color;
                }
            }

            return JSON.stringify({ ...persisted, state });
        },
        setItem: (name, value) => getAppStorage().setItem(name, value),
        removeItem: (name) => getAppStorage().removeItem(name),
    };
}

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
            storage: createJSONStorage(createDesignStorage),
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
