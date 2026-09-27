'use client'
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions, Pressable, Platform, Modal, Linking } from 'react-native';
import { UniversalImage } from 'app/components/UI/UniversalImage';
import { useLink } from 'solito/navigation';
import { useLanStorage } from 'app/store/useLanStore';
import { BlurView } from 'expo-blur'

interface LinkItem {
    name: string;
    pages: string;
    func?: () => void;
}

interface FooterSection {
    title: string;
    links: LinkItem[];
}

interface FooterLinkItemProps {
    link: LinkItem;
    styles: any;
}

const ExternalLink = ({ href, children, style }: { href: string; children: React.ReactNode; style?: any }) => {
    if (Platform.OS === 'web') {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', ...style }}>
                {children}
            </a>
        );
    }
    return (
        <TouchableOpacity onPress={() => Linking.openURL(href)} style={style}>
            {children}
        </TouchableOpacity>
    );
};

export default function OnlineMarketFooter() {
    const [isMount, setIsMount] = useState(false)
    const { width } = useWindowDimensions();
    const [contact, setContact] = useState<boolean>(false);
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    useEffect(() => {
        setIsMount(true)
    }, [])

    const isWeb = width >= 900;
    const lan = useLanStorage(state => state.lan)

    const FOOTER_DATA: FooterSection[] = [
        { title: { uz: 'Biz haqimizda', en: 'About us', ru: 'О нас' }, links: [{ name: { uz: 'Topshirish punktlari', en: 'Pickup points', ru: 'Пункты выдачи', }, pages: '/about/punkt' }, { name: { uz: 'Vakansiyalar', en: 'Vacancies', ru: 'Вакансии' }, pages: '/about/careres' }] },
        { title: { uz: 'Foydalanuvchilarga', en: 'For users', ru: 'Пользователям' }, links: [{ name: { uz: 'Biz bilan bog‘lanish', en: 'Contact us', ru: 'Связаться с нами' }, pages: '', func: () => setContact(true) }, { name: { uz: 'Savol-Javob', en: 'FAQ (Questions & Answers)', ru: 'Вопросы и ответы (FAQ)' }, pages: '/savolJavob' }] },
        { title: { uz: 'Tadbirkorlarga', en: 'For businesses', ru: 'Предпринимателям' }, links: [{ name: { uz: 'Online Marketda soting', en: 'Sell on Online Market', ru: 'Продавайте на Online Market' }, pages: 'https://seller.uzum.uz/?utm_source=uzum_market_main&utm_medium=web&utm_campaign=header_link' }, { name: { uz: 'Sotuvchi kabineti', en: 'Seller dashboard', ru: 'Кабинет продавца' }, pages: 'https://seller.uzum.uz/seller/signin' }, { name: { uz: 'Topshirish punktini ochish', en: 'Open a pickup point', ru: 'Открыть пункт выдачи' }, pages: 'https://promo.uzum.uz/uz/promo/pvz' }] },
    ];

    if (!isMount) {
        return <View></View>
    }

    const FooterLinkItem = ({ link, styles }: FooterLinkItemProps) => {
        const isExternal = link.pages.startsWith('http');

        const linkProps = useLink({
            href: isExternal ? '#' : (link.pages || '#'),
        });

        const handlePress = (e: any) => {
            if (link.func) {
                e.preventDefault();
                link.func();
                return;
            }
            if (isExternal) {
                e.preventDefault();
                Linking.openURL(link.pages);
                return;
            }
            linkProps.onPress(e);
        };

        return (
            <TouchableOpacity {...linkProps} onPress={handlePress} style={styles.linkButton}>
                <Text style={styles.link}>{link.name[lan]}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <Modal
                transparent={true}
                visible={contact}
                animationType="fade"
                onRequestClose={() => setContact(false)}
            >
                <Pressable style={[styles.modalOverlay, { ...Platform.select({ web: { cursor: 'default' } }) }]} onPress={() => setContact(false)}>
                    <BlurView
                        tint="light"
                        intensity={50}
                        style={StyleSheet.absoluteFill}
                    >
                        <View style={styles.modalContainer}>
                            <Pressable
                                onPress={(e) => e.stopPropagation()}
                                style={[styles.modalContent, { width: Platform.OS === 'web' ? 500 : '90%' }]}
                            >
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Biz bilan bogʻlanish</Text>
                                    <TouchableOpacity onPress={() => setContact(false)} style={styles.closeButton}>
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <View>
                                    <Text style={styles.modalDescription}>
                                        Mutaxassislarimizga sizga qulay ijtimoiy tarmoq chati yoki telefon orqali savol bering:
                                    </Text>
                                </View>

                                <View style={styles.modalBody}>
                                    <ExternalLink href="https://t.me/Uzum_Support_Bot" style={{ width: '100%' }}>
                                        <View style={styles.telegramCard}>
                                            <UniversalImage src="https://i.ibb.co/Q3m8LCVq/telegram.png" alt="telegram" width={40} height={40} resizeMode="contain" />
                                            <View>
                                                <Text style={styles.telegramTitle}>Telegram</Text>
                                                <Text style={styles.telegramHandle}>@Uzum_Support_Bot</Text>
                                            </View>
                                        </View>
                                    </ExternalLink>

                                    <View style={styles.emailSection}>
                                        <Text style={styles.emailLabel}>Qoʻllab-quvvatlash xizmatining email manzili:</Text>
                                        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@uzum.com')}>
                                            <Text style={styles.emailAddress}>support@uzum.com</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Pressable>
                        </View>
                    </BlurView>
                </Pressable>
            </Modal>
            <View style={styles.container}>
                <View style={styles.containerC}>
                    <View style={[styles.mainSection, isWeb ? styles.row : styles.column]}>
                        {FOOTER_DATA.map(({ title, links }) => {
                            const isOpen = isWeb || expandedMenu === title[lan];
                            return (
                                <View key={title.en} style={[styles.section, isWeb && styles.webSection]}>
                                    <TouchableOpacity
                                        disabled={isWeb}
                                        onPress={() => setExpandedMenu(expandedMenu === title[lan] ? null : title[lan])}
                                        style={styles.header}
                                    >
                                        <Text style={styles.title}>{title[lan]}</Text>
                                        {!isWeb ? <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text> : null}
                                    </TouchableOpacity>

                                    {isOpen ? (
                                        <View style={[styles.linkList, !isWeb && styles.mobileLinkList]}>
                                            {links.map(link => (
                                                <FooterLinkItem key={link.name.en} link={link} styles={styles} />
                                            ))}
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })}

                        <View style={[styles.section, isWeb && styles.webSection, !isWeb && styles.centerText]}>
                            <Text style={styles.title}>{lan === 'uz' ? 'Ilovani yuklab olish' : lan === 'en' ? 'Download the app' : lan === 'ru' ? 'Скачать приложение' : 'Ilovani yuklab olish'}</Text>
                            <Text style={[styles.link, { fontWeight: '500', marginTop: 10 }]}>App Store • Google Play</Text>

                            <Text style={[styles.title, { marginTop: 20 }]}>{lan === 'uz' ? 'Tarmoqlar' : lan === 'en' ? 'Social media' : lan === 'ru' ? 'Uzum в соцсетях' : 'Tarmoqlar'}</Text>
                            <View style={styles.socialMedias}>
                                <ExternalLink href="https://www.instagram.com/umidjon_sharipov_dev"><UniversalImage src="https://i.ibb.co/607bCCgd/instagram.png" alt="instagram" width={30} height={30} resizeMode="contain" /></ExternalLink>
                                <ExternalLink href="https://t.me/uzum_market"><UniversalImage src="https://i.ibb.co/Q3m8LCVq/telegram.png" alt="telegram" width={30} height={30} resizeMode="contain" /></ExternalLink>
                                <ExternalLink href="https://www.facebook.com/profile.php?id=61590541989133"><UniversalImage src="https://i.ibb.co/Cs9jwDWj/facebook.png" alt="facebook" width={30} height={30} resizeMode="contain" /></ExternalLink>
                                <ExternalLink href="https://youtube.com/@UmidjonDev"><UniversalImage src="https://i.ibb.co/Kx8QwBQW/youtube.png" alt="youtube" width={30} height={30} resizeMode="contain" /></ExternalLink>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={[styles.bottomSection, isWeb ? styles.row : styles.column]}>
                        <View style={[styles.legalBox, isWeb ? styles.row : styles.column]}>
                            <ExternalLink href='https://legal.uzum.uz/privacy-policy-uz.html'><Text style={styles.legalLink}>{lan === 'uz' ? 'Maxfiylik kelishuvi' : lan === 'en' ? 'Privacy policy' : lan === 'ru' ? 'Соглашение о конфиденциальности' : 'Maxfiylik kelishuvi'}</Text></ExternalLink>
                            <ExternalLink href='https://legal.uzum.uz/user-agreement-uz.html'><Text style={styles.legalLink}>{lan === 'uz' ? 'Foydalanuvchi kelishuvi' : lan === 'en' ? 'User agreement' : lan === 'ru' ? 'Пользовательское соглашение' : 'Foydalanuvchi kelishuvi'}</Text></ExternalLink>
                        </View>
                        <Text style={styles.copy}>© {new Date().getFullYear()} <Text style={{ textTransform: 'uppercase' }}>online market</Text>. {lan === 'uz' ? 'Barcha huquqlar himoyalangan.' : lan === 'en' ? 'All rights reserved.' : lan === 'ru' ? 'Все права защищены.' : 'Barcha huquqlar himoyalangan.'}</Text>
                    </View>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        ...Platform.select({
            web: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
            }
        })
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: Platform.OS === 'web' ? 40 : 24,
        borderRadius: 24,
        gap: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 13.16,
        elevation: 20,
        ...Platform.select({
            web: {
                cursor: 'auto',
            }
        })
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f1f1f' },
    closeButton: { backgroundColor: '#DFE0E2', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    closeButtonText: { color: '#4E5155', fontSize: 12, fontWeight: 'bold' },
    modalDescription: { color: '#4E5155', fontSize: 14, lineHeight: 20 },
    modalBody: { gap: 15 },
    telegramCard: { borderRadius: 16, backgroundColor: 'rgba(0, 166, 255, 0.12)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
    telegramTitle: { fontSize: 15, fontWeight: 'bold', color: '#000' },
    telegramHandle: { color: '#00a6ff', fontSize: 13, fontWeight: '500' },
    emailSection: { marginTop: 10 },
    emailLabel: { fontSize: 13, color: 'gray', marginBottom: 5 },
    emailAddress: { color: '#00a6ff', fontWeight: 'bold', fontSize: 15 },

    container: { padding: 24, width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 40, marginBottom: 80 },
    containerC: { width: '100%' },
    mainSection: { justifyContent: 'space-between' },
    socialMedias: { flexDirection: 'row', paddingVertical: 10, gap: 12, justifyContent: 'flex-start', alignItems: 'center' },
    row: { flexDirection: 'row', flexWrap: 'wrap' },
    column: { flexDirection: 'column' },
    section: { marginBottom: 16 },
    webSection: { flex: 1, minWidth: 180 },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    title: { fontSize: 15, fontWeight: '600', color: '#1f1f1f' },
    arrow: { fontSize: 12, color: '#86868b' },
    linkList: { marginTop: 4 },
    mobileLinkList: { alignItems: 'flex-start', paddingLeft: 10, paddingVertical: 5 },
    link: { fontSize: 14, color: '#86868b', paddingVertical: 5 },
    linkButton: { paddingVertical: 4, width: '100%' },
    centerText: { alignItems: 'center' },
    divider: { height: 1, backgroundColor: '#f2f2f7', marginVertical: 24 },
    bottomSection: { justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    legalBox: { gap: 16, alignItems: 'center' },
    legalLink: { fontSize: 12, color: '#1f1f1f' },
    copy: { fontSize: 12, color: '#86868b' },
});