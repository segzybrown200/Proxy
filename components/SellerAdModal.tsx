import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

interface SellerAdModalProps {
  visible: boolean;
  onClose: () => void;
  onStartSelling: () => void;
  isSeller?: boolean;
}

const { height } = Dimensions.get("window");

export const SellerAdModal: React.FC<SellerAdModalProps> = ({
  visible,
  onClose,
  onStartSelling,
  isSeller = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center">
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            width: "85%",
            overflow: "hidden",
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
          }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-4 z-10 bg-white/20 rounded-full p-2"
          >
            <MaterialCommunityIcons name="close" size={24} color="white" />
          </TouchableOpacity>

          {/* Content */}
          <View className="p-6 pt-8">
            {/* Icon */}
            <View className="items-center mb-4">
              <View className="bg-white/20 rounded-full p-4 mb-3">
                <FontAwesome5 name="store" size={40} color="white" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-2xl font-RalewayBold text-white text-center mb-2">
              Become a Seller
            </Text>

            {/* Subtitle */}
            <Text className="text-white/90 text-center font-NunitoRegular text-base mb-4">
              Grow your business and reach thousands of buyers.
            </Text>

            {/* Benefits (3 quick points) */}
            <View className="bg-white/10 rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-3">
                <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FCD34D" />
                <Text className="text-white font-NunitoBold ml-2">Easy Setup</Text>
              </View>
              <View className="flex-row items-center mb-3">
                <MaterialCommunityIcons name="chart-line" size={18} color="#34D399" />
                <Text className="text-white font-NunitoBold ml-2">Track Earnings</Text>
              </View>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="account-multiple" size={18} color="#60A5FA" />
                <Text className="text-white font-NunitoBold ml-2">1000s of Buyers</Text>
              </View>
            </View>

            {/* Main CTA Button */}
            <TouchableOpacity
              onPress={onStartSelling}
              className="bg-white py-4 rounded-xl items-center mb-3"
            >
              <Text className="text-purple-600 font-NunitoBold text-lg">
                Learn More
              </Text>
            </TouchableOpacity>

            {/* Secondary Button */}
            <TouchableOpacity
              onPress={onClose}
              className="bg-white/20 py-3 rounded-xl items-center border border-white/30"
            >
              <Text className="text-white font-NunitoRegular">Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};
