'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    useWindowDimensions,
    Platform,
    Animated,
    PanResponder,
    Pressable
} from 'react-native';
import ScreenWrapper from 'app/components/layout/ScreenWrapper';
import AboutWrapper from 'app/components/UI/AboutWrapper';

const deliveryPoints = [
    {
        id: 1,
        title: "Toshkent sh., Mirobod tumani, Mehrjon ko'chasi, 2 uy",
        hours: '10:00 - 20:00',
    },
    {
        id: 2,
        title: 'Toshkent sh., Yashnobod tumani, 2 mavzesi, 6 uy',
        hours: '10:00 - 20:00',
    },
    {
        id: 3,
        title: 'Toshkent sh., Shayxontohur tumani, Chorsu maydoni, 3A uy',
        hours: '10:00 - 20:00',
    },
    {
        id: 4,
        title: "Toshkent sh., Chilonzor tumani, Qatortol ko'chasi, 15 uy",
        hours: '10:00 - 20:00',
    },
];

export default function PunktPage() {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isLargeScreen = windowWidth > 950;

    const [select, setSelect] = useState(deliveryPoints)

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => {
                pan.setValue({
                    x: gestureState.dx * 0.3,
                    y: gestureState.dy * 0.3,
                });
            },
            onPanResponderRelease: () => {
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                    bounciness: 5,
                }).start();
            },
        })
    ).current;

    if (!isMounted) {
        return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
    }

    return (
        <ScreenWrapper>
            <View style={{ padding: 12, width: '100%', flex: 1 }}>
                <AboutWrapper>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Topshirish punkti</Text>
                            <Text style={styles.headerSub}>O'zbekiston bo'yicha topshirish punktlariga bepul yetkazib berish</Text>
                        </View>

                        <View style={[styles.content, { flexDirection: isLargeScreen ? 'row' : 'column', gap: 8 }]}>
                            <ScrollView
                                style={{
                                    width: isLargeScreen ? 400 : '100%',
                                    maxHeight: isLargeScreen ? '100%' : windowHeight * 0.35,
                                }}
                                contentContainerStyle={{
                                    padding: 20,
                                    paddingBottom: 40
                                }}
                                nestedScrollEnabled={true}
                                showsVerticalScrollIndicator={Platform.OS === 'web'}
                            >
                                {select.map((item) => (
                                    <View key={item.id} style={styles.card}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <View style={styles.hoursContainer}>
                                            <Text style={styles.hoursText}>Har kuni: {item.hours}</Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>

                            <View style={styles.mapWrapper}>
                                <Animated.View
                                    {...panResponder.panHandlers}
                                    style={[
                                        styles.mapContainer,
                                        {
                                            transform: [
                                                { translateX: pan.x },
                                                { translateY: pan.y }
                                            ]
                                        }
                                    ]}
                                >
                                    <View style={styles.mapCanvas}>
                                        <View style={styles.river} />

                                        <View style={[styles.road, { top: '25%', left: 0, right: 0, height: 12 }]} />
                                        <View style={[styles.road, { top: '65%', left: 0, right: 0, height: 16 }]} />
                                        <View style={[styles.road, { left: '35%', top: 0, bottom: 0, width: 14 }]} />
                                        <View style={[styles.road, { left: '70%', top: 0, bottom: 0, width: 12, transform: [{ rotate: '15deg' }] }]} />

                                        <View style={styles.ringRoad} />

                                        <Pressable onPress={() => setSelect([deliveryPoints[0]])} style={[styles.cluster, { top: '22%', left: '42%' }]}>
                                            <Text style={styles.clusterText}>193</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setSelect([deliveryPoints[1]])} style={[styles.cluster, { top: '28%', left: '68%' }]}>
                                            <Text style={styles.clusterText}>11</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setSelect([deliveryPoints[2]])} style={[styles.cluster, { top: '32%', left: '22%' }]}>
                                            <Text style={styles.clusterText}>51</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setSelect([deliveryPoints[3]])} style={[styles.cluster, { top: '58%', left: '25%' }]}>
                                            <Text style={styles.clusterText}>61</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setSelect([deliveryPoints[0]])} style={[styles.cluster, { top: '60%', left: '50%' }]}>
                                            <Text style={styles.clusterText}>108</Text>
                                        </Pressable>
                                    </View>
                                </Animated.View>
                            </View>
                        </View>
                    </View>
                </AboutWrapper>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f1f1f',
    },
    headerSub: {
        fontSize: 14,
        color: '#8b8b8b',
        marginTop: 6,
    },
    content: {
        flex: 1,
    },
    listContainer: {
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10
    },
    card: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 28,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e5eb',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f1f1f',
    },
    cardFeatures: {
        fontSize: 13,
        color: '#00B533',
        marginVertical: 6,
        fontWeight: '500',
    },
    hoursContainer: {
        marginTop: 2,
    },
    hoursText: {
        fontSize: 13,
        color: '#7f7f7f',
    },
    mapWrapper: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#fdfbf7',
        position: 'relative',
        minHeight: 400,
        borderRadius: 28
    },
    mapContainer: {
        position: 'absolute',
        top: '-15%',
        left: '-15%',
        width: '130%',
        height: '130%',
        ...Platform.select({
            web: {
                cursor: 'grab',
                userSelect: 'none',
            },
        }),
    },
    mapCanvas: {
        borderRadius: 28,
        flex: 1,
        backgroundColor: '#f9f6f0',
        position: 'relative',
    },
    river: {
        position: 'absolute',
        bottom: '20%',
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: '#c4e3f3',
        transform: [{ rotate: '-10deg' }],
    },
    road: {
        position: 'absolute',
        backgroundColor: '#fff8eb',
        borderColor: '#ebdcc5',
        borderWidth: 1,
    },
    ringRoad: {
        position: 'absolute',
        top: '15%',
        left: '15%',
        width: '70%',
        height: '70%',
        borderRadius: 999,
        borderWidth: 14,
        borderColor: '#fff8eb',
    },
    cluster: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgb(0, 149, 255)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#ffffff',
        zIndex: 99,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4 },
            android: { elevation: 5 },
            web: { boxShadow: '0px 4px 12px rgb(0, 149, 255)' },
        }),
    },
    clusterText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
});