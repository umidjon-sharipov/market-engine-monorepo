import { Platform } from 'react-native'

/** Native (iOS/Android) da true, web da false — ikkala platformada ham ishlaydi */
export const useNativeAnimDriver = Platform.OS !== 'web'
