import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../../../global/store";
import { showError, showSuccess } from "utils/toast";
import * as Location from "expo-location";
import { useSingleOrder } from "hooks/useHooks";
import { completeOrder, markedPickup, startTransitDelivery, completeOrderWithOTP } from "api/api";
import { mutate } from "swr";
import { useSessionAndSocket } from "hooks/useSessionManager";

export default function ActiveDeliveryDetails() {
  const params = useLocalSearchParams();
  // Extract deliveryId - handle both string and array cases
  const deliveryId = Array.isArray(params.deliveryId) 
    ? params.deliveryId[0] 
    : params.deliveryId;
  
  const router = useRouter();
  const user: any = useSelector((state: RootState) => state.auth.user);
  const token = user?.data?.token;
  const [pickUP, setpickUP] = useState(false);
  const [inTransit, setInTransit] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
    const { getSocket } =
      useSessionAndSocket(token, user?.data?.user);


  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );

  const mapRef = useRef<MapView | null>(null);
  const { delivery, isLoading, isError } = useSingleOrder(
    token,
    deliveryId as string
  );

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location access is needed to navigate"
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);
useEffect(() => {
  if (!deliveryId) return;
  let interval: NodeJS.Timeout | null = null;

  

  const startLiveTracking = async () => {
    const socket = getSocket();
    if (!socket) return;

    interval = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
          setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      console.log("location",loc)
        socket.emit("delivery_location_update", {
          deliveryId,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      } catch (err) {
        console.error("Failed to get location for live tracking:", err);
      }
    }, 10000); // every 10 seconds
  };

  if (delivery?.data?.status === "IN_TRANSIT" || delivery?.data?.status === "PICKUP_UP") {
    startLiveTracking();
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [delivery?.data?.status]);


  const handlePickUpStart = async () => {
    setpickUP(true);
    markedPickup(token as string, deliveryId as string)
      .then((res) => {
        setpickUP(false);
        showSuccess("Pickup started successfully");
        mutate(`rider/delivery/${deliveryId as string}`)
      })
      .catch((err) => {
        setpickUP(false);
        console.error("Pickup start error:", err.response?.data || err.message);
        showError(err.response?.data?.message || "Failed to start pickup");
      });
  };
  const handleInTransit = async () => {
    setInTransit(true);
    startTransitDelivery(token as string, deliveryId as string)
      .then((res) => {
        setInTransit(false);
        mutate(`rider/delivery/${deliveryId as string}`)
        showSuccess("Pickup started successfully");
      })
      .catch((err) => {
        setInTransit(false);
        console.error("Pickup start error:", err.response?.data || err.message);
        showError(err.response?.data?.message || "Failed to start pickup");
      });
  };
  const handleDelivery = async () => {
    // Show OTP modal instead of directly completing
    setShowOTPModal(true);
  };

  const handleConfirmDeliveryWithOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert("OTP Required", "Please enter the OTP code to confirm delivery.");
      return;
    }

    setOtpLoading(true);
    try {
      await completeOrderWithOTP(token as string, deliveryId as string, otpCode);
      setOtpLoading(false);
      setShowOTPModal(false);
      setOtpCode("");
      mutate(`rider/delivery/${deliveryId as string}`);
      showSuccess("Delivery completed successfully");
    } catch (err: any) {
      setOtpLoading(false);
      console.error("Delivery confirmation error:", err.response?.data || err.message);
      showError(err.response?.data?.message || "Failed to confirm delivery. Invalid OTP?");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0056FF" />
        <Text className="mt-3 text-gray-500 font-NunitoMedium">
          Loading delivery...
        </Text>
      </View>
    );
  }

  // If there was an error fetching the order, show a friendly message
  if (isError) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-4">
        <Text className="text-center text-gray-500">Delivery not found</Text>
      </View>
    );
  }

  const pickup = {
    latitude: Number(delivery?.data?.pickupLat),
    longitude: Number(delivery?.data?.pickupLng),
  };
  const dropoff = {
    latitude: Number(delivery?.data?.dropoffLat),
    longitude: Number(delivery?.data?.dropoffLng),
  };

  // Debug: Log coordinates

  return (
    <View className="flex-1 bg-white">
      {/* Map Section */}
      <View className="h-[50%]">
        {/* Only render the map when we have valid numeric coordinates */}
        {((coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') ||
          (typeof pickup.latitude === 'number' && !isNaN(pickup.latitude) && typeof pickup.longitude === 'number' && !isNaN(pickup.longitude))) ? (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: (coords && coords.latitude) || pickup.latitude,
              longitude: (coords && coords.longitude) || pickup.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Only pass valid coordinates to markers */}
            {typeof pickup.latitude === 'number' && !isNaN(pickup.latitude) && typeof pickup.longitude === 'number' && !isNaN(pickup.longitude) && (
              <Marker coordinate={pickup} title="Pickup" pinColor="green" />
            )}

            {typeof dropoff.latitude === 'number' && !isNaN(dropoff.latitude) && typeof dropoff.longitude === 'number' && !isNaN(dropoff.longitude) && (
              <Marker coordinate={dropoff} title="Dropoff" pinColor="red" />
            )}

            {coords && (
              <Marker
                coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
                title="You"
              />
            )}

            {(typeof pickup.latitude === 'number' && !isNaN(pickup.latitude) && typeof pickup.longitude === 'number' && !isNaN(pickup.longitude) &&
              typeof dropoff.latitude === 'number' && !isNaN(dropoff.latitude) && typeof dropoff.longitude === 'number' && !isNaN(dropoff.longitude)) && (
              <Polyline
                coordinates={[pickup, dropoff]}
                strokeColor="#0056FF"
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 font-RalewayRegular">Map data unavailable</Text>
          </View>
        )}
      </View>

      {/* Details Section */}
      <ScrollView className="flex-1 p-5">
        <Text className="text-2xl font-RalewayBold mb-3">Order Details</Text>

        <Text className="text-gray-600 font-NunitoLight">
          <Text className="font-NunitoBold">Pickup: </Text>
          {delivery?.data?.pickupAddress}
        </Text>
        <Text className="text-gray-600 font-NunitoLight">
          <Text className="font-NunitoBold">Dropoff: </Text>
          {delivery?.data?.dropoffAddress}
        </Text>
        <Text className="text-gray-600 font-NunitoLight">
          <Text className="font-NunitoBold">Customer: </Text>
          {delivery?.data?.order?.user?.name}
        </Text>
        <Text className="text-gray-600 font-NunitoLight">
          <Text className="font-NunitoBold">Vendor: </Text>
          {delivery?.data?.order?.vendor?.user?.name}
        </Text>

        <View className="flex-row justify-between mt-4">
          <Text className="text-xl font-RalewayBold">
            ₦{delivery?.data?.fareAmount}
          </Text>
          <Text
            className={`font-NunitoBold ${
              delivery?.data?.status === "ACCEPTED"
                ? "text-blue-500"
                : delivery?.data?.status === "PICKED_UP"
                  ? "text-orange-500"
                : delivery?.data?.status === "IN_TRANSIT"
                  ? "text-yellow-500"
                  : delivery?.data?.status === "DELIVERED"
                    ? "text-green-600"
                    : "text-gray-400"
            }`}
          >
            {delivery?.data?.status}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="mt-6 space-y-3">
          {delivery?.data?.status === "ACCEPTED" && (
            <TouchableOpacity
              onPress={handlePickUpStart}
              disabled={pickUP}
              className="bg-blue-600 py-4 rounded-xl"
            >
              <Text className="text-white text-center font-NunitoBold text-lg">
                {pickup ? "Starting..." : "Start Pickup"}
              </Text>
            </TouchableOpacity>
          )}

          {delivery?.data?.status === "PICKED_UP" && (
            <TouchableOpacity
              onPress={handleInTransit}
              disabled={inTransit}
              className="bg-orange-500 py-4 rounded-xl"
            >
              <Text className="text-white text-center font-NunitoBold text-lg">
                {inTransit ? "Marking..." : "Mark as Picked"}
              </Text>
            </TouchableOpacity>
          )}

          {delivery?.data?.status === "IN_TRANSIT" && (
            <TouchableOpacity
              onPress={handleDelivery}
              disabled={delivered}
              className="bg-green-600 py-4 rounded-xl"
            >
              <Text className="text-white text-center font-NunitoBold text-lg">
                {delivered ? "Delivering..." : "Mark as Delivered"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* OTP Confirmation Modal */}
      <Modal
        visible={showOTPModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !otpLoading && setShowOTPModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-lg">
              <Text className="text-2xl font-RalewayBold mb-2 text-center">
                Confirm Delivery
              </Text>
              <Text className="text-gray-600 font-NunitoLight text-center mb-4">
                Enter the OTP code from the customer to confirm delivery
              </Text>

              <TextInput
                placeholder="Enter OTP (e.g., 123456)"
                placeholderTextColor="#9CA3AF"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="numeric"
                maxLength={6}
                editable={!otpLoading}
                className="border border-gray-300 rounded-xl px-4 py-3 font-NunitoBold text-lg mb-6 text-center tracking-widest"
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowOTPModal(false);
                    setOtpCode("");
                  }}
                  disabled={otpLoading}
                  className="flex-1 bg-gray-200 py-3 rounded-xl"
                >
                  <Text className="text-gray-800 text-center font-NunitoBold">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmDeliveryWithOTP}
                  disabled={otpLoading || !otpCode.trim()}
                  className={`flex-1 py-3 rounded-xl ${
                    otpLoading || !otpCode.trim()
                      ? "bg-gray-300"
                      : "bg-green-600"
                  }`}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-center font-NunitoBold">
                      Confirm
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
