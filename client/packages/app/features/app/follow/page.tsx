'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { useRouter } from 'solito/navigation'
import ScreenWrapper from 'app/components/layout/ScreenWrapper'
import { UniversalImage } from 'app/components/UI/UniversalImage'
import { fetchWithAuth } from 'app/features/app/auth/fetchWithAuth'
import { useLanStorage } from 'app/store/useLanStore'
import { useTokenStore } from 'app/store/useTokenStore'
import { useUrlStore } from 'app/store/useUrlStore'

interface Market {
    id: string
    title: string
    logo: string
}

interface FollowHistory {
    id: string
    follow: string[]
    block: string[]
}

interface FollowItem extends FollowHistory {
    marketId: string
    market: Market
    updatedAt: string
}

interface MarketSearchResult extends Market {
    following: FollowHistory | null
}

const translations = {
    uz: {
        title: 'Marketlarni kuzatish',
        subtitle: 'O‘zingizga yoqqan marketlarni toping va kuzatib boring.',
        search: 'Market nomi bo‘yicha qidiring',
        searchHint: 'Kamida 3 ta harf yozing',
        following: 'Kuzatayotganlar',
        results: 'Qidiruv natijalari',
        follow: 'Kuzatish',
        unfollow: 'Kuzatishni to‘xtatish',
        followedAt: 'Kuzatish vaqti',
        updatedAt: 'Oxirgi o‘zgarish',
        marketCaption: 'Market',
        emptyFollowing: 'Hozircha market kuzatmayapsiz.',
        emptySearch: 'Bu nom bo‘yicha market topilmadi.',
        startSearch: 'Market topish uchun nomidan bir necha harf yozing.',
        loadingError: 'Ma’lumotlarni yuklashda xatolik yuz berdi.',
        actionError: 'Amalni bajarib bo‘lmadi. Qayta urinib ko‘ring.',
        loginRequired: 'Davom etish uchun akkauntingizga kiring.',
        retry: 'Qayta urinish',
        dateLocale: 'uz-UZ',
    },
    en: {
        title: 'Discover markets',
        subtitle: 'Find the markets you like and keep up with them.',
        search: 'Search by market name',
        searchHint: 'Type at least 3 characters',
        following: 'Following',
        results: 'Search results',
        follow: 'Follow',
        unfollow: 'Unfollow',
        followedAt: 'Followed',
        updatedAt: 'Last changed',
        marketCaption: 'Market',
        emptyFollowing: 'You are not following any markets yet.',
        emptySearch: 'No markets found for this name.',
        startSearch: 'Type a few letters to find a market.',
        loadingError: 'Could not load the data.',
        actionError: 'The action failed. Please try again.',
        loginRequired: 'Sign in to continue.',
        retry: 'Try again',
        dateLocale: 'en-US',
    },
    ru: {
        title: 'Найти магазины',
        subtitle: 'Находите интересные магазины и следите за ними.',
        search: 'Поиск по названию магазина',
        searchHint: 'Введите не менее 3 символов',
        following: 'Вы подписаны',
        results: 'Результаты поиска',
        follow: 'Подписаться',
        unfollow: 'Отписаться',
        followedAt: 'Подписка',
        updatedAt: 'Последнее изменение',
        marketCaption: 'Магазин',
        emptyFollowing: 'Вы пока не подписаны на магазины.',
        emptySearch: 'Магазины с таким названием не найдены.',
        startSearch: 'Введите несколько букв, чтобы найти магазин.',
        loadingError: 'Не удалось загрузить данные.',
        actionError: 'Не удалось выполнить действие. Попробуйте ещё раз.',
        loginRequired: 'Войдите в аккаунт, чтобы продолжить.',
        retry: 'Повторить',
        dateLocale: 'ru-RU',
    },
}

const isMarket = (value: unknown): value is Market =>
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'logo' in value &&
    typeof value.logo === 'string'

const isTimestampArray = (value: unknown): value is string[] =>
    Array.isArray(value) &&
    value.every(timestamp => typeof timestamp === 'string' && !Number.isNaN(Date.parse(timestamp)))

const isFollowHistory = (value: unknown): value is FollowHistory =>
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'follow' in value &&
    isTimestampArray(value.follow) &&
    'block' in value &&
    isTimestampArray(value.block)

const isFollowItemArray = (value: unknown): value is FollowItem[] =>
    Array.isArray(value) &&
    value.every(item =>
        typeof item === 'object' &&
        item !== null &&
        isFollowHistory(item) &&
        'marketId' in item &&
        typeof item.marketId === 'string' &&
        'updatedAt' in item &&
        typeof item.updatedAt === 'string' &&
        'market' in item &&
        isMarket(item.market)
    )

