import React, { useEffect, useState } from 'react'
import { View, Text, SafeAreaView, TouchableOpacity, FlatList } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'

const AddressList = () => {
  const [addresses, setAddresses] = useState<Array<any>>([])
  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem('addresses')
      const list = raw ? JSON.parse(raw) : []
      setAddresses(list)
    } catch (e) {
      console.warn('Load addresses failed', e)
    }
  }
  
  const deleteAddress = async (id: string) => {
    Alert.alert('Delete address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem('addresses')
            const list = raw ? JSON.parse(raw) : []
            const updated = list.filter((a: any) => a.id !== id)
            await AsyncStorage.setItem('addresses', JSON.stringify(updated))
            setAddresses(updated)
          } catch (e) {
            console.warn('Delete failed', e)
          }
        },
      },
    ])
  }
  useFocusEffect(
    React.useCallback(() => {
      load()
    }, [])
  )


  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <View className="flex-row items-center mt-14">
        <TouchableOpacity onPress={() => router.back()} className="bg-[#ECF0F4] rounded-full p-2 mr-3">
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-2xl font-NunitoBold">Address</Text>
      </View>

      <View className="mt-6">
        {addresses.length === 0 ? (
          <Text className="text-lg font-NunitoRegular text-gray-500">You have no saved address yet.</Text>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(i) => i.id}
            renderItem={({ item, index }) => (
              <View className={`bg-white p-4 rounded-lg my-2 border ${index === 0 ? 'border-primary-100' : 'border-gray-100'}`}>
                <View className="flex-row justify-between items-start">
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text className="text-lg font-RalewaySemiBold">{item.address}</Text>
                    <Text className="text-base font-NunitoMedium text-gray-400 mt-2">Saved: {new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteAddress(item.id)} className="p-2">
                    <Ionicons name="trash-outline" size={20} color="#E02424" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity onPress={() => router.push('/(tabs)/(profile)/add-address')} className="mt-10 bg-primary-100 rounded-lg p-4 items-center">
        <Text className="text-white text-xl font-NunitoLight">+ Add New Address</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default AddressList
