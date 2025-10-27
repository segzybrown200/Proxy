import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const _layout = () => {
  return (
    <Stack initialRouteName='onboarding'>
        <Stack.Screen name='login' options={{ headerShown: false }} />
        <Stack.Screen name='register' options={{ headerShown: false }} />
        <Stack.Screen name='onboarding' options={{ headerShown: false }} />
        <Stack.Screen name='forgot-password' options={{ headerShown: false }} />
        <Stack.Screen name='reset-password' options={{ headerShown: false }} />
        <Stack.Screen name='verifyOptions' options={{ headerShown: false }} />
        <Stack.Screen name='location' options={{ headerShown: false }} />
        <Stack.Screen name='verify-email' options={{ headerShown: false }} />
        <Stack.Screen name='congratulation' options={{ headerShown: false }} />
        <Stack.Screen name='verify-reset-OTP' options={{ headerShown: false }} />
        
    </Stack>
  )
}

export default _layout