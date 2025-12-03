import { router } from "expo-router";
import { RootState } from "global/store";
import { useUserOrder } from "hooks/useHooks";
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSelector } from "react-redux";

const OrderScreen = () => {
  const [active, setActive] = useState<"orders" | "history">("orders");
  const [refreshing, setRefreshing] = useState(false);
  const user: any = useSelector((state: RootState) => state.auth.user);
  const token = user?.data?.token || "";

  const { isError, isLoading, order, mutate } = useUserOrder(token);


  // Format the data for current tab (Orders or History)
  const activeOrders = useMemo(() => {
    if (!order?.data) return [];
    return order.data.filter(
      (o: any) => o.status === "PENDING" || o.status === "IN_PROGRESS"
    );
  }, [order]);

  const historyOrders = useMemo(() => {
    if (!order?.data) return [];
    return order.data.filter(
      (o: any) => o.status === "DELIVERED" || o.status === "CANCELLED"
    );
  }, [order]);

  const data = active === "orders" ? activeOrders : historyOrders;

  const renderItem = ({ item }: { item: any }) => {
    const date = new Date(item.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const firstListing = item.listings[0];
    const imageSource = firstListing?.image
      ? { uri: firstListing.image }
      : require("../../../assets/images/sneaker.png");

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(tabs)/(profile)/track-order",
            params: { order: JSON.stringify(item) },
          })
        }
        activeOpacity={0.8}
        className="bg-white rounded-lg mx-2 my-2 p-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <Image
            source={imageSource}
            className="w-16 h-16 rounded-md mr-3"
            resizeMode="cover"
          />
          <View>
            <Text className="text-lg font-RalewaySemiBold text-black">
              {firstListing?.title || "Order"}
            </Text>
            <Text
              className="text-base w-[90%]  font-NunitoLight text-primary-100 mt-1"
              numberOfLines={2}
            >
             Vendor Name:  {item.vendor?.name || "Vendor"}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-xs font-NunitoRegular text-gray-400">
            {date}
          </Text>
          <Text
            className={`text-base mt-1 font-NunitoMedium ${
              item?.delivery.status === "DELIVERED"
                ? "text-green-500"
                : item.status === "CANCELLED"
                ? "text-red-500"
                : "text-primary-100"
            }`}
          >
            {item?.delivery.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#004CFF" />
        <Text className="mt-3 font-NunitoMedium text-gray-500">
          Loading orders...
        </Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 font-NunitoSemiBold">
          Failed to load orders
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
      {/* Header */}
      <View className="flex-row items-center mt-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#ECF0F4] rounded-full mt-4 p-2 mr-3"
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-2xl font-NunitoBold">Orders</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row mt-4 mb-5 px-4">
        <TouchableOpacity
          onPress={() => setActive("orders")}
          className={`flex-1 py-2 items-center ${
            active === "orders" ? "border-b-2 border-primary-100" : ""
          }`}
        >
          <Text
            className={`font-NunitoSemiBold text-lg ${
              active === "orders" ? "text-black" : "text-gray-500"
            }`}
          >
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActive("history")}
          className={`flex-1 py-2 items-center ${
            active === "history" ? "border-b-2 border-primary-100" : ""
          }`}
        >
          <Text
            className={`font-NunitoSemiBold text-lg ${
              active === "history" ? "text-black" : "text-gray-500"
            }`}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await mutate();
              } catch (e) {
                console.log("Refresh error:", e);
              }
              setRefreshing(false);
            }}
            colors={["#004CFF"]}
            tintColor="#004CFF"
          />
        }
        ListEmptyComponent={() => (
          <View className="items-center mt-10">
            <Text className="text-gray-400 font-NunitoMedium">
              No {active === "orders" ? "active" : "past"} orders found.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default OrderScreen;
