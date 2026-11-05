import React, { useRef } from 'react';
import {
    Animated,
    Pressable,
    type PressableProps,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { useNativeAnimDriver } from 'app/utils/animation';

type AnimatedPressableProps = Omit<PressableProps, 'style' | 'children'> & {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    pressScale?: number;
};

export default function AnimatedPressable({
    children,
    onPressIn,
    onPressOut,
    pressScale = 0.975,
    style,
    ...props
}: AnimatedPressableProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const animateScale = (toValue: number) => {
        Animated.spring(scale, {
            toValue,
            damping: 20,
            stiffness: 320,
            useNativeDriver: useNativeAnimDriver,
        }).start();
    };

    return (
        <Pressable
            {...props}
            style={style}
            onPressIn={(event) => {
                animateScale(pressScale);
                onPressIn?.(event);
            }}
            onPressOut={(event) => {
                animateScale(1);
                onPressOut?.(event);
            }}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                {children}
            </Animated.View>
        </Pressable>
    );
}
