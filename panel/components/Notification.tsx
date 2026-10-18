"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

type Status = "success" | "error";
type Theme = "dark" | "light";

interface NotificationItem {
    id: string;
    message: string;
    status: Status;
    theme: Theme;
}

interface NotificationContextType {
    show: (message: string, status: Status, theme?: Theme) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isHovered, setIsHovered] = useState(false);
    const unhoverTimerRef = useRef<NodeJS.Timeout | null>(null);

    const show = (message: string, status: Status, theme: Theme = "dark") => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, message, status, theme }]);
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    useEffect(() => {
        if (!isHovered && notifications.length > 0) {
            unhoverTimerRef.current = setTimeout(() => {
                setNotifications([]);
            }, 2000);
        } else {
            if (unhoverTimerRef.current) {
                clearTimeout(unhoverTimerRef.current);
                unhoverTimerRef.current = null;
            }
        }
        return () => {
            if (unhoverTimerRef.current) clearTimeout(unhoverTimerRef.current);
        };
    }, [isHovered, notifications.length]);

    const statusConfig = {
        success: {
            border: "border-emerald-500/30",
            glow: "shadow-[0_10px_30px_rgba(16,185,129,0.15)]",
            iconBg: "bg-emerald-500/20 text-emerald-400",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            ),
        },
        error: {
            border: "border-rose-500/30",
            glow: "shadow-[0_10px_30px_rgba(244,63,94,0.15)]",
            iconBg: "bg-rose-500/20 text-rose-400",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ),
        },
    };

    const themeConfig = {
        dark: "bg-zinc-900/90 text-zinc-100 border-white/10",
        light: "bg-white/90 text-zinc-900 border-black/10",
    };

    return (
        <NotificationContext.Provider value={{ show }}>
            {children}

            <div 
                className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center pointer-events-none w-full max-w-md px-4"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative w-full flex flex-col items-center min-h-[80px]">
                    <AnimatePresence mode="popLayout">
                        {notifications.map((item, index) => {
                            const currentStatus = statusConfig[item.status];
                            const currentTheme = themeConfig[item.theme];
                            
                            // Qavat-qavat ko'rinishi uchun hisob-kitoblar
                            const reverseIndex = notifications.length - 1 - index;
                            
                            // Hover qilinganda oraliq ochiladi, bo'lmasa qavatlanib turadi
                            const yOffset = isHovered ? reverseIndex * 76 : reverseIndex * 10;
                            const scale = isHovered ? 1 : Math.max(0.8, 1 - reverseIndex * 0.06);
                            const opacity = isHovered ? 1 : reverseIndex > 3 ? 0 : 1 - reverseIndex * 0.25;

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.7}
                                    onDragEnd={(e, info: PanInfo) => {
                                        // Agar yonga surib yuborilsa (100px dan ko'p), o'chirib yuborish
                                        if (Math.abs(info.offset.x) > 100) {
                                            removeNotification(item.id);
                                        }
                                    }}
                                    initial={{ opacity: 0, y: -40, scale: 0.8 }}
                                    animate={{ 
                                        opacity: opacity, 
                                        y: yOffset, 
                                        scale: scale,
                                        zIndex: notifications.length - reverseIndex
                                    }}
                                    exit={{ opacity: 0, x: 200, scale: 0.8, transition: { duration: 0.2 } }}
                                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                    style={{
                                        position: reverseIndex === 0 ? "relative" : "absolute",
                                        top: 0,
                                    }}
                                    className="pointer-events-auto w-full cursor-grab active:cursor-grabbing touch-none"
                                >
                                    <div
                                        className={`relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl border backdrop-blur-2xl ${currentTheme} ${currentStatus.border} ${currentStatus.glow} w-full shadow-xl`}
                                    >
                                        <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${currentStatus.iconBg}`}>
                                            {currentStatus.icon}
                                        </div>

                                        <div className="flex-1 text-sm font-medium tracking-tight whitespace-pre-line select-none">
                                            {item.message}
                                        </div>

                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeNotification(item.id);
                                            }}
                                            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                                        >
                                            ✕
                                        </button>

                                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-t-2xl" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
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