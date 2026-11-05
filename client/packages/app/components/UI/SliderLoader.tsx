import React from 'react'
import { View, useWindowDimensions } from 'react-native'

const SliderLoader = () => {

    const { width: screenWidth } = useWindowDimensions();
    return (
        <View style={{ width: '100%', height: screenWidth < 800 ? 150 : 370, backgroundColor: '#e5e7eb', borderRadius: 20 }}>

        </View>
    )
}

export default SliderLoader