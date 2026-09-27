'use client'
import React, { useState, useEffect, useRef } from 'react'
import { View, Text, useWindowDimensions, Pressable, ScrollView, Animated, TextInput, Platform } from 'react-native'
import { useLanStorage } from 'app/store/useLanStore'
import { UniversalImage } from './UniversalImage'
import { TextLink } from 'solito/link'
import { useInputStorage } from 'app/store/useInputStore'
import { useRouter } from 'solito/navigation'
import SearchPng from 'app/features/app/assets/search.png'

interface Translation {
    uz: string; ru: string; en: string;
}
interface SubCategory {
    name: Translation; descr: Translation[];
}
interface CatalogItem {
    title: Translation; body: SubCategory[];
}

const AnimatedSubCategory = ({ subItem, lan, isMobileView }: { subItem: SubCategory, lan: keyof Translation, isMobileView: boolean }) => {
    const setInput = useInputStorage(state => state.setInput)
    const router = useRouter()

    const handleItemPress = (item: string) => {
        const slug = item.trim().replace(/\s+/g, '-').toLowerCase()
        setInput(slug)
        router.push(`/search/${slug}`)
    }

    const [isOpen, setIsOpen] = useState(false)
    const animationProgress = useRef(new Animated.Value(0)).current

    const toggleOpen = () => {
        const toValue = isOpen ? 0 : 1
        setIsOpen(!isOpen)

        Animated.timing(animationProgress, {
            toValue: toValue,
            duration: 400,
            useNativeDriver: false,
        }).start()
    }

    const primaryItems = subItem.descr.slice(0, 2)
    const extraItems = subItem.descr.slice(2)

    const animatedHeight = animationProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, extraItems.length * 36]
    })

    const getToggleText = () => {
        if (lan === 'uz') return isOpen ? 'Yopish' : 'Yana'
        if (lan === 'ru') return isOpen ? 'Свернуть' : 'Еще'
        return isOpen ? 'Less' : 'More'
    }

    return (
        <View style={{
            width: isMobileView ? '100%' : '31%',
            minWidth: isMobileView ? undefined : 260,
            backgroundColor: 'rgba(226, 245, 255, 0.6)',
            padding: 16,
            borderRadius: 20,
            justify: 'space-between',
            marginBottom: 10,
        }}>
            <View>
                <Text style={{ color: '#333', fontWeight: 'bold', marginBottom: 12, fontSize: 16 }}>
                    {subItem.name[lan]}
                </Text>

                <View style={{ gap: 4 }}>
                    {primaryItems.map((descrItem, descrIndex) => {
                        const slug = descrItem.en.trim().replace(/\s+/g, '-').toLowerCase()
                        return (
                            <Pressable
                                key={descrIndex}
                                href={`/search/${slug}`}
                                onPress={() => handleItemPress(descrItem[lan])}
                                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                                    <Text style={{ fontSize: 14, color: '#444', flex: 1 }}>{descrItem[lan]}</Text>
                                    <UniversalImage src="https://i.ibb.co/PZsbKfGr/search.png" alt="search" width={14} height={14} resizeMode='contain' />
                                </View>
                            </Pressable>
                        )
                    })}
                </View>

                {extraItems.length > 0 && (
                    <Animated.View style={{ height: animatedHeight, overflow: 'hidden', gap: 4 }}>
                        {extraItems.map((descrItem, descrIndex) => {
                            const slug = descrItem.en.trim().replace(/\s+/g, '-').toLowerCase()
                            return (
                                <Pressable
                                    key={descrIndex}
                                    href={`/search/${slug}`}
                                    onPress={() => handleItemPress(descrItem[lan])}
                                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                                        <Text style={{ fontSize: 14, color: '#444', flex: 1 }}>{descrItem[lan]}</Text>
                                        <UniversalImage src="https://i.ibb.co/PZsbKfGr/search.png" alt="search" width={14} height={14} resizeMode='contain' />
                                    </View>
                                </Pressable>
                            )
                        })}
                    </Animated.View>
                )}
            </View>

            {subItem.descr.length > 2 && (
                <Pressable
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(0,0,0,0.05)',
                        paddingTop: 8,
                        marginTop: 10
                    }}
                    onPress={toggleOpen}
                >
                    <Text style={{ color: '#007BF5', fontWeight: '600', fontSize: 13 }}>{getToggleText()}</Text>
                    <Text style={{ color: '#007BF5', fontWeight: '600' }}>{isOpen ? '▲' : '▼'}</Text>
                </Pressable>
            )}
        </View>
    )
}

