'use client'

import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native'
import ScreenWrapper from 'app/components/layout/ScreenWrapper'
import { UniversalImage } from 'app/components/UI/UniversalImage'
import { useTokenStore } from 'app/store/useTokenStore'
import { useLanStorage } from 'app/store/useLanStore'
import { useUrlStore } from 'app/store/useUrlStore'

interface Market {
    id: string
    title: string
    logo: string
}

interface Follow {
    id: string
    userId: string
    following: string[]
}

const FollowComponent = () => {
    const lan = useLanStorage(state => state.lan)
    const url = useUrlStore(state => state.url)
    const [markets, setMarkets] = useState<Market[]>([])
    const [userFollowingIds, setUserFollowingIds] = useState<string[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const token = useTokenStore(state => state.token)
    const [inputValue, setInputValue] = useState('')
    const [filteredMarkets, setFilteredMarkets] = useState<Market[]>(markets)

    const fetchAllData = async (token: string) => {
        try {
            const profileRes = await fetch(`${url}/auth/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const profileData = await profileRes.json()
            const userEmail = profileData?.email

            const usersRes = await fetch(`${url}/users`)
            const usersData = await usersRes.json()
            const currentUser = usersData.find((u: any) => u.email === userEmail)
            const currentUserId = currentUser?.id

            const [marketsRes, followingsRes] = await Promise.all([
                fetch(`${url}/markets`),
                fetch(`${url}/followings`)
            ])

            const marketsData = await marketsRes.json()
            const followingsData = await followingsRes.json()

            setMarkets(marketsData)
            setFilteredMarkets(marketsData)

            if (currentUserId) {
                const userFollowObj = followingsData.find((f: Follow) => f.userId === currentUserId)
                if (userFollowObj) {
                    setUserFollowingIds(userFollowObj.following || [])
                }
            }
        } catch (err) {
            console.error("Ma'lumotlarni yuklashda xatolik:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleInputValidate = () => {
        if (inputValue === '') {
            setFilteredMarkets(markets)
        } else {
            setFilteredMarkets(markets.filter((market: Market) => market.title.toLowerCase().includes(inputValue.toLowerCase().trim())))
        }
    }

    useEffect(() => {
        fetchAllData(token)
    }, [token])

    useEffect(() => {
        handleInputValidate()
    }, [inputValue])

    const handleFollowToggle = async (marketId: string) => {
        try {
            const res = await fetch(`${url}/followings/${marketId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: marketId })
            })

            if (res.ok) {
                fetchAllData(token)
            } else {
                const err = await res.json()
                console.log(err.message)
            }
        } catch (err) {
            console.log(`So'rov yuborilmadi ${err}`)
        }
    }

    const handleChatPress = (marketId: string) => {
        Alert.alert("Chat / Message", `Market ID: ${marketId}`)
    }

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            </ScreenWrapper>
        )
    }

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <TextInput
                    style={styles.searchInput}
                    onChangeText={setInputValue}
                    value={inputValue}
                    placeholder={lan === 'uz' ? `Qidirish...` : lan === 'en' ? `Search...` : lan === 'ru' ? 'Поиск' : 'Qidirish...'}
                    placeholderTextColor="#A0AEC0"
                />

                <Text style={styles.headerTitle}>{lan === 'uz' ? 'Barcha Marketlar' : lan === 'en' ? 'All Markets' : lan === 'ru' ? 'Все Mаркеты' : 'Barcha Marketlar'}</Text>

                {filteredMarkets.map((market: Market) => {
                    const isFollowing = userFollowingIds.includes(market.id)

                    return (
                        <View key={market.id} style={styles.card}>
                            <View style={styles.leftContainer}>
                                <UniversalImage
                                    src={market.logo}
                                    width={45}
                                    height={45}
                                    alt={market.title}
                                    resizeMode='cover'
                                    style={styles.logo}
                                />
                                <Text style={styles.title} numberOfLines={1}>{market.title}</Text>
                            </View>

                            <View style={styles.rightContainer}>
                                <TouchableOpacity
                                    style={[styles.button, isFollowing ? styles.followingBtn : styles.followBtn]}
                                    onPress={() => handleFollowToggle(market.id)}
                                >
                                    <Text style={[styles.buttonText, isFollowing ? styles.followingText : styles.followText]}>
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.chatButton}
                                    onPress={() => handleChatPress(market.id)}
                                >
                                    <Text style={styles.chatButtonText}>Chat</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                })}
            </View>
        </ScreenWrapper>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    logo: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#EDF2F7',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D3748',
        marginLeft: 12,
        flex: 1,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    followBtn: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    followingBtn: {
        backgroundColor: '#EDF2F7',
        borderColor: '#CBD5E0',
    },
    buttonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    followText: {
        color: '#FFFFFF',
    },
    followingText: {
        color: '#4A5568',
    },
    chatButton: {
        backgroundColor: '#E2E8F0',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    chatButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2D3748',
    },
    searchInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#2D3748',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
})

export default FollowComponent