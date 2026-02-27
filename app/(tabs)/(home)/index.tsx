import * as Location from "expo-location";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Image } from 'expo-image';
import React, { useEffect, useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { SearchComponent } from "components/SearchInput";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useCategory,
  useNewListings,
  usePopularListings,
} from "hooks/useHooks";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AntDesign, Feather } from "@expo/vector-icons";
import { mutate } from "swr";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatCurrency } from "utils/currency";

const index = () => {
  const [userAddress, setUserAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const { categories, isError, isLoading } = useCategory();
  const {
    isLoading: PopularisLoading,
    popular,
    isError: popularError,
  } = usePopularListings();
  const {
    isLoading: NewListingsLocading,
    listings: NewListing,
    isError: NewError,
  } = useNewListings();

  const NewList = NewListing?.data || [];

  // Prefetch helper: fetch first page for a category and store in SWR cache
  const buildCategoryUrl = (categoryId: string, cursor = "") =>
    `https://proxy-backend-6of2.onrender.com/api/listings/search-category?limit=10&categoryId=${categoryId}${cursor ? `&cursor=${cursor}` : ""}`;

  const prefetchCategory = async (categoryId: string) => {
    try {
      const url = buildCategoryUrl(categoryId);
      const res = await axios.get(url);
      // cache first page response under the same key useSWRInfinite will generate for page 0
      mutate(url, res.data.data, false); // don't revalidate immediately
    } catch (err) {
      console.warn("prefetchCategory failed", err);
    }
  };

  // small helper: promise timeout wrapper
  async function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
    ]) as T;
  }

  // Helper to fetch and store location
  const fetchAndStoreLocation = async () => {
    try {
      setLoadingAddress(true);
      // Ensure device location services are enabled first
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          console.warn('Location services disabled');
          Alert.alert(
            'Location services disabled',
            'Please enable location services for accurate address. Open device settings?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          // restore stored address if available
          try {
            const stored = await AsyncStorage.getItem('userLocation');
            if (stored) {
              const parsed = JSON.parse(stored);
              setUserAddress(parsed?.address || 'Unable to fetch location');
            }
          } catch (inner) {
            console.warn('restore after disabled services failed', inner);
          }
          setLoadingAddress(false);
          return;
        }
      } catch (svcErr) {
        // ignore hasServices check failures and continue to permission request
        console.warn('hasServicesEnabledAsync failed', svcErr);
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // Permission denied: offer to open app settings and fall back to cached address
        Alert.alert(
          'Location permission',
          'Location permission denied. Open app settings to allow location access?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        // restore cached address if available instead of showing an error string
        try {
          const stored = await AsyncStorage.getItem('userLocation');
          if (stored) {
            const parsed = JSON.parse(stored);
            setUserAddress(parsed?.address || 'No address found');
          } else {
            setUserAddress('Location permission denied');
          }
        } catch (inner) {
          console.warn('restore after permission denied failed', inner);
          setUserAddress('Location permission denied');
        }
        setLoadingAddress(false);
        return;
      }

      // get current position and reverse geocode with generous timeouts for slow networks/GPS
      const loc = await withTimeout(Location.getCurrentPositionAsync({}), 20000);
      const rev = await withTimeout(Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }), 15000);
      let address = "";
      if (rev && rev.length > 0) {
        const place = rev[0];
        const parts: string[] = [];
        if (place.name) parts.push(place.name);
        if (place.street) parts.push(place.street);
        if (place.city) parts.push(place.city);
        if (place.region) parts.push(place.region);
        if (place.postalCode) parts.push(place.postalCode);
        if (place.country) parts.push(place.country);
        address = parts.join(", ");
      }
      if (!address) {
        address = `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`;
      }
      setUserAddress(address);

      await AsyncStorage.setItem(
        "userLocation",
        JSON.stringify({ address, coords: loc.coords })
      );
    } catch (e) {
      console.warn('fetchAndStoreLocation failed', e);
      // If fetching failed, try to restore the last saved location from AsyncStorage
      try {
        const stored = await AsyncStorage.getItem('userLocation');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserAddress(parsed?.address || 'Unable to fetch location');
        } else {
          // keep a friendly message but avoid overwriting with an opaque error until user retries
          setUserAddress('Unable to fetch location');
        }
      } catch (inner) {
        console.warn('restoring stored location failed', inner);
        setUserAddress('Unable to fetch location');
      }
    } finally {
      setLoadingAddress(false);
    }
  };

  // On mount, load or fetch location
  useEffect(() => {
    const loadLocation = async () => {
      setLoadingAddress(true);
      try {
        const locationJSON = await AsyncStorage.getItem("userLocation");
        if (locationJSON) {
          const location = JSON.parse(locationJSON);
          setUserAddress(location.address || "");
          setLoadingAddress(false);
        } else {
          await fetchAndStoreLocation();
        }
      } catch (e) {
        await fetchAndStoreLocation();
      }
    };
    loadLocation();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAndStoreLocation(); // refresh location
      await Promise.all([
        mutate("/admin/get-category"),
        mutate("/listings/popular"),
        mutate("/listings/new"),
      ]);
    } catch (e) {
    }
    setRefreshing(false);
  };

  if (isLoading || PopularisLoading || NewListingsLocading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#004CFF" />
        <Text className="mt-3 font-NunitoMedium text-gray-500">
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  if (isError || NewError || popularError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 font-NunitoSemiBold">
          Failed to load stats
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 flex px-5 bg-white">
      <View className="flex-row items-center mt-8 justify-between">
        <View className="w-[75%]">
          <View className="flex-row items-center">
            <Text className="text-2xl  font-RalewayBold text-textColor-100">
              Deliver to
            </Text>
            <FontAwesome6 name="chevron-down" size={18} color="#000" />
          </View>
          <TouchableOpacity
            disabled={loadingAddress}
            onPress={() => {
              // allow manual retry when not loading
              if (!loadingAddress) fetchAndStoreLocation();
            }}
          >
            <Text className="text-base font-NunitoMedium  w-[80%] text-primary-100">
              {loadingAddress ? "Loading address..." : userAddress || "No address found"}
            </Text>
            {!loadingAddress && (userAddress?.toLowerCase().includes('unable') || userAddress?.toLowerCase().includes('permission')) && (
              <Text className="text-sm text-primary-100 mt-1">Tap to retry</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row w-[45%] items-center gap-3">
          <TouchableOpacity className="px-2 py-2 bg-[#F3F4F6] rounded-full">
            <FontAwesome name="bell" size={24} color="#004CFF" />
          </TouchableOpacity>
          <Image
            source={require("../../../assets/images/artist-2 1.png")}
            style={{ width: 40, height: 40, borderRadius: 999 }}
            contentFit="cover"
          />
        </View>
      </View>
      <View className="mt-8">
        <TouchableOpacity
          onPress={() => router.push("/search")}
          className="relative"
        >
          <SearchComponent
            placeholder="Search for items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            otherStyles="pointer-events-none"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="mt-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#004CFF"]}
            tintColor="#004CFF"
          />
        }
      >
        <View className="mt-8 flex-row justify-between items-center">
          <Text className="text-xl font-NunitoMedium text-textColor-100">
            Shop by Category
          </Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(tabs)/(home)/category",
                params: {
                  category: "Category",
                  allCategories: JSON.stringify(categories?.categories || []),
                },
              })
            }
            className="flex-row items-center gap-1"
          >
            <Text className="text-lg font-NunitoBold text-primary-100">
              View All
            </Text>
            {/* <FontAwesome6 name="arrow-right-long" size={18} color="#004CFF" /> */}
            <MaterialIcons name="arrow-forward-ios" size={18} color="#004CFF" />
          </TouchableOpacity>
        </View>
        <View className="mt-8 flex-row flex-wrap justify-between">
          {isLoading ? (
            // Loading skeleton
            [...Array(4)].map((_, index) => (
              <View
                key={`skeleton-${index}`}
                className="w-[32%] h-[50px] bg-gray-100 rounded-lg mb-3 animate-pulse"
              />
            ))
          ) : isError ? (
            // Error state
            <View className="w-full py-4 items-center">
              <Text className="text-red-500 font-NunitoMedium">
                Failed to load categories
              </Text>
              <TouchableOpacity
                onPress={() => window.location.reload()}
                className="mt-2 p-2 bg-primary-100 rounded-lg"
              >
                <Text className="text-white font-NunitoMedium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : categories?.categories?.length > 0 ? (
            // Show only first 6 categories in home view
            categories?.categories.slice(0, 6).map((item: any) => (
              <TouchableOpacity
                onPressIn={() => prefetchCategory(String(item.id))}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/(home)/category",
                    params: {
                      id: item.id,
                      category: item.name,
                      allCategories: JSON.stringify(
                        categories?.categories || []
                      ),
                    },
                  })
                }
                key={item.id}
                className="w-[32%] bg-primary-100/10 p-2 rounded-lg mb-3"
              >
                <View className="flex-row items-center">
                  {item?.imageUrl ? (
                    <Image
                      source={{ uri: item?.imageUrl }}
                      style={{ width: 32, height: 32, borderRadius: 999 }}
                      contentFit="cover"
                    />
                  ) : item.iconLib === "Ionicons" ? (
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center `}
                    >
                      <Ionicons
                        name={item.iconName}
                        size={18}
                        color={"#004CFF"}
                      />
                    </View>
                  ) : item.iconLib === "AntDesign" ? (
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center `}
                    >
                      <AntDesign
                        name={item.iconName}
                        size={18}
                        color={"#004CFF"}
                      />
                    </View>
                  ) : item.iconLib === "Feather" ? (
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center `}
                    >
                      <Feather
                        name={item.iconName}
                        size={18}
                        color={"#004CFF"}
                      />
                    </View>
                  ) : null}
                  <Text
                    numberOfLines={2}
                    className="text-sm font-NunitoMedium text-primary-100 ml-1 flex-1"
                  >
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            // No categories found
            <Text className="text-gray-500 font-NunitoMedium w-full text-center py-4">
              No categories available
            </Text>
          )}
        </View>

        {/* Ads  */}

        {/* Popular Selling */}
        <View>
          <View className="mt-8 flex-row justify-between items-center">
            <Text className="text-xl font-NunitoMedium text-textColor-100">
              Popular Selling
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(home)/listings",
                  params: { route: "Selling" },
                })
              }
              className="flex-row items-center gap-1"
            >
              <Text className="text-lg font-NunitoBold text-primary-100">
                View All
              </Text>
              {/* <FontAwesome6 name="arrow-right-long" size={18} color="#004CFF" /> */}
              <MaterialIcons
                name="arrow-forward-ios"
                size={18}
                color="#004CFF"
              />
            </TouchableOpacity>
          </View>

          {/* List of Popular Selling Items */}
          <View className="flex flex-row flex-wrap justify-between gap-1">
            {popular?.data?.slice(0, 4).map((item: any) => (
              <TouchableOpacity
                key={item?.id}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/(home)/details",
                    params: { item: JSON.stringify(item) },
                  })
                }
                className="mt-5 w-[49%] border border-primary-100 rounded-lg"
              >
                <View className="w-full h-40 rounded-lg border-4 border-white shadow-2xl overflow-hidden">
                  <Image
                    source={{
                      uri:
                        item?.media?.find(
                          (media: any) => media.mimeType === "image/jpeg"
                        )?.url || item?.media[0]?.url,
                    }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    onLoad={() => item?.id}
                    onError={(error) =>
                      console.log(
                        "Image load error:",
                        error
                      )
                    }
                  />
                </View>
                <View>
                  <View className="p-1 flex-row justify-between items-start">
                    <Text
                      numberOfLines={2}
                      className="text-lg font-NunitoRegular text-textColor-100 mt-2 w-[70%]"
                    >
                      {item?.title}
                    </Text>
                    <TouchableOpacity className="flex-row px-2 py-1.5 rounded-full bg-primary-100 justify-between items-center mt-1">
                      <FontAwesome6 name="plus" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-[22px] p-1 font-RalewayExtraBold text-textColor-100 ">
                    {formatCurrency(item?.price, "NGN", "Nigerian Naira")}
                  </Text>

                  <View className="relative p-2 mt-2 mb-5">
                    <Text className="bg-primary-100/20 text-lg rounded-lg text-primary-100 p-2 font-NunitoSemiBold flex flex-row justify-center items-center">
                      {item?.condition.toUpperCase()}
                    </Text>
                    <Text className="font-NunitoMedium text-lg">
                      {item?.seller?.vendorApplication?.location?.city},
                      {item?.seller?.vendorApplication?.location?.country}
                    </Text>
                  </View>
                </View>
                <View className="bg-primary-100 p-2 rounded-b-lg absolute top-4 right-2">
                  <Text className="text-white font-NunitoLight">
                    Verified ID
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* New Listing */}
        <View>
          <View className="mt-8 flex-row justify-between items-center">
            <Text className="text-xl font-NunitoMedium text-textColor-100">
              New Listing
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(home)/listings",
                  params: { route: "Listings" },
                })
              }
              className="flex-row items-center gap-1"
            >
              <Text className="text-lg font-NunitoBold text-primary-100">
                View All
              </Text>
              {/* <FontAwesome6 name="arrow-right-long" size={18} color="#004CFF" /> */}
              <MaterialIcons
                name="arrow-forward-ios"
                size={18}
                color="#004CFF"
              />
            </TouchableOpacity>
          </View>
          <View className="flex flex-row flex-wrap justify-between gap-1">
            {NewListing?.data?.slice(0, 4).map((item: any) => (
              <TouchableOpacity
                key={item?.id}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/(home)/details",
                    params: { item: JSON.stringify(item) },
                  })
                }
                className="mt-5 w-[49%] border border-primary-100 rounded-lg"
              >
                {(() => {
                  const jpegImage = item?.media?.find(
                    (media: any) => media.mimeType === "image/jpeg"
                  );
                  const imageUrl = jpegImage?.url || item?.media[0]?.url;
                  return (
                    <View className="w-full h-40 rounded-lg border-4 border-white shadow-2xl overflow-hidden">
                      <Image
                        source={{ uri: imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        onLoad={() => item?.id}
                        onError={(error) =>
                          console.log(
                            "Image load error:",
                            error
                          )
                        }
                      />
                    </View>
                  );
                })()}
                <View>
                  <View className="p-1 flex-row justify-between items-start">
                    <Text
                      numberOfLines={2}
                      className="text-lg font-NunitoRegular text-textColor-100 mt-2 w-[70%]"
                    >
                      {item?.title}
                    </Text>
                    <TouchableOpacity className="flex-row px-2 py-1.5 rounded-full bg-primary-100 justify-between items-center mt-1">
                      <FontAwesome6 name="plus" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-[22px] p-1 font-RalewayExtraBold text-textColor-100 ">
                    {formatCurrency(item?.price, "NGN", "Nigerian Naira")}
                  </Text>

                  <View className="relative p-2 mt-2 mb-5">
                    <Text className="bg-primary-100/20 text-lg rounded-lg text-primary-100 p-2 font-NunitoSemiBold flex flex-row justify-center items-center">
                      {item?.condition.toUpperCase()}
                    </Text>
                    <Text className="font-NunitoMedium text-lg">
                      {item?.seller?.vendorApplication?.location?.city},
                      {item?.seller?.vendorApplication?.location?.country}
                    </Text>
                  </View>
                </View>
                <View className="bg-primary-100 p-2 rounded-b-lg absolute top-4 right-2">
                  <Text className="text-white font-NunitoLight">
                    Verified ID
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* rest of home screen content */}
    </SafeAreaView>
  );
};

export default index;
