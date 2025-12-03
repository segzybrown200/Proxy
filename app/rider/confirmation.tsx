import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "../../global/store";

const Confirmation = () => {
  const registrationStatus = useSelector(
    (state: RootState) => state.rider.registrationStatus
  );

  const renderStatusContent = () => {
    switch (registrationStatus) {
      case "pending-review":
        return {
          icon: "hourglass-outline",
          title: "Application Under Review",
          message:
            "We're reviewing your application. This usually takes 1-2 business days. We'll notify you once the review is complete.",
          buttonText: "Back to Profile",
          buttonAction: () => router.push("/profile"),
        };
      case "approved":
        return {
          icon: "checkmark-circle-outline",
          title: "Application Approved!",
          message:
            "Congratulations! Your rider account has been approved. You can now start accepting delivery requests.",
          buttonText: "Start Delivering",
          buttonAction: () => router.push("/rider-dashboard"),
        };
      case "rejected":
        return {
          icon: "close-circle-outline",
          title: "Application Needs Review",
          message:
            "Some information needs to be updated. Please review the feedback and resubmit the required documents.",
          buttonText: "Review Application",
          buttonAction: () => router.push("/rider-registration/personal-info"),
        };
      default:
        return {
          icon: "alert-circle-outline",
          title: "Unknown Status",
          message: "Please contact support for assistance.",
          buttonText: "Contact Support",
          buttonAction: () => router.push("/support"),
        };
    }
  };

  const content = renderStatusContent();

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
          Application Status
        </Text>
      </View>

      {/* Status Content */}
      <ScrollView className="flex-1 px-4 py-6">
        <View className="items-center py-8">
          <View
            className={`rounded-full p-6 mb-6 ${
              registrationStatus === "approved"
                ? "bg-green-100"
                : registrationStatus === "rejected"
                ? "bg-red-100"
                : "bg-primary-50"
            }`}
          >
            <Ionicons
              name={content.icon as any}
              size={48}
              color={
                registrationStatus === "approved"
                  ? "#22C55E"
                  : registrationStatus === "rejected"
                  ? "#EF4444"
                  : "#004CFF"
              }
            />
          </View>
          <Text className="font-RalewayBold text-2xl text-center text-black mb-4">
            {content.title}
          </Text>
          <Text className="font-NunitoRegular text-gray-600 text-center text-lg mb-8">
            {content.message}
          </Text>

          {registrationStatus === "pending-review" && (
            <View className="w-full bg-gray-50 rounded-xl p-6 mb-8">
              <Text className="font-RalewayBold text-black text-lg mb-4">
                What happens next?
              </Text>
              <View className="space-y-4">
                <View className="flex-row">
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#004CFF"
                    style={{ marginRight: 12 }}
                  />
                  <Text className="font-NunitoRegular text-gray-600 flex-1">
                    We'll verify your documents and information
                  </Text>
                </View>
                <View className="flex-row">
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#004CFF"
                    style={{ marginRight: 12 }}
                  />
                  <Text className="font-NunitoRegular text-gray-600 flex-1">
                    Background check will be conducted
                  </Text>
                </View>
                <View className="flex-row">
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#004CFF"
                    style={{ marginRight: 12 }}
                  />
                  <Text className="font-NunitoRegular text-gray-600 flex-1">
                    You'll receive a notification with the results
                  </Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={content.buttonAction}
            className="bg-primary-100 w-full py-4 rounded-xl"
          >
            <Text className="text-white text-center font-RalewayBold text-lg">
              {content.buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Confirmation;