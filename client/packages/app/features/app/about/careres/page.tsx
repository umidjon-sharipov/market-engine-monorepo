'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useRouter } from 'solito/navigation';
import AnimatedPressable from 'app/components/UI/AnimatedPressable';
import AboutWrapper from 'app/components/UI/AboutWrapper';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import { fetchWithAuth } from 'app/features/app/auth/fetchWithAuth';
import { useLanStorage } from 'app/store/useLanStore';
import { useTokenStore } from 'app/store/useTokenStore';
import { useUrlStore } from 'app/store/useUrlStore';
import { useDesignStore } from 'app/store/useDesignStore';

interface Vacancy {
    id: string;
    title: string;
    requiredRole: string;
    jobType: string;
    requiredWorkers: number;
    availableWorkers: number;
    salary: string | number | null;
    skills: string;
    experience: string;
    description: string | null;
    benefits: string | null;
    hrName: string;
    hrPhone: string;
    hrLink: string | null;
    createdAt: string;
    market: { id: string; title: string; logo: string } | null;
}

const translations = {
    uz: {
        eyebrow: 'KARYERA', title: 'Jamoamizga qo‘shiling', subtitle: 'Loyihamizni birga rivojlantiramiz. Ochiq vakansiyalarni ko‘ring va mos keladiganiga ariza yuboring.',
        openRoles: 'Ochiq vakansiyalar', roles: 'ta vakansiya', loading: 'Vakansiyalar yuklanmoqda…',
        empty: 'Hozircha ochiq vakansiya yo‘q.', emptyHint: 'Yangi o‘rinlar paydo bo‘lganda shu yerda ko‘rasiz.',
        retry: 'Qayta urinish', error: 'Vakansiyalarni yuklab bo‘lmadi.', apply: 'Ariza yuborish',
        applying: 'Yuborilmoqda…', applied: 'Arizangiz yuborildi', applyError: 'Arizani yuborib bo‘lmadi.',
        signIn: 'Ariza yuborish uchun tizimga kiring', role: 'Yo‘nalish', type: 'Ish turi',
        experience: 'Tajriba', salary: 'Maosh', available: 'Bo‘sh o‘rin', team: 'Market',
        contact: 'HR bilan bog‘lanish', benefits: 'Imtiyozlar', skills: 'Ko‘nikmalar',
        fullTime: 'To‘liq ish kuni', partTime: 'Yarim stavka', contract: 'Shartnoma',
        salaryNegotiable: 'Kelishiladi',
    },
    en: {
        eyebrow: 'CAREERS', title: 'Build with our team', subtitle: 'Help us grow the platform. Explore open roles and apply for the opportunity that fits you.',
        openRoles: 'Open positions', roles: 'roles', loading: 'Loading opportunities…',
        empty: 'There are no open positions right now.', emptyHint: 'New opportunities will appear here.',
        retry: 'Try again', error: 'Could not load vacancies.', apply: 'Apply now',
        applying: 'Submitting…', applied: 'Application submitted', applyError: 'Could not submit your application.',
        signIn: 'Sign in to apply', role: 'Role', type: 'Work type',
        experience: 'Experience', salary: 'Salary', available: 'Openings', team: 'Market',
        contact: 'Contact HR', benefits: 'Benefits', skills: 'Skills',
        fullTime: 'Full time', partTime: 'Part time', contract: 'Contract',
        salaryNegotiable: 'Negotiable',
    },
    ru: {
        eyebrow: 'КАРЬЕРА', title: 'Присоединяйтесь к команде', subtitle: 'Развивайте платформу вместе с нами. Выберите подходящую вакансию и отправьте заявку.',
        openRoles: 'Открытые вакансии', roles: 'вакансий', loading: 'Загружаем вакансии…',
        empty: 'Сейчас открытых вакансий нет.', emptyHint: 'Новые предложения появятся здесь.',
        retry: 'Повторить', error: 'Не удалось загрузить вакансии.', apply: 'Откликнуться',
        applying: 'Отправка…', applied: 'Заявка отправлена', applyError: 'Не удалось отправить заявку.',
        signIn: 'Войдите, чтобы откликнуться', role: 'Направление', type: 'Занятость',
        experience: 'Опыт', salary: 'Зарплата', available: 'Мест', team: 'Магазин',
        contact: 'Связаться с HR', benefits: 'Преимущества', skills: 'Навыки',
        fullTime: 'Полный день', partTime: 'Неполный день', contract: 'Контракт',
        salaryNegotiable: 'По договорённости',
    },
} as const;

const isVacancyArray = (value: unknown): value is Vacancy[] =>
    Array.isArray(value) && value.every(item =>
        typeof item === 'object' && item !== null &&
        'id' in item && typeof item.id === 'string' &&
        'title' in item && typeof item.title === 'string' &&
        'requiredRole' in item && typeof item.requiredRole === 'string' &&
        'jobType' in item && typeof item.jobType === 'string' &&
        'availableWorkers' in item && typeof item.availableWorkers === 'number',
    );