const isSearchResultArray = (value: unknown): value is MarketSearchResult[] =>
    Array.isArray(value) &&
    value.every(item =>
        typeof item === 'object' &&
        item !== null &&
        isMarket(item) &&
        'following' in item &&
        (item.following === null || isFollowHistory(item.following))
    )

const FollowComponent = () => {
    const lan = useLanStorage(state => state.lan) as keyof typeof translations
    const t = translations[lan] || translations.uz
    const url = useUrlStore(state => state.url)
    const token = useTokenStore(state => state.token)
    const hasHydrated = useTokenStore(state => state.hasHydrated)
    const router = useRouter()

    const [followedMarkets, setFollowedMarkets] = useState<FollowItem[]>([])
    const [searchResults, setSearchResults] = useState<MarketSearchResult[]>([])
    const [inputValue, setInputValue] = useState('')
    const [loading, setLoading] = useState(true)
    const [searching, setSearching] = useState(false)
    const [error, setError] = useState('')
    const [pendingMarkets, setPendingMarkets] = useState<string[]>([])

    const normalizedQuery = inputValue.trim()
    const shouldSearch = normalizedQuery.length >= 3

    const fetchFollowedMarkets = useCallback(async (signal?: AbortSignal) => {
        const response = await fetchWithAuth(`${url}/followings/mine`, { method: 'GET', signal }, token)
        if (response.status === 401) {
            router.push('/auth')
            throw new Error(t.loginRequired)
        }
        if (!response.ok) throw new Error(`${t.loadingError} (${response.status})`)

        const data: unknown = await response.json()
        if (!isFollowItemArray(data)) throw new Error(t.loadingError)
        setFollowedMarkets(data)
    }, [router, t, token, url])

    useEffect(() => {
        if (!hasHydrated) return
        if (!token) {
            router.push('/auth')
            setLoading(false)
            return
        }

        const controller = new AbortController()
        setLoading(true)
        setError('')
        fetchFollowedMarkets(controller.signal)
            .catch((requestError: unknown) => {
                if (!controller.signal.aborted) {
                    setError(requestError instanceof Error ? requestError.message : t.loadingError)
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })

        return () => controller.abort()
    }, [fetchFollowedMarkets, hasHydrated, router, token, url])

    useEffect(() => {
        if (!hasHydrated || !token || !shouldSearch) {
            setSearchResults([])
            setSearching(false)
            return
        }

        const controller = new AbortController()
        setSearchResults([])
        setSearching(true)
        setError('')
        const timer = setTimeout(() => {
            fetchWithAuth(
                `${url}/followings/markets/search?q=${encodeURIComponent(normalizedQuery)}`,
                { method: 'GET', signal: controller.signal },
                token,
            )
                .then(async response => {
                    if (response.status === 401) {
                        router.push('/auth')
                        throw new Error(t.loginRequired)
                    }
                    if (!response.ok) throw new Error(`${t.loadingError} (${response.status})`)
                    const data: unknown = await response.json()
                    if (!isSearchResultArray(data)) throw new Error(t.loadingError)
                    setSearchResults(data)
                })
                .catch((requestError: unknown) => {
                    if (!controller.signal.aborted) {
                        setSearchResults([])
                        setError(requestError instanceof Error ? requestError.message : t.loadingError)
                    }
                })
                .finally(() => {
                    if (!controller.signal.aborted) setSearching(false)
                })
        }, 300)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [hasHydrated, normalizedQuery, router, shouldSearch, t, token, url])

    const handleFollowToggle = async (market: Market) => {
        if (pendingMarkets.includes(market.id)) return
        setPendingMarkets(current => [...current, market.id])
        setError('')

        try {
            const response = await fetchWithAuth(`${url}/followings/${market.id}`, {
                method: 'PATCH',
            }, token)
            if (response.status === 401) {
                router.push('/auth')
                throw new Error(t.loginRequired)
            }
            if (!response.ok) throw new Error(`${t.actionError} (${response.status})`)

            const data: unknown = await response.json()
            if (!isFollowHistory(data) || !('updatedAt' in data) || typeof data.updatedAt !== 'string') {
                throw new Error(t.actionError)
            }

            const updatedFollow: FollowItem = {
                id: data.id,
                follow: data.follow,
                block: data.block,
                updatedAt: data.updatedAt,
                marketId: market.id,
                market,
            }
            const isFollowing = data.follow.length % 2 === 1

            setFollowedMarkets(current => isFollowing
                ? [
                    updatedFollow,
                    ...current.filter(item => item.marketId !== market.id),
                ]
                : current.filter(item => item.marketId !== market.id))

            setSearchResults(current => current.map(result =>
                result.id === market.id
                    ? {
                        ...result,
                        following: { id: data.id, follow: data.follow, block: data.block },
                    }
                    : result
            ))
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : t.actionError)
        } finally {
            setPendingMarkets(current => current.filter(id => id !== market.id))
        }
    }

    const handleRetry = async () => {
        setError('')
        if (shouldSearch) {
            setSearching(true)
            try {
                const response = await fetchWithAuth(
                    `${url}/followings/markets/search?q=${encodeURIComponent(normalizedQuery)}`,
                    { method: 'GET' },
                    token,
                )
                if (response.status === 401) {
                    router.push('/auth')
                    throw new Error(t.loginRequired)
                }
                if (!response.ok) throw new Error(`${t.loadingError} (${response.status})`)
                const data: unknown = await response.json()
                if (!isSearchResultArray(data)) throw new Error(t.loadingError)
                setSearchResults(data)
            } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : t.loadingError)
            } finally {
                setSearching(false)
            }
            return
        }

        setLoading(true)
        try {
            await fetchFollowedMarkets()
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : t.loadingError)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (value: string) => {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        return new Intl.DateTimeFormat(t.dateLocale, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date)
    }

    const renderFollowedMarket = (item: FollowItem) => (
        <MarketCard
            key={item.marketId}
            market={item.market}
            followed
            timestampLabel={t.updatedAt}
            timestampValue={formatDate(item.updatedAt)}
            marketCaption={t.marketCaption}
            actionLabel={pendingMarkets.includes(item.marketId) ? '...' : t.unfollow}
            actionPending={pendingMarkets.includes(item.marketId)}
            onAction={() => handleFollowToggle(item.market)}
        />
    )

    const renderSearchMarket = (market: MarketSearchResult) => {
        const followed = (market.following?.follow.length ?? 0) % 2 === 1
        return (
            <MarketCard
                key={market.id}
                market={market}
                followed={followed}
                timestampLabel={t.followedAt}
                timestampValue={followed && market.following ? formatDate(market.following.follow.at(-1)) : undefined}
                marketCaption={t.marketCaption}
                actionLabel={pendingMarkets.includes(market.id) ? '...' : followed ? t.unfollow : t.follow}
                actionPending={pendingMarkets.includes(market.id)}
                onAction={() => handleFollowToggle(market)}
            />
        )
    }

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.hero}>
                    <View style={styles.heroIcon}>
                        <Text style={styles.heroIconText}>✦</Text>
                    </View>
                    <Text style={styles.heroTitle}>{t.title}</Text>
                    <Text style={styles.heroSubtitle}>{t.subtitle}</Text>
                </View>

                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>⌕</Text>
                    <TextInput
                        style={styles.searchInput}
                        onChangeText={setInputValue}
                        value={inputValue}
                        placeholder={t.search}
                        placeholderTextColor="#94A3B8"
                        returnKeyType="search"
                        autoCorrect={false}
                    />
                    {searching && <ActivityIndicator size="small" color="#0284C7" />}
                    {inputValue.length > 0 && (
                        <Pressable onPress={() => setInputValue('')} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>×</Text>
                        </Pressable>
                    )}
                </View>
                <Text style={styles.searchHint}>{t.searchHint}</Text>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Pressable onPress={handleRetry}>
                            <Text style={styles.retryText}>{t.retry}</Text>
                        </Pressable>
                    </View>
                ) : null}

                {!shouldSearch && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t.following}</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{followedMarkets.length}</Text>
                            </View>
                        </View>
                        {loading ? (
                            <View style={styles.loadingCard}>
                                <ActivityIndicator color="#0284C7" />
                            </View>
                        ) : followedMarkets.length > 0 ? (
                            followedMarkets.map(renderFollowedMarket)
                        ) : (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyIcon}>♡</Text>
                                <Text style={styles.emptyText}>{t.emptyFollowing}</Text>
                                <Text style={styles.emptyHint}>{t.startSearch}</Text>
                            </View>
                        )}
                    </View>
                )}

                {shouldSearch && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t.results}</Text>
                            {!searching && (
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>{searchResults.length}</Text>
                                </View>
                            )}
                        </View>
                        {searching ? (
                            <View style={styles.loadingCard}>
                                <ActivityIndicator color="#0284C7" />
                            </View>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(renderSearchMarket)
                        ) : !error ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyIcon}>⌕</Text>
                                <Text style={styles.emptyText}>{t.emptySearch}</Text>
                            </View>
                        ) : null}
                    </View>
                )}
            </View>
        </ScreenWrapper>
    )
}

