import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { useTokenStore } from 'app/store/useTokenStore';
import { useUrlStore } from 'app/store/useUrlStore';
import { fetchWithAuth } from 'app/features/app/auth/fetchWithAuth';

interface Props {
    currentImage?: string;
    onImageUpdated?: (newUrl: string) => void;
    render?: (token: string) => void;
    gender: string;
}

export default function ProfileImageUpload({ currentImage, onImageUpdated, render, gender }: Props) {
    const url = useUrlStore(state => state.url)
    const token = useTokenStore(state => state.token);
    const [loading, setLoading] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(currentImage || null);

    const uploadToBackend = async (formData: FormData) => {
        setLoading(true);
        try {
            const response = await fetchWithAuth(`${url}/auth/image`, {
                method: 'PATCH',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                if (render && token) {
                    render(useTokenStore.getState().token);
                }

                if (onImageUpdated && data.image) {
                    onImageUpdated(data.image);
                }
            } else {
                const errorMsg = data.message || 'Yuklab bo‘lmadi';
                console.log(data)
            }
        } catch (error) {
            console.error(error);
            const errText = 'Server bilan ulanishda xatolik';
        } finally {
            setLoading(false);
        }
    };

    const handleWebFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUri(URL.createObjectURL(file));

        const formData = new FormData();
        formData.append('image', file);
        await uploadToBackend(formData);
    };

    const handleMobilePickImage = async () => {
        try {
            const ImagePicker = await import('expo-image-picker');

            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            setImageUri(asset.uri);

            const formData = new FormData();
            const fileData = {
                uri: asset.uri,
                type: 'image/jpeg',
                name: asset.fileName || 'profile.jpg',
            } as any;

            formData.append('image', fileData);
            await uploadToBackend(formData);
        } catch (err) {
            console.error('Expo Image Picker import xatosi:', err);
        }
    };

    return (
        Platform.OS === 'web' ? (
            <label style={StyleSheet.flatten([styles.webButton, { backgroundColor: gender === 'Male' ? '#1A73E8' : '#EA4335' }])}>
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleWebFileChange}
                    disabled={loading}
                />
            </label>
        ) : (
            <TouchableOpacity style={[styles.button, { backgroundColor: gender === 'Male' ? '#1A73E8' : '#EA4335' }]} onPress={handleMobilePickImage} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? '...' : '+'}</Text>
            </TouchableOpacity>
        )
    );
}

const styles = StyleSheet.create({
    button: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            },
            default: {
                elevation: 2
            }
        }),
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    webButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...Platform.select({
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            },
            default: {
                elevation: 2
            }
        }),
        cursor: 'pointer'
    } as any,
});