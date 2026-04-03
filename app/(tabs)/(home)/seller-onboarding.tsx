import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { openSellerAppWithFallback } from "utils/sellerDeepLink";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const { width } = Dimensions.get("window");

const SellerOnboardingScreen = () => {
  const handleGoBack = () => {
    router.push("/(tabs)/(home)");
  };

  const handleStartSelling = async () => {
    await openSellerAppWithFallback();
  };

  const benefits = [
    { 
      icon: "dollar-sign", 
      title: "Earn More", 
      description: "Unlock a new income channel by selling products and services.", 
      color: "#10B981" 
    },
    { 
      icon: "store", 
      title: "Quick Setup", 
      description: "Publish your first product in minutes with our step-by-step flow.", 
      color: "#3B82F6" 
    },
    { 
      icon: "users", 
      title: "Live Demand", 
      description: "Access thousands of local buyers ready to purchase now.", 
      color: "#8B5CF6" 
    },
    { 
      icon: "chart-line", 
      title: "Smart Insights", 
      description: "Analyze sales and optimize listings to grow faster.", 
      color: "#F59E0B" 
    },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <LinearGradient
        colors={["#667EEA", "#764BA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={handleGoBack} className="bg-white/20 rounded-full p-2 mr-3">
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View className="items-center">
          <View className="bg-white/20 rounded-full p-4 mb-4">
            <MaterialCommunityIcons name="storefront" size={48} color="white" />
          </View>
          <Text className="text-3xl font-RalewayBold text-white text-center mb-2">
            Become a Seller
          </Text>
          <Text className="text-white/90 text-center font-NunitoRegular text-base px-4">
            Grow your business and reach thousands of buyers with our vendor app.
          </Text>
        </View>
      </LinearGradient>

      <View className="px-5 pb-10">
        <View className="mt-8">
          <Text className="text-xl font-RalewayBold text-gray-900 mb-6 text-center">
            Why Sell with Us?
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {benefits.map((item, idx) => (
              <View 
                key={idx} 
                className="w-[48%] bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100" 
                style={{ elevation: 3 }}
              >
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center mb-3" 
                  style={{ backgroundColor: item.color + "20" }}
                >
                  <FontAwesome5 name={item.icon} size={20} color={item.color} />
                </View>
                <Text className="font-NunitoBold text-gray-900 mb-1">{item.title}</Text>
                <Text className="font-NunitoRegular text-gray-600 text-sm leading-5">
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View className="mt-8 mb-8">
          <Text className="text-lg font-RalewayBold text-gray-900 mb-4">Features</Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <MaterialCommunityIcons 
                name="check-circle" 
                size={20} 
                color="#10B981" 
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <Text className="flex-1 font-NunitoRegular text-gray-700">
                Easy product listing and inventory management
              </Text>
            </View>
            <View className="flex-row items-start">
              <MaterialCommunityIcons 
                name="check-circle" 
                size={20} 
                color="#10B981" 
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <Text className="flex-1 font-NunitoRegular text-gray-700">
                Real-time order notifications and tracking
              </Text>
            </View>
            <View className="flex-row items-start">
              <MaterialCommunityIcons 
                name="check-circle" 
                size={20} 
                color="#10B981" 
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <Text className="flex-1 font-NunitoRegular text-gray-700">
                Detailed sales analytics and reporting
              </Text>
            </View>
            <View className="flex-row items-start">
              <MaterialCommunityIcons 
                name="check-circle" 
                size={20} 
                color="#10B981" 
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <Text className="flex-1 font-NunitoRegular text-gray-700">
                Secure payment processing and payouts
              </Text>
            </View>
            <View className="flex-row items-start">
              <MaterialCommunityIcons 
                name="check-circle" 
                size={20} 
                color="#10B981" 
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <Text className="flex-1 font-NunitoRegular text-gray-700">
                24/7 seller support and resources
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          onPress={handleStartSelling} 
          className="bg-primary-100 py-4 rounded-2xl items-center mb-4"
        >
          <Text className="text-white font-NunitoBold text-lg">Start Selling</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleGoBack} 
          className="bg-gray-100 py-4 rounded-2xl items-center"
        >
          <Text className="text-gray-700 font-NunitoBold">Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SellerOnboardingScreen;
