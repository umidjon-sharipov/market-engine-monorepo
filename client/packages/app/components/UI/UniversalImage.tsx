import React from 'react';
import { Platform } from 'react-native';
import { SolitoImage } from 'solito/image';

let ExpoImage: any = null;
if (Platform.OS !== 'web') {
    try {
        ExpoImage = require('expo-image').Image;
    } catch (e) {

    }
}

interface UniversalImageProps {
    src: string | any;
    alt?: string;
    width?: number;
    height?: number;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
    style?: any;
    cachePolicy?: string;
    transition?: number;
}

export function UniversalImage({
    src,
    alt = '',
    width,
    height,
    resizeMode = 'contain',
    style,
    cachePolicy = 'memory-disk',
    transition = 200,
}: UniversalImageProps) {
    if (Platform.OS !== 'web' && ExpoImage) {
        return (
            <ExpoImage
                source={src}
                style={[{ width, height }, style]}
                contentFit={resizeMode}
                cachePolicy={cachePolicy}
                transition={transition}
            />
        );
    }

    return (
        <SolitoImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            resizeMode={resizeMode}
            // @ts-ignore
            style={style}
        />
    );
}