import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import {
  logoutState,
  selectIsVisitor,
  selectUser,
  VisitorState,
} from "global/authSlice";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearCart } from "global/listingSlice";
import { getRiderStatus } from "../../../api/api";

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user: any = useSelector(selectUser);
  const select = useSelector(selectIsVisitor);
  const [riderStatus, setRiderStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      title: "Wallet",
      icon: <MaterialCommunityIcons name="wallet" size={24} color="#F59E0B" />,
      color: "#F59E0B",
      route: "wallet",
    },
    {
      title: "Message",
      icon: <MaterialIcons name="message" size={24} color="#FF3B30" />,
      color: "#FF3B30",
      route: "message",
    },
    // {
    //   title: "Notifications",
    //   icon: <Ionicons name="notifications" size={24} color="#FFB800" />,
    //   color: "#FFB800",
    //   route: "notifications",
    // },
  ];

  useEffect(() => {
    const fetchStatus = async () => {
      const token = user?.data?.token;
      if (!token) return;
      setLoadingStatus(true);
      try {
        const res = await getRiderStatus(token);
        setRiderStatus(res?.data?.data);
      } catch (e) {
        setRiderStatus(null);
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const token = user?.data?.token;
      if (token) {
        const res = await getRiderStatus(token);
        setRiderStatus(res?.data?.data);
      }
    } catch (e) {
      console.log("Refresh error:", e);
    }
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#004CFF"]}
            tintColor="#004CFF"
          />
        }
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

            <View className="bg-[#F8F9FA] rounded-2xl p-3 mb-5">
              <TouchableOpacity
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
                onPress={async () => {
                  try {
                    const token = user?.data?.token;
                    if (!token) {
                      router.replace("/(auth)/login");
                      return;
                    }
                    if (!riderStatus) {
                      router.push("/rider/personal-info");
                      return;
                    }
                    const status = riderStatus.status;
                    if (status === "APPROVED") {
                      router.push("/(tabs)/(rides)");
                    } else {
                      router.push("/rider/personal-info");
                    }
                  } catch (err) {
                    router.push("/rider/personal-info");
                  }
                }}
              >
                <View className="flex-row items-center space-x-6 gap-3">
                  <MaterialCommunityIcons
                    name="bike-fast"
                    size={24}
                    color="#22C55E"
                  />
                  <Text className="font-NunitoRegular text-lg text-gray-700">
                    Switch to Rider
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
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

            {/* Rider Registration Status */}

            {riderStatus === null ? null : (
              <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
                <Text className="font-RalewayBold text-lg mb-2">
                  Rider Registration Status
                </Text>

                {!riderStatus ? null : (
                  <>
                    <Text className="font-NunitoRegular mb-1">
                      Status:{" "}
                      <Text
                        className={`font-RalewayExtraBold ${riderStatus.status === "REJECTED" ? "text-red-500" : riderStatus.status === "APPROVED" ? "text-green-500" : "text-yellow-500"}`}
                      >
                        {riderStatus.status}
                      </Text>
                    </Text>
                    {riderStatus.status === "APPROVED" && (
                      <Text className="mb-2 font-NunitoRegular text-green-700">
                        Registration complete. You can edit your details below.
                      </Text>
                    )}
                    {riderStatus.status === "PENDING" && (
                      <Text className="mb-2 font-NunitoRegular text-yellow-700">
                        Your registration is pending. You can review or edit
                        your details.
                      </Text>
                    )}
                    {riderStatus.status === "REJECTED" && (
                      <Text className="mb-2 font-NunitoRegular text-red-700">
                        Your registration was rejected. Please review and update
                        your details.
                      </Text>
                    )}
                    <View className="mt-2">
                      <Text className="font-NunitoRegular text-xs text-gray-500">
                        KYC Status: {riderStatus.kyc?.status || "N/A"}
                      </Text>
                      <Text className="font-NunitoRegular text-xs text-gray-500">
                        Vehicle: {riderStatus.vehicle?.brand || "N/A"}{" "}
                        {riderStatus.vehicle?.model || ""}{" "}
                        {riderStatus.vehicle?.plateNumber || ""}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="mt-4 bg-primary-100 py-2 px-4 rounded-xl"
                      onPress={() => router.push("/rider/personal-info")}
                    >
                      <Text className="text-white text-center font-NunitoBold">
                        Edit Details
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* Logout */}
        <TouchableOpacity
          className="bg-[#F8F9FA] rounded-2xl flex-row items-center justify-between p-4 mb-10"
          onPress={() => {
            if (!select) {
              AsyncStorage.removeItem("sessionId");
              AsyncStorage.removeItem("userLocation");
              dispatch(clearCart());
              dispatch(logoutState());
              router.replace("/(auth)/login");
            } else {
              router.replace("/(auth)/login");
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
