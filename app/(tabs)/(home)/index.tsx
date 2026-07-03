import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Animated,
  ImageBackground,
  Pressable,
} from "react-native";
import * as Location from "expo-location";
import { Image } from "expo-image";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { SearchComponent } from "../../../components/SearchInput";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { selectUser } from "../../../global/authSlice";
import { SellerAdModal } from "../../../components/SellerAdModal";
import {
  useCategory,
  useNewListings,
  usePopularListings,
} from "../../../hooks/useHooks";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AntDesign, Feather, Entypo } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { mutate } from "swr";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatCurrency } from "../../../utils/currency";

type ExploreFeature =
  | {
      id: string;
      title: string;
      route: string;
      iconLib: "AntDesign";
      icon: React.ComponentProps<typeof AntDesign>["name"];
      image: string;
      backgroundColor: string;
    }
  | {
      id: string;
      title: string;
      route: string;
      iconLib: "Feather";
      icon: React.ComponentProps<typeof Feather>["name"];
      image: string;
      backgroundColor: string;
    }
  | {
      id: string;
      title: string;
      route: string;
      iconLib: "Entypo";
      icon: React.ComponentProps<typeof Entypo>["name"];
      image: string;
      backgroundColor: string;
    }
  | {
      id: string;
      title: string;
      route: string;
      iconLib: "Ionicons";
      icon: React.ComponentProps<typeof Ionicons>["name"];
      image: string;
      backgroundColor: string;
    };

const renderFeatureIcon = (feature: ExploreFeature) => {
  const iconProps = { size: 24, color: "white" } as const;

  switch (feature.iconLib) {
    case "AntDesign":
      return (
        <AntDesign
          name={feature.icon as React.ComponentProps<typeof AntDesign>["name"]}
          {...iconProps}
        />
      );
    case "Feather":
      return (
        <Feather
          name={feature.icon as React.ComponentProps<typeof Feather>["name"]}
          {...iconProps}
        />
      );
    case "Entypo":
      return (
        <Entypo
          name={feature.icon as React.ComponentProps<typeof Entypo>["name"]}
          {...iconProps}
        />
      );
    case "Ionicons":
      return (
        <Ionicons
          name={feature.icon as React.ComponentProps<typeof Ionicons>["name"]}
          {...iconProps}
        />
      );
    default:
      return null;
  }
};

