import * as ImagePicker from 'expo-image-picker';
import type { PickedProfileImage } from './pickProfileImage';

export async function pickProfileImage(): Promise<PickedProfileImage | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
    });

    if (result.canceled) {
        return null;
    }

    const asset = result.assets[0];
    return {
        uri: asset.uri,
        fileName: asset.fileName,
    };
}
