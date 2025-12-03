import { View, Text,Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const congratulations = () => {
  return (
    <View className="flex-1 bg-white items-center justify-center px-4"
    >
      <Image source={require('../../../assets/images/celebrate.png')} className="w-72 h-72 mb-6" />
      <Text className="text-2xl font-RalewayBold text-gray-900 mb-4">Congratulations!</Text>
      <Text className="text-center text-lg font-NunitoRegular text-gray-700">Your payment was successful. Thank you for shopping with us!</Text>
      {/* Button for Track Order and Back Home */}
      <View className="mt-8 w-full space-y-4">
        <TouchableOpacity onPress={()=> router.replace("/(tabs)/(profile)/profile")} className="bg-[#0056FF] py-4 mb-4 rounded-2xl items-center">
          <Text className="text-white font-NunitoBold text-lg">Track Order</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=> router.replace("/(tabs)/(home)")} className="border border-gray-300 py-4 rounded-2xl items-center">
          <Text className="text-gray-900 font-NunitoBold text-lg">Back Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default congratulations