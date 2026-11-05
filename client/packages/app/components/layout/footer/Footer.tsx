'use client';

import React, { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { TextLink } from 'solito/link';
import AnimatedPressable from 'app/components/UI/AnimatedPressable';
import { useDesignStore } from 'app/store/useDesignStore';
import { useLanStorage } from 'app/store/useLanStore';

type Language = 'uz' | 'en' | 'ru';
interface FooterLink { label: Record<Language, string>; href: string }
interface FooterSection { id: string; title: Record<Language, string>; links: FooterLink[] }

const sections: FooterSection[] = [
    {
        id: 'explore',
        title: { uz: 'Kashf qiling', en: 'Explore', ru: 'Откройте' },
        links: [
            { label: { uz: 'Bosh sahifa', en: 'Home', ru: 'Главная' }, href: '/' },
            { label: { uz: 'Katalog', en: 'Catalog', ru: 'Каталог' }, href: '/katalog' },
            { label: { uz: 'Marketlarni kuzatish', en: 'Discover markets', ru: 'Найти магазины' }, href: '/follow' },
            { label: { uz: 'Yoqtirganlar', en: 'Favorites', ru: 'Избранное' }, href: '/yoqtirilgan' },
        ],
    },
    {
        id: 'help',
        title: { uz: 'Yordam', en: 'Help', ru: 'Помощь' },
        links: [
            { label: { uz: 'Savol-javob', en: 'Help center', ru: 'Центр помощи' }, href: '/savolJavob' },
            { label: { uz: 'Topshirish punktlari', en: 'Pickup points', ru: 'Пункты выдачи' }, href: '/about/punkt' },
            { label: { uz: 'Vakansiyalar', en: 'Careers', ru: 'Вакансии' }, href: '/about/careres' },
        ],
    },
    {
        id: 'account',
        title: { uz: 'Akkaunt', en: 'Account', ru: 'Аккаунт' },
        links: [
            { label: { uz: 'Profil', en: 'Profile', ru: 'Профиль' }, href: '/profile' },
            { label: { uz: 'Savat', en: 'Cart', ru: 'Корзина' }, href: '/savat' },
            { label: { uz: 'Kirish', en: 'Sign in', ru: 'Войти' }, href: '/auth' },
        ],
    },
];

const footerCopy = {
    uz: {
        brand: 'Market Engine', description: 'Marketlar, mahsulotlar va buyurtmalar uchun yagona qulay platforma.',
        copyright: 'Barcha huquqlar himoyalangan.', heading: 'Foydali havolalar',
    },
    en: {
        brand: 'Market Engine', description: 'One place to discover markets, products and manage your shopping.',
        copyright: 'All rights reserved.', heading: 'Useful links',
    },
    ru: {
        brand: 'Market Engine', description: 'Единая платформа для магазинов, товаров и заказов.',
        copyright: 'Все права защищены.', heading: 'Полезные ссылки',
    },
} as const;

export default function OnlineMarketFooter() {
    const lan = useLanStorage(state => state.lan);
    const language: Language = lan === 'en' || lan === 'ru' ? lan : 'uz';
    const t = footerCopy[language];
    const theme = useDesignStore(state => state.theme);
    const accent = useDesignStore(state => state.accentColor);
    const dark = theme === 'dark';
    const { width } = useWindowDimensions();
    const isDesktop = width >= 820;
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
        <View style={[
            styles.shell,
            {
                backgroundColor: dark ? 'rgba(9,15,28,0.68)' : 'rgba(255,255,255,0.66)',
                borderColor: dark ? `${accent}30` : `${accent}25`,
            },
        ]}>
            <View style={styles.top}>
                <View style={styles.brandBlock}>
                    <View style={[styles.brandMark, { backgroundColor: `${accent}20`, borderColor: `${accent}50` }]}>
                        <Text style={[styles.brandMarkText, { color: accent }]}>M</Text>
                    </View>
                    <View style={styles.brandTextBlock}>
                        <Text style={[styles.brand, { color: dark ? '#f8fafc' : '#0f172a' }]}>{t.brand}</Text>
                        <Text style={[styles.description, { color: dark ? '#94a3b8' : '#64748b' }]}>{t.description}</Text>
                    </View>
                </View>
                <Text style={[styles.linksHeading, { color: dark ? '#64748b' : '#94a3b8' }]}>{t.heading}</Text>
            </View>

            <View style={[styles.sections, isDesktop ? styles.sectionsDesktop : styles.sectionsMobile]}>
                {sections.map(section => {
                    const isOpen = isDesktop || expanded === section.id;
                    return (
                        <View key={section.id} style={[styles.section, isDesktop && styles.sectionDesktop]}>
                            <AnimatedPressable
                                disabled={isDesktop}
                                onPress={() => setExpanded(current => current === section.id ? null : section.id)}
                                style={styles.sectionHeader}
                                accessibilityRole="button"
                                accessibilityState={{ expanded: isOpen }}
                            >
                                <Text style={[styles.sectionTitle, { color: dark ? '#e2e8f0' : '#334155' }]}>{section.title[language]}</Text>
                                {!isDesktop && <Text style={[styles.chevron, { color: accent }]}>{isOpen ? '−' : '+'}</Text>}
                            </AnimatedPressable>
                            {isOpen ? (
                                <View style={styles.linkList}>
                                    {section.links.map(link => (
                                        <TextLink href={link.href} key={link.href} style={styles.link}>
                                            <Text style={[styles.linkText, { color: dark ? '#94a3b8' : '#64748b' }]}>{link.label[language]}</Text>
                                        </TextLink>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    );
                })}
            </View>

            <View style={[styles.bottom, { borderTopColor: dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)' }]}>
                <Text style={[styles.copyright, { color: dark ? '#64748b' : '#94a3b8' }]}>
                    © {new Date().getFullYear()} {t.brand}. {t.copyright}
                </Text>
                <Text style={[styles.signature, { color: accent }]}>BUILT FOR BETTER COMMERCE</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        width: '100%',
        maxWidth: 1400,
        alignSelf: 'center',
        marginTop: 32,
        marginBottom: 92,
        padding: 22,
        borderWidth: 1,
        borderRadius: 28,
    },
    top: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 },
    brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 240 },
    brandMark: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    brandMarkText: { fontSize: 18, fontWeight: '900' },
    brandTextBlock: { flex: 1, gap: 3 },
    brand: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
    description: { fontSize: 11, lineHeight: 17 },
    linksHeading: { fontSize: 9, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' },
    sections: { gap: 12 },
    sectionsDesktop: { flexDirection: 'row', justifyContent: 'space-between' },
    sectionsMobile: { flexDirection: 'column' },
    section: { flex: 1, minWidth: 150 },
    sectionDesktop: { paddingVertical: 6 },
    sectionHeader: { minHeight: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 12, fontWeight: '800' },
    chevron: { fontSize: 20, fontWeight: '600' },
    linkList: { gap: 8, paddingTop: 5, paddingBottom: 8 },
    link: { textDecorationLine: 'none' },
    linkText: { fontSize: 11, lineHeight: 17 },
    bottom: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
    copyright: { fontSize: 10, lineHeight: 16 },
    signature: { fontSize: 8, fontWeight: '900', letterSpacing: 1.3, alignSelf: 'center' },
});
