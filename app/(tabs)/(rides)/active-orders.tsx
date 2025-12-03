import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRiderActiveOrder } from "hooks/useHooks";
import { useSelector } from "react-redux";
import { RootState } from "global/store";

interface Order {
  status: "new" | "ACCEPTED" | "PICKED_UP" | "IN_TRANSIT";
}

const ActiveOrders = () => {
  const router = useRouter();
    const user: any = useSelector((state: RootState) => state.auth.user);
  const token = user?.data?.token;

  const { isError,  isLoading, active}= useRiderActiveOrder(token)
  // Mock data - replace with actual API call


  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "#22C55E";
      case "ACCEPTED":
        return "#0056FF";
      case "PICKED_UP":
        return "#F59E0B";
      case "IN_TRANSIT":
      return "#ca8a04";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "New Order";
      case "ACCEPTED":
        return "ACCEPTED";
      case "PICKED_UP":
        return "PICKED UP";
      case "IN_TRANSIT":
        return "IN_TRANSIT";
      default:
        return status;
    }
  };

    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#004CFF" />
          <Text className="mt-3 font-NunitoMedium text-gray-500 ">
            Loading ...
          </Text>
        </View>
      );
    }
  
    if (isError) {
      return (
        <View className="flex-1 justify-center items-center bg-white">
          <Text className="text-red-500 font-NunitoSemiBold">
            Failed to load
          </Text>
        </View>
      );
    }





  return (
    <ScrollView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

           <View className="flex-row items-center border border-b border-gray-300 px-5 pt-16 pb-4">
        <TouchableOpacity
          className="bg-[#F1F4F9] p-3 rounded-full"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#0D1321" />
        </TouchableOpacity>
        <Text className="text-2xl font-RalewayBold ml-4">Active Order</Text>
      </View>
      
      {/* Header */}
      <View className="bg-white p-6">
        <Text className="text-2xl font-RalewayBold">Active Orders</Text>
        <Text className="text-gray-500 mt-1 font-NunitoLight">
          {active?.data?.length} active order{active?.data?.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Orders List */}
    
            <View className="px-4 py-4">
        {active?.data?.length === 0 ? (
          <View className="bg-white rounded-xl p-6 items-center">
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={48}
              color="#9CA3AF"
            />
            <Text className="text-gray-500 font-NunitoRegular mt-4 text-center">
              No active orders at the moment.{"\n"}
              New orders will appear here.
            </Text>
          </View>
        ) : (
          active?.data.map((order:any) => (
            <TouchableOpacity
              key={order?.id}
              onPress={() => router.push({
                pathname: '/(tabs)/(rides)/[deliveryId]',
                params: { deliveryId: order?.id },
              })}
              className="bg-white p-4 rounded-xl mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-NunitoRegular">Order #{(order?.id).toString().slice(0,6).toUpperCase()}</Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${getStatusColor(order?.status)}20` }}
                >
                  <Text
                    style={{ color: getStatusColor(order?.status) }}
                    className="font-RalewayBold"
                  >
                    {getStatusText(order?.status)}
                  </Text>
                </View>
              </View>

              <View className="space-y-2">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#22C55E"
                  />
                  <Text className="text-gray-700 ml-2 font-NunitoRegular">{order?.pickupAddress}</Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#EF4444"
                  />
                  <Text className="text-gray-700 ml-2 font-NunitoRegular">{order?.dropoffAddress}</Text>
                </View>
              </View>

              <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="cash"
                    size={20}
                    color="#0056FF"
                  />
                  <Text className="text-primary font-NunitoSemiBold ml-1">
                    ₦{order?.fareAmount}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="map-marker-distance"
                    size={20}
                    color="#6B7280"
                  />
                  <Text className="text-gray-500 font-NunitoMedium ml-1">{(order?.distanceKm)?.toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
        
  
    
    </ScrollView>
  );
};

export default ActiveOrders;