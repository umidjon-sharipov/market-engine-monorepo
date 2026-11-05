"use client";

import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    Animated, 
    PanResponder, 
    TouchableOpacity,
    Dimensions 
} from "react-native";

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
const { width } = Dimensions.get("window");

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isHovered, setIsHovered] = useState(false);

    const show = (message: string, status: Status, theme: Theme = "dark") => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, message, status, theme }]);
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ show }}>
            {children}

            <View 
                style={styles.container} 
                pointerEvents="box-none"
                // @ts-ignore
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <View style={styles.stackWrapper} pointerEvents="box-none">
                    {notifications.map((item, index) => (
                        <NotificationCard 
                            key={item.id} 
                            item={item} 
                            index={index} 
                            totalCount={notifications.length}
                            isHovered={isHovered}
                            onRemove={removeNotification} 
                        />
                    ))}
                </View>
            </View>
        </NotificationContext.Provider>
    );
}

function NotificationCard({ item, index, totalCount, isHovered, onRemove }: { 
    item: NotificationItem; 
    index: number; 
    totalCount: number; 
    isHovered: boolean;
    onRemove: (id: string) => void; 
}) {
    const panX = useRef(new Animated.Value(0)).current;
    const panY = useRef(new Animated.Value(0)).current;
    const animProgress = useRef(new Animated.Value(0)).current; 
    const hoverAnim = useRef(new Animated.Value(0)).current;
    const exitAnim = useRef(new Animated.Value(0)).current; 
    
    const isExiting = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Paydo bo'lish animatsiyasi
    useEffect(() => {
        Animated.spring(animProgress, {
            toValue: 1,
            friction: 8,
            tension: 45,
            useNativeDriver: true,
        }).start();
    }, []);

    // 2. Hover qilingandagi yoyilish
    useEffect(() => {
        Animated.spring(hoverAnim, {
            toValue: isHovered ? 1 : 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, [isHovered]);

    // 3. Har bir notification uchun alohida avtomatik o'chish taymeri (Hover bo'lsa to'xtaydi)
    useEffect(() => {
        if (!isHovered) {
            timerRef.current = setTimeout(() => {
                startExitAnimation();
            }, 3500); // 3.5 sekunddan keyin o'z-özidan silliq yo'qoladi
        } else {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isHovered]);

    // 4. Mukammal silliq yo'qolish animatsiyasi (Hech qachon taq etib o'chmaydi)
    const startExitAnimation = () => {
        if (isExiting.current) return;
        isExiting.current = true;

        if (timerRef.current) clearTimeout(timerRef.current);

        Animated.parallel([
            Animated.timing(panX, {
                toValue: width * 0.4, // O'ngga qarab suriladi
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(panY, {
                toValue: -30, // Teparoqqa ko'tariladi
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(exitAnim, {
                toValue: 1, // Kichrayib va shaffoflashib o'chadi
                duration: 400,
                useNativeDriver: true,
            })
        ]).start(() => {
            onRemove(item.id);
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event(
                [null, { dx: panX }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gestureState) => {
                if (Math.abs(gestureState.dx) > 80) {
                    startExitAnimation();
                } else {
                    Animated.spring(panX, {
                        toValue: 0,
                        friction: 6,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const reverseIndex = totalCount - 1 - index;

    const translateY = Animated.add(
        hoverAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [reverseIndex * 6, reverseIndex * 74]
        }),
        panY
    );

    const scale = Animated.multiply(
        animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
        }),
        exitAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.5] // Yo'qolayotganda sekin kichrayadi
        })
    );

    const opacity = Animated.multiply(
        animProgress,
        exitAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [reverseIndex > 3 ? 0 : 1, 0] // 0 ga qarab asta-sekin shaffoflashadi
        })
    );

    const isSuccess = item.status === "success";
    const isDark = item.theme === "dark";

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.cardWrapper,
                {
                    opacity: opacity,
                    transform: [
                        { translateX: panX },
                        { translateY: translateY },
                        { scale: scale },
                    ],
                    zIndex: totalCount - reverseIndex,
                    position: reverseIndex === 0 ? "relative" : "absolute",
                },
            ]}
        >
            <View style={[
                styles.card,
                isDark ? styles.darkTheme : styles.lightTheme,
                isSuccess ? styles.successBorder : styles.errorBorder
            ]}>
                <View style={[
                    styles.iconContainer,
                    isSuccess ? styles.successIconBg : styles.errorIconBg
                ]}>
                    <Text style={[styles.iconText, isSuccess ? styles.successText : styles.errorText]}>
                        {isSuccess ? "✓" : "✕"}
                    </Text>
                </View>

                <Text style={[styles.message, isDark ? styles.darkText : styles.lightText]} numberOfLines={2}>
                    {item.message}
                </Text>

                <TouchableOpacity onPress={startExitAnimation} style={styles.closeButton}>
                    <Text style={[styles.closeText, isDark ? styles.darkText : styles.lightText]}>✕</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 15,
        left: 20,
        right: 20,
        alignItems: "center",
        zIndex: 9999999,
    },
    stackWrapper: {
        width: "100%",
        maxWidth: 400,
        alignItems: "center",
    },
    cardWrapper: {
        width: "100%",
        top: 0,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
    },
    darkTheme: {
        backgroundColor: "rgba(24, 24, 27, 0.9)",
    },
    lightTheme: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
    },
    successBorder: {
        borderColor: "rgba(16, 185, 129, 0.35)",
    },
    errorBorder: {
        borderColor: "rgba(244, 63, 94, 0.35)",
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    successIconBg: {
        backgroundColor: "rgba(16, 185, 129, 0.2)",
    },
    errorIconBg: {
        backgroundColor: "rgba(244, 63, 94, 0.2)",
    },
    iconText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    successText: {
        color: "#34d399",
    },
    errorText: {
        color: "#fb7185",
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
    },
    darkText: {
        color: "#f4f4f5",
    },
    lightText: {
        color: "#18181b",
    },
    closeButton: {
        padding: 6,
        marginLeft: 8,
    },
    closeText: {
        fontSize: 14,
        opacity: 0.6,
    },
});