import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TextLink } from 'solito/link'

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 10,
        minWidth: 300
    },
    btn: {
        backgroundColor: 'rgb(0, 149, 255)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        color: 'snow',
    },
    text: {
        color: 'snow'
    }
})

const AboutItem = () => {
    return (
        <View style={styles.item}>
            <TextLink href='/about/punkt'><View style={styles.btn}><Text style={styles.text}>topshirish punktlari</Text></View></TextLink>
            <TextLink href='/about/careres'><View style={styles.btn}><Text style={styles.text}>vakansiyalar</Text></View></TextLink>
        </View>
    )
}

export default AboutItem