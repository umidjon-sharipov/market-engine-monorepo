import { SafeArea } from 'app/provider/safe-area'
import { NavigationProvider } from './navigation/index.native'
import { NotificationProvider } from 'app/components/UI/Notification'

export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <SafeArea>
            <NotificationProvider>
                <NavigationProvider>{ children }</NavigationProvider>
            </NotificationProvider>
        </SafeArea>
    )
}
