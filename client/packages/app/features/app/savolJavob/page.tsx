'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import AnimatedPressable from 'app/components/UI/AnimatedPressable';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import { useDesignStore } from 'app/store/useDesignStore';
import { useLanStorage } from 'app/store/useLanStore';
import { useNativeAnimDriver } from 'app/utils/animation';

type Language = 'uz' | 'en' | 'ru';
type Localized = Record<Language, string>;
interface FaqItemData { id: string; question: Localized; answer: Localized }
interface FaqSection { id: string; title: Localized; items: FaqItemData[] }

const FAQ_DATA: FaqSection[] = [
    {
        id: 'platform',
        title: { uz: 'Loyiha haqida', en: 'About the platform', ru: 'О платформе' },
        items: [
            {
                id: 'platform-purpose',
                question: { uz: 'Bu platformada nimalar qilish mumkin?', en: 'What can I do on this platform?', ru: 'Что можно делать на платформе?' },
                answer: {
                    uz: 'Turli marketlarning mahsulotlarini ko‘rish, qidirish, saralash va yoqtirganlaringizga saqlash mumkin. Marketni kuzatib, uning faol topshirish punktlarini ko‘rishingiz, savatni shakllantirib buyurtmani rasmiylashtirishingiz mumkin.',
                    en: 'Browse, search, filter and save products from different markets. Follow a market to see its active pickup points, build a cart and place an order.',
                    ru: 'Просматривайте, ищите и сохраняйте товары разных магазинов. Подпишитесь на магазин, чтобы видеть его активные пункты выдачи, соберите корзину и оформите заказ.',
                },
            },
            {
                id: 'market-follow',
                question: { uz: 'Marketni qanday kuzataman?', en: 'How do I follow a market?', ru: 'Как подписаться на магазин?' },
                answer: {
                    uz: 'Marketni kuzatish sahifasidan nomi bo‘yicha qidiring va “Kuzatish” tugmasini bosing. Kuzatishni profilingizdagi kuzatilayotgan marketlar ro‘yxatidan boshqarishingiz mumkin.',
                    en: 'Search for a market on the discovery page and select “Follow”. Manage followed markets from your profile’s following list.',
                    ru: 'Найдите магазин на странице поиска магазинов и нажмите «Подписаться». Список подписок можно открыть и изменить в профиле.',
                },
            },
            {
                id: 'market-unavailable',
                question: { uz: 'Nega ayrim marketlar yoki punktlar ko‘rinmaydi?', en: 'Why can’t I see some markets or pickup points?', ru: 'Почему некоторые магазины или пункты не отображаются?' },
                answer: {
                    uz: 'Faqat faol ma’lumotlar ko‘rsatiladi. Market sizni bloklagan bo‘lsa, uning topshirish punktlari ro‘yxatga kiritilmaydi. Ayrim bo‘limlar akkauntga kirishni talab qiladi.',
                    en: 'Only active listings are shown. Pickup points are hidden when a market has blocked your account. Some areas also require you to sign in.',
                    ru: 'Показываются только активные данные. Пункты магазина не отображаются, если он заблокировал ваш аккаунт. Для некоторых разделов также требуется вход.',
                },
            },
        ],
    },
    {
        id: 'products',
        title: { uz: 'Mahsulotlar va marketlar', en: 'Products and markets', ru: 'Товары и магазины' },
        items: [
            {
                id: 'find-products',
                question: { uz: 'Kerakli mahsulotni qanday topaman?', en: 'How do I find a product?', ru: 'Как найти товар?' },
                answer: {
                    uz: 'Qidiruv maydoniga mahsulot nomini yozing. Katalog va filterlardan foydalanib natijalarni toraytiring. Mahsulot kartasini ochib narx, tavsif va mavjud variantlarini tekshiring.',
                    en: 'Enter the product name in search. Narrow results with the catalog and filters, then open a product to review its price, details and available options.',
                    ru: 'Введите название в поиске. Используйте каталог и фильтры, затем откройте карточку товара, чтобы посмотреть цену, описание и варианты.',
                },
            },
            {
                id: 'save-products',
                question: { uz: 'Mahsulotni keyinroq ko‘rish uchun saqlash mumkinmi?', en: 'Can I save products for later?', ru: 'Можно сохранить товар на потом?' },
                answer: {
                    uz: 'Ha. Mahsulot kartasidagi yoqtirish belgisini bosing. Saqlangan mahsulotlarni “Yoqtirganlar” bo‘limidan topasiz.',
                    en: 'Yes. Select the favorite control on a product card. Your saved products are available in the Favorites section.',
                    ru: 'Да. Нажмите значок избранного в карточке товара. Сохранённые товары доступны в разделе «Избранное».',
                },
            },
            {
                id: 'options',
                question: { uz: 'Mahsulot variantlari va qo‘shimchalarini qayerdan tanlayman?', en: 'Where do I choose product options and add-ons?', ru: 'Где выбрать варианты и дополнения товара?' },
                answer: {
                    uz: 'Mahsulot sahifasini oching. Agar market rang, o‘lcham yoki tarkib kabi variantlarni belgilagan bo‘lsa, ularni savatga qo‘shishdan oldin shu sahifada tanlaysiz.',
                    en: 'Open the product page. If the market has configured options such as size, color or add-ons, choose them there before adding the item to your cart.',
                    ru: 'Откройте страницу товара. Если магазин добавил варианты — например размер, цвет или комплектацию — выберите их перед добавлением в корзину.',
                },
            },
        ],
    },
    {
        id: 'orders',
        title: { uz: 'Savat, buyurtma va yetkazib berish', en: 'Cart, orders and delivery', ru: 'Корзина, заказы и доставка' },
        items: [
            {
                id: 'checkout',
                question: { uz: 'Buyurtmani qanday rasmiylashtiraman?', en: 'How do I place an order?', ru: 'Как оформить заказ?' },
                answer: {
                    uz: 'Mahsulotlarni savatga qo‘shing, savatdagi miqdor va tanlangan variantlarni tekshiring, so‘ng rasmiylashtirish bo‘limida aloqa va yetkazib berish ma’lumotlarini kiriting.',
                    en: 'Add products to your cart, review quantities and selected options, then provide your contact and delivery details at checkout.',
                    ru: 'Добавьте товары в корзину, проверьте количество и выбранные варианты, затем укажите контактные данные и способ доставки при оформлении.',
                },
            },
            {
                id: 'pickup-points',
                question: { uz: 'Topshirish punktini qanday tanlayman?', en: 'How do I choose a pickup point?', ru: 'Как выбрать пункт выдачи?' },
                answer: {
                    uz: 'Buyurtmani rasmiylashtirishda mavjud yetkazib berish usullaridan topshirish punktini tanlang. “Topshirish punktlari” sahifasida esa siz kuzatadigan va sizni bloklamagan marketlarning faol punktlarini ko‘rishingiz mumkin.',
                    en: 'Choose a pickup point from the available delivery options during checkout. The Pickup points page also lists active locations for markets you follow that have not blocked you.',
                    ru: 'Выберите пункт выдачи среди доступных способов доставки при оформлении заказа. На отдельной странице также показаны активные пункты магазинов, на которые вы подписаны и которые вас не блокировали.',
                },
            },
            {
                id: 'delivery-availability',
                question: { uz: 'Nega tanlagan punktim buyurtmada chiqmayapti?', en: 'Why isn’t my preferred pickup point available at checkout?', ru: 'Почему нужный пункт недоступен при оформлении?' },
                answer: {
                    uz: 'Buyurtma uchun mos punkt marketning yetkazib berish hududi, faol holati va mahsulotlar mavjudligiga bog‘liq. Rasmiylashtirish sahifasida shu buyurtma uchun taklif qilingan punktlardan birini tanlang.',
                    en: 'Eligible pickup points depend on the market’s service area, whether the point is active and product availability. Choose from the options offered for the current order.',
                    ru: 'Доступность зависит от зоны доставки магазина, активности пункта и наличия товаров. Выберите один из пунктов, предложенных для текущего заказа.',
                },
            },
            {
                id: 'payment',
                question: { uz: 'Qaysi to‘lov usullari mavjud?', en: 'Which payment methods are available?', ru: 'Какие способы оплаты доступны?' },
                answer: {
                    uz: 'To‘lov usullari market va buyurtma uchun yoqilgan sozlamalarga bog‘liq. Buyurtmani rasmiylashtirish vaqtida ekranda ko‘rsatilgan usullarni tanlang; ro‘yxatda bo‘lmagan usulni mavjud deb hisoblamang.',
                    en: 'Payment methods depend on the market and the options enabled for your order. Choose from the methods shown at checkout; do not assume an unlisted method is available.',
                    ru: 'Способы оплаты зависят от магазина и настроек заказа. Выберите один из вариантов, показанных при оформлении; не рассчитывайте на способы, которых нет в списке.',
                },
            },
        ],
    },
    {
        id: 'account',
        title: { uz: 'Akkaunt va maxfiylik', en: 'Account and privacy', ru: 'Аккаунт и конфиденциальность' },
        items: [
            {
                id: 'account-create',
                question: { uz: 'Akkauntga kirish nima uchun kerak?', en: 'Why should I sign in?', ru: 'Зачем входить в аккаунт?' },
                answer: {
                    uz: 'Akkaunt kuzatilayotgan marketlar, saqlangan mahsulotlar va buyurtma jarayonidagi shaxsiy ma’lumotlarni bir joyda boshqarishga yordam beradi. Shaxsiy bo‘limlar faqat tizimga kirgandan so‘ng ochiladi.',
                    en: 'An account keeps your followed markets, saved products and checkout details together. Personal areas are available after you sign in.',
                    ru: 'Аккаунт помогает управлять подписками, избранными товарами и данными для оформления заказов. Персональные разделы доступны после входа.',
                },
            },
            {
                id: 'account-security',
                question: { uz: 'Akkauntimni qanday himoya qilaman?', en: 'How can I keep my account secure?', ru: 'Как защитить аккаунт?' },
                answer: {
                    uz: 'Kirish ma’lumotlaringizni boshqalar bilan ulashmang va umumiy qurilmada ish tugagach akkauntdan chiqing. Kutilmagan kirish muammosi bo‘lsa, parol yoki tasdiqlash ma’lumotlarini hech kimga yubormang.',
                    en: 'Do not share your sign-in details, and sign out on shared devices. If you have an unexpected sign-in issue, never send passwords or verification codes to anyone.',
                    ru: 'Не сообщайте данные для входа и выходите из аккаунта на общих устройствах. При подозрительной активности никому не отправляйте пароль или код подтверждения.',
                },
            },
            {
                id: 'language-theme',
                question: { uz: 'Til va ko‘rinishni qanday o‘zgartiraman?', en: 'How do I change the language and appearance?', ru: 'Как изменить язык и оформление?' },
                answer: {
                    uz: 'Tilni ilovadagi til tanlash boshqaruvidan, rang va mavzuni esa profil ichidagi dizayn sozlamalaridan o‘zgartiring. Tanlovlar ushbu qurilmada saqlanadi.',
                    en: 'Use the language selector to change the language, and the design settings in your profile to adjust theme and colors. Preferences are saved on this device.',
                    ru: 'Выберите язык в переключателе языка, а тему и цвета настройте в разделе дизайна профиля. Параметры сохраняются на этом устройстве.',
                },
            },
        ],
    },
    {
        id: 'careers',
        title: { uz: 'Vakansiyalar va yordam', en: 'Careers and help', ru: 'Вакансии и помощь' },
        items: [
            {
                id: 'career-apply',
                question: { uz: 'Vakansiyaga qanday ariza yuboraman?', en: 'How do I apply for a vacancy?', ru: 'Как откликнуться на вакансию?' },
                answer: {
                    uz: '“Vakansiyalar” sahifasida ochiq ish o‘rinlarini ko‘ring. Ariza yuborish uchun akkauntga kiring va mos vakansiya kartasidagi tugmani bosing.',
                    en: 'Browse open positions on the Careers page. Sign in and select the application button on a vacancy that fits you.',
                    ru: 'Откройте страницу вакансий. Войдите в аккаунт и нажмите кнопку отклика у подходящей вакансии.',
                },
            },
            {
                id: 'support',
                question: { uz: 'Muammo bo‘lsa qayerga murojaat qilaman?', en: 'Where can I get help?', ru: 'Куда обратиться за помощью?' },
                answer: {
                    uz: 'Avval savolingizga mos bo‘limni tekshiring. Buyurtma yoki akkauntga oid masalada ilovada ko‘rsatilgan market yoki loyiha bilan bog‘lanish kanalidan foydalaning; noma’lum manzilga to‘lov yoki tasdiqlash kodini yubormang.',
                    en: 'Check the relevant section first. For an order or account issue, use the contact channel shown in the app for the market or project. Never send payments or verification codes to an unknown address.',
                    ru: 'Сначала проверьте подходящий раздел. По вопросам заказа или аккаунта используйте контактный канал магазина или проекта, указанный в приложении. Не отправляйте оплату или коды подтверждения неизвестным лицам.',
                },
            },
        ],
    },
];

