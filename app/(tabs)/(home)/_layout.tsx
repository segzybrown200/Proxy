import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const _layout = () => {
  return (
    <SafeAreaProvider>
    <Stack >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="category" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ headerShown: false }} />
        <Stack.Screen name="listings" options={{ headerShown: false }} />
        <Stack.Screen name="payment" options={{ headerShown: false }} />
        <Stack.Screen name="congratulations" options={{ headerShown: false }} />
        <Stack.Screen name="search-results" options={{ headerShown: false }} />
      
    </Stack>
    </SafeAreaProvider>
  )
}

export default _layout