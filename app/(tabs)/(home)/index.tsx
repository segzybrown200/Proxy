import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import * as Location from "expo-location";
import { Image } from 'expo-image';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { SearchComponent } from "components/SearchInput";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { selectUser } from "global/authSlice";
import { SellerAdModal } from "components/SellerAdModal";
import {
  useCategory,
  useNewListings,
  usePopularListings,
} from "hooks/useHooks";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AntDesign, Feather } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { mutate } from "swr";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatCurrency } from "utils/currency";

const index = () => {
  const [userAddress, setUserAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSellerAd, setShowSellerAd] = useState(false);

  const user: any = useSelector(selectUser);
  const roles = useMemo(() => {
    const maybeRoles = user?.data?.user?.roles ?? user?.data?.user?.role ?? [];
    if (Array.isArray(maybeRoles)) return maybeRoles.map((r: any) => String(r).toUpperCase());
    if (typeof maybeRoles === "string") return [maybeRoles.toUpperCase()];
    return [];
  }, [user]);
  const isSeller = roles.includes("SELLER");


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

  const [jobsListings, setJobsListings] = useState<any[]>([]);
  const [servicesListings, setServicesListings] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);

  

  // Prefetch helper: fetch first page for a category and store in SWR cache
  const buildCategoryUrl = (categoryId: string, cursor = "") =>
    `https://proxy-backend-1rfl.onrender.com/api/listings/search-category?limit=10&categoryId=${categoryId}${cursor ? `&cursor=${cursor}` : ""}`;

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

  // Fetch Jobs and Services listings when categories load
  useEffect(() => {
    const fetchCategoryListings = async () => {
      if (!categories?.categories) return;
      const findCategory = (name: string) =>
        categories.categories.find(
          (c: any) => (c.name || c.title || "").toString().toLowerCase() === name
        );

      const jobsCat = findCategory("jobs");
      const servicesCat = findCategory("services");

      if (jobsCat) {
        setJobsLoading(true);
        try {
          const res = await axios.get(buildCategoryUrl(String(jobsCat.id)));
          setJobsListings(res.data?.data || []);
        } catch (e) {
          console.warn("Failed to fetch jobs listings", e);
        } finally {
          setJobsLoading(false);
        }
      }

      if (servicesCat) {
        setServicesLoading(true);
        try {
          const res = await axios.get(buildCategoryUrl(String(servicesCat.id)));
          setServicesListings(res.data?.data || []);
        } catch (e) {
          console.warn("Failed to fetch services listings", e);
        } finally {
          setServicesLoading(false);
        }
      }
    };
    fetchCategoryListings();
  }, [categories]);

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

  // Check and show seller ad modal periodically
  useEffect(() => {
    const checkShowSellerAd = async () => {
      try {
        const lastShownTime = await AsyncStorage.getItem("sellerAdLastShown");
        const now = Date.now();
        const TWO_HOURS = 0.5 * 60 * 60 * 1000;

        if (!lastShownTime) {
          // First time - show after a delay
          setTimeout(() => setShowSellerAd(true), 3000);
          await AsyncStorage.setItem("sellerAdLastShown", now.toString());
        } else {
          const timeSinceLastShown = now - parseInt(lastShownTime);
          // Show again after 2 hours
          if (timeSinceLastShown > TWO_HOURS) {
            setTimeout(() => setShowSellerAd(true), 3000);
            await AsyncStorage.setItem("sellerAdLastShown", now.toString());
          }
        }
      } catch (e) {
        console.warn("Error checking seller ad:", e);
      }
    };

    if (!isSeller) {
      checkShowSellerAd();
    }
  }, [isSeller]);

  const handleCloseSellerAd = () => {
    setShowSellerAd(false);
  };

  const handleStartSellingFromAd = () => {
    setShowSellerAd(false);
    router.push("/(tabs)/(home)/seller-onboarding");
  };

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

  if ((isError || NewError || popularError) && !categories && !NewListing && !popular) {
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
      <SellerAdModal
        visible={showSellerAd}
        onClose={handleCloseSellerAd}
        onStartSelling={handleStartSellingFromAd}
        isSeller={isSeller}
      />
      <View className="flex-row items-center mt-8 justify-between" style={{ zIndex: 50, elevation: 50 }}>
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
            [...Array(6)].map((_, index) => (
              <View
                key={`skeleton-${index}`}
                className="w-[32%] h-[100px] bg-gray-100 rounded-2xl mb-4 animate-pulse"
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
            categories?.categories.slice(0, 6).map((item: any, index: number) => {
              const gradients = [
                { colors: ['#60A5FA', '#2563EB'], icon: '#ffffff' },
                { colors: ['#3B82F6', '#1D4ED8'], icon: '#ffffff' },
                { colors: ['#1E40AF', '#1E3A8A'], icon: '#ffffff' },
                { colors: ['#60A5FA', '#3B82F6'], icon: '#ffffff' },
                { colors: ['#93C5FD', '#60A5FA'], icon: '#ffffff' },
                { colors: ['#2563EB', '#1E40AF'], icon: '#ffffff' },
              ];
              const gradient = gradients[index % gradients.length];
              
              return (
                <TouchableOpacity
                  onPressIn={() => prefetchCategory(String(item.id))}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/(home)/category",
                      params: {
                        id: item.id,
                        category: item.name,
                      },
                    })
                  }
                  key={item.id}
                  activeOpacity={0.85}
                  className={`w-[32%] h-[130px] p-0 mb-4`}
                  style={{
                    elevation: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.18,
                    shadowRadius: 10,
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  {item?.imageUrl ? (
                    <View style={{ height: 130, borderRadius: 16, overflow: 'hidden' }}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
                        contentFit="cover"
                        onError={(error) => console.log('Category image load error:', error)}
                      />
                      <LinearGradient
                        colors={gradient.colors.map(color => color + '80') as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 16,
                        }}
                      >
                        <View className="items-center justify-center w-full">
                          <Text
                            numberOfLines={2}
                            className="text-sm font-NunitoExtraBold text-white text-center"
                          >
                            {item.name}
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={gradient.colors as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        height: 140,
                        padding: 16,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View className="items-center justify-center w-full">
                        <View className="mb-2 w-[70px] h-[70px] rounded-full justify-center items-center bg-white/20">
                          {item.iconLib === "Ionicons" ? (
                            <Ionicons name={item.iconName} size={36} color={gradient.icon} />
                          ) : item.iconLib === "AntDesign" ? (
                            <AntDesign name={item.iconName} size={36} color={gradient.icon} />
                          ) : item.iconLib === "Feather" ? (
                            <Feather name={item.iconName} size={36} color={gradient.icon} />
                          ) : (
                            <Text className="text-white font-NunitoBold text-lg">{(item.name || "").charAt(0)}</Text>
                          )}
                        </View>
                        <Text
                          numberOfLines={2}
                          className="text-sm font-NunitoExtraBold text-white text-center mt-1"
                        >
                          {item.name}
                        </Text>
                      </View>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              );
            })
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
              <MaterialIcons
                name="arrow-forward-ios"
                size={18}
                color="#004CFF"
              />
            </TouchableOpacity>
          </View>

          {/* List of Popular Selling Items */}
          <View className="flex flex-row flex-wrap justify-between gap-1">
            {PopularisLoading && (!popular?.data || popular.data.length === 0) ? (
              [...Array(4)].map((_, index) => (
                <View
                  key={`popular-skeleton-${index}`}
                  className="mt-5 w-[49%] rounded-lg bg-gray-200 animate-pulse"
                  style={{ height: 240 }}
                />
              ))
            ) : popular?.data && popular.data.length > 0 ? (
              popular.data.slice(0, 4).map((item: any) => (
                <TouchableOpacity
                  key={item?.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/(home)/details",
                      params: { id: item.id },
                    })
                  }
                  className="mt-5 w-[49%] border border-primary-100 rounded-lg overflow-hidden"
                  style={{ height: 240, position: 'relative' }}
                >
                  <View style={{ flex: 1, position: 'relative' }}>
                    <Image
                      source={{
                        uri:
                          item?.media?.find(
                            (media: any) => media.mimeType === "image/jpeg"
                          )?.url || item?.media[0]?.url,
                      }}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                      contentFit="cover"
                      onError={(error) =>
                        console.log(
                          "Image load error:",
                          error
                        )
                      }
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)'] as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: 10,
                        justifyContent: 'space-between',
                      }}
                    >
                      <View className="flex-row mt-10 justify-between items-start">
                        <Text
                          numberOfLines={2}
                          className="text-lg font-NunitoExtraBold text-white w-[70%]"
                        >
                          {item?.title}
                        </Text>
                        <TouchableOpacity className="flex-row px-2 py-1.5 rounded-full bg-primary-100 justify-between items-center">
                          <FontAwesome6 name="plus" size={18} color="white" />
                        </TouchableOpacity>
                      </View>
                      <View>
                        <Text className="text-[22px] font-RalewayExtraBold text-white">
                          {formatCurrency(item?.price, "NGN", "Nigerian Naira")}
                        </Text>
                        <Text className="bg-primary-100 text-lg rounded-lg text-white p-2 font-NunitoSemiBold flex flex-row justify-center items-center mt-2">
                          {item?.condition.toUpperCase()}
                        </Text>
                        <Text className="font-NunitoMedium text-lg text-white">
                          {item?.seller?.vendorApplication?.location?.city}, {item?.seller?.vendorApplication?.location?.country}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <View className="bg-primary-100 p-2 rounded-b-lg absolute top-2 right-2" style={{ zIndex: 0, elevation: 0 }}>
                    <Text className="text-white font-NunitoLight">
                      Verified ID
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-gray-500 font-NunitoMedium w-full text-center py-4">
                No popular listings found
              </Text>
            )}
          </View>
        </View>

        {/* Jobs & Services (combined) */}
        <View>
          <View className="mt-8 flex-row justify-between items-center">
            <Text className="text-xl font-NunitoMedium text-textColor-100">Jobs & Services</Text>
            {categories?.categories && categories.categories.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  const jobsCat = categories.categories.find((c:any) =>
                    (c.name||c.title||"").toLowerCase().includes('job')
                  );
                  const servicesCat = categories.categories.find((c:any) =>
                    (c.name||c.title||"").toLowerCase().includes('service')
                  );

                  let targetCat = jobsCat || servicesCat;

                  if (targetCat) {
                    console.log('Navigating to category:', targetCat.name || targetCat.title, 'ID:', targetCat.id);
                    router.push({
                      pathname: '/(tabs)/(home)/category',
                      params: {
                        category: targetCat.name || targetCat.title,
                        id: String(targetCat.id),
                      }
                    });
                  } else {
                    console.log('No jobs/services category found, available categories:', categories.categories.map((c: any) => c.name || c.title));
                    router.push({
                      pathname: "/(tabs)/(home)/listings",
                      params: { route: "Jobs & Services" },
                    });
                  }
                }}
                className="flex-row items-center gap-1"
              >
                <Text className="text-lg font-NunitoBold text-primary-100">View All</Text>
                <MaterialIcons name="arrow-forward-ios" size={18} color="#004CFF" />
              </TouchableOpacity>
            )}
          </View>
          <View className="flex flex-row flex-wrap justify-between gap-1">
            {jobsLoading && servicesLoading && jobsListings.length === 0 && servicesListings.length === 0 ? (
              [...Array(4)].map((_, index) => (
                <View
                  key={`jobs-skeleton-${index}`}
                  className="mt-5 w-[49%] rounded-lg bg-gray-200 animate-pulse"
                  style={{ height: 240 }}
                />
              ))
            ) : (() => {
              const combined = [...(jobsListings || []), ...(servicesListings || [])];
              const map = new Map<string, any>();
              combined.forEach((it: any) => { if (it?.id) map.set(it.id, it); });
              const uniq = Array.from(map.values()).slice(0,4);
              return uniq.length > 0 ? uniq.map((item:any) => (
                <TouchableOpacity key={item?.id} onPress={() => router.push({ pathname: '/(tabs)/(home)/details', params: { id: item.id } })} className="mt-5 w-[49%] border border-primary-100 rounded-lg overflow-hidden" style={{ height: 240, position:'relative' }}>
                  <View style={{ flex: 1, position: 'relative' }}>
                    <Image source={{ uri: item?.media?.[0]?.url }} style={{ position: 'absolute', top:0, left:0, right:0, bottom:0 }} contentFit="cover" onError={(e)=>console.log('Jobs&Services image error', e)} />
                    <LinearGradient colors={['rgba(0,0,0,0.5)','rgba(0,0,0,0.2)'] as any} start={{x:0,y:0}} end={{x:1,y:1}} style={{ position:'absolute', top:0,left:0,right:0,bottom:0,padding:10, justifyContent:'space-between' }}>
                      <View className="flex-row justify-between items-start">
                        <Text numberOfLines={2} className="text-lg font-NunitoRegular text-white w-[70%]">{item?.title}</Text>
                        <TouchableOpacity className="flex-row px-2 py-1.5 rounded-full bg-primary-100 justify-between items-center"><FontAwesome6 name="plus" size={18} color="white" /></TouchableOpacity>
                      </View>
                      <View>
                        <Text className="text-[22px] font-RalewayExtraBold text-white">{formatCurrency(item?.price,'NGN','Nigerian Naira')}</Text>
                        <Text className="bg-primary-100/20 text-lg rounded-lg text-primary-100 p-2 font-NunitoSemiBold flex flex-row justify-center items-center mt-2">{item?.condition?.toUpperCase()}</Text>
                        <Text className="font-NunitoMedium text-lg text-white">{item?.seller?.vendorApplication?.location?.city}, {item?.seller?.vendorApplication?.location?.country}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <View className="bg-primary-100 p-2 rounded-b-lg absolute bottom-2 right-2" style={{ zIndex: 0, elevation: 0 }}><Text className="text-white font-NunitoLight">Verified ID</Text></View>
                </TouchableOpacity>
              )) : (
                <Text className="text-gray-500 font-NunitoMedium w-full text-center py-4">No jobs or services available</Text>
              );
            })()}
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
            {NewListingsLocading && (!NewListing || NewListing.length === 0) ? (
              [...Array(4)].map((_, index) => (
                <View
                  key={`newlist-skeleton-${index}`}
                  className="mt-5 w-[49%] rounded-lg bg-gray-200 animate-pulse"
                  style={{ height: 240 }}
                />
              ))
            ) : NewListing?.data && NewListing.data.length > 0 ? (
              NewListing.data.slice(0, 4).map((item: any) => (
                <TouchableOpacity
                  key={item?.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/(home)/details",
                      params: { id: item.id },
                    })
                  }
                  className="mt-5 w-[49%] border border-primary-100 rounded-lg overflow-hidden"
                  style={{ height: 240, position: 'relative' }}
                >
                  {(() => {
                    const jpegImage = item?.media?.find(
                      (media: any) => media.mimeType === "image/jpeg"
                    );
                    const imageUrl = jpegImage?.url || item?.media[0]?.url;
                    return (
                      <View style={{ flex: 1, position: 'relative' }}>
                        <Image
                          source={{ uri: imageUrl }}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                          contentFit="cover"
                          onError={(error) =>
                            console.log(
                              "Image load error:",
                              error
                            )
                          }
                        />
                        <LinearGradient
                          colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)'] as any}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: 10,
                            justifyContent: 'space-between',
                          }}
                        >
                          <View className="flex-row justify-between items-start">
                            <Text
                              numberOfLines={2}
                              className="text-lg font-NunitoRegular text-white w-[70%]"
                            >
                              {item?.title}
                            </Text>
                            <TouchableOpacity className="flex-row px-2 py-1.5 rounded-full bg-primary-100 justify-between items-center">
                              <FontAwesome6 name="plus" size={18} color="white" />
                            </TouchableOpacity>
                          </View>
                          <View>
                            <Text className="text-[22px] font-RalewayExtraBold text-white">
                              {formatCurrency(item?.price, "NGN", "Nigerian Naira")}
                            </Text>
                            <Text className="bg-primary-100/20 text-lg rounded-lg text-primary-100 p-2 font-NunitoSemiBold flex flex-row justify-center items-center mt-2">
                              {item?.condition.toUpperCase()}
                            </Text>
                            <Text className="font-NunitoMedium text-lg text-white">
                              {item?.seller?.vendorApplication?.location?.city}, {item?.seller?.vendorApplication?.location?.country}
                            </Text>
                          </View>
                        </LinearGradient>
                      </View>
                    );
                  })()}
                  <View className="bg-primary-100 p-2 rounded-b-lg absolute bottom-2 right-2" style={{ zIndex: 0, elevation: 0 }}>
                    <Text className="text-white font-NunitoLight">
                      Verified ID
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-gray-500 font-NunitoMedium w-full text-center py-4">
                No new listings found
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* rest of home screen content */}
    </SafeAreaView>
  );
};

export default index;
