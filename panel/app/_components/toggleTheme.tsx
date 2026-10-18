import { useThemeStore } from "@/app/_store/useThemeStore";

export default function toggleTheme() {
    const currentTheme = useThemeStore.getState().theme;
    const setTheme = useThemeStore.getState().setTheme;

    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}