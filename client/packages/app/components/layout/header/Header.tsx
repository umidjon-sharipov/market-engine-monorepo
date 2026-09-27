"use client"

import React, { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, View, Platform, TextInput, TouchableOpacity, useWindowDimensions, Pressable, Animated, Dimensions, Modal } from 'react-native'
import { useNativeAnimDriver } from 'app/utils/animation'
import { TextLink } from 'solito/link'
import { useColorStore } from 'app/store/useColorStore'
import { UniversalImage } from 'app/components/UI/UniversalImage'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import Language from 'app/components/UI/Language'
import { useLanStorage } from 'app/store/useLanStore'
import { useInputStorage } from 'app/store/useInputStore'
import { useRouter } from 'solito/navigation'
import { useCartStore } from 'app/store/useCartStore'
import { useYoqtirilganStore } from 'app/store/useYoqtirilganStore'
import { useTabStore } from 'app/store/useTabStore'
import { usePathname } from 'solito/navigation'
import { uselocationStorage } from 'app/store/useLocationStore'
import Location from 'app/components/UI/Location'
import SearchPng from 'app/features/app/assets/search.png'
import UserPng from 'app/features/app/assets/user.png'
import CartPng from 'app/features/app/assets/cart.png'
import HeartPng from 'app/features/app/assets/heart.png'
import CatalogPng from 'app/features/app/assets/catalog.png'
import HomePng from 'app/features/app/assets/home.png'
import GrapePng from 'app/features/app/assets/grape.png'
import UzPng from 'app/features/app/assets/uzbekistan.png'
import EnPng from 'app/features/app/assets/united-kingdom.png'
import RuPng from 'app/features/app/assets/russia.png'
import GpsPng from 'app/features/app/assets/gps.png'
import CancelPng from 'app/features/app/assets/cancel.png'
import LanguagePng from 'app/features/app/assets/language.png'
import { useModalStore } from 'app/store/useModalStore'
import ModalComponent from 'app/components/UI/Modal'
import TopPng from 'app/features/app/assets/back.png'
import ArrowPng from 'app/features/app/assets/arrow.png'
import BlueArrowPng from 'app/features/app/assets/blue-arrow.png'
import { useScrollStore } from 'app/store/useScrollStore'
import { useTokenStore } from 'app/store/useTokenStore'
import { useLocationOpenStore } from 'app/store/useLocationOpenStore'
import { useUrlStore } from 'app/store/useUrlStore'

const SearchIcon = () => (
    <UniversalImage
        src={SearchPng}
        alt="search"
        width={18}
        height={18}
        resizeMode="contain"
    />
)

const HomeIcon = () => (
    <UniversalImage
        src={HomePng}
        alt="home"
        width={18}
        height={18}
        resizeMode="contain"
    />
)

const HeartIcon = () => (
    <UniversalImage
        src={HeartPng}
        alt="heart"
        width={18}
        height={18}
        resizeMode="contain"
    />
)

const CartIcon = () => (
    <UniversalImage
        src={CartPng}
        alt="kart"
        width={18}
        height={18}
        resizeMode="contain"
    />
)

const CatalogIcon = () => (
    <UniversalImage
        src={CatalogPng}
        alt="katalog"
        width={18}
        height={18}
        resizeMode="contain"
    />
)

