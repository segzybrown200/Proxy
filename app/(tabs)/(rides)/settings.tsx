import { View, Text, ScrollView, Switch } from "react-native";
import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { StatusBar } from "expo-status-bar";
import { RootState } from "../../../global/store";

const Settings = () => {
  const dispatch = useDispatch();
  const user:any = useSelector((state: RootState) => state.auth.user);
  const [isOnline, setIsOnline] = useState(user?.data?.user?.isOnline ?? false);

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const settings = [
    {
      title: "Online Status",
      description: "Toggle to go online/offline for receiving orders",
      value: isOnline,
      onValueChange: setIsOnline,
      icon: "bike",
    },
    {
      title: "Push Notifications",
      description: "Receive notifications about new orders",
      value: pushNotifications,
      onValueChange: setPushNotifications,
      icon: "bell",
    },
    {
      title: "Email Notifications",
      description: "Receive order summaries and updates via email",
      value: emailNotifications,
      onValueChange: setEmailNotifications,
      icon: "email",
    },
    {
      title: "Sound",
      description: "Play sound for new orders and updates",
      value: soundEnabled,
      onValueChange: setSoundEnabled,
      icon: "volume-high",
    },
  ] as const;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white p-6">
        <Text className="text-2xl font-bold">Settings</Text>
        <Text className="text-gray-500 mt-1">Manage your rider preferences</Text>
      </View>

      {/* Settings List */}
      <View className="px-4 py-4">
        {settings.map((setting, index) => (
          <View
            key={setting.title}
            className="bg-white p-4 rounded-xl mb-3 shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center flex-1 mr-4">
                <MaterialCommunityIcons
                  name={setting.icon}
                  size={24}
                  color="#0056FF"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-medium">
                    {setting.title}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {setting.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={setting.value}
                onValueChange={setting.onValueChange}
                trackColor={{ false: "#D1D5DB", true: "#0056FF" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        ))}

        {/* Version Info */}
        <View className="mt-6 items-center">
          <Text className="text-gray-500 text-sm">Version 1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default Settings;