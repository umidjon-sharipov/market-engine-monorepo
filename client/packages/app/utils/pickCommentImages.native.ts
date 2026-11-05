import * as ImagePicker from 'expo-image-picker';
import type { PickedCommentImage } from './pickCommentImages';

export async function pickCommentImages(limit: number): Promise<PickedCommentImage[]> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        throw new Error('Rasmlarga kirish ruxsatini bering.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: limit,
        quality: 0.8,
    });
    if (result.canceled) return [];

    return result.assets.map((asset, index) => ({
        uri: asset.uri,
        fileName: asset.fileName ?? `comment-${Date.now()}-${index}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
    }));
}