const Header = () => {
    const url = useUrlStore(state => state.url)
    const [openLan, setOpenLan] = useState(false)
    const token = useTokenStore(state => state.token)
    const color = useColorStore((state) => state.color)
    const location = uselocationStorage(state => state.location)
    const { width: windowWidth } = useWindowDimensions()
    const [isHydrated, setIsHydrated] = useState(false)
    const yoqtirilganIds = useYoqtirilganStore(state => state.yoqtirilganIds)
    const router = useRouter()
    const tab = useTabStore(state => state.tab)
    const setTab = useTabStore(state => state.setTab)
    const pathname = usePathname()
    const locationOpen = useLocationOpenStore(state => state.locationOpen)
    const setLocationOpen = useLocationOpenStore(state => state.setLocationOpen)
    const [firstName, setFirstName] = useState('')
    const [extra, setExtra] = useState(false)
    const modal = useModalStore(state => state.modal)
    const setModal = useModalStore(state => state.setModal)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const currentWidth = isHydrated ? windowWidth : 1200
    const isMobileView = currentWidth < 1000

    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: tab,
            duration: 300,
            useNativeDriver: false
        }).start()
    }, [tab])

    const handlePage = (path: string, num: number) => {
        router.push(path)
        setTab(num)
    }

    useEffect(() => {
        if (!pathname) return

        if (pathname === '/') setTab(0)
        else if (pathname.startsWith('/katalog')) setTab(1)
        else if (pathname.startsWith('/savat')) setTab(2)
        else if (pathname.startsWith('/yoqtirilgan')) setTab(4)
        else if (pathname.startsWith('/profile')) setTab(3)
        else if (pathname.startsWith('/auth')) setTab(3)
        else if (pathname.startsWith('/search')) setTab(1)
    }, [pathname])

    const marginLeft = animValue.interpolate({
        inputRange: [0, 1, 2, 3, 4],
        outputRange: ['0%', '25%', '50%', '75%', '150%'],
        extrapolate: 'clamp'
    });

    const lan = useLanStorage(state => state.lan)

    const input = useInputStorage(state => state.input)
    const setInput = useInputStorage(state => state.setInput)

    const cart = useCartStore((state) => state.cart);
    const uniqueItemsCount = cart.length;

    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: extra ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: useNativeAnimDriver,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: useNativeAnimDriver,
            }),
        ]).start();
    }, [extra]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const scale = scaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.4],
    });

    const [image, setImage] = useState(UserPng)

    const renderToken = async (token: string) => {
        try {
            const res = await fetch(`${url}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const req = await res.json()
            console.log(req)
            setImage(req.image)
            setFirstName(req.firstName)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        if (!token || token === '') {
            setImage(UserPng)
        } else {
            renderToken(token)
        }
    }, [token])


    const scrollToTop = useScrollStore((state) => state.scrollToTop);

    if (isMobileView) {
        return (
            <>
                <Modal
                    transparent={true}
                    visible={locationOpen}
                    animationType="fade"
                    onRequestClose={() => setLocationOpen(false)}
                >
                    <BlurView
                        tint="light"
                        intensity={40}
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            ...Platform.select({
                                web: {
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                }
                            })
                        }}
                    >
                        <Pressable
                            style={{
                                flex: 1,
                                width: '100%',
                                height: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                ...Platform.select({ web: { cursor: 'default' } })
                            }}
                            onPress={() => setLocationOpen(false)}
                        >
                            <Location setLocationOpen={setLocationOpen} />
                        </Pressable>
                    </BlurView>
                </Modal>
                {(modal === '' && tab !== 3) ? (
                    <>
                        <View style={{
                            ...Platform.select({
                                web: { position: 'fixed' },
                                default: { position: 'absolute' }
                            }),
                            top: Platform.OS !== 'web' ? 36 : 10,
                            left: 0,
                            width: '100%',
                            height: 40,
                            zIndex: 999999,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                        }}>
                            <Pressable
                                onPress={() => setLocationOpen(!locationOpen)}
                                style={({ pressed }: {pressed: boolean}) => [
                                    {
                                        width: 40,
                                        height: 40,
                                        borderRadius: 28,
                                        overflow: 'hidden',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.25)',
                                        opacity: pressed ? 0.7 : 1,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 10,
                                        zIndex: 999999999999999999
                                    }
                                ]}
                            >
                                <BlurView
                                    tint="light"
                                    intensity={60}
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0, 132, 255, 0.11)',
                                        alignItems: 'center',
                                    }}
                                >
                                    <UniversalImage
                                        src={locationOpen ? CancelPng : GpsPng}
                                        alt='gps'
                                        width={18}
                                        height={18}
                                        resizeMode='contain'
                                    />
                                </BlurView>
                            </Pressable>
                            <BlurView
                                tint="light"
                                intensity={60}
                                style={{
                                    width: '70%',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(0, 132, 255, 0.11)',
                                    borderRadius: 100,
                                    paddingHorizontal: 10,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.25)',
                                    zIndex: 999999999999999
                                }}
                            >

                                <TextInput
                                    value={input}
                                    onChangeText={setInput}
                                    returnKeyType="search"
                                    onSubmitEditing={() => router.push(`/search/${input.trim().toLowerCase().replace(/\s+/g, '-')}`)}
                                    style={{
                                        flex: 1,
                                        height: '100%',
                                        fontSize: 14,
                                        color: '#333',
                                        outline: 'none'
                                    }}
                                    placeholder={
                                        lan === 'en' ? 'Search products and categories' :
                                            lan === 'ru' ? 'Искать товары и категории' :
                                                'Mahsulotlar va turkumlar izlash'
                                    }
                                    placeholderTextColor="rgba(0, 149, 255, 0.6)"
                                />

                                <TextLink
                                    href={`/search/${input.trim().toLowerCase().replace(/\s+/g, '-')}`}
                                    style={{
                                        padding: 6,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <SearchIcon />
                                </TextLink>
                            </BlurView>
                        </View>
                    </>
                ) : (modal !== '' && tab !== 3) ? <ModalComponent top={Platform.OS !== 'web' ? 36 : 10} left={0} /> : null}


                {
                    extra ? (
                        <View style={{
                            ...Platform.select({
                                web: { position: 'fixed' },
                                default: { position: 'absolute' }
                            }),
                            bottom: 160,
                            right: 0,
                            width: '24%',
                            height: 40,
                            zIndex: 999999,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                        }}>
                            <BlurView
                                tint="light"
                                intensity={60}
                                style={[styles.mobileTabItem, {
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    borderRadius: 100,
                                    paddingHorizontal: 10,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.25)',
                                }]}
                            >
                                <Pressable onPress={() => { setTimeout(() => setExtra(false), 600), router.push('https://internet-magazin-panel.vercel.app') }}>
                                    <Animated.View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            transform: [{ scale }]
                                        }}
                                    >
                                        <HomeIcon />
                                    </Animated.View>
                                </Pressable>
                            </BlurView>
                            <BlurView
                                tint="light"
                                intensity={60}
                                style={[styles.mobileTabItem, {
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    borderRadius: 100,
                                    paddingHorizontal: 10,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.25)',
                                }]}
                            >
                                <Pressable onPress={() => { setTimeout(() => setExtra(false), 600), handlePage('/yoqtirilgan', 4) }}>
                                    <Animated.View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            transform: [{ scale }]
                                        }}
                                    >
                                        <View style={styles.badgeContainer}>
                                            <HeartIcon />
                                            {yoqtirilganIds.length > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{yoqtirilganIds.length}</Text></View> : null}
                                        </View>
                                    </Animated.View>
                                </Pressable>
                            </BlurView>
                            <BlurView
                                tint="light"
                                intensity={60}
                                style={[styles.mobileTabItem, {
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    borderRadius: 100,
                                    paddingHorizontal: 10,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.25)',
                                }]}
                            >
                                <Pressable onPress={() => { setTimeout(() => setExtra(false), 600), router.push('/sozlamalar'), setOpenLan(true) }}>
                                    <Animated.View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            transform: [{ scale }]
                                        }}
                                    >
                                        <UniversalImage
                                            src={LanguagePng}
                                            alt='language'
                                            width={18}
                                            height={18}
                                            resizeMode='contain'
                                        />
                                    </Animated.View>
                                </Pressable>
                            </BlurView>

                            <BlurView
                                tint="light"
                                intensity={60}
                                style={[styles.mobileTabItem, {
                                    alignItems: 'center',
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    borderRadius: 100,
                                    paddingHorizontal: 10,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.25)',
                                }]}
                            >
                                <Pressable onPress={() => { setTimeout(() => setExtra(false), 600), scrollToTop() }}>
                                    <Animated.View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            transform: [{ scale }]
                                        }}
                                    >
                                        <UniversalImage src={BlueArrowPng} alt='top' height={20} width={20} resizeMode='contain' />
                                    </Animated.View>
                                </Pressable>
                            </BlurView>
                        </View>
                    ) : null
                }

                <View style={[styles.mobileTabBarC, { height: windowWidth > 500 ? 75 : 70 }]}>
                    <View style={[styles.mobileTabBar]}>

                        <BlurView
                            intensity={50}
                            tint="light"
                            style={[StyleSheet.absoluteFill, { borderRadius: 100 }]}
                        />

                        <Animated.View style={{
                            top: 0,
                            left: marginLeft,
                            width: '25%',
                            height: '100%',
                            backgroundColor: 'rgba(0, 149, 255, 0.2)',
                            pointerEvents: 'none',
                            borderRadius: 100,
                            ...Platform.select({
                                web: {
                                    background: 'rgba(0, 149, 255, 0.2)',
                                    position: 'absolute',
                                },
                                default: {
                                    position: 'absolute',
                                }
                            }),
                            zIndex: 999999999,
                        }}>
                        </Animated.View>

                        {Platform.OS !== 'web' ? (
                            <>
                                <Pressable style={styles.mobileTabItem} onPress={() => handlePage('/', 0)}>
                                    <View style={styles.mobileTabItem}>
                                        <HomeIcon />
                                        {tab === 0 ? <Text style={styles.mobileText}>home</Text> : null}
                                    </View>
                                </Pressable>

                                <Pressable style={styles.mobileTabItem} onPress={() => handlePage('/katalog', 1)}>
                                    <View style={styles.mobileTabItem}>
                                        <SearchIcon />
                                        {tab === 1 ? <Text style={styles.mobileText}>search</Text> : null}
                                    </View>
                                </Pressable>

                                <Pressable style={styles.mobileTabItem} onPress={() => handlePage('/savat', 2)}>
                                    <View style={styles.mobileTabItem}>
                                        <View style={styles.badgeContainer}>
                                            <CartIcon />
                                            {uniqueItemsCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{uniqueItemsCount}</Text></View> : null}
                                        </View>
                                        {tab === 2 ? <Text style={styles.mobileText}>cart</Text> : null}
                                    </View>
                                </Pressable>

                                <Pressable style={styles.mobileTabItem} onPress={() => handlePage('/profile', 3)}>
                                    <View style={styles.mobileTabItem}>
                                        <UniversalImage
                                            src={image}
                                            alt="profile"
                                            width={18}
                                            height={18}
                                            resizeMode="contain"
                                        />
                                        {tab === 3 ? <Text style={styles.mobileText}>{firstName ? firstName : 'profile'}</Text> : null}
                                    </View>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <TextLink href='/' style={styles.mobileTabItem}>
                                    <View style={styles.mobileTabItem}>
                                        <HomeIcon />
                                        {tab === 0 ? <Text style={styles.mobileText}>home</Text> : null}
                                    </View>
                                </TextLink>

                                <TextLink href='/katalog' style={styles.mobileTabItem}>
                                    <View style={styles.mobileTabItem}>
                                        <SearchIcon />
                                        {tab === 1 ? <Text style={styles.mobileText}>search</Text> : null}
                                    </View>
                                </TextLink>

                                <TextLink href='/savat' style={styles.mobileTabItem}>
                                    <View style={styles.mobileTabItem}>
                                        <View style={styles.badgeContainer}>
                                            <CartIcon />
                                            {uniqueItemsCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{uniqueItemsCount}</Text></View> : null}
                                        </View>
                                        {tab === 2 ? <Text style={styles.mobileText}>cart</Text> : null}
                                    </View>
                                </TextLink>

                                <TextLink href='/profile' style={styles.mobileTabItem}>
                                    <View style={styles.mobileTabItem}>
                                        <UniversalImage
                                            src={image}
                                            alt="profile"
                                            width={18}
                                            height={18}
                                            resizeMode="contain"
                                        />
                                        {tab === 3 ? <Text style={styles.mobileText}>{firstName ? firstName : 'profile'}</Text> : null}
                                    </View>
                                </TextLink>
                            </>
                        )}
                    </View>

                    <LinearGradient
                        colors={['rgba(0, 149, 255, 0.8)', 'rgba(0, 149, 255, 0.5)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        tint="light"
                        intensity={60}
                        style={[styles.mobileTabItem, {
                            alignItems: 'center',
                            borderRadius: 100,
                            paddingHorizontal: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.25)',
                            ...Platform.select({
                                web: {
                                    background: 'linear-gradient(to bottom, rgba(0, 149, 255, 0.8), rgba(0, 149, 255, 0.5))',
                                },
                            })
                        }]}
                    >
                        <Pressable onPress={() => setExtra(prev => !prev)}>
                            <Animated.View
                                style={{
                                    width: 20,
                                    height: 20,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    transform: [{ scale }],
                                }}
                            >
                                <Animated.View
                                    style={{
                                        width: 20,
                                        height: 20,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        transform: [{ rotate }],
                                    }}
                                >
                                    <View
                                        style={{
                                            position: 'absolute',
                                            width: 20,
                                            height: 2.4,
                                            backgroundColor: 'snow',
                                            borderRadius: 2
                                        }}
                                    />
                                    <View
                                        style={{
                                            position: 'absolute',
                                            width: 2.4,
                                            height: 20,
                                            backgroundColor: 'snow',
                                            borderRadius: 2
                                        }}
                                    />
                                </Animated.View>
                            </Animated.View>
                        </Pressable>
                    </LinearGradient>

                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0)', 'rgb(255, 255, 255)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{
                            paddingHorizontal: 5000,
                            flexDirection: 'row',
                            height: 100,
                            left: 0,
                            bottom: 0,
                            pointerEvents: 'none',
                            ...Platform.select({
                                web: {
                                    position: 'fixed',
                                    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgb(255, 255, 255))',
                                },
                                default: {
                                    position: 'absolute',
                                }
                            }),
                        }}>

                    </LinearGradient>

                </View>

                <LinearGradient
                    colors={['rgb(255, 255, 255)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                        top: 0,
                        left: 0,
                        height: '100%',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 99999,
                        width: '100%',
                        pointerEvents: 'none',
                        paddingHorizontal: 5000,
                        ...Platform.select({
                            web: {
                                position: 'fixed',
                                background: 'linear-gradient(to bottom, rgb(255, 255, 255), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0))'
                            },
                            default: {
                                position: 'absolute',
                            }
                        }),
                    }}>

                </LinearGradient>
            </>
        )
    }

    return (
        <>
            <Modal
                transparent={true}
                visible={locationOpen}
                animationType="fade"
                onRequestClose={() => setLocationOpen(false)}
            >
                <BlurView
                    tint="light"
                    intensity={40}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        ...Platform.select({
                            web: {
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }
                        })
                    }}
                >
                    <Pressable
                        style={{
                            flex: 1,
                            width: '100%',
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            ...Platform.select({ web: { cursor: 'default' } })
                        }}
                        onPress={() => setLocationOpen(false)}
                    >
                        <Location setLocationOpen={setLocationOpen} />
                    </Pressable>
                </BlurView>
            </Modal>

            <View style={{
                ...Platform.select({
                    web: { position: 'fixed' },
                    default: { position: 'absolute' }
                }),
                bottom: 30,
                left: 0,
                width: '100%',
                height: 40,
                zIndex: 999999,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'end',
                gap: 10,
            }}>

                <Pressable style={[styles.mobileTabItem,
                {
                    backgroundColor: '#007bff9e',
                    borderRadius: 100,
                    padding: 18,
                    borderWidth: 2,
                    alignItems: 'center',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    justifyContent: 'center',
                    transform: [{ translateX: -30 }]
                }
                ]} onPress={() => { setTimeout(() => setExtra(false), 600), scrollToTop() }}>
                    <Animated.View
                        style={{
                            width: 20,
                            height: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
                            transform: [{ scale }]
                        }}
                    >
                        <UniversalImage src={ArrowPng} alt='top' height={30} width={30} resizeMode='contain' />
                    </Animated.View>
                </Pressable>
            </View>

            <View style={styles.webHeaderWrapper}>
                <View style={styles.topBar}>
                    <View style={[styles.containerRow, { backgroundColor: '#f4f5f5', height: 28 }]}>
                        <View style={{ flexDirection: 'row' }}>
                            <Pressable onPress={() => setLocationOpen(true)} style={{ flexDirection: 'row', gap: 4 }}>
                                <UniversalImage
                                    src={GpsPng}
                                    alt="gps"
                                    width={18}
                                    height={18}
                                    resizeMode="contain"
                                />

                                <Text>{location}</Text>
                            </Pressable>
                            <Text> | </Text>
                            <TextLink href='/about/punkt'><Text>{lan === 'uz' ? 'Topshirish punktlari' : lan === 'en' ? 'Pickup points' : lan === 'ru' ? 'Пункты выдачи' : 'Topshirish punktlari'}</Text></TextLink>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 14, height: '100%' }}>
                            <TextLink href='https://seller.uzum.uz/?utm_source=uzum_market_main&utm_medium=web&utm_campaign=header_link'><Text>{lan === 'uz' ? "Sotuvchi bo'lish" : lan === 'en' ? 'Become a seller' : lan === 'ru' ? 'ПСтать продавцом' : "Sotuvchi bo'lish"}</Text></TextLink>
                            <Text>|</Text>
                            <TextLink href='https://promo.uzum.uz/uz/promo/pvz'><Text>{lan === 'uz' ? 'Topshirish punktini ochish' : lan === 'en' ? 'Open a pickup point' : lan === 'ru' ? 'Открыть пункт выдачи' : 'Topshirish punktini ochish'}</Text></TextLink>
                            <TextLink href='/savolJavob'><Text>{lan === 'uz' ? 'Savol-javob' : lan === 'en' ? 'FAQ (yoki Questions & Answers)' : lan === 'ru' ? 'Вопросы и ответы (или Частые вопросы)' : 'Savol-javob'}</Text></TextLink>
                            <Text>{lan === 'uz' ? 'Buyrutmalarim' : lan === 'en' ? 'My orders' : lan === 'ru' ? 'Мои заказы' : 'Buyrutmalarim'}</Text>
                            <View style={{ width: 80 }}>
                                {openLan ? <Language setOpenLan={setOpenLan} /> :
                                    <Pressable style={{ paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(226, 245, 255, 0.6)', width: '100%', alignItems: 'center', justifyItems: 'center', flexDirection: 'row', gap: 4 }} onPress={() => setOpenLan(prew => !prew)}>
                                        <UniversalImage
                                            src={lan === 'uz' ? UzPng : lan === 'ru' ? RuPng : lan === 'en' ? EnPng : ''}
                                            alt={lan === 'uz' ? 'uz' : lan === 'ru' ? 'ru' : lan === 'en' ? 'en' : ''}
                                            width={20}
                                            height={15}
                                            resizeMode="contain"
                                        />
                                        <Text style={{ textTransform: 'uppercase', fontSize: 15 }}>{lan}</Text>
                                    </Pressable>
                                }
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.mainHeader}>

                    <LinearGradient
                        colors={['rgb(255, 255, 255)', 'rgba(255, 255, 255, 0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{
                            pointerEvents: 'none',
                            paddingHorizontal: 5000,
                            flexDirection: 'row',
                            height: 100,
                            left: 0,
                            top: 30,
                            width: '100%',
                            ...Platform.select({
                                web: {
                                    position: 'fixed',
                                    background: 'linear-gradient(to top, rgba(255, 255, 255, 0), rgb(255, 255, 255))'
                                },
                                default: {
                                    position: 'absolute',
                                }
                            }),
                        }}>

                    </LinearGradient>

                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0)', 'rgb(255, 255, 255)']}
                        location={[0.9, 0.1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{
                            top: 0,
                            left: 0,
                            height: '100%',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 99999,
                            width: '100%',
                            pointerEvents: 'none',
                            paddingHorizontal: 5000,
                            ...Platform.select({
                                web: {
                                    position: 'fixed',
                                    background: 'linear-gradient(to top, rgb(255, 255, 255), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0), rgba(255, 255, 255, 0))'
                                },
                                default: {
                                    position: 'absolute',
                                }
                            }),
                        }}>

                    </LinearGradient>

                    <View style={[styles.containerRow, { zIndex: 999999999999 }]}>

                        <BlurView
                            intensity={50}
                            tint="light"
                            style={[StyleSheet.absoluteFill, { borderRadius: 100 }]}
                        />

                        <TextLink href='/'>
                            <View style={{ gap: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <UniversalImage
                                    src={GrapePng}
                                    alt="home Icon"
                                    width={30}
                                    height={30}
                                    resizeMode="contain"
                                />
                                <Text style={{ textTransform: 'capitalize', fontSize: 20, color: '#1A73E8', fontWeight: 'bold' }}>online market</Text>
                            </View>
                        </TextLink>

                        <TextLink href='/katalog'>
                            <View style={styles.navItem}>
                                <CatalogIcon />
                                <Text style={styles.navText}>{lan === 'uz' ? 'Katalog' : lan === 'en' ? 'Catalog' : lan === 'ru' ? 'Каталог' : 'Katalog'}</Text>
                            </View>
                        </TextLink>

                        <View style={styles.searchContainer}>
                            <TextInput
                                returnKeyType="search"
                                onSubmitEditing={() => router.push(`/search/${input.trim().toLowerCase().replace(/\s+/g, '-')}`)}
                                onChangeText={(text: string) => setInput(text)}
                                placeholder={`${lan === 'uz' ? 'Mahsulotlar va turkumlar izlash' : lan === 'en' ? 'Search products and categories' : lan === 'ru' ? 'Искать товары и категории' : 'Mahsulotlar va turkumlar izlash'}`}
                                style={styles.searchInput}
                                placeholderTextColor="#1A73E8"
                                value={input}
                            />
                            <TextLink href={`/search/${input.split(' ').join('-').toLocaleLowerCase().trim()}`} style={styles.searchIconWrapper}>
                                <SearchIcon />
                            </TextLink>
                        </View>

                        <View style={styles.navLinks}>
                            <TextLink href='/profile'>
                                <View style={styles.navItem}>
                                    <UniversalImage
                                        src={image}
                                        alt="profile"
                                        width={18}
                                        height={18}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.navText}>{firstName ? firstName : lan === 'uz' ? 'Kirish' : lan === 'en' ? 'Sign in' : lan === 'ru' ? 'Войти' : 'Kirish'}</Text>
                                </View>
                            </TextLink>
                            <TextLink href='/yoqtirilgan'>
                                <View style={styles.navItem}>
                                    <View style={styles.badgeContainer}>
                                        {yoqtirilganIds.length > 0 ? <View style={styles.webBadge}><Text style={styles.badgeText}>{yoqtirilganIds.length}</Text></View> : null}
                                        <HeartIcon />
                                    </View>
                                    <Text style={styles.navText}>{lan === 'uz' ? 'Saralangan' : lan === 'en' ? 'Favorites' : lan === 'ru' ? 'Избранное' : 'Saralangan'}</Text>
                                </View>
                            </TextLink>
                            <TextLink href='/savat'>
                                <View style={styles.navItem}>
                                    <View style={styles.badgeContainer}>
                                        <CartIcon />
                                        {uniqueItemsCount > 0 ? <View style={styles.webBadge}><Text style={styles.badgeText}>{uniqueItemsCount}</Text></View> : null}
                                    </View>
                                    <Text style={styles.navText}>{lan === 'uz' ? 'Savat' : lan === 'en' ? 'Cart' : lan === 'ru' ? 'Корзина' : 'Savat'}</Text>
                                </View>
                            </TextLink>

                        </View>

                    </View>
                </View>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    topBar: {
        backgroundColor: '#fff',
        paddingVertical: 6,
        zIndex: 99999999999999,
    },
    topBarText: {
        fontSize: 13,
        color: '#4d4e4e',
    },
    mainHeader: {
        ...Platform.select({
            web: {
                position: 'fixed',
            },
            default: {
                position: 'absolute',
            }
        }),
        top: 30,
        left: 0,
        right: 0,
        paddingVertical: 16,
        backgroundColor: 'transparent',
    },
    containerRow: {
        width: '100%',
        maxWidth: 1440,
        marginHorizontal: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 100,
        paddingVertical: 2,
        zIndex: 99999999999999,
        boxShadow: '0 0 5px rgb(226, 245, 255)',
        gap: 24
    },
    logoText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#3B9EFE',
        letterSpacing: -0.5,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgb(226, 245, 255)',
        borderRadius: 80,
        backgroundColor: 'rgba(226, 245, 255, 0.1)',
        height: '100%'
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        ...Platform.select({ web: { outlineStyle: 'none' } }),
    },
    searchIconWrapper: {
        padding: 10,
        borderRadius: 80,
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1A73E8',
    },
    iconText: {
        fontSize: 18,
    },
    mobileIcon: {
        fontSize: 22,
        marginBottom: 2,
    },
    badgeContainer: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: 'rgb(0, 166, 255)',
        borderRadius: 9,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    webBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: 'rgb(0, 166, 255)',
        borderRadius: 8,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    webHeaderWrapper: {
        width: '100%',
        backgroundColor: '#fff',
        ...Platform.select({
            web: {
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 100000,
            }
        })
    },
    mobileTabBarC: {
        ...Platform.select({
            web: {
                position: 'fixed',
            },
            default: {
                position: 'absolute',
            }
        }),
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        gap: 8,
        width: '100%',
        paddingBottom: 30,
    },
    mobileTabBar: {
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 99999,
        gap: 0,
        backgroundColor: 'rgba(235, 245, 255, 0.6)',
        borderRadius: 100,
        width: '76%',
        borderWidth: 1,
        borderColor: 'white',
        borderStyle: 'solid',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    mobileTabItem: {
        ...Platform.select({
            web: {
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
            },
        }),
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: '100%',
        backgroundColor: 'transparent',
        borderRadius: 100,
        flexDirection: 'row',
        gap: 8,
        zIndex: 9999999999999999999
    },
    mobileText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 2,
        textTransform: 'capitalize',
        color: '#1A73E8',
        fontWeight: '500'
    },
})

export default Header
