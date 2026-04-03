import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface SellerPromoCardProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onPress: () => void;
  isSeller?: boolean;
}

export const SellerPromoCard: React.FC<SellerPromoCardProps> = ({
  title = "Become a Seller",
  description = "Grow your business and reach thousands of buyers.",
  buttonText = "Learn More",
  onPress,
  isSeller,
}) => {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-6">
      <Text className="text-xl font-RalewayBold text-gray-900 mb-2">{title}</Text>
      <Text className="text-gray-600 font-NunitoRegular mb-4">{description}</Text>
      <TouchableOpacity
        onPress={onPress}
        className="bg-primary-100 py-3 rounded-xl justify-center items-center"
      >
        <Text className="text-white font-NunitoBold">{buttonText}</Text>
      </TouchableOpacity>
      {isSeller && (
        <Text className="text-xs text-green-600 text-center mt-2">You are already a seller.</Text>
      )}
    </View>
  );
};
