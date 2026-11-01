import React from 'react';
import { SolitoImage } from 'solito/image';

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
}: UniversalImageProps) {
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