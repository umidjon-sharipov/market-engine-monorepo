"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "success" | "error";
type Theme = "dark" | "light";

interface NotificationContextType {
    show: (message: string, status: Status, theme?: Theme) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<Status>("success");
    const [theme, setTheme] = useState<Theme>("dark");

    const show = (msg: string, stat: Status, thm: Theme = "dark") => {
        setMessage(msg);
        setStatus(stat);
        setTheme(thm);
        setIsOpen(true);
    };

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsOpen(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const statusConfig = {
        success: {
            border: "border-emerald-500/30",
            glow: "shadow-[0_0_30px_rgba(16,185,129,0.2),inset_0_1px_0_0_rgba(16,185,129,0.4)]",
            iconBg: "bg-emerald-500/50 text-emerald-400",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            ),
        },
        error: {
            border: "border-rose-500/30",
            glow: "shadow-[0_0_30px_rgba(244,63,94,0.2),inset_0_1px_0_0_rgba(244,63,94,0.4)]",
            iconBg: "bg-rose-500/50 text-rose-400",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ),
        },
    };

    const themeConfig = {
        dark: "bg-transparent text-zinc-100 border-white/10",
        light: "bg-transparent text-zinc-900 border-black/10",
    };

    const currentStatus = statusConfig[status];
    const currentTheme = themeConfig[theme];

    return (
        <NotificationContext.Provider value={{ show }}>
            {children}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ duration: 0.35, type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed top-5 left-1/2 -translate-x-1/2 z-[999999999999999999999] flex justify-center pointer-events-none"
                    >
                        <div
                            className={`pointer-events-auto relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl border backdrop-blur-md ${currentTheme} ${currentStatus.border} ${currentStatus.glow} w-auto max-w-md`}
                            style={{
                                backdropFilter: "blur(24px)",
                                WebkitBackdropFilter: "blur(24px)",
                            }}
                        >
                            <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${currentStatus.iconBg}`}>
                                {currentStatus.icon}
                            </div>

                            <div className="flex-1 text-sm font-medium tracking-tight">
                                {message}
                            </div>

                            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}