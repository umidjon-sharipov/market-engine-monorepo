import React from 'react';
import { Image } from 'expo-image';

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
    width,
    height,
    resizeMode = 'contain',
    style,
    cachePolicy = 'memory-disk',
    transition = 200,
}: UniversalImageProps) {
    return (
        <Image
            source={src}
            style={[{ width, height }, style]}
            contentFit={resizeMode}
            cachePolicy={cachePolicy}
            transition={transition}
        />
    );
}
