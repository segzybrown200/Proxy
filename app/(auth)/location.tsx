import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import CustomButton from "../../components/CustomButton";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { useDispatch } from "react-redux";
import { VisitorState } from "global/authSlice";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Address = () => {
  const { visitor } = useLocalSearchParams();
  const dispatch = useDispatch();
  const [isSubmitting, setisSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState<string>("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  console.log(visitor)

  useEffect(() => {
    // try to fetch location on mount
    (async () => {
      await fetchAndSetLocation();
    })();
  }, []);

  const saveLocationToStorage = async (locationData: {
    address: string;
    coords?: { latitude: number; longitude: number } | null;
  }) => {
    try {
      await AsyncStorage.setItem('userLocation', JSON.stringify(locationData));
    } catch (e) {
      console.error('Error saving location:', e);
    }
  };

  const fetchAndSetLocation = async () => {
    setLoadingLocation(true);
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const rev = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (rev && rev.length > 0) {
        const place = rev[0];
        // build address parts cleanly
        const parts: string[] = [];
        if (place.name) parts.push(place.name);
        if (place.street) parts.push(place.street);
        if (place.city) parts.push(place.city);
        if (place.region) parts.push(place.region);
        if (place.postalCode) parts.push(place.postalCode);
        if (place.country) parts.push(place.country);
        const addr = parts.join(", ");
        // fallback to lat/lon if no readable address
        const finalAddr =
          addr ||
          `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`;
        setAddress(finalAddr);
        // automatically navigate to register with address and coords
        try {
          const qp = `address=${encodeURIComponent(finalAddr)}&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}`;
        } catch (navErr) {
          // ignore navigation errors, we'll still show the address
          console.warn("Navigation error", navErr);
        }
      } else {
        setError("Unable to determine address");
      }
    } catch (e: any) {
      setError(e.message || "Error fetching location");
    }
    setLoadingLocation(false);
  };

  return (
    <>
      <SafeAreaView className=" flex-1 bg-white ">
        <View className="absolute">
          <Image source={require("../../assets/images/Bubbles.png")} />
        </View>
        <View>
          <View
            className="mt-20 p-5 w-full mb-[30px]
      "
          >
            <TouchableOpacity
              className="mb-4"
              onPress={() => router.back()}
            ></TouchableOpacity>
            <Text className="font-RalewayBold mt-[60px] self-center text-[32px]">
              Current Address
            </Text>
          </View>

          <View className="px-5 mt-[50px]">
            <Text className="text-xl font-RalewayMedium text-gray-500">
              Current location
            </Text>
            <View className="mt-4 flex-row items-center gap-3">
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <TouchableOpacity onPress={() => fetchAndSetLocation()}>
                  <FontAwesome6 name="location-dot" size={28} color="#000" />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }}>
                <Text className="text-lg font-NunitoMedium">
                  {address || (error ? error : "Location not available")}
                </Text>
                <Text className="text-lg font-NunitoLight text-gray-500">
                  Tap the icon to refresh location
                </Text>
              </View>
            </View>

            <View className="flex flex-1 justify-end flex-col  items-center mt-[200px] p-5">
              {visitor === "true" ? (
                <CustomButton
                  title="Confirm Location"
                  isLoading={isSubmitting}
                  handlePress1={async () => {
                    // Navigate to home as visitor and change global state of visitor to true
                    setisSubmitting(true);
                    dispatch(VisitorState(true));
                    // Save location before navigating
                    await saveLocationToStorage({
                      address,
                      coords
                    });
                    setTimeout(() => {
                      setisSubmitting(false);
                      router.replace(`/(tabs)/(home)`);
                    });
                  }}
                />
              ) : (
                <CustomButton
                  title="Confirm Location"
                  isLoading={isSubmitting}
                  handlePress1={async () => {
                    // Navigate with current address / coords if available
                    setisSubmitting(true);
                    const finalAddr = address || "";
                    const lat = coords?.latitude;
                    const lon = coords?.longitude;
                    // Save location before navigating
                    await saveLocationToStorage({
                      address: finalAddr,
                      coords
                    });
                    const qp = `address=${encodeURIComponent(finalAddr)}${lat ? `&lat=${lat}` : ""}${lon ? `&lon=${lon}` : ""}`;
                    router.push(`/(auth)/congratulation?${qp}`);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

export default Address;
