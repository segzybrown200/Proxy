import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { logoutState, selectIsVisitor, selectUser, VisitorState } from "global/authSlice";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCart } from "global/listingSlice";

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user:any = useSelector(selectUser)
  const select = useSelector(selectIsVisitor);
  const menuItems = [
    {
      title: "Personal Info",
      icon: <MaterialCommunityIcons name="account" size={24} color="#0056FF" />,
      color: "#0056FF",
      route: "personal-info",
    },
    {
      title: "Addresses",
      icon: <MaterialIcons name="location-on" size={24} color="#8B5CF6" />,
      color: "#8B5CF6",
      route: "address-list",
    },
  ];

  const accountItems = [
    {
      title: "Order",
      icon: <FontAwesome6 name="bag-shopping" size={24} color="#5C67F2" />,
      color: "#5C67F2",
      route: "order",
    },
    {
      title: "Message",
      icon: <MaterialIcons name="message" size={24} color="#FF3B30" />,
      color: "#FF3B30",
      route: "message",
    },
    {
      title: "Notifications",
      icon: <Ionicons name="notifications" size={24} color="#FFB800" />,
      color: "#FFB800",
      route: "notifications",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60 }}
      >
        {/* Profile Header */}
        <View className="items-center mb-8">
          <Image
            source={require("../../../assets/images/artist-2 2.png")}
            className="w-24 h-24 rounded-full"
          />
          {select ? (
            <Text className="text-gray-400 font-NunitoRegular text-lg i mt-2">
              Visitor Account
            </Text>
          ) : (
            <View>
              <Text className="text-2xl font-RalewayBold mt-4 self-center">
                {user?.data?.user?.name}
              </Text>
              <Text className="text-gray-500 text-lg self-center font-NunitoRegular">
                {user?.data?.user?.email}
              </Text>
            </View>
          )}
        </View>

        {select ? null : (
          <>
            {/* Profile Info Section */}
            <View className="bg-[#F8F9FA] rounded-2xl p-3 mb-5">
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center justify-between py-4 border-b border-gray-100"
                  onPress={() => router.push(`/(tabs)/(profile)/${item.route}`)}
                >
                  <View className="flex-row items-center space-x-6 gap-3">
                    {item.icon}
                    <Text className="font-NunitoRegular text-lg text-gray-700">
                      {item.title}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Account Section */}
            <View className="bg-[#F8F9FA] rounded-2xl p-3 mb-5">
              {accountItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center justify-between py-4 border-b border-gray-100"
                  onPress={() => router.push(`/(tabs)/(profile)/${item.route}`)}
                >
                  <View className="flex-row items-center space-x-6 gap-3">
                    {item.icon}
                    <Text className="font-NunitoRegular text-lg text-gray-700">
                      {item.title}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Logout */}
        <TouchableOpacity
          className="bg-[#F8F9FA] rounded-2xl flex-row items-center justify-between p-4 mb-10"
          onPress={() => {
            if(!select){
              AsyncStorage.removeItem('sessionId');
              dispatch(clearCart())
              dispatch(logoutState());
              router.replace("/(auth)/login")
            }else{
              router.replace("/(auth)/login")
              dispatch(VisitorState(false));
            }
          }}
        >
          <Text className="font-NunitoRegular text-lg text-gray-700">
            Log Out
          </Text>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
