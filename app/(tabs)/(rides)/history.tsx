import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSelector } from "react-redux";
import { RootState } from "global/store";
import { useRiderHistory } from "hooks/useHooks";

interface HistoryOrder {

  status: "DELIVERED" | "CANCELLED";
}

const History = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | "DELIVERED" | "CANCELLED">("ALL");
  const user: any = useSelector((state: RootState) => state.auth.user);
  const token = user?.data?.token;

  const { isError,  isLoading, history}= useRiderHistory(token)
  // Mock data - replace with actual API call

  const filteredOrders = (history?.data || [])?.filter(
    (order:any) => filter === "ALL" || order.status === filter
  ) || [];

  // Format date to readable format
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      return dateString;
    }
  };

  const getStatusColor = (status: HistoryOrder["status"]) => {
    switch (status) {
      case "DELIVERED":
        return "#22C55E";
      case "CANCELLED":
        return "#EF4444";
      default:
        return "#9CA3AF";
    }
  };

      if (isLoading) {
        return (
          <View className="flex-1 justify-center items-center bg-white">
            <ActivityIndicator size="large" color="#004CFF" />
            <Text className="mt-3 font-NunitoMedium text-gray-500">
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
        <Text className="text-2xl font-RalewayBold ml-4">History</Text>
      </View>

      {/* Header with Filters */}
      <View className="bg-white p-6">
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          {(["ALL", "DELIVERED", "CANCELLED"] as const).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => {
                try {
                  setFilter(status);
                } catch (err) {
                  console.warn("Filter error:", err);
                }
              }}
              className={`flex-1 py-2 rounded-lg ${
                filter === status ? "bg-white shadow" : ""
              }`}
            >
              <Text
                className={`text-center font-NunitoRegular ${
                  filter === status ? "text-primary-100" : "text-gray-500"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Orders List */}
      <View className="px-4 py-4">
        {filteredOrders.length === 0 ? (
          <View className="bg-white rounded-xl p-6 items-center">
            <MaterialCommunityIcons
              name="history"
              size={48}
              color="#9CA3AF"
            />
            <Text className="text-gray-500 font-RalewayRegular mt-4 text-center">
              No orders found for the selected filter.
            </Text>
          </View>
        ) : (
          filteredOrders.map((order:any) => (
              <TouchableOpacity
                key={order?.id}
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
                      {(order?.status)}
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

                <View className="mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      size={18}
                      color="#6B7280"
                    />
                    <Text className="text-gray-600 font-NunitoLight ml-2">
                      {formatDate(order?.completedAt || order?.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default History;