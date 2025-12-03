import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const RidesLayout = () => {
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        animation: 'fade'
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="active-orders" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="earnings" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="history" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="[deliveryId]" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  )
}

export default RidesLayout