import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'app/components/UI/UniversalBlurView';
import { useEffect, useRef } from 'react';
import {
    useDesignStore,
    type GlassLevel,
    type HeaderStyle,
    type IconTone,
} from 'app/store/useDesignStore';

const accentColors = ['#7000FF', '#0EA5E9', '#6366F1', '#EC4899', '#F97316', '#10B981'];
const glassLevels: GlassLevel[] = ['soft', 'balanced', 'strong'];
const headerStyles: HeaderStyle[] = ['glass', 'solid', 'transparent'];
const iconTones: IconTone[] = ['accent', 'neutral'];

const copy = {
    uz: {
        title: 'Dizayn sozlamalari',
        subtitle: 'Ko‘rinishni o‘zingizga moslang. Sozlamalar qurilmangizda saqlanadi.',
        theme: 'Mavzu',
        light: 'Yorug‘',
        dark: 'Qorong‘i',
        accent: 'Asosiy rang',
        glass: 'Glass blur',
        soft: 'Yengil',
        balanced: 'Muvozanatli',
        strong: 'Kuchli',
        header: 'Header ko‘rinishi',
        glassHeader: 'Glass',
        solidHeader: 'Yopiq',
        transparentHeader: 'Shaffof',
        icons: 'Ikon ranglari',
        accentIcons: 'Asosiy rang',
        neutralIcons: 'Neytral',
        reset: 'Standartga qaytarish',
        close: 'Yopish',
    },
    en: {
        title: 'Design settings',
        subtitle: 'Personalize the appearance. Preferences are saved on this device.',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        accent: 'Accent color',
        glass: 'Glass blur',
        soft: 'Soft',
        balanced: 'Balanced',
        strong: 'Strong',
        header: 'Header style',
        glassHeader: 'Glass',
        solidHeader: 'Solid',
        transparentHeader: 'Transparent',
        icons: 'Icon color',
        accentIcons: 'Accent',
        neutralIcons: 'Neutral',
        reset: 'Reset to default',
        close: 'Close',
    },
    ru: {
        title: 'Настройки дизайна',
        subtitle: 'Настройте внешний вид. Параметры сохраняются на устройстве.',
        theme: 'Тема',
        light: 'Светлая',
        dark: 'Тёмная',
        accent: 'Акцентный цвет',
        glass: 'Размытие стекла',
        soft: 'Лёгкое',
        balanced: 'Среднее',
        strong: 'Сильное',
        header: 'Стиль заголовка',
        glassHeader: 'Стекло',
        solidHeader: 'Сплошной',
        transparentHeader: 'Прозрачный',
        icons: 'Цвет значков',
        accentIcons: 'Акцентный',
        neutralIcons: 'Нейтральный',
        reset: 'Сбросить настройки',
        close: 'Закрыть',
    },
} as const;

interface DesignSettingsModalProps {
    visible: boolean;
    language: 'uz' | 'ru' | 'en';
    onClose: () => void;
}

