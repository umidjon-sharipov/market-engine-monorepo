"use client";

import { useThemeStore } from "@/app/_store/useThemeStore";
import Image from "next/image";
export default function ThemeBtn() {
    const mode = useThemeStore(state => state.theme)
    const setMode = useThemeStore(state => state.setTheme)
    let dark = mode === 'dark' ? true : false

    return (

        <button
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className={`flex items-center justify-center backdrop-blur-3xl shadow-2xl shadow-black/20 rounded-3xl  ${dark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'} border text-sm font-medium tracking-wide transition-all duration-300 group`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-sky-500">
                {mode === 'dark' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                )}
            </svg>
        </button>
    );
}