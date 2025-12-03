import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "../../../global/store";
import { StatusBar } from "expo-status-bar";
import { useRider } from "hooks/useHooks";
import { useSessionAndSocket } from "hooks/useSessionManager";
import { showError, showSuccess } from "utils/toast";
import axios from "axios";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { mutate } from "swr";

interface StatItem {
  title: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

interface MenuItem {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  route: string;
}

const RiderDashboard = () => {
  const router = useRouter();
  const user: any = useSelector((state: RootState) => state.auth.user);
  const token = user?.data?.token;
  const { getSocket, onSocketReady, updateRiderLocation, toggleRiderOnline } =
    useSessionAndSocket(token, user?.data?.user);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [incomingDeliveries, setIncomingDeliveries] = useState<any[]>([]);
  // Keep a short-lived set of seen deliveryIds to avoid reacting to rapid re-emits
  const seenDeliveryIdsRef = useRef<Set<string>>(new Set());

  const { isLoading, isError, rider } = useRider(token);

  const riderId = rider?.data?.id;

  // Handle new delivery notifications
  console.log(incomingDeliveries)
  const handleNewDeliveryOffer = async (data: any) => {


    try {
      // Normalize to array if backend sends either a single object or an array
      const offers = Array.isArray(data) ? data : [data];

      setIncomingDeliveries((prev) => {
        const toAdd: any[] = [];

        for (const offer of offers) {
          if (!offer) continue;
          const id = offer.deliveryId;
          if (!id) {
            console.warn("Incoming offer missing deliveryId, skipping:", offer);
            continue;
          }

          // Already in current state?
          const existsInState = prev.some((d: any) => d.deliveryId === id);
          if (existsInState) {
            console.log("Offer already present in state, ignoring:", id);
            continue;
          }

          // Recently seen (short TTL) - prevents rapid re-emits from duplicating
          if (seenDeliveryIdsRef.current.has(id)) {
            continue;
          }

          // Mark as seen for 30s
          seenDeliveryIdsRef.current.add(id);
          setTimeout(() => seenDeliveryIdsRef.current.delete(id), 30 * 1000);

          // Schedule notification for new delivery (fire-and-forget)
          Notifications.scheduleNotificationAsync({
            content: {
              title: "🚨 New Delivery Nearby!",
              body: `${offer.vendorName} has a pickup near you (${offer.pickupAddress})`,
              data: {
                deliveryId: id,
                pickupAddress: offer.pickupAddress,
                dropoffAddress: offer.dropoffAddress,
                fareAmount: offer.fareAmount,
              },
            },
            trigger: null,
          }).catch((err) => console.error("Failed to schedule notification:", err));

          toAdd.push(offer);
        }

        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });
    } catch (err) {
      console.error("Failed to handle delivery offer:", err);
    }
  };

  useEffect(() => {
    onSocketReady((socket) => {
      console.log("🔗 Rider socket ready — listening for delivery offers");
      socket.on("new_delivery_offer", handleNewDeliveryOffer);
    });

    return () => {
      const s = getSocket();
      s?.off("new_delivery_offer");
    };
  }, []);
  useEffect(() => {
    // Only start the location updates if we have the riderId
    if (!riderId) {
      console.log("Waiting for riderId...");
      return;
    }

    console.log("Starting location updates for rider:", riderId);
    
    // Initial location update
    const updateLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        console.log("Updating location for rider:", riderId);
        updateRiderLocation(loc.coords.latitude, loc.coords.longitude, riderId);
      } catch (err) {
        console.error("Failed to update location:", err);
      }
    };

    // Run initial update
    updateLocation();

    // Set up interval for subsequent updates
    const watch = setInterval(updateLocation, 20000);

    return () => {
      console.log("Cleaning up location updates for rider:", riderId);
      clearInterval(watch);
    };
  }, [riderId]); // Add riderId as a dependency

  const handleToggleStatus = async (newStatus: boolean) => {
    if (isTogglingStatus) return; // Prevent multiple clicks
    try {
      setIsTogglingStatus(true);
      await toggleRiderOnline(newStatus, riderId);
      // Success handled by Redux state update
      mutate(`/rider/me`);
      showSuccess(`✅ You are now ${newStatus ? "online" : "offline"}`);
    } catch (err: any) {
      showError(`Failed to update status: ${err.message}`);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    try {
      const res = await axios.post(
        `https://proxy-backend-6of2.onrender.com/api/rider/accept-delivery/${deliveryId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSuccess("✅ Delivery accepted successfully!");
      // Remove this specific delivery from the list
      setIncomingDeliveries(prev => prev.filter(d => d.deliveryId !== deliveryId));
    } catch (err: any) {
      console.error("acceptDelivery error:", err.response?.data || err.message);
      showError(
        `❌ Failed to accept delivery: ${err.response?.data?.message || err.message}`
      );
    }
  };

  const riderStats: StatItem[] = [
    {
      title: "Total Rides",
      value: "0",
      icon: "bike" as const,
      color: "#0056FF",
    },
    {
      title: "Today's Earnings",
      value: "$0",
      icon: "cash" as const,
      color: "#22C55E",
    },
    {
      title: "Rating",
      value: "N/A",
      icon: "star" as const,
      color: "#F59E0B",
    },
  ];

  const menuItems: MenuItem[] = [
    {
      title: "Active Orders",
      icon: "clipboard-list" as const,
      color: "#0056FF",
      route: "active-orders",
    },
    // {
    //   title: "Earnings",
    //   icon: "cash-multiple" as const,
    //   color: "#22C55E",
    //   route: "earnings",
    // },
    {
      title: "History",
      icon: "history" as const,
      color: "#8B5CF6",
      route: "history",
    },
    // {
    //   title: "Settings",
    //   icon: "cog" as const,
    //   color: "#F59E0B",
    //   route: "settings",
    // },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#004CFF" />
        <Text className="mt-3 font-NunitoMedium text-gray-500">
          Loading rider details...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 font-NunitoSemiBold">
          Failed to load rider profile
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-row items-center border border-b border-gray-300 px-5 pt-16 pb-4">
        <TouchableOpacity
          className="bg-[#F1F4F9] p-3 rounded-full"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#0D1321" />
        </TouchableOpacity>
        <Text className="text-2xl font-RalewayBold ml-4">Rider Dashboard</Text>
        <Image
          source={{ uri: rider?.data?.kyc?.selfieUrl }}
          className="w-10 h-10 ml-auto rounded-full"
          resizeMode="contain"
        />
      </View>

      {/* Header */}
      <View className="bg-primary p-6 rounded-b-3xl">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-black font-RalewayMedium text-2xl mb-2">
              Welcome back, {rider?.data.fullName || "Rider"}!
            </Text>
            <Text
              className={`font-NunitoBold text-lg ${rider?.data?.isOnline ? "text-green-600" : "text-red-500"}`}
            >
              {rider?.data?.isOnline ? "You're online" : "You're offline"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleToggleStatus(!rider?.data?.isOnline)}
            disabled={isTogglingStatus}
            className={`px-4 py-2 rounded-full flex-row items-center ${
              rider?.data?.isOnline ? "bg-green-500" : "bg-gray-300"
            } ${isTogglingStatus ? "opacity-70" : ""}`}
          >
            {isTogglingStatus ? (
              <ActivityIndicator
                size="small"
                color="white"
                style={{ marginRight: 4 }}
              />
            ) : (
              <MaterialCommunityIcons
                name="power"
                size={20}
                color="white"
                style={{ marginRight: 4 }}
              />
            )}
            <Text className="text-white font-NunitoBold">
              {isTogglingStatus
                ? "Updating..."
                : user?.data?.user?.isOnline
                  ? "Go Offline"
                  : "Go Online"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row justify-between px-4 mt-4">
        {riderStats.map((stat, index) => (
          <View
            key={index}
            className="bg-white rounded-xl p-4 shadow-sm flex-1 mx-1"
          >
            <MaterialCommunityIcons
              name={stat.icon}
              size={24}
              color={stat.color}
            />
            <Text className="text-gray-600 mt-2 font-NunitoLight">
              {stat.title}
            </Text>
            <Text className="text-xl font-RalewayBold mt-1">{stat.value}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View className="px-4 mt-6">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(`/(rides)/${item.route}`)}
            className="flex-row items-center bg-white p-4 rounded-xl mb-3 shadow-sm"
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={item.color}
            />
            <Text className="text-gray-800 text-lg font-NunitoLight ml-4">
              {item.title}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9CA3AF"
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={incomingDeliveries.length > 0} transparent animationType="slide">
        {incomingDeliveries.map((delivery: any) => (
          <View className="flex-1 bg-black/50 justify-center items-center" key={delivery?.deliveryId}>
            <View className="bg-white p-6 rounded-2xl w-[85%]"  key={delivery?.deliveryId}>
              <Text className="text-xl font-RalewayBold mb-2">
                New Delivery Offer
              </Text>
              <Text className="text-gray-600 font-NunitoLight">
                Pickup: {delivery?.pickupAddress}
              </Text>
              <Text className="text-gray-600 font-NunitoLight">
                Dropoff: {delivery?.dropoffAddress}
              </Text>
              <Text className="text-gray-600 font-NunitoLight">
                Fare: ₦{delivery?.fareAmount}
              </Text>
              <Text className="text-gray-600 font-NunitoLight">
                Vendor: {delivery?.vendorName}
              </Text>

              <View className="flex-row justify-between mt-5">
                <TouchableOpacity
                  onPress={() => {
                    // Remove this specific delivery from the list
                    setIncomingDeliveries(prev => 
                      prev.filter(d => d.deliveryId !== delivery.deliveryId)
                    );
                  }}
                  className="bg-gray-300 px-5 py-3 rounded-xl"
                >
                  <Text className="text-gray-800 font-NunitoBold">Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAcceptDelivery(delivery?.deliveryId)}
                  className="bg-[#0056FF] px-5 py-3 rounded-xl"
                >
                  <Text className="text-white font-NunitoBold">Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </Modal>
    </ScrollView>
  );
};

export default RiderDashboard;
