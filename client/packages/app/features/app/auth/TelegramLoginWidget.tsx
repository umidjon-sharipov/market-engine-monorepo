import React from 'react'
import { Text, View } from 'react-native'

type Props = {
    apiUrl: string
    onSuccess: (session: unknown) => void
    onError: (message: string) => void
}

export default function TelegramLoginWidget(_props: Props) {
    return (
        <View>
            <Text>Telegram orqali kirish web sahifada mavjud.</Text>
        </View>
    )
}
