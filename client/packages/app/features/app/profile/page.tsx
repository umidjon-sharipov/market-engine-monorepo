'use client'

import { Text, View, StyleSheet, ScrollView, Pressable, Animated, TextInput, useWindowDimensions, Platform } from 'react-native'
import { UniversalImage } from 'app/components/UI/UniversalImage'
import { useRouter } from 'solito/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useLanStorage } from 'app/store/useLanStore'
import UserPng from 'app/features/app/assets/user.png'
import ProfileImageUpload from './_components/ProfileImageUpload'
import { useTokenStore } from 'app/store/useTokenStore'
import { useLocationOpenStore } from 'app/store/useLocationOpenStore'
import { useUrlStore } from 'app/store/useUrlStore'

const translations = {
    uz: {
        myProfile: 'Mening Profilim',
        editProfile: 'Profilni tahrirlash',
        favourites: 'Sevimlilar',
        cart: 'Savat',
        language: 'Til',
        location: 'Joylashuv',
        orders: 'Buyurtmalar',
        feedPreference: 'Ekran sozlamalari',
        subscription: 'Kuzatish',
        clearCache: 'Keshni tozalash',
        deleteAkk: 'Hisobni O\'chirib tashlash',
        logout: 'Chiqib ketish',
        appVersion: 'Ilova versiyasi',
        yourInformation: 'Sizning Ma\'lumotlaringiz',
        firstName: 'Ism',
        lastName: 'Familiya',
        phone: 'Telefon raqam',
        emailId: 'Elektron pochta',
        gender: 'Jinsi',
        save: 'Saqlash',
        back: 'Orqaga',
        male: 'Erkak',
        female: 'Ayol',
        desktopWelcome: 'Xush kelibsiz! Bu yerda profilingiz va barcha sozlamalaringizni bir joyda boshqarishingiz mumkin.',
        quickStats: 'Tezkor Statistikalar',
        activeOrders: 'Faol Buyurtmalar',
        savedItems: 'Saqlanganlar',
        accountSettings: 'Hisob sozlamalari',
        generalSettings: 'Umumiy sozlamalar',
        systemData: 'Tizim va ma\'lumotlar',
    },

    en: {
        myProfile: 'My Profile',
        editProfile: 'Edit Profile',
        favourites: 'Favourites',
        cart: 'Cart',
        language: 'Language',
        location: 'Location',
        orders: 'Orders',
        feedPreference: 'Display settings',
        subscription: 'Follow',
        clearCache: 'Clear Cache',
        deleteAkk: 'Delete Account',
        logout: 'Log Out',
        appVersion: 'App Version',
        yourInformation: 'Your Information',
        firstName: 'First Name',
        lastName: 'Last Name',
        phone: 'Phone Number',
        emailId: 'Email',
        gender: 'Gender',
        save: 'Save',
        back: 'Back',
        male: 'Male',
        female: 'Female',
        desktopWelcome: 'Welcome! Here you can manage your profile and all your settings in one place.',
        quickStats: 'Quick Stats',
        activeOrders: 'Active Orders',
        savedItems: 'Saved Items',
        accountSettings: 'Account Settings',
        generalSettings: 'General Settings',
        systemData: 'System & Data',
    },
    ru: {
        myProfile: 'Мой профиль',
        editProfile: 'Редактировать профиль',
        favourites: 'Избранное',
        cart: 'Корзина',
        language: 'Язык',
        location: 'Местоположение',
        orders: 'Заказы',
        feedPreference: 'Параметры экрана',
        subscription: 'Подписаться',
        clearCache: 'Очистить кэш',
        deleteAkk: 'Удалить аккаунт',
        logout: 'Выйти',
        appVersion: 'Версия приложения',
        yourInformation: 'Ваша информация',
        firstName: 'Имя',
        lastName: 'Фамилия',
        phone: 'Номер телефона',
        emailId: 'Эл. почта',
        gender: 'Пол',
        save: 'Сохранить',
        back: 'Назад',
        male: 'Мужской',
        female: 'Женский',
        desktopWelcome: 'Добро пожаловать! Здесь вы можете управлять своим профилем и всеми настройками в одном месте.',
        quickStats: 'Быстрые статистические данные',
        activeOrders: 'Активные заказы',
        savedItems: 'Сохраненные',
        accountSettings: 'Настройки аккаунта',
        generalSettings: 'Общие настройки',
        systemData: 'Система и данные',
    }
}

