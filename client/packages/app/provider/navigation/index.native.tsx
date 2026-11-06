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
            initialRouteName: 'home' as const,
            screens: {
              home: '',
              katalog: 'katalog',
              savat: 'savat',
              checkout: 'checkout',
              saralangan: 'yoqtirilgan',
              profile: 'profile',
              savolJavob: 'savolJavob',
              search: 'search',
              careres: 'about/careres',
              punkt: 'about/punkt',
              auth: {
                path: 'auth',
                parse: {
                  step: String,
                  email: String,
                  code: String,
                  error: String,
                },
              },
              follow: 'follow',
              'filter': 'search/:id',
              'products': 'product/:id',
              productComments: 'productComments',
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