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
import {
  completeOrder,
  markedPickup,
  startTransitDelivery,
  completeOrderWithOTP,
} from "api/api";
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
  const { getSocket } = useSessionAndSocket(token, user?.data?.user);

  const [coords, setCoords]: any = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [routeSteps, setRouteSteps] = useState<
    Array<{ html_instructions?: string; distance?: any; duration?: any }>
  >([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance?: string;
    duration?: string;
  } | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const { delivery, isLoading, isError } = useSingleOrder(
    token,
    deliveryId as string
  );
  const pickup = {
    latitude: Number(delivery?.data?.pickupLat),
    longitude: Number(delivery?.data?.pickupLng),
  };
  const dropoff = {
    latitude: Number(delivery?.data?.dropoffLat),
    longitude: Number(delivery?.data?.dropoffLng),
  };
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
          console.log("location", loc);
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

    if (
      delivery?.data?.status === "IN_TRANSIT" ||
      delivery?.data?.status === "PICKUP_UP"
    ) {
      startLiveTracking();
      //  if (dropoff) fetchRoute(coords, dropoff);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [delivery?.data?.status]);

  // Decode a polyline from Google Directions (encoded polyline algorithm)
  function decodePolyline(encoded: string) {
    if (!encoded) return [];
    const points: Array<{ latitude: number; longitude: number }> = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

  // Fetch driving directions (Google Directions API) and decode polyline

  const fetchRoute = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ) => {
    try {
      setRouteLoading(true);

      // Call backend instead of Google Maps directly
      const res = await axios.get(
        "https://proxy-backend-1rfl.onrender.com/api/search/get-direction",
        {
          params: {
            originLat: origin.latitude,
            originLng: origin.longitude,
            destLat: destination.latitude,
            destLng: destination.longitude,
          },
        }
      );

      const route = res.data.data; // your backend returns { success: true, data: route }

      if (route) {
        const coordsDecoded = route.overview_polyline?.points
          ? decodePolyline(route.overview_polyline.points)
          : [];
        setRouteCoords(coordsDecoded);

        // Extract turn-by-turn steps
        const steps: any[] = [];
        route.legs?.forEach((leg: any) => {
          leg.steps?.forEach((s: any) =>
            steps.push({
              html_instructions: s.html_instructions,
              distance: s.distance,
              duration: s.duration,
            })
          );
        });
        setRouteSteps(steps);
        setRouteInfo({
          distance: route.legs?.[0]?.distance?.text,
          duration: route.legs?.[0]?.duration?.text,
        });

        // Fit map to route
        if (mapRef.current && coordsDecoded.length > 0) {
          mapRef.current.fitToCoordinates(coordsDecoded, {
            edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
            animated: true,
          });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch route from backend", err);
    } finally {
      setRouteLoading(false);
    }
  };

  // When both pickup and dropoff are available, fetch a routed polyline
  useEffect(() => {
    if (!pickup || !dropoff) return;

    if (
      isFinite(pickup.latitude) &&
      isFinite(pickup.longitude) &&
      isFinite(dropoff.latitude) &&
      isFinite(dropoff.longitude)
    ) {
      fetchRoute(pickup, dropoff);
    }
  }, [pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude]);

  const handlePickUpStart = async () => {
    setpickUP(true);
    markedPickup(token as string, deliveryId as string)
      .then((res) => {
        setpickUP(false);
        showSuccess("Pickup started successfully");
        mutate(`rider/delivery/${deliveryId as string}`);
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
        mutate(`rider/delivery/${deliveryId as string}`);
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
      Alert.alert(
        "OTP Required",
        "Please enter the OTP code to confirm delivery."
      );
      return;
    }

    setOtpLoading(true);
    try {
      await completeOrderWithOTP(
        token as string,
        deliveryId as string,
        otpCode
      );
      setOtpLoading(false);
      setShowOTPModal(false);
      setOtpCode("");
      mutate(`rider/delivery/${deliveryId as string}`);
      showSuccess("Delivery completed successfully");
    } catch (err: any) {
      setOtpLoading(false);
      console.error(
        "Delivery confirmation error:",
        err.response?.data || err.message
      );
      showError(
        err.response?.data?.message ||
          "Failed to confirm delivery. Invalid OTP?"
      );
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

  // Debug: Log coordinates

  return (
    <View className="flex-1 bg-white">
      {/* Map Section */}

      <View className="absolute top-10 left-4 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-white p-2 rounded-full shadow"
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View className="h-[50%]">
        <View style={{ flex: 1 }}>
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
            {pickup && (
              <Marker coordinate={pickup} title="Pickup" pinColor="green" />
            )}

            {dropoff && (
              <Marker coordinate={dropoff} title="Dropoff" pinColor="red" />
            )}

            {coords && <Marker coordinate={coords} title="You" />}

            {routeCoords.length > 0 ? (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#0056FF"
                strokeWidth={4}
              />
            ) : (
              pickup &&
              dropoff && (
                <Polyline
                  coordinates={[pickup, dropoff]}
                  strokeColor="#0056FF"
                  strokeWidth={4}
                />
              )
            )}
          </MapView>

          {/* ✅ OVERLAY UI — OUTSIDE MapView */}
          {(routeInfo || routeLoading) && (
            <View
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                bottom: 12,
                zIndex: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  padding: 10,
                  borderRadius: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text className="font-NunitoExtraBold" >
                  {routeLoading
                    ? "Calculating route..."
                    : `${routeInfo?.distance} • ${routeInfo?.duration}`}
                </Text>

                <TouchableOpacity onPress={() => setShowSteps(!showSteps)}>
                  <Text className="font-RalewayMedium" style={{ color: "#0056FF" }}>
                    {showSteps ? "Hide steps" : "Show steps"}
                  </Text>
                </TouchableOpacity>
              </View>

              {showSteps && (
                <ScrollView
                  style={{
                    maxHeight: 200,
                    marginTop: 8,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 12,
                    padding: 8,
                  }}
                >
                  {routeSteps.map((s, i) => (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Text className="font-RalewaySemiBold">
                        {`${i + 1}. ${s.distance?.text} • ${s.duration?.text}`}
                      </Text>
                      <Text className="font-NunitoRegular" style={{ color: "#444" }}>
                        {String(s.html_instructions || "").replace(
                          /<[^>]*>/g,
                          ""
                        )}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>
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
                {pickup ? "Start Pickup" : "Starting..."}
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
