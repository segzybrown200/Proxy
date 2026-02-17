import React, { useEffect, useRef, useState } from "react";
import { formatCurrency } from "utils/currency";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Linking,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import MapView, { Marker, Polyline } from "react-native-maps";
import Ionicons from "react-native-vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import io from "socket.io-client";

const socket = io("https://proxy-backend-6of2.onrender.com");

const TrackOrderScreen = () => {
  const { order } = useLocalSearchParams();
  const parsedOrder = JSON.parse(order as string);
  const mapRef = useRef<MapView>(null);

  const [riderLocation, setRiderLocation] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState(parsedOrder.delivery?.status || "PENDING");
  // const [riderInfo, setRiderInfo] = useState<any>(null);

  const riderInfo = parsedOrder?.delivery?.rider



  const delivery = parsedOrder.delivery;
  const isDigital = parsedOrder.isDigital;

  // Animate marker smoothly
  const riderAnim = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    if (!delivery?.id) return;

    socket.on("delivery_location_update", (data) => {
      if (data?.deliveryId === delivery.id) {
        const newLocation = { latitude: data.lat, longitude: data.lng };
        setRiderLocation(newLocation);
        Animated.timing(riderAnim, {
          toValue: { x: data.lat, y: data.lng },
          duration: 800,
          useNativeDriver: false,
        }).start();
      }
    });

    socket.on("delivery_status_update", (data) => {
      if (data?.deliveryId === delivery.id) {
        setCurrentStatus(data.status);
      }
    });

    // socket.on("rider_assigned", (data) => {
    //   if (data?.deliveryId === delivery.id) {
    //     setRiderInfo(data.rider);
    //   }
    // });

    return () => {
      socket.off("delivery_location_update");
      socket.off("delivery_status_update");
      socket.off("rider_assigned");
    };
  }, [delivery]);

  // ✅ DIGITAL DELIVERY
  if (isDigital) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 p-5">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#ECF0F4] rounded-full mt-10 p-2 mb-3 w-10"
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>

        <Text className="text-2xl font-NunitoBold mb-3">Digital Delivery</Text>
        <Text className="text-gray-500 font-NunitoMedium mb-6">
          Your purchased files are ready below.
        </Text>

        {parsedOrder?.digitalFiles?.length ? (
          parsedOrder.digitalFiles.map((file: any) => (
            <TouchableOpacity
              key={file.id}
              onPress={() => Linking.openURL(file.url)}
              className="mb-4 bg-white rounded-xl shadow p-4 flex-row justify-between items-center"
            >
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={22} color="#004CFF" />
                <Text className="text-primary-100 font-NunitoSemiBold ml-2">
                  {file.name || "Download File"}
                </Text>
              </View>
              <Ionicons name="download-outline" size={22} color="#004CFF" />
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-gray-400 font-NunitoMedium">No files available.</Text>
        )}

        <View className="mt-6 bg-white p-5 rounded-2xl shadow-sm">
          <Text className="text-xl font-NunitoBold mb-2">Order Summary</Text>
          <Text className="text-gray-600">Order ID: {parsedOrder.id}</Text>
          <Text className="text-gray-600 mt-2">
            Total: {formatCurrency(parsedOrder.transaction.amountPaid, "NGN", "Nigerian Naira")}
          </Text>
          <Text className="text-gray-500 mt-2">
            Date: {new Date(parsedOrder.createdAt).toLocaleString()}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ PHYSICAL DELIVERY
  const pickup = {
    latitude: Number(delivery?.pickupLat) || 0,
    longitude: Number(delivery?.pickupLng) || 0,
  };
  const dropoff = {
    latitude: Number(delivery?.dropoffLat) || 0,
    longitude: Number(delivery?.dropoffLng) || 0,
  };
  const riderCords = {
    latitude: Number(parsedOrder?.rider?.currentLat) || 0,
    longitude: Number(parsedOrder?.rider?.currentLng) || 0,
  }
  const statusSteps = ["PENDING","SEARCH_OF_RIDER", "ACCEPTED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
  const activeIndex = statusSteps.indexOf(currentStatus);
  
  // Show fullscreen map during active delivery
  const isActiveDelivery = currentStatus === "PICKED_UP" || currentStatus === "IN_TRANSIT";

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header - Hidden during fullscreen map */}
      {isActiveDelivery && (
        <View className="flex-row items-center mt-7 px-4 pt-4 pb-3 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#ECF0F4] rounded-full p-2 mr-3"
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-2xl font-NunitoBold">Track Order</Text>
        </View>
      )}

      {/* Map Container */}
      <View className={isActiveDelivery ? "flex-1" : "h-72"}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: pickup.latitude || 0,
            longitude: pickup.longitude || 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onMapReady={() => {
            if (mapRef.current) {
              mapRef.current.fitToCoordinates([pickup, dropoff], {
                edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                animated: true,
              });
            }
          }}
        >
          <Marker coordinate={pickup} title="Pickup" pinColor="blue" />
          <Marker coordinate={dropoff} title="Dropoff" pinColor="green" />
          {riderLocation && (
            <Marker coordinate={riderLocation || riderCords} title="Rider" pinColor="red" />
          )}
          <Polyline
            coordinates={[
              pickup,
              ...(riderLocation ? [riderLocation] : []),
              dropoff,
            ]}
            strokeColor="#004CFF"
            strokeWidth={4}
          />
        </MapView>
      </View>

      {/* Order status and details - Hidden during fullscreen map */}
       
      <View className="flex-1 overflow-hidden bg-white border-t border-gray-200">
        <View className="flex-row justify-between mb-4 p-5">
          {statusSteps.map((step, index) => (
            <View key={step} className="items-center flex-1">
              <View
                className={`w-8 h-8 rounded-full border-2 ${
                  index <= activeIndex
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300"
                }`}
              />
              <Text
                className={`text-xs mt-1 text-center ${
                  index <= activeIndex
                    ? "text-blue-600 font-NunitoBold"
                    : "text-gray-400"
                }`}
              >
                {step.replace("_", " ")}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView className="flex-1 px-5">
          {riderInfo && (
            <View className="flex-row items-center mb-6 mt-2">
              <Image
                source={{
                  uri:
                    riderInfo?.kyc?.selfieUrl ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                }}
                className="w-12 h-12 rounded-full mr-3"
                contentFit="cover"
                style={{ borderRadius: 100, width: 48, height: 48, marginRight: 12 }}
              />
              <View className="flex-1">
                <Text className="font-NunitoBold text-black text-lg">
                  {riderInfo?.fullName}
                </Text>
                <Text className="font-NunitoMedium text-gray-500">
                  {riderInfo.vehicleType || "Bike"}
                </Text>
                <View className="flex flex-row gap-3">
                   <Text className="font-NunitoMedium text-gray-500">
                  {riderInfo?.vehicle?.model}
                </Text>
                   <Text className="font-NunitoMedium text-gray-500">
                  PlateNumber: {riderInfo?.vehicle?.plateNumber}
                </Text>
                </View>
               
              </View>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${riderInfo.phone}`)}
                className="bg-primary-100 px-3 py-3 rounded-full"
              >
                <Ionicons name="call-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Order Details */}
          <ScrollView horizontal={true} className="mb-5 ">
          {parsedOrder.listings?.map((item: any) => (
            <View key={item.id} className="flex-row items-center mb-3">
              <Image
                source={{
                  uri: item.image || "https://via.placeholder.com/80",
                }}
                className="w-12 h-12 rounded-md mr-3"
                contentFit="cover"
                style={{ borderRadius: 8, width: 48, height: 48, marginRight: 12 }}
              />
              <View className="flex-1">
                <Text className="font-NunitoSemiBold text-black">
                  {item.title}
                </Text>
                <Text className="text-gray-500 font-NunitoMedium">
                  ₦{item.price.toLocaleString()} x {item.quantity}
                </Text>
              </View>
            </View>
          ))}
          </ScrollView>
          
          <View className="mt-3 border-t border-gray-300 pt-3 pb-5">
            <Text className="font-NunitoBold text-black">
              Total: ₦{parsedOrder.transaction.amountPaid.toLocaleString()}
            </Text>
            <Text className="font-NunitoBold text-black mt-1">
              Delivery Fare: ₦
              {parsedOrder?.delivery?.fareAmount?.toLocaleString()}
            </Text>
            <Text className="text-gray-500 font-RalewayLight mt-1">
              Date: {new Date(parsedOrder.createdAt).toLocaleString()}
            </Text>
          </View>
        </ScrollView>
      </View>
      
    </SafeAreaView>
  );
};

export default TrackOrderScreen;
