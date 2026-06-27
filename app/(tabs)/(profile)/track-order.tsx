import React, { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../../../utils/currency";
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
import MapView, { Marker, Polyline, Circle } from "react-native-maps";
import Ionicons from "react-native-vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import io from "socket.io-client";

const socket = io("https://proxy-backend-1rfl.onrender.com");

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const TrackOrderScreen = () => {
  const { order } = useLocalSearchParams();
  const parsedOrder = JSON.parse(order as string);
  const mapRef = useRef<MapView>(null);

  const [riderLocation, setRiderLocation] = useState<any>(null);
  const [vendorLocation, setVendorLocation] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState(parsedOrder.delivery?.status || "PENDING");
  // const [riderInfo, setRiderInfo] = useState<any>(null);

  const delivery = parsedOrder.delivery;
  const isSelfDelivery = delivery?.isSelfDelivery;
  const riderInfo = isSelfDelivery ? null : parsedOrder?.delivery?.rider;
  const vendorInfo = parsedOrder?.vendor;
  const otp = delivery?.otp;
  const isDigital = parsedOrder.isDigital;


  // Animate marker smoothly
  const riderAnim = useRef(new Animated.ValueXY()).current;
  const vendorAnim = useRef(new Animated.ValueXY()).current;

  // console.log(JSON.stringify(parsedOrder, null, 2))

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

    socket.on("delivery_vendor_on_the_way", (data) => {
      if (data?.deliveryId === delivery.id) {
        const newVendorLocation = { latitude: data.vendorLat, longitude: data.vendorLng };
  
        setVendorLocation(newVendorLocation);
        Animated.timing(vendorAnim, {
          toValue: { x: data.vendorLat, y: data.vendorLng },
          duration: 800,
          useNativeDriver: false,
        }).start();
      }
    });

    // console.log(vendorLocation)

    socket.on("vendor_location_update", (data) => {
      console.log("Vendor data",data)
      if (data?.vendorId === vendorInfo?.id && isSelfDelivery) {
        const newVendorLocation = { latitude: data.lat, longitude: data.lng };
        console.log("new Location",newVendorLocation)
        setVendorLocation(newVendorLocation);
        Animated.timing(vendorAnim, {
          toValue: { x: data.lat, y: data.lng },
          duration: 800,
          useNativeDriver: false,
        }).start();
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
      socket.off("delivery_vendor_on_the_way");
      socket.off("vendor_location_update");
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
    latitude: isSelfDelivery 
      ? Number(delivery?.vendorLat) || 0 
      : Number(parsedOrder?.rider?.currentLat) || 0,
    longitude: isSelfDelivery 
      ? Number(delivery?.vendorLng) || 0 
      : Number(parsedOrder?.rider?.currentLng) || 0,
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
              const vendorStartCoord = {
                latitude: Number(delivery?.vendorLat) || 0,
                longitude: Number(delivery?.vendorLng) || 0,
              };
              const coordsToFit = isSelfDelivery 
                ? [vendorStartCoord, dropoff]
                : [pickup, dropoff];
              mapRef.current.fitToCoordinates(coordsToFit, {
                edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                animated: true,
              });
            }
          }}
        >
          {!isSelfDelivery && (
            <Marker coordinate={pickup} title="Pickup" pinColor="blue" />
          )}
          <Marker coordinate={dropoff} title="Dropoff" pinColor="green" />
          {isSelfDelivery && (
            <Marker 
              coordinate={{
                latitude: Number(delivery?.vendorLat) || 0,
                longitude: Number(delivery?.vendorLng) || 0,
              }}
              title="Vendor Starting Location" 
              pinColor="purple"
              description="Where vendor is"
            />
          )}
          {vendorLocation && isSelfDelivery && (
            <>
              <Circle
                center={vendorLocation}
                radius={50}
                fillColor="rgba(255, 165, 0, 0.2)"
                strokeColor="rgba(255, 165, 0, 0.5)"
                strokeWidth={2}
              />
              <Marker 
                coordinate={vendorLocation}
              >
                <View className="items-center">
                  <View className="bg-orange-500 px-2 py-1 rounded-md mb-1">
                    <Text className="text-white font-bold text-xs">Vendor</Text>
                  </View>
                  <View className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white" style={{shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 2, elevation: 5}} />
                </View>
              </Marker>
            </>
          )}
          {riderLocation && !isSelfDelivery && (
            <>
              <Circle
                center={riderLocation}
                radius={50}
                fillColor="rgba(255, 0, 0, 0.2)"
                strokeColor="rgba(255, 0, 0, 0.5)"
                strokeWidth={2}
              />
              <Marker 
                coordinate={riderLocation || riderCords}
              >
                <View className="items-center">
                  <View className="bg-red-500 px-2 py-1 rounded-md mb-1">
                    <Text className="text-white font-bold text-xs">Rider</Text>
                  </View>
                  <View className="w-4 h-4 bg-red-500 rounded-full border-2 border-white" style={{shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 2, elevation: 5}} />
                </View>
              </Marker>
            </>
          )}
          <Polyline
            coordinates={[
              isSelfDelivery
                ? {
                    latitude: Number(delivery?.vendorLat) || 0,
                    longitude: Number(delivery?.vendorLng) || 0,
                  }
                : pickup,
              ...(vendorLocation && isSelfDelivery ? [vendorLocation] : []),
              ...(riderLocation && !isSelfDelivery ? [riderLocation] : []),
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
          {/* Rider or Vendor Info */}
          {(riderInfo || vendorInfo) && (
            <View className="flex-row items-center mb-6 mt-2">
              <Image
                source={{
                  uri: isSelfDelivery
                    ? vendorInfo?.image?.selfieUrl ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    : riderInfo?.kyc?.selfieUrl ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                }}
                className="w-12 h-12 rounded-full mr-3"
                contentFit="cover"
                style={{ borderRadius: 100, width: 48, height: 48, marginRight: 12 }}
              />
              <View className="flex-1">
                <Text className="font-NunitoBold text-black text-lg">
                  {isSelfDelivery ? vendorInfo?.name : riderInfo?.fullName}
                </Text>
                {!isSelfDelivery && (
                  <>
                    <Text className="font-NunitoMedium text-gray-500">
                      {riderInfo?.vehicleType || "Bike"}
                    </Text>
                    <View className="flex flex-row gap-3">
                      <Text className="font-NunitoMedium text-gray-500">
                        {riderInfo?.vehicle?.model}
                      </Text>
                      <Text className="font-NunitoMedium text-gray-500">
                        PlateNumber: {riderInfo?.vehicle?.plateNumber}
                      </Text>
                    </View>
                  </>
                )}
                {isSelfDelivery && (
                  <Text className="font-NunitoMedium text-gray-500">
                    {vendorInfo?.email}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    `tel:${isSelfDelivery ? vendorInfo?.phone : riderInfo?.phone}`
                  )
                }
                className="bg-primary-100 px-3 py-3 rounded-full"
              >
                <Ionicons name="call-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Display */}
          {otp && (
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <Text className="font-NunitoMedium text-gray-600 mb-2">
                Delivery OTP
              </Text>
              <Text className="font-NunitoBold text-2xl text-blue-600 tracking-widest">
                {otp}
              </Text>
              <Text className="font-NunitoMedium text-gray-500 mt-2 text-xs">
                Share this code with the {isSelfDelivery ? "vendor" : "rider"} when done with delivery/service
              </Text>
            </View>
          )}

          {/* Location Info Card */}
          <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <Text className="font-NunitoBold text-black mb-4">Location & Distance Info</Text>
            
            {/* Legend */}
            <View className="mb-4 border-b border-gray-300 pb-4">
              <Text className="font-NunitoBold text-gray-700 mb-2 text-sm">Map Legend:</Text>
              <View className="flex-row items-center mb-2">
                <View style={{ width: 16, height: 16, backgroundColor: '#9333EA', borderRadius: 8, marginRight: 8 }} />
                <Text className="font-NunitoMedium text-gray-600 text-sm">
                  {isSelfDelivery ? "Vendor starting location" : "Pickup location"}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <View style={{ width: 16, height: 16, backgroundColor: '#22C55E', borderRadius: 8, marginRight: 8 }} />
                <Text className="font-NunitoMedium text-gray-600 text-sm">Dropoff location</Text>
              </View>
              {isSelfDelivery && (
                <View className="flex-row items-center mb-2">
                  <View style={{ width: 16, height: 16, backgroundColor: '#FF9500', borderRadius: 8, marginRight: 8 }} />
                  <Text className="font-NunitoMedium text-gray-600 text-sm">Vendor current location (en route)</Text>
                </View>
              )}
              {!isSelfDelivery && (
                <View className="flex-row items-center">
                  <View style={{ width: 16, height: 16, backgroundColor: '#EF4444', borderRadius: 8, marginRight: 8 }} />
                  <Text className="font-NunitoMedium text-gray-600 text-sm">Rider current location</Text>
                </View>
              )}
            </View>

            {/* Current Location Info */}
            {(vendorLocation || riderLocation) && (
              <View>
                <Text className="font-NunitoBold text-gray-700 mb-3 text-sm">
                  {isSelfDelivery ? "Vendor" : "Rider"} Status
                </Text>
                
                {/* Real-time Location Section */}
                <View className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <Text className="font-NunitoBold text-orange-700 text-sm mb-2">Real-time Location</Text>
                  
                  <Text className="font-NunitoMedium text-gray-600 text-xs mb-1">Distance from Dropoff</Text>
                  <Text className="font-NunitoBold text-lg text-orange-600 mb-2">
                    {isSelfDelivery && vendorLocation
                      ? calculateDistance(
                          vendorLocation.latitude,
                          vendorLocation.longitude,
                          dropoff.latitude,
                          dropoff.longitude
                        ).toFixed(2)
                      : riderLocation && !isSelfDelivery
                      ? calculateDistance(
                          riderLocation.latitude,
                          riderLocation.longitude,
                          dropoff.latitude,
                          dropoff.longitude
                        ).toFixed(2)
                      : "0.00"} km away
                  </Text>

                  <View className="flex-row justify-between bg-white rounded p-2">
                    <Text className="font-NunitoMedium text-gray-700 text-xs">
                      Lat: {isSelfDelivery && vendorLocation 
                        ? vendorLocation.latitude.toFixed(4)
                        : riderLocation && !isSelfDelivery
                        ? riderLocation.latitude.toFixed(4)
                        : "N/A"}
                    </Text>
                    <Text className="font-NunitoMedium text-gray-700 text-xs">
                      Lng: {isSelfDelivery && vendorLocation
                        ? vendorLocation.longitude.toFixed(4)
                        : riderLocation && !isSelfDelivery
                        ? riderLocation.longitude.toFixed(4)
                        : "N/A"}
                    </Text>
                  </View>
                </View>

                {/* Initial Location Section */}
                <View className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                  <Text className="font-NunitoBold text-purple-700 text-sm mb-2">Initial Location</Text>
                  
                  <Text className="font-NunitoMedium text-gray-600 text-xs mb-1">Distance from Dropoff</Text>
                  <Text className="font-NunitoBold text-lg text-purple-600 mb-2">
                    {isSelfDelivery
                      ? calculateDistance(
                          Number(delivery?.vendorLat) || 0,
                          Number(delivery?.vendorLng) || 0,
                          dropoff.latitude,
                          dropoff.longitude
                        ).toFixed(2)
                      : calculateDistance(
                          pickup.latitude,
                          pickup.longitude,
                          dropoff.latitude,
                          dropoff.longitude
                        ).toFixed(2)} km away
                  </Text>

                  <View className="flex-row justify-between bg-white rounded p-2">
                    <Text className="font-NunitoMedium text-gray-700 text-xs">
                      Lat: {isSelfDelivery 
                        ? (Number(delivery?.vendorLat) || 0).toFixed(4)
                        : pickup.latitude.toFixed(4)}
                    </Text>
                    <Text className="font-NunitoMedium text-gray-700 text-xs">
                      Lng: {isSelfDelivery
                        ? (Number(delivery?.vendorLng) || 0).toFixed(4)
                        : pickup.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>

                {/* Dropoff Address */}
                <View className="bg-white border border-green-200 rounded-lg p-3">
                  <Text className="font-NunitoBold text-green-700 text-sm mb-2">Dropoff Details</Text>
                  <Text className="font-NunitoMedium text-gray-600 text-xs mb-2">Address</Text>
                  <Text className="font-NunitoMedium text-gray-800 text-sm mb-3">
                    {delivery?.dropoffAddress || "N/A"}
                  </Text>
                  <View className="flex-row justify-between bg-gray-50 rounded p-2">
                    <Text className="font-NunitoMedium text-gray-700 text-xs">
                      Lat: {dropoff.latitude.toFixed(4)}
                    </Text>
                    <Text className="font-NunitoMedium text-gray-700 text-xs">
                      Lng: {dropoff.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

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
              Total: ₦{parsedOrder?.transaction?.amountPaid.toLocaleString()}
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
