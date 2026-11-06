import React from 'react'
import type { ColorValue, ViewProps } from 'react-native'
import type { LinearGradientPoint, LinearGradientProps } from 'expo-linear-gradient'
import NativeLinearGradient from 'expo-linear-gradient/build/NativeLinearGradient.web.js'

type WebGradientProps = ViewProps & {
    colors: readonly ColorValue[]
    locations?: readonly number[] | null
    startPoint?: readonly [number, number]
    endPoint?: readonly [number, number]
}

const WebLinearGradient = NativeLinearGradient as React.ComponentType<WebGradientProps>

function toPoint(point: LinearGradientPoint | null | undefined): readonly [number, number] | undefined {
    if (!point) return undefined
    return Array.isArray(point) ? point : [point.x, point.y]
}

export function LinearGradient({ colors, locations, start, end, dither, ...props }: LinearGradientProps) {
    return (
        <WebLinearGradient
            {...props}
            colors={colors}
            locations={locations}
            startPoint={toPoint(start)}
            endPoint={toPoint(end)}
        />
    )
}