export default function DesignSettingsModal({ visible, language, onClose }: DesignSettingsModalProps) {
    const text = copy[language] ?? copy.uz;
    const theme = useDesignStore((state) => state.theme);
    const accentColor = useDesignStore((state) => state.accentColor);
    const glassLevel = useDesignStore((state) => state.glassLevel);
    const headerStyle = useDesignStore((state) => state.headerStyle);
    const iconTone = useDesignStore((state) => state.iconTone);
    const setTheme = useDesignStore((state) => state.setTheme);
    const setAccentColor = useDesignStore((state) => state.setAccentColor);
    const setGlassLevel = useDesignStore((state) => state.setGlassLevel);
    const setHeaderStyle = useDesignStore((state) => state.setHeaderStyle);
    const setIconTone = useDesignStore((state) => state.setIconTone);
    const resetDesign = useDesignStore((state) => state.resetDesign);
    const dark = theme === 'dark';
    const entrance = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!visible) {
            entrance.setValue(0);
            return;
        }

        Animated.parallel([
            Animated.timing(entrance, {
                toValue: 1,
                duration: 260,
                useNativeDriver: true,
            }),
            Animated.spring(entrance, {
                toValue: 1,
                stiffness: 190,
                damping: 20,
                mass: 0.8,
                useNativeDriver: true,
            }),
        ]).start();
    }, [entrance, visible]);

    const choiceStyle = (selected: boolean) => [
        styles.choice,
        {
            backgroundColor: selected ? `${accentColor}22` : dark ? 'rgba(255,255,255,0.06)' : '#fff',
            borderColor: selected ? accentColor : dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
        },
    ];
    const choiceTextStyle = (selected: boolean) => [
        styles.choiceText,
        { color: selected ? accentColor : dark ? '#e2e8f0' : '#334155' },
    ];

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <BlurView
                    intensity={dark ? 48 : 34}
                    tint={dark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={text.close} />
                <Animated.View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: dark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255,255,255,0.94)',
                            borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)',
                            opacity: entrance,
                            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }, { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
                        },
                    ]}
                >
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.heading}>
                            <View style={styles.headingCopy}>
                                <View style={styles.titleRow}>
                                    <View style={[styles.titleIcon, { backgroundColor: `${accentColor}24` }]}>
                                        <Text style={{ color: accentColor, fontSize: 19, fontWeight: '800' }}>✦</Text>
                                    </View>
                                    <Text style={[styles.title, { color: dark ? '#f8fafc' : '#0f172a' }]}>{text.title}</Text>
                                </View>
                                <Text style={[styles.subtitle, { color: dark ? '#94a3b8' : '#64748b' }]}>{text.subtitle}</Text>
                            </View>
                            <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button">
                                <Text style={[styles.closeText, { color: dark ? '#cbd5e1' : '#475569' }]}>×</Text>
                            </Pressable>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.label, { color: dark ? '#e2e8f0' : '#334155' }]}>{text.theme}</Text>
                            <View style={styles.choices}>
                                {(['light', 'dark'] as const).map((value) => (
                                    <Pressable key={value} onPress={() => setTheme(value)} style={choiceStyle(theme === value)}>
                                        <Text style={choiceTextStyle(theme === value)}>{text[value]}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.label, { color: dark ? '#e2e8f0' : '#334155' }]}>{text.accent}</Text>
                            <View style={styles.colors}>
                                {accentColors.map((color) => (
                                    <Pressable
                                        key={color}
                                        onPress={() => setAccentColor(color)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${text.accent} ${color}`}
                                        accessibilityState={{ selected: accentColor === color }}
                                        style={[
                                            styles.colorButton,
                                            { backgroundColor: color, borderColor: accentColor === color ? (dark ? '#fff' : '#0f172a') : 'transparent' },
                                        ]}
                                    >
                                        {accentColor === color && <Text style={styles.colorCheck}>✓</Text>}
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.label, { color: dark ? '#e2e8f0' : '#334155' }]}>{text.glass}</Text>
                            <View style={styles.choices}>
                                {glassLevels.map((value) => (
                                    <Pressable key={value} onPress={() => setGlassLevel(value)} style={choiceStyle(glassLevel === value)}>
                                        <Text style={choiceTextStyle(glassLevel === value)}>{text[value]}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.label, { color: dark ? '#e2e8f0' : '#334155' }]}>{text.header}</Text>
                            <View style={styles.choices}>
                                {headerStyles.map((value) => (
                                    <Pressable key={value} onPress={() => setHeaderStyle(value)} style={choiceStyle(headerStyle === value)}>
                                        <Text style={choiceTextStyle(headerStyle === value)}>{text[`${value}Header`]}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.label, { color: dark ? '#e2e8f0' : '#334155' }]}>{text.icons}</Text>
                            <View style={styles.choices}>
                                {iconTones.map((value) => (
                                    <Pressable key={value} onPress={() => setIconTone(value)} style={choiceStyle(iconTone === value)}>
                                        <Text style={choiceTextStyle(iconTone === value)}>{text[`${value}Icons`]}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <Pressable onPress={resetDesign} style={[styles.resetButton, { borderColor: dark ? '#334155' : '#e2e8f0' }]}>
                                <Text style={{ color: dark ? '#cbd5e1' : '#475569', fontWeight: '600' }}>{text.reset}</Text>
                            </Pressable>
                            <Pressable onPress={onClose} style={[styles.doneButton, { backgroundColor: accentColor }]}>
                                <Text style={styles.doneText}>{text.close}</Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    sheet: {
        width: '100%',
        maxWidth: 520,
        maxHeight: '90%',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#020617',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.28,
        shadowRadius: 42,
        elevation: 22,
    },
    heading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
    headingCopy: { flex: 1, gap: 5 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    titleIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800' },
    subtitle: { fontSize: 13, lineHeight: 19 },
    closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
    closeText: { fontSize: 28, lineHeight: 30, fontWeight: '300' },
    section: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    choice: { minHeight: 38, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
    choiceText: { fontSize: 12, fontWeight: '700' },
    colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    colorButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
    colorCheck: { color: '#fff', fontSize: 14, fontWeight: '900' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
    resetButton: { minHeight: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
    doneButton: { minHeight: 42, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
    doneText: { color: '#fff', fontWeight: '700' },
});