const Profile = () => {
    const url = useUrlStore(state => state.url)
    const token = useTokenStore(state => state.token)
    const setToken = useTokenStore(state => state.setToken)
    const lan = useLanStorage(state => state.lan) as 'uz' | 'ru' | 'en'
    const setLan = useLanStorage(state => state.setLan)
    const t = translations[lan || 'uz']

    const { width } = useWindowDimensions();
    const isDesktop = width >= 800;

    const [isEditing, setIsEditing] = useState<boolean>(false)

    const [firstName, setFirstName] = useState<string>('FirstName')
    const [image, setImage] = useState(UserPng)
    const [lastName, setLastName] = useState<string>('LastName')
    const [phone, setPhone] = useState<string>('+99 888 90 90')
    const [email, setEmail] = useState<string>('Example@gmail.com')
    const [gender, setGender] = useState<string>('Male')
    const [bio, setBio] = useState('bio')
    const [focus, setFocus] = useState(0)
    const [genderOpen, setGenderOpen] = useState(false)
    const router = useRouter()
    const setOpenLocation = useLocationOpenStore(state => state.setLocationOpen)

    const scrollY = useRef(new Animated.Value(0)).current
    const fadeAnim = useRef(new Animated.Value(0)).current

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start()
    }, [isEditing])

    const avatarScale = scrollY.interpolate({
        inputRange: [-50, 0, 100, 110],
        outputRange: [2, 1, 0.55, 0.4],
        extrapolate: 'clamp',
    })

    const cycleLanguage = () => {
        if (lan === 'uz') setLan('en')
        else if (lan === 'en') setLan('ru')
        else setLan('uz')
    }

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
            setFirstName(req.firstName)
            setLastName(req.lastName)
            setPhone(req.phone)
            setEmail(req.email)
            setGender(req.gender)
            setBio(req.bio)
            setImage(req.image)
        } catch (err) {
            console.log(err)
        }
    }

    const handleDeleteAccount = async () => {
        try {
            const response = await fetch(`${url}/auth/account`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setToken('')

                window.location.href = '/auth';
            } else {
            }
        } catch (error) {
            console.error('Server bilan aloqada xatolik:', error);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const response = await fetch(`${url}/auth/update-profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    gender,
                    image,
                    bio,
                })
            });

            const data = await response.json();

            if (response.ok) {
                renderToken(token)
            } else {
            }
        } catch (error) {
            console.error('Server xatosi:', error);
        }
    };

    useEffect(() => {
        if (!token) {
            router.push('/auth')
        } else {
            renderToken(token)
        }
    }, [])


    return (
        <View style={styles.outerContainer}>
            <View style={styles.backgroundDecor}>
                <View style={styles.orbTop} />
                <View style={styles.orbBottom} />
            </View>

            <Animated.ScrollView
                contentContainerStyle={[styles.scrollContent, {
                    paddingVertical: isDesktop ? 24 : 0,
                    paddingHorizontal: isDesktop ? 16 : 0,
                }]}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <View style={[styles.mainWrapper, isDesktop && styles.desktopMaxWidth]}>

                    {!isEditing ? (
                        <View style={[styles.containerCard, isDesktop && styles.desktopGridContainer, {
                            paddingBottom: isDesktop ? 0 : 80,
                            paddingTop: isDesktop ? 100 : 40
                        }]}>

                            <View style={[styles.sidebarColumn, isDesktop && styles.desktopSidebarColumn, {
                                backgroundColor: isDesktop ? '#FFFFFF' : 'transparent',
                            }]}>
                                <View style={styles.phoneHeader}>
                                    {!isDesktop && (
                                        <Pressable style={styles.iconButton} onPress={() => router.back()}>
                                            <Text style={styles.headerNavArrow}>‹</Text>
                                        </Pressable>
                                    )}
                                    <Text style={styles.phoneHeaderTitle}>{isDesktop ? t.accountSettings : t.myProfile}</Text>
                                    <View style={[styles.iconButton, { backgroundColor: 'transparent' }]}>
                                    </View>
                                </View>

                                <View style={styles.profileCardClean}>
                                    <Animated.View style={[styles.avatarWrapper, {
                                        elevation: 120,
                                        shadowColor: `${gender === 'Male' ? '#0284C7' : 'red'}`,
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 1,
                                        shadowRadius: 120,
                                        borderRadius: 10000000,
                                        transform: [{ scale: avatarScale }],
                                    }]}>
                                        <Animated.View style={[styles.avatarContainer, {
                                            borderColor: gender === 'Male' ? '#00E5FF' : '#FF007F',
                                        }]}>
                                            <UniversalImage
                                                src={image}
                                                alt="Profile"
                                                width={80}
                                                height={80}
                                                resizeMode="cover"
                                            />
                                        </Animated.View>
                                        <Pressable style={styles.cameraBadge}>
                                            <ProfileImageUpload render={renderToken} gender={gender} />
                                        </Pressable>
                                    </Animated.View>

                                    <Text style={styles.profileName}>{firstName} {lastName}</Text>
                                    <Text style={styles.profileEmail}>{email}</Text>
                                    <Text style={styles.profileEmail}>{bio}</Text>

                                    <Pressable
                                        android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
                                        style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
                                            [styles.editProfileButton, { transition: 'all 0.3s' }],
                                            {
                                                background: (hovered || pressed)
                                                    ? 'linear-gradient(#0284C7, #00E5FF)'
                                                    : 'linear-gradient(#00E5FF, #0284C7)'
                                            },
                                            pressed && [styles.editProfileButtonPressed, {
                                                elevation: 6,
                                                shadowColor: '#0284C7',
                                                shadowOffset: { width: 0, height: 0 },
                                                shadowOpacity: 0.8,
                                                shadowRadius: 8,
                                                opacity: 0.6,
                                                transform: [{ scale: 0.95 }]
                                            }],
                                            hovered && {
                                                elevation: 6,
                                                shadowColor: '#0284C7',
                                                shadowOffset: { width: 0, height: 0 },
                                                shadowOpacity: 0.8,
                                                shadowRadius: 8,
                                            }
                                        ]}
                                        onPress={() => setIsEditing(true)}
                                    >
                                        {({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => (
                                            <LinearGradient
                                                colors={(hovered || pressed) ? ['#0284C7', '#00E5FF'] : ['#00E5FF', '#0284C7']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0, y: 1 }}
                                                style={styles.editProfileGradient}
                                            >
                                                <Text style={styles.editProfileButtonText}>{t.editProfile}</Text>
                                            </LinearGradient>
                                        )}
                                    </Pressable>
                                </View>

                                <View style={styles.menuGroup}>
                                    <Pressable android_ripple={{ color: 'rgba(0, 229, 255, 0.2)' }} onPress={() => router.push('/yoqtirilgan')} style={styles.menuRow}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>🤍</Text>
                                            <Text style={styles.menuRowText}>{t.favourites}</Text>
                                        </View>
                                        <Text style={styles.menuArrow}>›</Text>
                                    </Pressable>

                                    <Pressable android_ripple={{ color: 'rgba(0, 229, 255, 0.2)' }} onPress={() => router.push('/savat')} style={styles.menuRow}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>🛒</Text>
                                            <Text style={styles.menuRowText}>{t.cart}</Text>
                                        </View>
                                        <Text style={styles.menuArrow}>›</Text>
                                    </Pressable>
                                </View>
                            </View>

                            <View style={[styles.contentColumn, isDesktop && styles.desktopContentColumn, {
                                backgroundColor: isDesktop ? '#FFFFFF' : 'transparent',
                            }]}>
                                <View style={styles.menuGroup}>
                                    <Text style={styles.desktopSectionHeader}>{t.generalSettings}</Text>
                                    <Pressable android_ripple={{ color: 'rgba(0, 229, 255, 0.2)' }} style={styles.menuRow} onPress={cycleLanguage}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>🌐</Text>
                                            <Text style={styles.menuRowText}>{t.language}</Text>
                                        </View>
                                        <Text style={styles.menuArrow}>›</Text>
                                    </Pressable>

                                    <Pressable android_ripple={{ color: 'rgba(0, 229, 255, 0.2)' }} onPress={() => setOpenLocation(prev => !prev)} style={styles.menuRow}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>📍</Text>
                                            <Text style={styles.menuRowText}>{t.location}</Text>
                                        </View>
                                        <Text style={styles.menuArrow}>›</Text>
                                    </Pressable>

                                    <Pressable android_ripple={{ color: 'rgba(0, 229, 255, 0.2)' }} style={styles.menuRow}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>📦</Text>
                                            <Text style={styles.menuRowText}>{t.orders}</Text>
                                        </View>
                                        <Text style={styles.menuArrow}>›</Text>
                                    </Pressable>

                                    <Pressable android_ripple={{ color: 'rgba(0, 229, 255, 0.2)' }} style={styles.menuRow}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>📱</Text>
                                            <Text style={styles.menuRowText}>{t.feedPreference}</Text>
                                        </View>
                                        <Text style={styles.menuArrow}>›</Text>
                                    </Pressable>

                                    <Pressable onPress={() => router.push('/follow')} android_ripple={{ color: 'rgba(0, 229, 255, 0.2)' }} style={styles.menuRow}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>🏪</Text>
                                            <Text style={styles.menuRowText}>{t.subscription}</Text>
                                        </View>
                                        <Text style={styles.menuArrow}>›</Text>
                                    </Pressable>
                                </View>

                                <View style={styles.menuGroup}>
                                    <Text style={styles.desktopSectionHeader}>{t.systemData}</Text>
                                    <Pressable android_ripple={{ color: 'rgba(0, 229, 255, 0.2)' }} style={styles.menuRow}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>🗑️</Text>
                                            <Text style={styles.menuRowText}>{t.clearCache}</Text>
                                        </View>
                                        <Text style={styles.menuArrow}>›</Text>
                                    </Pressable>

                                    <Pressable onPress={handleDeleteAccount} android_ripple={{ color: 'rgba(239, 68, 68, 0.2)' }} style={styles.menuRow}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>⚠️</Text>
                                            <Text style={[styles.menuRowText, styles.logoutTextLabel]}>{t.deleteAkk}</Text>
                                        </View>
                                        <Text style={[styles.menuArrow, styles.logoutTextLabel]}>›</Text>
                                    </Pressable>

                                    <Pressable onPress={() => { setToken(''), renderToken(token), router.push('auth') }} android_ripple={{ color: 'rgba(239, 68, 68, 0.2)' }} style={styles.menuRow}>
                                        <View style={styles.menuRowLeft}>
                                            <Text style={styles.menuEmoji}>🚪</Text>
                                            <Text style={[styles.menuRowText, styles.logoutTextLabel]}>{t.logout}</Text>
                                        </View>
                                        <Text style={[styles.menuArrow, styles.logoutTextLabel]}>›</Text>
                                    </Pressable>
                                </View>

                                <Text style={styles.versionFooterText}>{t.appVersion} 3.0.0</Text>
                            </View>

                        </View>
                    ) : (
                        <View style={[styles.containerCard, {
                            maxWidth: isDesktop ? 800 : 900, alignSelf: 'center',
                            paddingTop: isDesktop ? 100 : 40,
                            paddingBottom: isDesktop ? 20 : 100,
                            marginTop: isDesktop ? 100 : 0,
                            marginBottom: isDesktop ? 100 : 0,
                        }]}>
                            <View style={styles.phoneHeader}>
                                <Pressable style={styles.iconButton} onPress={() => { setIsEditing(false), renderToken(token) }}>
                                    <Text style={styles.headerNavArrow}>‹</Text>
                                </Pressable>
                                <Text style={styles.phoneHeaderTitle}>{t.editProfile}</Text>
                                <Pressable
                                    style={[styles.iconButton, styles.checkButtonBg]}
                                    onPress={() => setIsEditing(false)}
                                >
                                    <Text style={styles.checkIconText}>✓</Text>
                                </Pressable>
                            </View>

                            <View style={[styles.inputBox, isDesktop && { flex: 1 }, focus === 8 ? styles.inputBoxActive : null]}>
                                <Text style={styles.inputLabel}>{t.firstName}</Text>
                                <TextInput
                                    multiline={true}
                                    numberOfLines={5}
                                    placeholder="Matn kiriting..."
                                    style={[styles.textInput, { width: '100%' }]}
                                    value={bio}
                                    onChangeText={(text: string) => {
                                        const letters = text.match(/[a-zA-Zа-яА-ЯoʻgʻOʻGʻ\u0400-\u04FF]/g) || [];
                                        if (letters.length <= 140) setBio(text);
                                    }}
                                    onFocus={() => setFocus(8)}
                                    onBlur={() => setFocus(0)}
                                    placeholderTextColor="#64748B"
                                />
                            </View>

                            <View style={styles.formContainer}>
                                <Text style={styles.formSectionTitle}>{t.yourInformation}</Text>

                                <View style={isDesktop ? styles.desktopFormRow : null}>
                                    <View style={[styles.inputBox, isDesktop && { flex: 1 }, focus === 1 ? styles.inputBoxActive : null]}>
                                        <Text style={styles.inputLabel}>{t.firstName}</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={firstName}
                                            placeholder='First name...'
                                            onChangeText={setFirstName}
                                            onFocus={() => setFocus(1)}
                                            onBlur={() => setFocus(0)}
                                            placeholderTextColor="#64748B"
                                        />
                                    </View>

                                    <View style={[styles.inputBox, isDesktop && { flex: 1 }, focus === 2 ? styles.inputBoxActive : null]}>
                                        <Text style={styles.inputLabel}>{t.lastName}</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={lastName}
                                            onFocus={() => setFocus(2)}
                                            onBlur={() => setFocus(0)}
                                            placeholder='Last name...'
                                            onChangeText={setLastName}
                                            placeholderTextColor="#64748B"
                                        />
                                    </View>
                                </View>

                                <View style={isDesktop ? styles.desktopFormRow : null}>
                                    <View style={[styles.inputBox, isDesktop && { flex: 1 }, focus === 3 ? styles.inputBoxActive : null]}>
                                        <Text style={styles.inputLabel}>{t.phone}</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={phone}
                                            placeholder='Phone number...'
                                            onChangeText={(text: string) => {
                                                if (!text.startsWith('+998 ')) {
                                                    text = '+998 ';
                                                }

                                                const rawNumber = text.replace(/[^\d]/g, '').slice(3);

                                                let formatted = '+998 ';
                                                if (rawNumber.length > 0) formatted += rawNumber.substring(0, 2);
                                                if (rawNumber.length > 2) formatted += ' ' + rawNumber.substring(2, 5);
                                                if (rawNumber.length > 5) formatted += ' ' + rawNumber.substring(5, 7);
                                                if (rawNumber.length > 7) formatted += ' ' + rawNumber.substring(7, 9);

                                                setPhone(formatted);
                                            }}
                                            onFocus={() => setFocus(3)}
                                            onBlur={() => setFocus(0)}
                                            placeholderTextColor="#64748B"
                                        />
                                    </View>

                                    <View style={[styles.inputBox, isDesktop && { flex: 1 }, focus === 4 ? styles.inputBoxActive : null]}>
                                        <Text style={styles.inputLabel}>{t.emailId}</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={email}
                                            placeholder='Email...'
                                            onChangeText={setEmail}
                                            onFocus={() => setFocus(4)}
                                            onBlur={() => setFocus(0)}
                                            placeholderTextColor="#64748B"
                                        />
                                    </View>
                                </View>

                                <View style={[styles.inputBox, genderOpen ? styles.inputBoxActive : null]}>
                                    <Text style={styles.inputLabel}>{t.gender}</Text>
                                    <Pressable onPress={() => setGenderOpen(prev => !prev)} style={[styles.selectRow, { flexDirection: genderOpen ? 'column' : 'row', gap: 5 }]}>
                                        <Text style={styles.selectText}>{gender === 'Male' ? t.male : t.female}</Text>
                                        {genderOpen ? null : <Text style={styles.selectArrow}>▼</Text>}
                                        {
                                            genderOpen ? (
                                                <Pressable onPress={() => { setGender(prev => prev === 'Male' ? 'Female' : 'Male'), setGenderOpen(false) }}>
                                                    <Text style={styles.selectText}>{gender === 'Male' ? t.female : t.male}</Text>
                                                </Pressable>
                                            ) : null
                                        }
                                    </Pressable>
                                </View>

                                <Pressable
                                    android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
                                    style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
                                        [styles.saveButtonWrapper, { borderWidth: 0.1, borderColor: '#00E5FF', transition: 'all 0.3s' }],
                                        {
                                            background: (hovered || pressed)
                                                ? 'linear-gradient(#0284C7, #00E5FF)'
                                                : 'linear-gradient(#00E5FF, #0284C7)'
                                        },
                                        pressed && [styles.editProfileButtonPressed, {
                                            elevation: 6,
                                            shadowColor: '#0284C7',
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 0.8,
                                            shadowRadius: 8,
                                            opacity: 0.6,
                                            transform: [{ scale: 0.95 }]
                                        }],
                                        hovered && {
                                            elevation: 6,
                                            shadowColor: '#0284C7',
                                            shadowOffset: { width: 0, height: 0 },
                                            shadowOpacity: 0.8,
                                            shadowRadius: 8,
                                        }
                                    ]}
                                    onPress={() => { setIsEditing(false), handleUpdateProfile() }}
                                >
                                    {({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => (
                                        <LinearGradient
                                            colors={(hovered || pressed) ? ['#0284C7', '#00E5FF'] : ['#00E5FF', '#0284C7']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                            style={styles.editProfileGradient}
                                        >
                                            <Text style={styles.editProfileButtonText}>{t.save}</Text>
                                        </LinearGradient>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    )}

                </View>
            </Animated.ScrollView>
        </View>
    )
}

export default Profile

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#F8FAFC',
    },
    backgroundDecor: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
    },
    orbTop: {
        position: 'absolute',
        top: -60,
        left: -60,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(0, 229, 255, 0.12)',
    },
    orbBottom: {
        position: 'absolute',
        bottom: -60,
        right: -60,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: 'rgba(2, 132, 199, 0.08)',
    },
    scrollContent: {
        alignItems: 'center',
    },
    mainWrapper: {
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
    },
    desktopMaxWidth: {
        paddingHorizontal: 16,
    },
    desktopWelcomeCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 28,
        marginBottom: 20,
        ...Platform.select({
            web: {
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
            },
            default: {
                elevation: 3
            }
        }),
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    desktopWelcomeTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    desktopWelcomeSubtitle: {
        fontSize: 14,
        color: '#64748B',
        maxWidth: 600,
    },
    desktopStatsContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    statBox: {
        backgroundColor: '#F8FAFC',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0284C7',
    },
    statLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    containerCard: {
        width: '100%',
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        paddingBottom: 40,
        ...Platform.select({
            web: {
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            },
            default: {
                elevation: 4
            }
        }),
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    desktopGridContainer: {
        maxWidth: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 24,
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        ...Platform.select({
            web: { boxShadow: 'none' },
            default: { elevation: 0 }
        })
    },
    sidebarColumn: {
        width: '100%',
    },
    desktopSidebarColumn: {
        width: '380px',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' },
            default: { elevation: 3 }
        })
    },
    contentColumn: {
        width: '100%',
    },
    desktopContentColumn: {
        flex: 1,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Platform.select({
            web: { boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' },
            default: { elevation: 3 }
        })
    },
    desktopSectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 4,
        paddingHorizontal: 4,
    },
    desktopFormRow: {
        flexDirection: 'row',
        gap: 12,
    },
    phoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerNavArrow: {
        fontSize: 26,
        fontWeight: '600',
        color: '#0F172A',
        marginTop: -2,
    },
    phoneHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    checkButtonBg: {
        backgroundColor: 'rgba(0, 229, 255, 0.15)',
    },
    checkIconText: {
        color: '#00A8CC',
        fontSize: 18,
        fontWeight: '800',
    },
    profileCardClean: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            },
            default: {
                elevation: 2
            }
        }),
    },
    cameraBadgeText: {
        fontSize: 12,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
    },
    editProfileButton: {
        borderRadius: 24,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 220,
        transition: 'all 0.3s ease'
    },
    editProfileGradient: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editProfileButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    menuGroup: {
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        paddingVertical: 6,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    menuEmoji: {
        fontSize: 18,
    },
    menuRowText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    logoutTextLabel: {
        color: '#EF4444',
    },
    menuArrow: {
        fontSize: 18,
        color: '#94A3B8',
        fontWeight: '700',
    },
    versionFooterText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 8,
        marginBottom: 4,
    },
    formContainer: {
        width: '100%',
    },
    formSectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    inputBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 14,
    },
    inputBoxActive: {
        borderColor: '#00E5FF',
        backgroundColor: '#F0FDFA',
    },
    inputLabel: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 4,
    },
    textInput: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
        paddingVertical: 4,
    },
    selectRow: {
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    selectText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    selectArrow: {
        fontSize: 11,
        color: '#64748B',
    },
    saveButtonWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        marginTop: 12,
        width: '100%',
    },
    saveButtonGradient: {
        payddingVertical: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    }
})