const KatalogTizimi = () => {
    const [hoverState, setHoverState] = useState(false)
    const { width: windowWidth } = useWindowDimensions()
    const [isHydrated, setIsHydrated] = useState(false)
    const [activeNav, setActiveNav] = useState<number>(0)
    const [hoveredIndex, setHoveredIndex] = useState<null | number>(null)

    const input = useInputStorage(state => state.input)
    const setInput = useInputStorage(state => state.setInput)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const currentWidth = isHydrated ? windowWidth : 1200
    const isMobileView = currentWidth < 1024
    const lan = useLanStorage(state => state.lan) as keyof Translation

    const katalogData = [
        {
            title: { uz: 'Maishiy texnika', ru: 'Бытовая техника', en: 'Home Appliances' },
            body: [
                {
                    name: { uz: "Go'zallik uchun texnika", ru: 'Техника для красоты', en: 'Beauty Appliances' },
                    descr: [
                        { uz: 'Soch turmaklash', ru: 'Укладка волос', en: 'Hair Styling' },
                        { uz: 'Soch kesish mashinkalari', ru: 'Машинки для стрижки', en: 'Hair Clippers' },
                        { uz: 'Elektr ustaralar', ru: 'Электробритвы', en: 'Electric Shavers' },
                        { uz: 'Apparatli kosmetologiya', ru: 'Аппаратная косметология', en: 'Cosmetology Devices' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Kiyim', ru: 'Одежда', en: 'Clothing' },
            body: [
                {
                    name: { uz: 'Erkaklar kiyimi', ru: 'Мужская одежда', en: "Men's Clothing" },
                    descr: [
                        { uz: 'Futbolkalar va pololar', ru: 'Футболки и поло', en: 'T-shirts & Polos' },
                        { uz: 'Shortilar va shimlar', ru: 'Шорты и брюки', en: 'Shorts & Trousers' },
                        { uz: 'Kostyum va kurtkalar', ru: 'Костюмы и куртки', en: 'Suits & Jackets' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Elektronika', ru: 'Электроника', en: 'Electronics' },
            body: [
                {
                    name: { uz: 'Smartfonlar va telefonlar', ru: 'Смартфоны и телефоны', en: 'Smartphones & Phones' },
                    descr: [
                        { uz: 'Smartfonlar', ru: 'Смартфоны', en: 'Smartphones' },
                        { uz: 'Tugmali telefonlar', ru: 'Кнопочные телефоны', en: 'Button Phones' },
                        { uz: 'Garnituralar va aksessuarlar', ru: 'Гарнитуры и аксессуары', en: 'Headsets & Accessories' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Poyabzallar', ru: 'Обувь', en: 'Shoes' },
            body: [
                {
                    name: { uz: 'Ayollar poyabzali', ru: 'Женская обувь', en: "Women's Shoes" },
                    descr: [
                        { uz: 'Krossovkalar va kedalar', ru: 'Кроссовки и кеды', en: 'Sneakers & Canvas Shoes' },
                        { uz: 'Tufli va baletkalar', ru: 'Туфли и балетки', en: 'Heels & Flats' },
                        { uz: 'Sandal va shlyopansilar', ru: 'Сандалии и шлепанцы', en: 'Sandals & Slippers' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Aksessuarlar', ru: 'Аксессуары', en: 'Accessories' },
            body: [
                {
                    name: { uz: 'Sumkalar va ryukzaklar', ru: 'Сумки и рюкзаки', en: 'Bags & Backpacks' },
                    descr: [
                        { uz: 'Ayollar sumkalari', ru: 'Женские сумки', en: 'Women Bags' },
                        { uz: 'Erkaklar sumkalari', ru: 'Мужские сумки', en: 'Men Bags' },
                        { uz: 'Sayohat chamadonlari', ru: 'Дорожные чемоданы', en: 'Suitcases' }
                    ]
                }
            ]
        },
        {
            title: { uz: "Go'zallik va parvarish", ru: 'Красота и уход', en: 'Beauty & Personal Care' },
            body: [
                {
                    name: { uz: 'Makiyaj', ru: 'Макияж', en: 'Makeup' },
                    descr: [
                        { uz: 'Kozlar uchun', ru: 'Для глаз', en: 'For Eyes' },
                        { uz: 'Lablar uchun', ru: 'Для губ', en: 'For Lips' },
                        { uz: 'Yuz uchun tonal vositalar', ru: 'Тональные средства', en: 'Face Foundation' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Salomatlik', ru: 'Здоровье', en: 'Health' },
            body: [
                {
                    name: { uz: 'Vitaminlar va BFQ (БАД)', ru: 'Витамины и БАДы', en: 'Vitamins & Supplements' },
                    descr: [
                        { uz: 'Multivitaminlar', ru: 'Мультивитамины', en: 'Multivitamins' },
                        { uz: 'Imunitet uchun', ru: 'Для иммунитета', en: 'For Immunity' },
                        { uz: 'Parhezbop mahsulotlar', ru: 'Диетические продукты', en: 'Dietary Products' }
                    ]
                }
            ]
        },
        {
            title: { uz: "Uy-ro'zg'or buyumlari", ru: 'Товары для дома', en: 'Home Goods' },
            body: [
                {
                    name: { uz: 'Oshxona jihozlari', ru: 'Кухонная утварь', en: 'Kitchenware' },
                    descr: [
                        { uz: 'Idish-tovoqlar', ru: 'Посуда для готовки', en: 'Cookware' },
                        { uz: 'Oshxona pichoqlari', ru: 'Кухонные ножи', en: 'Kitchen Knives' },
                        { uz: 'Konteynerlar va saqlash', ru: 'Контейнеры для хранения', en: 'Food Containers' }
                    ]
                }
            ]
        },
        {
            title: { uz: "Qurilish va ta'mirlash", ru: 'Строительство и ремонт', en: 'Construction & Repair' },
            body: [
                {
                    name: { uz: 'Elektr asboblari', ru: 'Электроинструменты', en: 'Power Tools' },
                    descr: [
                        { uz: 'Shurupburagichlar (Drel)', ru: 'Шуруповерты и дрели', en: 'Drills & Screwdrivers' },
                        { uz: 'Silliqlash mashinalari (Bolgarka)', ru: 'Шлифмашины (Болгарки)', en: 'Angle Grinders' },
                        { uz: 'Payvandlash apparatlari', ru: 'Сварочные аппараты', en: 'Welding Machines' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Avtotovarlar', ru: 'Автотовары', en: 'Automotive' },
            body: [
                {
                    name: { uz: 'Avtoelektronika', ru: 'Автоэлектроника', en: 'Car Electronics' },
                    descr: [
                        { uz: 'Videoregistratorlar', ru: 'Видеорегистраторы', en: 'Dashcams' },
                        { uz: 'Radar-detektorlar', ru: 'Радар-детекторы', en: 'Radar Detectors' },
                        { uz: 'Avto akustika va radiolar', ru: 'Автоакустика и магнитолы', en: 'Car Audio & Speakers' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Bolalar tovarlari', ru: 'Детские товары', en: 'Children Goods' },
            body: [
                {
                    name: { uz: "O'yinchoqlar", ru: 'Игрушки', en: 'Toys' },
                    descr: [
                        { uz: 'Yumshoq o‘yinchoqlar', ru: 'Мягкие игрушки', en: 'Plush Toys' },
                        { uz: 'Konstruktorlar', ru: 'Конструкторы', en: 'Building Blocks' },
                        { uz: 'Radioboshqariladigan o‘yinchoqlar', ru: 'Радиоуправляемые игрушки', en: 'RC Toys' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Xobbi va ijod', ru: 'Хобби и творчество', en: 'Hobby & Creativity' },
            body: [
                {
                    name: { uz: 'Chizish va rassomchilik', ru: 'Рисование и живопись', en: 'Drawing & Painting' },
                    descr: [
                        { uz: 'Raqamlar bo‘yicha rasmlar', ru: 'Картины по номерам', en: 'Paint by Numbers' },
                        { uz: 'Flomasterlar va qalamlar', ru: 'Фломастеры и карандаши', en: 'Markers & Pencils' },
                        { uz: 'Molbertlar va sketcbuqlar', ru: 'Мольберты и скетчбуки', en: 'Easels & Sketchbooks' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Sport va hordiq', ru: 'Спорт и отдых', en: 'Sport & Recreation' },
            body: [
                {
                    name: { uz: 'Fitnes va trenajyorlar', ru: 'Фитнес и тренажеры', en: 'Fitness & Gym' },
                    descr: [
                        { uz: 'Gantellar va shtangalar', ru: 'Гантели и штанги', en: 'Dumbbells & Barbells' },
                        { uz: 'Yoga va fitnes uchun gilamchalar', ru: 'Коврики для йоги', en: 'Yoga Mats' },
                        { uz: 'Ekspanderlar va tasmalar', ru: 'Эспандеры и ленты', en: 'Resistance Bands' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Oziq-ovqat mahsulotlari', ru: 'Продукты питания', en: 'Food & Groceries' },
            body: [
                {
                    name: { uz: 'Choy va kofe', ru: 'Чай и кофе', en: 'Tea & Coffee' },
                    descr: [
                        { uz: 'Kofe donalari va eruvchan kofe', ru: 'Кофе в зернах и растворимый', en: 'Coffee Beans & Instant' },
                        { uz: 'Ko‘k va qora choylar', ru: 'Зеленый и черный чай', en: 'Green & Black Tea' },
                        { uz: 'Kofe uchun sirop va qo‘shimchalar', ru: 'Сиропы для кофе', en: 'Coffee Syrups' }
                    ]
                }
            ]
        },
        {
            title: { uz: 'Kitoblar', ru: 'Книги', en: 'Books' },
            body: [
                {
                    name: { uz: 'Badiiy adabiyot', ru: 'Художественная литература', en: 'Fiction' },
                    descr: [
                        { uz: 'Jahon adabiyoti', ru: 'Мировая литература', en: 'World Literature' },
                        { uz: 'Detektivlar va trillerlar', ru: 'Детективы и триллеры', en: 'Detectives & Thrillers' },
                        { uz: 'Fantastika va fentezi', ru: 'Фантастика и фэнтези', en: 'Sci-Fi & Fantasy' }
                    ]
                }
            ]
        }
    ];

    const activeCatalog = katalogData[activeNav] || katalogData[0];

    return (
        <View style={{
            width: '100%',
            maxWidth: 1340,
            marginHorizontal: 'auto',
            marginTop: isMobileView ? 80 : 140,
            paddingHorizontal: 16,
        }}>

            <View style={{
                flexDirection: isMobileView ? 'column' : 'row',
                gap: 20,
                paddingHorizontal: 16,
                marginTop: 10
            }}>
                <ScrollView
                    style={{ width: isMobileView ? '100%' : '25%', maxHeight: isMobileView ? 300 : 620 }}
                    showsVerticalScrollIndicator={false}
                >
                    {katalogData.map((item, index) => {
                        const isActive = index === activeNav;
                        const isHovered = index === hoveredIndex;

                        return (
                            <Pressable
                                key={index}
                                onPress={() => setActiveNav(index)}
                                onMouseEnter={() => { hoverState ? setActiveNav(index) : console.clear(), setTimeout(() => setHoverState(true), 2000) }}
                                onMouseLeave={() => setHoverState(false)}
                                onHoverIn={() => setHoveredIndex(index)}
                                onHoverOut={() => setHoveredIndex(null)}
                                style={{
                                    marginTop: 4,
                                    padding: 12,
                                    backgroundColor: isActive
                                        ? 'rgba(200, 235, 255, 1)'
                                        : isHovered
                                            ? 'rgba(226, 245, 255, 0.6)'
                                            : 'transparent',
                                    borderRadius: 10,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{
                                    fontSize: 15,
                                    fontWeight: isActive ? 'bold' : '500',
                                    color: isActive ? '#007BF5' : '#333',
                                    fontFamily: 'sans-serif'
                                }}>
                                    {item.title[lan]}
                                </Text>
                                <Text style={{ color: isActive ? '#007BF5' : 'gray' }}>{'>'}</Text>
                            </Pressable>
                        )
                    })}
                </ScrollView>

                <ScrollView
                    style={{
                        width: isMobileView ? '100%' : undefined,
                        flex: isMobileView ? undefined : 1,
                        maxHeight: isMobileView ? undefined : 620
                    }}
                    contentContainerStyle={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 16,
                        paddingBottom: 20
                    }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={!isMobileView}
                >
                    {activeCatalog.body.map((subItem, subIndex) => (
                        <AnimatedSubCategory
                            key={subIndex}
                            subItem={subItem}
                            lan={lan}
                            isMobileView={isMobileView}
                        />
                    ))}
                </ScrollView>
            </View>
        </View>
    )
}

export default KatalogTizimi