const index = () => {
  const [userAddress, setUserAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSellerAd, setShowSellerAd] = useState(false);
  const [activePopularIndex, setActivePopularIndex] = useState(0);

  const exploreFeatures: ExploreFeature[] = [
    {
      id: "categories",
      title: "Categories",
      route: "/(tabs)/(home)/category",
      iconLib: "Feather",
      icon: "grid",
      image: require("../../../assets/images/Categorys.png"),
      backgroundColor: "#4F46E5",
    },
    {
      id: "orders",
      title: "Orders",
      route: "/(tabs)/(profile)/order",
      iconLib: "AntDesign",
      icon: "shoppingcart",
      image: require("../../../assets/images/Empty_Box.png"),
      backgroundColor: "#10B981",
    },
    {
      id: "wallet",
      title: "Wallet",
      route: "/(tabs)/(profile)/wallet",
      iconLib: "Entypo",
      icon: "wallet",
      image: require("../../../assets/images/Wallets.png"),
      backgroundColor: "#8B5CF6",
    },
    {
      id: "chat",
      title: "Chat",
      route: "/(tabs)/(profile)/message",
      iconLib: "AntDesign",
      icon: "message1",
      image: require("../../../assets/images/Message icon.png"),
      backgroundColor: "#F59E0B",
    },
    {
      id: "rider",
      title: "Rider",
      route: "/rider/confirmation",
      iconLib: "Ionicons",
      icon: "bicycle",
      image: require("../../../assets/images/Rider-icon.png"),
      backgroundColor: "#EF4444",
    },
    {
      id: "seller",
      title: "Seller",
      route: "/(tabs)/(home)/seller-onboarding",
      iconLib: "AntDesign",
      icon: "user",
      image: require("../../../assets/images/Seller-icon.png"),
      backgroundColor: "#F97316",
    },
  ];

  // animated values for Explore tiles
  const exploreAnims = useRef(
    exploreFeatures.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = exploreAnims.map((anim, i) =>
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }),
    );
    Animated.stagger(80, animations).start();
  }, [exploreAnims]);

  const user: any = useSelector(selectUser);
  const roles = useMemo(() => {
    const maybeRoles = user?.data?.user?.roles ?? user?.data?.user?.role ?? [];
    if (Array.isArray(maybeRoles))
      return maybeRoles.map((r: any) => String(r).toUpperCase());
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      const total = popular?.data?.length || 0;
      if (total > 0) {
        setActivePopularIndex((prev) => (prev + 1) % total);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [popular?.data?.length]);

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
          (c: any) =>
            (c.name || c.title || "").toString().toLowerCase() === name,
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
    return (await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms),
      ),
    ])) as T;
  }

  // Helper to fetch and store location
  const fetchAndStoreLocation = async () => {
    try {
      setLoadingAddress(true);
      // Ensure device location services are enabled first
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          console.warn("Location services disabled");
          Alert.alert(
            "Location services disabled",
            "Please enable location services for accurate address. Open device settings?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ],
          );
          // restore stored address if available
          try {
            const stored = await AsyncStorage.getItem("userLocation");
            if (stored) {
              const parsed = JSON.parse(stored);
              setUserAddress(parsed?.address || "Unable to fetch location");
            }
          } catch (inner) {
            console.warn("restore after disabled services failed", inner);
          }
          setLoadingAddress(false);
          return;
        }
      } catch (svcErr) {
        // ignore hasServices check failures and continue to permission request
        console.warn("hasServicesEnabledAsync failed", svcErr);
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // Permission denied: offer to open app settings and fall back to cached address
        Alert.alert(
          "Location permission",
          "Location permission denied. Open app settings to allow location access?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
        // restore cached address if available instead of showing an error string
        try {
          const stored = await AsyncStorage.getItem("userLocation");
          if (stored) {
            const parsed = JSON.parse(stored);
            setUserAddress(parsed?.address || "No address found");
          } else {
            setUserAddress("Location permission denied");
          }
        } catch (inner) {
          console.warn("restore after permission denied failed", inner);
          setUserAddress("Location permission denied");
        }
        setLoadingAddress(false);
        return;
      }

      // get current position and reverse geocode with generous timeouts for slow networks/GPS
      const loc = await withTimeout(
        Location.getCurrentPositionAsync({}),
        20000,
      );
      const rev = await withTimeout(
        Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }),
        15000,
      );
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
        JSON.stringify({ address, coords: loc.coords }),
      );
    } catch (e) {
      console.warn("fetchAndStoreLocation failed", e);
      // If fetching failed, try to restore the last saved location from AsyncStorage
      try {
        const stored = await AsyncStorage.getItem("userLocation");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserAddress(parsed?.address || "Unable to fetch location");
        } else {
          // keep a friendly message but avoid overwriting with an opaque error until user retries
          setUserAddress("Unable to fetch location");
        }
      } catch (inner) {
        console.warn("restoring stored location failed", inner);
        setUserAddress("Unable to fetch location");
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
  // useEffect(() => {
  //   const checkShowSellerAd = async () => {
  //     try {
  //       const lastShownTime = await AsyncStorage.getItem("sellerAdLastShown");
  //       const now = Date.now();
  //       const TWO_HOURS = 0.5 * 60 * 60 * 1000;

  //       if (!lastShownTime) {
  //         // First time - show after a delay
  //         setTimeout(() => setShowSellerAd(true), 3000);
  //         await AsyncStorage.setItem("sellerAdLastShown", now.toString());
  //       } else {
  //         const timeSinceLastShown = now - parseInt(lastShownTime);
  //         // Show again after 2 hours
  //         if (timeSinceLastShown > TWO_HOURS) {
  //           setTimeout(() => setShowSellerAd(true), 3000);
  //           await AsyncStorage.setItem("sellerAdLastShown", now.toString());
  //         }
  //       }
  //     } catch (e) {
  //       console.warn("Error checking seller ad:", e);
  //     }
  //   };

  //   if (!isSeller) {
  //     checkShowSellerAd();
  //   }
  // }, [isSeller]);

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
    } catch (e) {}
    setRefreshing(false);
  };

  if (
    (isError || NewError || popularError) &&
    !categories &&
    !NewListing &&
    !popular
  ) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 font-NunitoSemiBold">
          Failed to load stats
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#004CFF"]}
            tintColor="#004CFF"
          />
        }
      >
        {/* Header */}
        <View className="px-5">
          <View
            className="flex-row items-center mt-5 justify-between"
            style={{ zIndex: 50, elevation: 50 }}
          >
            <View className="flex-row items-center flex-1">
              <FontAwesome name="map-marker" size={20} color="#004CFF" />
              <View className="ml-2">
                <View className="flex-row items-center">
                  <Text className="text-sm font-NunitoMedium text-textColor-100">
                    {loadingAddress ? "Loading..." : (userAddress ? userAddress.split(",")[0] : "Lagos, Nigeria")}
                  </Text>
                  <FontAwesome6 name="chevron-down" size={14} color="#000" />
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="relative">
                <TouchableOpacity className="px-3 py-2 bg-[#F3F4F6] rounded-full">
                  <FontAwesome name="bell" size={20} color="#004CFF" />
                </TouchableOpacity>
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                  <Text className="text-white text-xs font-NunitoSemiBold">3</Text>
                </View>
              </View>
              <View className="relative">
                <TouchableOpacity 
                  onPress={() => router.push("/(tabs)/cart")}
                  className="px-3 py-2 bg-[#F3F4F6] rounded-full"
                >
                  <FontAwesome name="shopping-cart" size={20} color="#004CFF" />
                </TouchableOpacity>
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                  <Text className="text-white text-xs font-NunitoSemiBold">2</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View className="mt-5">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/(home)/search-results")}
              className="relative"
            >
              <SearchComponent
                placeholder="Search for products, stores..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                otherStyles="pointer-events-none"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Deals Banner */}
        <View className="mt-6 px-5">
          <LinearGradient
            colors={["#0052FF", "#0066FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 24,
              overflow: "hidden",
            }}
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1 w-[55%]">
                <View className="flex-row items-center mb-3">
                  <FontAwesome name="star" size={16} color="white" />
                  <Text className="text-white text-xs font-NunitoSemiBold ml-2">
                    Popular
                  </Text>
                </View>
                <Text className="text-white text-2xl font-RalewayExtraBold mb-2">
                  Top Deals{"\n"}You'll Love
                </Text>
                <Text className="text-white text-sm font-NunitoMedium opacity-90 mb-4">
                  Best sellers. Best prices.{"\n"}Shop now!
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/(home)/listings")}
                  className="bg-white rounded-full px-5 py-2.5 w-max"
                >
                  <Text className="text-blue-600 font-NunitoSemiBold text-sm flex-row items-center">
                    Shop Now →
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Right side image placeholder */}
              <View className="w-[40%] items-center justify-center">
                <View className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <FontAwesome name="shopping-bag" size={32} color="white" />
                </View>
              </View>
            </View>

            {/* Pagination dots */}
            <View className="flex-row gap-1 mt-4 justify-center">
              <View className="w-2 h-2 bg-white rounded-full"></View>
              <View className="w-2 h-2 bg-white/50 rounded-full"></View>
              <View className="w-2 h-2 bg-white/50 rounded-full"></View>
            </View>
          </LinearGradient>
        </View>

        {/* Category Grid */}
        <View className="mt-8 px-5">
          <View className="flex-row flex-wrap justify-between gap-3">
            {[
              { id: "marketplace", title: "Marketplace", icon: "shopping-bag" },
              { id: "airtime", title: "Airtime & Data", icon: "mobile" },
              { id: "bills", title: "Bills Payment", icon: "file-text" },
              { id: "wallet", title: "Wallet", icon: "wallet" },
              { id: "logistics", title: "Logistics", icon: "truck" },
              { id: "gifts", title: "Gift Cards", icon: "gift" },
              { id: "services", title: "Services", icon: "cog" },
              { id: "more", title: "More", icon: "ellipsis-h" },
            ].map((category) => (
              <TouchableOpacity
                key={category.id}
                className="w-[22%] items-center py-4 bg-[#F9FAFB] rounded-xl"
                onPress={() => {
                  if (category.id === "marketplace") {
                    router.push("/(tabs)/(home)/category");
                  } else if (category.id === "wallet") {
                    router.push("/(tabs)/(profile)/wallet");
                  } else {
                    Alert.alert("Coming Soon", `${category.title} feature coming soon!`);
                  }
                }}
              >
                <View className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <FontAwesome name={category.icon as any} size={20} color="#004CFF" />
                </View>
                <Text className="text-xs font-NunitoSemiBold text-textColor-100 text-center">
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Flash Deals Section */}
        <View className="mt-8 px-5">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <FontAwesome name="bolt" size={20} color="#EF4444" />
              <Text className="text-xl font-NunitoSemiBold text-textColor-100">
                Flash Deals
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(home)/listings",
                  params: { route: "Flash Deals" },
                })
              }
            >
              <Text className="text-lg font-NunitoBold text-primary-100">
                View all
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-3"
          >
            {popular?.data && popular.data.length > 0
              ? popular.data.slice(0, 6).map((item: any) => {
                  const imageUrl =
                    item?.media?.find((media: any) =>
                      media.mimeType?.startsWith("image"),
                    )?.url || item?.media?.[0]?.url || "";

                  return (
                    <TouchableOpacity
                      key={item?.id}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/(home)/details",
                          params: { id: item.id },
                        })
                      }
                      className="w-32 bg-white rounded-2xl overflow-hidden border border-gray-100"
                    >
                      <View className="h-24 bg-gray-200 relative">
                        <Image
                          source={{ uri: imageUrl }}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          }}
                          contentFit="cover"
                        />
                        <View className="absolute top-1 left-1 bg-red-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-NunitoSemiBold">
                            -20%
                          </Text>
                        </View>
                      </View>
                      <View className="p-2">
                        <Text
                          numberOfLines={1}
                          className="text-xs font-NunitoSemiBold text-textColor-100"
                        >
                          {item?.title}
                        </Text>
                        <Text className="text-sm font-RalewayBold text-primary-100 mt-1">
                          {formatCurrency(item?.price, "NGN", "Nigerian Naira")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              : [...Array(4)].map((_, i) => (
                  <View
                    key={i}
                    className="w-32 h-40 bg-gray-200 rounded-2xl animate-pulse"
                  />
                ))}
          </ScrollView>
        </View>

        {/* Recommended Stores */}
        <View className="mt-8 px-5 pb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-NunitoSemiBold text-textColor-100">
              Recommended Stores
            </Text>
            <TouchableOpacity>
              <Text className="text-lg font-NunitoBold text-primary-100">
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between gap-3">
            {[
              {
                id: 1,
                name: "TechZone",
                rating: 4.8,
                reviews: 120,
                verified: true,
              },
              {
                id: 2,
                name: "Home World",
                rating: 4.6,
                reviews: 98,
                verified: true,
              },
              {
                id: 3,
                name: "Fashion Hub",
                rating: 4.7,
                reviews: 76,
                verified: true,
              },
              {
                id: 4,
                name: "Gadge",
                rating: 4.5,
                reviews: 45,
                verified: true,
              },
            ].map((store) => (
              <TouchableOpacity
                key={store.id}
                className="w-[48%] bg-white border border-gray-100 rounded-2xl p-3"
              >
                <View className="w-full h-16 bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mb-2">
                  <FontAwesome name="lock" size={24} color="#004CFF" />
                </View>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-NunitoSemiBold text-textColor-100">
                      {store.name}
                    </Text>
                    {store.verified && (
                      <FontAwesome
                        name="check-circle"
                        size={12}
                        color="#10B981"
                        style={{ marginTop: 2 }}
                      />
                    )}
                  </View>
                </View>
                <View className="flex-row items-center gap-1 mt-2">
                  <FontAwesome name="star" size={12} color="#FCD34D" />
                  <Text className="text-xs font-NunitoSemiBold text-textColor-100">
                    {store.rating} ({store.reviews})
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom padding */}
    </SafeAreaView>
  );
};

export default index;