interface MarketCardProps {
    market: Market
    followed: boolean
    timestampLabel: string
    timestampValue?: string
    marketCaption: string
    actionLabel: string
    actionPending: boolean
    onAction: () => void
}

const MarketCard = ({
    market,
    followed,
    timestampLabel,
    timestampValue,
    marketCaption,
    actionLabel,
    actionPending,
    onAction,
}: MarketCardProps) => (
    <View style={styles.marketCard}>
        <View style={styles.marketMain}>
            <UniversalImage
                src={market.logo}
                width={54}
                height={54}
                alt={market.title}
                resizeMode="cover"
                style={styles.marketLogo}
            />
            <View style={styles.marketDetails}>
                <Text style={styles.marketTitle} numberOfLines={1}>{market.title}</Text>
                {followed && timestampValue ? (
                    <Text style={styles.timestamp} numberOfLines={1}>
                        {timestampLabel}: {timestampValue}
                    </Text>
                ) : (
                    <Text style={styles.marketCaption}>{marketCaption}</Text>
                )}
            </View>
        </View>
        <View style={styles.marketActions}>
            <Pressable
                onPress={onAction}
                disabled={actionPending}
                style={({ pressed }: { pressed: boolean }) => [
                    styles.followButton,
                    followed ? styles.followingButton : styles.notFollowingButton,
                    pressed && styles.pressed,
                    actionPending && styles.disabled,
                ]}
            >
                {actionPending
                    ? <ActivityIndicator size="small" color={followed ? '#0369A1' : '#FFFFFF'} />
                    : <Text style={[styles.followButtonText, followed && styles.followingButtonText]}>{actionLabel}</Text>}
            </Pressable>
        </View>
    </View>
)

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 900,
        alignSelf: 'center',
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 32,
    },
    hero: {
        alignItems: 'center',
        paddingTop: 14,
        paddingBottom: 24,
    },
    heroIcon: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    heroIconText: {
        color: '#0284C7',
        fontSize: 28,
        fontWeight: '700',
    },
    heroTitle: {
        color: '#0F172A',
        fontSize: 25,
        fontWeight: '800',
        textAlign: 'center',
    },
    heroSubtitle: {
        maxWidth: 420,
        color: '#64748B',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        marginTop: 7,
    },
    searchBox: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            web: { boxShadow: '0 6px 20px rgba(15, 23, 42, 0.05)' },
            default: { elevation: 2 },
        }),
    },
    searchIcon: {
        color: '#0284C7',
        fontSize: 26,
        lineHeight: 30,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        height: 52,
        color: '#0F172A',
        fontSize: 15,
        outlineStyle: 'none',
    },
    clearButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    clearButtonText: {
        color: '#64748B',
        fontSize: 22,
        lineHeight: 25,
    },
    searchHint: {
        color: '#94A3B8',
        fontSize: 11,
        marginTop: 7,
        marginLeft: 5,
    },
    section: {
        marginTop: 26,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 13,
        gap: 9,
    },
    sectionTitle: {
        color: '#0F172A',
        fontSize: 18,
        fontWeight: '800',
    },
    countBadge: {
        minWidth: 25,
        height: 25,
        borderRadius: 13,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 7,
    },
    countText: {
        color: '#0369A1',
        fontSize: 12,
        fontWeight: '800',
    },
    marketCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        marginBottom: 10,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8EEF5',
        backgroundColor: '#FFFFFF',
        gap: 10,
        ...Platform.select({
            web: { boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)' },
            default: { elevation: 2 },
        }),
    },
    marketMain: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    marketLogo: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
    },
    marketDetails: {
        flex: 1,
        minWidth: 0,
    },
    marketTitle: {
        color: '#0F172A',
        fontSize: 15,
        fontWeight: '700',
    },
    marketCaption: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 5,
    },
    timestamp: {
        color: '#64748B',
        fontSize: 10,
        marginTop: 5,
    },
    marketActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    followButton: {
        minWidth: 88,
        minHeight: 38,
        paddingHorizontal: 12,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    notFollowingButton: {
        backgroundColor: '#0284C7',
        borderColor: '#0284C7',
    },
    followingButton: {
        backgroundColor: '#F0F9FF',
        borderColor: '#BAE6FD',
    },
    followButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    followingButtonText: {
        color: '#0369A1',
    },
    pressed: {
        opacity: 0.78,
        transform: [{ scale: 0.97 }],
    },
    disabled: {
        opacity: 0.7,
    },
    loadingCard: {
        minHeight: 100,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8EEF5',
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 30,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E8EEF5',
        backgroundColor: '#FFFFFF',
    },
    emptyIcon: {
        color: '#38BDF8',
        fontSize: 35,
        marginBottom: 9,
    },
    emptyText: {
        color: '#334155',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyHint: {
        color: '#94A3B8',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 6,
    },
    errorBox: {
        padding: 13,
        marginTop: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FECACA',
        backgroundColor: '#FEF2F2',
        gap: 7,
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 13,
    },
    retryText: {
        color: '#0369A1',
        fontSize: 13,
        fontWeight: '700',
    },
})

export default FollowComponent