const copy = {
    uz: { title: 'Yordam markazi', subtitle: 'Loyihamizdan foydalanish bo‘yicha kerakli javoblar.', search: 'Savol yoki kalit so‘z bo‘yicha qidiring', all: 'Barchasi', count: 'ta savol', noResults: 'Savol topilmadi', noResultsHint: 'Boshqa so‘z bilan qidirib ko‘ring.' },
    en: { title: 'Help center', subtitle: 'Answers to common questions about using our platform.', search: 'Search questions and keywords', all: 'All topics', count: 'questions', noResults: 'No matching questions', noResultsHint: 'Try a different search term.' },
    ru: { title: 'Центр помощи', subtitle: 'Ответы на частые вопросы о платформе.', search: 'Поиск по вопросам и ключевым словам', all: 'Все темы', count: 'вопросов', noResults: 'Ничего не найдено', noResultsHint: 'Попробуйте другой запрос.' },
} as const;

function FaqItem({
    item,
    language,
    selected,
    accent,
    dark,
    onPress,
}: {
    item: FaqItemData;
    language: Language;
    selected: boolean;
    accent: string;
    dark: boolean;
    onPress: () => void;
}) {
    const reveal = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(reveal, {
            toValue: selected ? 1 : 0,
            damping: 22,
            stiffness: 220,
            useNativeDriver: useNativeAnimDriver,
        }).start();
    }, [reveal, selected]);

    return (
        <View style={[styles.faqCard, { backgroundColor: dark ? 'rgba(15,23,42,0.78)' : 'rgba(255,255,255,0.86)', borderColor: dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)' }]}>
            <AnimatedPressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={{ expanded: selected }}
                style={styles.questionButton}
            >
                <Text style={[styles.question, { color: dark ? '#f8fafc' : '#0f172a' }]}>{item.question[language]}</Text>
                <View style={[styles.expandIcon, { backgroundColor: selected ? accent : `${accent}18` }]}>
                    <Text style={[styles.expandText, { color: selected ? '#fff' : accent }]}>{selected ? '−' : '+'}</Text>
                </View>
            </AnimatedPressable>
            {selected ? (
                <Animated.View style={{
                    opacity: reveal,
                    transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                }}>
                    <Text style={[styles.answer, { color: dark ? '#aab6c7' : '#526176' }]}>{item.answer[language]}</Text>
                </Animated.View>
            ) : null}
        </View>
    );
}

export default function SavolJavob() {
    const selectedLanguage = useLanStorage(state => state.lan);
    const language: Language = selectedLanguage === 'en' || selectedLanguage === 'ru' ? selectedLanguage : 'uz';
    const t = copy[language];
    const theme = useDesignStore(state => state.theme);
    const accent = useDesignStore(state => state.accentColor);
    const dark = theme === 'dark';
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const sections = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase();
        return FAQ_DATA
            .filter(section => category === 'all' || section.id === category)
            .map(section => ({
                ...section,
                items: section.items.filter(item => {
                    if (!normalized) return true;
                    return `${item.question[language]} ${item.answer[language]}`
                        .toLocaleLowerCase()
                        .includes(normalized);
                }),
            }))
            .filter(section => section.items.length > 0);
    }, [category, language, query]);
    const resultCount = sections.reduce((total, section) => total + section.items.length, 0);

    return (
        <ScreenWrapper>
            <View style={styles.page}>
                <View style={styles.hero}>
                    <Text style={[styles.eyebrow, { color: accent }]}>SUPPORT / FAQ</Text>
                    <Text style={[styles.title, { color: dark ? '#f8fafc' : '#0f172a' }]}>{t.title}</Text>
                    <Text style={[styles.subtitle, { color: dark ? '#94a3b8' : '#64748b' }]}>{t.subtitle}</Text>
                </View>

                <View style={[styles.searchBox, { backgroundColor: dark ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.78)', borderColor: dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)' }]}>
                    <Text style={[styles.searchIcon, { color: accent }]}>⌕</Text>
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder={t.search}
                        placeholderTextColor={dark ? '#64748b' : '#94a3b8'}
                        style={[styles.searchInput, { color: dark ? '#f8fafc' : '#0f172a' }]}
                        accessibilityLabel={t.search}
                    />
                    {query ? <AnimatedPressable onPress={() => setQuery('')}><Text style={{ color: dark ? '#94a3b8' : '#64748b', fontSize: 20 }}>×</Text></AnimatedPressable> : null}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
                    {[{ id: 'all', title: t.all }, ...FAQ_DATA.map(section => ({ id: section.id, title: section.title[language] }))].map(item => {
                        const active = category === item.id;
                        return (
                            <AnimatedPressable
                                key={item.id}
                                onPress={() => { setCategory(item.id); setSelectedId(null); }}
                                style={[styles.categoryChip, { backgroundColor: active ? accent : dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)', borderColor: active ? accent : dark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)' }]}
                            >
                                <Text style={[styles.categoryText, { color: active ? '#fff' : dark ? '#cbd5e1' : '#475569' }]}>{item.title}</Text>
                            </AnimatedPressable>
                        );
                    })}
                </ScrollView>

                <Text style={[styles.resultCount, { color: dark ? '#64748b' : '#94a3b8' }]}>{resultCount} {t.count}</Text>

                {sections.length ? sections.map(section => (
                    <View key={section.id} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: accent }]}>{section.title[language]}</Text>
                        {section.items.map(item => (
                            <FaqItem
                                key={item.id}
                                item={item}
                                language={language}
                                selected={selectedId === item.id}
                                accent={accent}
                                dark={dark}
                                onPress={() => setSelectedId(current => current === item.id ? null : item.id)}
                            />
                        ))}
                    </View>
                )) : (
                    <View style={[styles.emptyCard, { backgroundColor: dark ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.78)' }]}>
                        <Text style={[styles.emptyTitle, { color: dark ? '#f8fafc' : '#0f172a' }]}>{t.noResults}</Text>
                        <Text style={[styles.subtitle, { color: dark ? '#94a3b8' : '#64748b' }]}>{t.noResultsHint}</Text>
                    </View>
                )}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    page: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
    hero: { paddingTop: 8, paddingBottom: 4, gap: 7 },
    eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8 },
    subtitle: { fontSize: 13, lineHeight: 20 },
    searchBox: { minHeight: 48, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 10 },
    searchIcon: { fontSize: 22, lineHeight: 26 },
    searchInput: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 10 },
    categories: { gap: 8, paddingVertical: 2 },
    categoryChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
    categoryText: { fontSize: 11, fontWeight: '800' },
    resultCount: { fontSize: 10, fontWeight: '700', textAlign: 'right' },
    section: { gap: 9, marginBottom: 8 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
    faqCard: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
    questionButton: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, paddingVertical: 14 },
    question: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '700' },
    expandIcon: { width: 26, height: 26, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    expandText: { fontSize: 19, lineHeight: 22, fontWeight: '700' },
    answer: { paddingHorizontal: 15, paddingBottom: 16, fontSize: 12, lineHeight: 20 },
    emptyCard: { minHeight: 120, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 20 },
    emptyTitle: { fontSize: 15, fontWeight: '800' },
});
