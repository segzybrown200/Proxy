import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

const congratulations = () => {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="items-center justify-center px-4 pt-8">
        <Image source={require('../../../assets/images/celebrate.png')} className="w-72 h-72 mb-6" />
        <Text className="text-2xl font-RalewayBold text-gray-900 mb-4">Congratulations!</Text>
        <Text className="text-center text-lg font-NunitoRegular text-gray-700">Your payment was successful. Thank you for shopping with us!</Text>
        
        {/* Seller Promo Card */}
        <View className="w-full mt-8 mb-8">
          <LinearGradient
            colors={["#667EEA", "#764BA2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16 }}
          >
            <View className="p-6 items-center">
              <View className="bg-white/20 rounded-full p-3 mb-3">
                <MaterialCommunityIcons name="store" size={32} color="white" />
              </View>
              <Text className="text-xl font-RalewayBold text-white text-center mb-2">You're a Great Buyer!</Text>
              <Text className="text-white/90 text-center font-NunitoRegular text-sm mb-4">
                Why not become a seller and share great items with our community?
              </Text>
              <TouchableOpacity 
                onPress={() => router.push("/(tabs)/(home)/seller-onboarding")}
                className="bg-white py-3 px-6 rounded-lg"
              >
                <Text className="text-purple-600 font-NunitoBold">Become a Seller</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Button for Track Order and Back Home */}
        <View className="w-full space-y-4 pb-8">
          <TouchableOpacity onPress={()=> router.replace("/(tabs)/(profile)/profile")} className="bg-[#0056FF] py-4 mb-4 rounded-2xl items-center">
            <Text className="text-white font-NunitoBold text-lg">Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=> router.replace("/(tabs)/(home)")} className="border border-gray-300 py-4 rounded-2xl items-center">
            <Text className="text-gray-900 font-NunitoBold text-lg">Back Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

export default congratulations