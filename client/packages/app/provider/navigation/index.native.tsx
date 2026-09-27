import { NavigationContainer } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import React, { useMemo } from 'react'

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NavigationContainer
      linking={useMemo(
        () => ({
          prefixes: [Linking.createURL('/')],
          config: {
            initialRouteName: 'home',
            screens: {
              home: '',
              katalog: 'katalog',
              savat: 'savat',
              saralangan: 'yoqtirilgan',
              profile: 'profile',
              savolJavob: 'savolJavob',
              search: 'search',
              careres: 'about/careres',
              punkt: 'about/punkt',
              auth: 'auth',
              follow: 'follow',
              'filter': 'search/:id',
              'products': 'product/:id'
            },
          },
        }),
        []
      )}
    >
      {children}
    </NavigationContainer>
  )
}