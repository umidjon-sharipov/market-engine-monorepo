import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TextLink } from 'solito/link'
import AnimatedPressable from 'app/components/UI/AnimatedPressable'
import { useLanStorage } from 'app/store/useLanStore'
import { useDesignStore } from 'app/store/useDesignStore'

const AboutItem = () => {
    const lan = useLanStorage(state => state.lan)
    const theme = useDesignStore(state => state.theme)
    const accent = useDesignStore(state => state.accentColor)
    const dark = theme === 'dark'
    const labels = lan === 'en'
        ? { points: 'Pickup points', vacancies: 'Careers' }
        : lan === 'ru'
            ? { points: 'Пункты выдачи', vacancies: 'Вакансии' }
            : { points: 'Topshirish punktlari', vacancies: 'Vakansiyalar' }

    return (
        <View style={styles.item}>
            {[
                { href: '/about/punkt', label: labels.points },
                { href: '/about/careres', label: labels.vacancies },
            ].map(({ href, label }) => (
                <TextLink key={href} href={href} style={styles.link}>
                    <AnimatedPressable
                        style={[
                            styles.button,
                            {
                                backgroundColor: dark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.72)',
                                borderColor: `${accent}55`,
                            },
                        ]}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.text, { color: dark ? '#e2e8f0' : '#0f172a' }]}>{label}</Text>
                    </AnimatedPressable>
                </TextLink>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    link: {
        flexGrow: 1,
        flexBasis: 140,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
    },
    text: {
        fontWeight: '700',
        fontSize: 13,
        textAlign: 'center',
    },
})

export default AboutItem