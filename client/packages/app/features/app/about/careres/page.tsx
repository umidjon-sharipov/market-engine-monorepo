import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Pressable
} from 'react-native';
import { TextLink } from 'solito/link';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import AboutWrapper from 'app/components/UI/AboutWrapper';

const VacanciesScreen = () => {

    return (
        <ScreenWrapper>
            <View style={{ padding: 12, width: '100%' }}>
                <AboutWrapper>
                    <View style={styles.card}>
                        <Text style={styles.title}>VAKANSIYALAR</Text>
                        <Text style={styles.description}>
                            Uzum Market jamoasining safiga qo'shilmoqchimisiz? Nima uchun bizga mos kelishingiz
                            haqida so'zlab bering va o'z rezyumengizni yuboring.
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TextLink
                                href='https://tashkent.hh.uz/employer/6132255?hhtmFrom=vacancy&tab=DESCRIPTION'
                                target="_blank"
                            >
                                <Pressable style={styles.primaryButton}>
                                    <Text style={styles.primaryButtonText}>UZUM MARKET'DA ISHLASHNI ISTAYMAN</Text>
                                </Pressable>
                            </TextLink>

                            <TextLink href="https://t.me/Uzum_jbot" target="_blank">
                                <View style={styles.botBadge}>
                                    <Text style={styles.botBadgeText}>
                                        Telegram bot - <Text style={styles.botBold}>@Uzum_jbot</Text>
                                    </Text>
                                </View>
                            </TextLink>
                        </View>

                        <Text style={styles.listTitle}>O'zingizga mos kasbni topadigan ish profillari:</Text>
                        <View style={styles.listContainer}>
                            {[
                                "Buxgalteriya va moliya",
                                "Uzum Market yetkazib berish xizmati",
                                "Ma'muriy xodim",
                                "Ombor logistikasi",
                                "Aloqa markazi",
                                "Xodimlar boshqaruvi"
                            ].map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.listItemText}>{item}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.separator} />

                        <Text style={styles.footerText}>
                            Agar hali sizning orzuingizdagi vakansiya bizda ochilmagan bo'lsa, o'zingizga qulay usulda
                            rezyumeni zaxiraga yuboring:
                        </Text>

                        <View style={styles.contactContainer}>
                            <Text style={styles.contactLabel}>
                                Telegram:{' '}
                                <TextLink
                                    style={styles.linkText}
                                    href="https://t.me/HR_UZUM"
                                    target="_blank"
                                >
                                    <Text>
                                        @HR_UZUM
                                    </Text>
                                </TextLink>
                            </Text>

                            <Text style={styles.contactLabel}>
                                Email:{' '}
                                <TextLink
                                    href='https://mail.google.com/mail/u/0/?fs=1&to=hr-market@uzum.com&su=&body=&tf=cm'
                                    style={styles.linkText}
                                    target="_blank"
                                >
                                    <Text>
                                        hr-market@uzum.com
                                    </Text>
                                </TextLink>
                            </Text>
                        </View>
                    </View>
                </AboutWrapper>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 40,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        width: '100%',
        marginTop: 30
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111111',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: '#555555',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'column',
        gap: 10,
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: '#4facfe',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    botBadge: {
        backgroundColor: '#f2f2f2',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    botBadgeText: {
        color: '#444444',
        fontSize: 14,
    },
    botBold: {
        fontWeight: '700',
        color: '#111111',
    },
    listTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111111',
        marginBottom: 10,
    },
    listContainer: {
        marginBottom: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    bullet: {
        fontSize: 16,
        color: '#4facfe',
        marginRight: 8,
        lineHeight: 20,
    },
    listItemText: {
        fontSize: 14,
        color: '#444444',
        lineHeight: 20,
        flex: 1,
    },
    separator: {
        height: 1,
        backgroundColor: '#e5e5e5',
        marginVertical: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#555555',
        lineHeight: 22,
        marginBottom: 14,
    },
    contactContainer: {
        gap: 8,
    },
    contactLabel: {
        fontSize: 14,
        color: '#333333',
        fontWeight: '500',
    },
    linkText: {
        color: '#4facfe',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default VacanciesScreen;