import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const RiderRegistrationSteps = [
  {
    id: 1,
    title: "Personal Information",
    icon: "person-outline",
    route: "/rider-registration/personal-info",
    description: "Basic details and contact information",
  },
  {
    id: 2,
    title: "Identity Verification",
    icon: "shield-checkmark-outline",
    route: "/rider-registration/kyc",
    description: "Upload your identification documents",
  },
  {
    id: 3,
    title: "Vehicle Details",
    icon: "car-outline",
    route: "/rider-registration/vehicle",
    description: "Add your vehicle information",
  },
];

const BecomeRider = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-14 pb-4 flex-row items-center border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#ECF0F4] rounded-full p-2 mr-3"
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="font-RalewayBold text-xl text-black">
          Become a Rider
        </Text>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4 py-6">
        {/* Welcome Section */}
        <View className="bg-primary-100 rounded-2xl p-6 mb-8">
          <Text className="font-RalewayBold text-white text-2xl mb-2">
            Join Our Rider Network
          </Text>
          <Text className="font-NunitoRegular text-white text-base">
            Complete these steps to start earning as a rider. Make sure you have all required documents ready.
          </Text>
        </View>

        {/* Steps */}
        {RiderRegistrationSteps.map((step, index) => (
          <TouchableOpacity
            key={step.id}
            onPress={() => router.push(step.route)}
            className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex-row items-center"
          >
            <View className="bg-primary-50 rounded-full p-3 mr-4">
              <Ionicons name={step.icon as any} size={24} color="#004CFF" />
            </View>
            <View className="flex-1">
              <Text className="font-RalewayBold text-lg text-black mb-1">
                {step.title}
              </Text>
              <Text className="font-NunitoRegular text-gray-600">
                {step.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        ))}

        {/* Requirements Notice */}
        <View className="mt-4 bg-gray-50 rounded-xl p-4">
          <Text className="font-RalewayBold text-base text-black mb-2">
            Requirements:
          </Text>
          <View className="space-y-2">
            <Text className="font-NunitoRegular text-gray-600">
              • Valid government-issued ID
            </Text>
            <Text className="font-NunitoRegular text-gray-600">
              • Driver's license
            </Text>
            <Text className="font-NunitoRegular text-gray-600">
              • Vehicle registration (if using own vehicle)
            </Text>
            <Text className="font-NunitoRegular text-gray-600">
              • Proof of insurance
            </Text>
            <Text className="font-NunitoRegular text-gray-600">
              • Clear profile photo
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BecomeRider;