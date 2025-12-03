import { View, Text, TouchableOpacity, Image, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { selectUser } from "global/authSlice";

export default function PersonalInfoScreen() {
    const user:any = useSelector(selectUser)
  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between mt-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="bg-[#ECF0F4] rounded-full p-2 mr-3">
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-NunitoBold">Personal Info</Text>
        </View>

        <TouchableOpacity onPress={() => router.push("/(tabs)/(profile)/edit-info")}>
          <Text className="text-[#004CFF] text-lg font-NunitoBold underline">Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View className="items-center mt-10">
        <Image
          source={require("../../../assets/images/artist-2 2.png")}
          className="w-28 h-28 rounded-full"
        />
        <Text className="text-lg font-RalewayBold mt-3">{user?.data?.user?.name}</Text>
        <Text className="text-gray-500 font-NunitoRegular">{user?.data?.user?.email}</Text>
      </View>

      {/* Info Box */}
      <View className="mt-10 bg-[#F7F9FC] rounded-2xl p-5">
        <View className="flex-row items-center mb-4">
          <Ionicons name="person-outline" size={20} color="#FF7F50" />
          <View className="ml-3">
            <Text className="text-gray-500 font-RalewayRegular text-base">FULL NAME</Text>
            <Text className="text-lg font-NunitoRegular">{user?.data?.user?.name}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          <Ionicons name="mail-outline" size={20} color="#004CFF" />
          <View className="ml-3">
            <Text className="text-gray-500 font-RalewayRegular text-base">EMAIL</Text>
            <Text className="text-lg font-NunitoRegular">{user?.data?.user?.email}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="call-outline" size={20} color="#0096FF" />
          <View className="ml-3">
            <Text className="text-gray-500 font-RalewayRegular text-base">PHONE NUMBER</Text>
            <Text className="text-lg font-NunitoRegular">{user?.data?.user?.phone}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
