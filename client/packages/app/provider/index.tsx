import { SafeArea } from 'app/provider/safe-area'
import { NavigationProvider } from './navigation/index.native'

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SafeArea>
      <NavigationProvider>{children}</NavigationProvider>
    </SafeArea>
  )
}