export default function VacanciesScreen() {
    const lan = useLanStorage(state => state.lan) as keyof typeof translations;
    const t = translations[lan] ?? translations.uz;
    const url = useUrlStore(state => state.url);
    const token = useTokenStore(state => state.token);
    const hasHydrated = useTokenStore(state => state.hasHydrated);
    const theme = useDesignStore(state => state.theme);
    const accent = useDesignStore(state => state.accentColor);
    const router = useRouter();
    const dark = theme === 'dark';
    const [vacancies, setVacancies] = useState<Vacancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingId, setPendingId] = useState('');
    const [notice, setNotice] = useState('');
    const palette = useMemo(() => ({
        text: dark ? '#f8fafc' : '#0f172a',
        muted: dark ? '#94a3b8' : '#64748b',
        card: dark ? 'rgba(15,23,42,0.78)' : 'rgba(255,255,255,0.88)',
        border: dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)',
        soft: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
    }), [dark]);

    const loadVacancies = useCallback(async (signal?: AbortSignal) => {
        const response = await fetch(`${url}/vacancies/openings`, { signal });
        if (!response.ok) throw new Error(`${t.error} (${response.status})`);
        const data: unknown = await response.json();
        if (!isVacancyArray(data)) throw new Error(t.error);
        setVacancies(data);
    }, [t.error, url]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        loadVacancies(controller.signal)
            .catch((requestError: unknown) => {
                if (!controller.signal.aborted) {
                    setError(requestError instanceof Error ? requestError.message : t.error);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [loadVacancies, t.error]);

    const apply = async (vacancy: Vacancy) => {
        if (!hasHydrated) return;
        if (!token) {
            router.push('/auth');
            return;
        }
        if (pendingId) return;
        setPendingId(vacancy.id);
        setNotice('');
        setError('');
        try {
            const response = await fetchWithAuth(`${url}/vacancies/${vacancy.id}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '' }),
            }, token);
            if (response.status === 401) {
                router.push('/auth');
                return;
            }
            if (!response.ok) {
                const payload: unknown = await response.json().catch(() => null);
                const message = typeof payload === 'object' && payload !== null && 'message' in payload &&
                    typeof payload.message === 'string' ? payload.message : t.applyError;
                throw new Error(message);
            }
            setNotice(t.applied);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : t.applyError);
        } finally {
            setPendingId('');
        }
    };

    const formatSalary = (salary: Vacancy['salary']) => {
        if (salary === null || salary === '') return t.salaryNegotiable;
        const amount = Number(salary);
        return Number.isFinite(amount)
            ? new Intl.NumberFormat(lan === 'ru' ? 'ru-RU' : lan === 'en' ? 'en-US' : 'uz-UZ').format(amount)
            : t.salaryNegotiable;
    };
    const formatType = (type: string) => {
        const normalized = type.toLowerCase();
        if (normalized.includes('full')) return t.fullTime;
        if (normalized.includes('part')) return t.partTime;
        if (normalized.includes('contract')) return t.contract;
        return type;
    };
    const externalLink = async (link: string) => {
        const href = /^https?:\/\//i.test(link) ? link : `https://${link}`;
        await Linking.openURL(href);
    };

    return (
        <ScreenWrapper>
            <View style={styles.page}>
                <AboutWrapper>
                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        <View style={styles.hero}>
                            <Text style={[styles.eyebrow, { color: accent }]}>{t.eyebrow}</Text>
                            <Text style={[styles.title, { color: palette.text }]}>{t.title}</Text>
                            <Text style={[styles.subtitle, { color: palette.muted }]}>{t.subtitle}</Text>
                            <View style={[styles.countBadge, { backgroundColor: `${accent}18`, borderColor: `${accent}38` }]}>
                                <Text style={[styles.countText, { color: accent }]}>{vacancies.length} {t.roles}</Text>
                            </View>
                        </View>

                        {notice ? <Text style={[styles.notice, { color: accent }]}>{notice}</Text> : null}
                        {error ? (
                            <View style={[styles.stateCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                <Text style={[styles.stateText, { color: palette.text }]}>{error}</Text>
                                <Pressable onPress={() => {
                                    setLoading(true);
                                    setError('');
                                    loadVacancies().catch((requestError: unknown) => {
                                        setError(requestError instanceof Error ? requestError.message : t.error);
                                    }).finally(() => setLoading(false));
                                }}>
                                    <Text style={[styles.retry, { color: accent }]}>{t.retry}</Text>
                                </Pressable>
                            </View>
                        ) : null}

                        {loading ? (
                            <View style={styles.loading}>
                                <ActivityIndicator size="large" color={accent} />
                                <Text style={[styles.stateText, { color: palette.muted }]}>{t.loading}</Text>
                            </View>
                        ) : !error && vacancies.length === 0 ? (
                            <View style={[styles.stateCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                <Text style={styles.emptyIcon}>✦</Text>
                                <Text style={[styles.cardTitle, { color: palette.text }]}>{t.empty}</Text>
                                <Text style={[styles.subtitle, { color: palette.muted }]}>{t.emptyHint}</Text>
                            </View>
                        ) : (
                            vacancies.map(vacancy => (
                                <View key={vacancy.id} style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.marketMark, { backgroundColor: `${accent}20` }]}>
                                            <Text style={[styles.marketMarkText, { color: accent }]}>
                                                {(vacancy.market?.title ?? 'M')[0]?.toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.cardHeading}>
                                            <Text style={[styles.cardTitle, { color: palette.text }]}>{vacancy.title}</Text>
                                            <Text style={[styles.marketName, { color: palette.muted }]}>{vacancy.market?.title ?? t.team}</Text>
                                        </View>
                                        <View style={[styles.openBadge, { backgroundColor: `${accent}18` }]}>
                                            <Text style={[styles.openText, { color: accent }]}>{vacancy.availableWorkers} {t.available}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.metaRow}>
                                        {[
                                            [t.role, vacancy.requiredRole],
                                            [t.type, formatType(vacancy.jobType)],
                                            [t.experience, vacancy.experience],
                                            [t.salary, formatSalary(vacancy.salary)],
                                        ].map(([label, value]) => (
                                            <View key={label} style={[styles.metaItem, { backgroundColor: palette.soft }]}>
                                                <Text style={[styles.metaLabel, { color: palette.muted }]}>{label}</Text>
                                                <Text style={[styles.metaValue, { color: palette.text }]}>{value}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {vacancy.description ? <Text style={[styles.description, { color: palette.muted }]}>{vacancy.description}</Text> : null}
                                    {vacancy.skills ? (
                                        <View style={styles.detailBlock}>
                                            <Text style={[styles.detailLabel, { color: palette.text }]}>{t.skills}</Text>
                                            <Text style={[styles.description, { color: palette.muted }]}>{vacancy.skills}</Text>
                                        </View>
                                    ) : null}
                                    {vacancy.benefits ? (
                                        <View style={styles.detailBlock}>
                                            <Text style={[styles.detailLabel, { color: palette.text }]}>{t.benefits}</Text>
                                            <Text style={[styles.description, { color: palette.muted }]}>{vacancy.benefits}</Text>
                                        </View>
                                    ) : null}

                                    <View style={styles.actions}>
                                        <AnimatedPressable
                                            style={[styles.applyButton, { backgroundColor: accent, opacity: pendingId === vacancy.id ? 0.72 : 1 }]}
                                            disabled={pendingId === vacancy.id}
                                            onPress={() => void apply(vacancy)}
                                        >
                                            {pendingId === vacancy.id
                                                ? <ActivityIndicator color="#fff" />
                                                : <Text style={styles.applyText}>{hasHydrated && !token ? t.signIn : t.apply}</Text>}
                                        </AnimatedPressable>
                                        {vacancy.hrLink ? (
                                            <AnimatedPressable
                                                style={[styles.contactButton, { borderColor: palette.border }]}
                                                onPress={() => void externalLink(vacancy.hrLink!)}
                                            >
                                                <Text style={[styles.contactText, { color: palette.text }]}>{t.contact}</Text>
                                            </AnimatedPressable>
                                        ) : null}
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </AboutWrapper>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    page: { width: '100%', padding: 12 },
    content: { padding: 20, paddingBottom: 36, gap: 16 },
    hero: { paddingVertical: 12, gap: 8, maxWidth: 760 },
    eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
    subtitle: { fontSize: 14, lineHeight: 22 },
    countBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: 4 },
    countText: { fontSize: 12, fontWeight: '800' },
    notice: { fontSize: 13, fontWeight: '700' },
    stateCard: { alignItems: 'center', padding: 24, borderWidth: 1, borderRadius: 24, gap: 8 },
    stateText: { fontSize: 14, textAlign: 'center' },
    retry: { fontSize: 14, fontWeight: '800', padding: 8 },
    loading: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyIcon: { fontSize: 28, color: '#0EA5E9' },
    card: { padding: 18, borderWidth: 1, borderRadius: 24, gap: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    marketMark: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    marketMarkText: { fontSize: 18, fontWeight: '900' },
    cardHeading: { flex: 1, gap: 3 },
    cardTitle: { fontSize: 17, lineHeight: 23, fontWeight: '800' },
    marketName: { fontSize: 12, fontWeight: '600' },
    openBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
    openText: { fontSize: 10, fontWeight: '800' },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    metaItem: { flexGrow: 1, flexBasis: 135, borderRadius: 14, padding: 11, gap: 5 },
    metaLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    metaValue: { fontSize: 12, fontWeight: '700' },
    description: { fontSize: 13, lineHeight: 21 },
    detailBlock: { gap: 5 },
    detailLabel: { fontSize: 12, fontWeight: '800' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    applyButton: { minWidth: 160, flexGrow: 1, minHeight: 46, borderRadius: 15, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
    applyText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    contactButton: { minWidth: 140, minHeight: 46, borderWidth: 1, borderRadius: 15, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
    contactText: { fontSize: 13, fontWeight: '700' },
});
