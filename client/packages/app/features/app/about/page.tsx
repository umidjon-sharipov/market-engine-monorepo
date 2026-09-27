'use client'
import React, { useEffect } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'solito/navigation'

const About = () => {
    const router = useRouter()
    useEffect(() => {
        router.push('/about/punkt')
    }, [router])
    return (
        <View><Text>About</Text></View>
    )
}

export default About