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
  StatusBar,
} from "react-native";
import * as Location from "expo-location";
import { Image } from "expo-image";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SearchComponent } from "../../../components/SearchInput";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { selectUser } from "../../../global/authSlice";
import { SellerAdModal } from "../../../components/SellerAdModal";
import {
  useCategory,
  useMessages,
  useNewListings,
  usePopularListings,
} from "../../../hooks/useHooks";
import { LinearGradient } from "expo-linear-gradient";
import { mutate } from "swr";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatCurrency } from "../../../utils/currency";
import { getRiderStatus } from "@/api/api";
import { FontAwesome5, SimpleLineIcons } from "@expo/vector-icons";

type ExploreFeature = {
  id: string;
  title: string;
  route: string;
  image: any;
  backgroundColor: string;
  params?: string;
};

const index = () => {
  const [userAddress, setUserAddress] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSellerAd, setShowSellerAd] = useState(false);
  const [activePopularIndex, setActivePopularIndex] = useState(0);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [riderStatus, setRiderStatus] = useState<any>(null);
  const featureAnimations = useRef({
    categories: new Animated.Value(0),
    orders: new Animated.Value(0),
    wallet: new Animated.Value(0),
    chat: new Animated.Value(0),
    rider: new Animated.Value(0),
    seller: new Animated.Value(0),
  }).current;

  useEffect(() => {
    const animations = [
      {
        key: "categories",
        sequence: [
          Animated.timing(featureAnimations.categories, {
            toValue: -4,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnimations.categories, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ],
      },
      {
        key: "orders",
        sequence: [
          Animated.timing(featureAnimations.orders, {
            toValue: 4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnimations.orders, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ],
      },
      {
        key: "wallet",
        sequence: [
          Animated.timing(featureAnimations.wallet, {
            toValue: -3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnimations.wallet, {
            toValue: 2,
            duration: 600,
            useNativeDriver: true,
          }),
        ],
      },
      {
        key: "chat",
        sequence: [
          Animated.timing(featureAnimations.chat, {
            toValue: 3,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnimations.chat, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ],
      },
      {
        key: "rider",
        sequence: [
          Animated.timing(featureAnimations.rider, {
            toValue: -5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnimations.rider, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ],
      },
      {
        key: "seller",
        sequence: [
          Animated.timing(featureAnimations.seller, {
            toValue: 2,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(featureAnimations.seller, {
            toValue: -1,
            duration: 750,
            useNativeDriver: true,
          }),
        ],
      },
    ];

    const loops = animations.map(({ sequence }) =>
      Animated.loop(Animated.sequence(sequence)),
    );
    loops.forEach((loop) => loop.start());

    return () => loops.forEach((loop) => loop.stop());
  }, [featureAnimations]);

  const exploreFeatures: ExploreFeature[] = [
    {
      id: "categories",
      title: "Categories",
      route: "/(tabs)/(home)/category",
      params: "Category",
      image: require("../../../assets/images/Categorys.png"),
      backgroundColor: "#4F46E5",
    },
    {
      id: "orders",
      title: "Orders",
      route: "/(tabs)/(profile)/order",
      image: require("../../../assets/images/Empty_Box.png"),
      backgroundColor: "#10B981",
      params: undefined,
    },
    {
      id: "wallet",
      title: "Wallet",
      route: "/(tabs)/(profile)/wallet",
      image: require("../../../assets/images/Wallets.png"),
      backgroundColor: "#8B5CF6",
      params: undefined,
    },
    {
      id: "chat",
      title: "Chat",
      route: "/(tabs)/(profile)/message",
      image: require("../../../assets/images/Message icon.png"),
      backgroundColor: "#F59E0B",
      params: undefined,
    },
    {
      id: "rider",
      title: "Rider",
      route: "/(tabs)/(rides)",
      image: require("../../../assets/images/Rider-icon.png"),
      backgroundColor: "#EF4444",
      params: undefined,
    },
    {
      id: "seller",
      title: "Seller",
      route: "/(tabs)/(home)/seller-onboarding",
      image: require("../../../assets/images/Seller-icon.png"),
      backgroundColor: "#F97316",
      params: undefined,
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
  const token = user?.data?.token;
  const { messages: messageThreads } = useMessages(token);

  const messageThreadsList = useMemo(() => {
    const resolvedThreads = messageThreads?.data || messageThreads || [];
    return Array.isArray(resolvedThreads) ? resolvedThreads : [];
  }, [messageThreads]);
  const unreadMessageCount = useMemo(() => {
    return messageThreadsList.reduce(
      (total: number, thread: any) => total + Number(thread?.unreadCount || 0),
      0,
    );
  }, [messageThreadsList]);

  const displayName = useMemo(() => {
    const rawName =
      user?.data?.user?.fullName ||
      user?.data?.user?.name ||
      user?.data?.user?.firstName ||
      user?.data?.user?.username ||
      "there";

    return String(rawName);
  }, [user]);
  const roles = useMemo(() => {
    const maybeRoles = user?.data?.user?.roles ?? user?.data?.user?.role ?? [];
    if (Array.isArray(maybeRoles))
      return maybeRoles.map((r: any) => String(r).toUpperCase());
    if (typeof maybeRoles === "string") return [maybeRoles.toUpperCase()];
    return [];
  }, [user]);
  const isSeller = roles.includes("SELLER");

  const handleFeaturePress = async (feature: ExploreFeature) => {
    if (feature.id === "rider") {
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
      return;
    }

    router.push({
      pathname: feature.route,
      params: feature.params ? { category: feature.params } : undefined,
    });
  };

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
  const featuredSlides = useMemo(() => {
    return (NewList || []).slice(0, 5).map((item: any) => {
      const slideImage =
        item?.media?.find((media: any) => media.mimeType?.startsWith("image"))
          ?.url || item?.media?.[0]?.url;

      return {
        id: item?.id,
        title: item?.title || "Fresh arrivals",
        subtitle: item?.condition ? `${item.condition} pick` : "Best sellers. Best prices.",
        price: item?.price,
        image: slideImage
          ? { uri: slideImage }
          : require("../../../assets/images/Background-Image.png"),
        route: {
          pathname: "/(tabs)/(home)/details",
          params: { id: item?.id },
        },
      };
    });
  }, [NewList]);

  const activeSlide = featuredSlides[activeCarouselIndex] || featuredSlides[0];

  const [jobsListings, setJobsListings] = useState<any[]>([]);
  const [servicesListings, setServicesListings] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    if (!featuredSlides.length) return;

    const intervalId = setInterval(() => {
      setActiveCarouselIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [featuredSlides.length]);

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

  // small helper: promise timeout wrapper
  async function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
    return (await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms),
      ),
    ])) as T;
  }

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getCurrentLocation = async () => {
    const attempts = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Lowest,
        });
        if (location?.coords?.latitude && location?.coords?.longitude) {
          return location;
        }
      } catch (err) {
        lastError = err;
        console.warn(
          `getCurrentPositionAsync attempt ${attempt} failed, retrying...`,
          err,
        );
        if (attempt < attempts) {
          await delay(1500);
          continue;
        }
      }
    }

    const lastKnown = await Location.getLastKnownPositionAsync({});
    if (lastKnown && lastKnown.coords) {
      return lastKnown;
    }

    throw (
      lastError ||
      new Error(
        "Current location is unavailable. Make sure that location services are enabled.",
      )
    );
  };

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

      const loc = await getCurrentLocation();
      let address = "";
      try {
        const rev = await withTimeout(
          Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          }),
          15000,
        );
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
      } catch (revErr) {
        console.warn("reverseGeocodeAsync failed, using coordinates", revErr);
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
      <StatusBar barStyle="dark-content" backgroundColor="#F0EDFD" />
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
        {/* <View className="px-5">  */}
          <LinearGradient
            colors={["#F0EDFD", "#F5F5FD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              // borderRadius: 18,
              paddingHorizontal: 12,
              paddingVertical: 12,

            }}
          >
          <View
            className="flex-row items-center mt-5 justify-between rounded-3xl border border-white/70 p-2"
            style={{
              zIndex: 50,
              backgroundColor: "rgba(255, 255, 255, 0.55)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              // elevation: 6,
            }}
          >
            <View className="flex-1 mr-3">
              <View className="flex-row items-start">
                <View className="mr-2 mt-1">
                  <Text className="text-3xl font-NunitoSemiBold text-[#6366F1]">
                    👋
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-NunitoSemiBold text-black">
                    Hello
                  </Text>
                  <Text className="text-3xl font-NunitoBold text-[#111827]">
                    {displayName}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    {/* <FontAwesome name="map-marker" size={18} color="#004CFF" className="mr-3" /> */}
                    {/* <SimpleLineIcons name="location-pin" size={18} color="#004CFF" /> */}
                    <Text
                      className="text-sm font-NunitoSemiBold text-[#004CFF] flex-1"
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {loadingAddress
                        ? "Loading..."
                        : userAddress
                          ? userAddress
                          : "Lagos, Nigeria"}
                    </Text>
                    {/* <FontAwesome6 name="chevron-down" size={12} color="#004CFF" /> */}
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/(profile)/transactions")}
                className="px-3 py-3 bg-white rounded-full"
              >
                <Ionicons name="notifications-outline" size={20} color="#004CFF" />
              </TouchableOpacity>

              <View className="relative">
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/(profile)/message")}
                  className="px-3 py-3 bg-white rounded-full"
                >
                  <AntDesign name="message1" size={20} color="#004CFF" />
                </TouchableOpacity>
                {unreadMessageCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                    <Text className="text-white text-[10px] font-NunitoSemiBold">
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

               <View className="mx-2">
                <Image
                  source={require("../../../assets/images/profile.png")}
                  style={{ width: 40, height: 40, borderRadius: 9999 }}
                />
              </View>
      
          </View>

          {/* Search Bar */}
          <View className="mt-5">
            <SearchComponent
              placeholder="Search for products, stores..."
              value={searchQuery}
              white="yes"
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                const filters = searchQuery.trim()
                  ? { q: searchQuery.trim() }
                  : {};
                const filtersParam = encodeURIComponent(
                  JSON.stringify(filters),
                );
                router.push(
                  `/(tabs)/(home)/search-results?filters=${filtersParam}`,
                );
              }}
              onPressIcon={() => {
                const filters = searchQuery.trim()
                  ? { q: searchQuery.trim() }
                  : {};
                const filtersParam = encodeURIComponent(
                  JSON.stringify(filters),
                );
                router.push(
                  `/(tabs)/(home)/search-results?filters=${filtersParam}`,
                );
              }}
            />
          </View>
        {/* </View> */}
            </LinearGradient>


        {/* Top Deals Banner */}
        <View className="mt-6 px-5">
          <ImageBackground
            source={activeSlide?.image || require("../../../assets/images/Background-Image.png")}
            style={{
              borderRadius: 24,
              overflow: "hidden",
            }}
            imageStyle={{ borderRadius: 24 }}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 24,
                overflow: "hidden",
              }}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <View className="flex-row items-center mb-3">
                    <FontAwesome name="star" size={16} color="#004CFF" />
                    <Text className="text-white text-xs font-NunitoSemiBold ml-2">
                      New Listings
                    </Text>
                  </View>
                  <Text className="text-white text-2xl font-RalewayExtraBold mb-2" numberOfLines={2}>
                    {activeSlide?.title || "Newly Added You'll Love"}
                  </Text>
                  <Text className="text-white text-sm font-NunitoMedium opacity-90 mb-4">
                    {activeSlide?.subtitle || "Best sellers. Best prices. Shop now!"}
                  </Text>
                  {activeSlide?.price ? (
                    <Text className="text-white text-lg font-RalewayBold mb-4">
                      {formatCurrency(activeSlide.price, "NGN", "en-NG")}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={() =>
                      activeSlide?.route
                        ? router.push(activeSlide.route)
                        : router.push({
                            pathname: "/(tabs)/(home)/listings",
                            params: { route: "Listings" },
                          })
                    }
                    className="bg-white rounded-full px-4 py-2.5 w-max flex-row items-center justify-center"
                  >
                    <Text className="text-blue-600 font-NunitoSemiBold text-base flex-row items-center">
                      {activeSlide?.price ? "View Listing" : "Shop Now"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center mt-4">
                {featuredSlides.map((slide: any, index: number) => (
                  <View
                    key={`${slide?.id || index}-dot`}
                    className={`h-1.5 rounded-full mx-1 ${index === activeCarouselIndex ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
                  />
                ))}
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
        {/* Explore Features Grid */}
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          className="mt-8 px-3"
        >
          <View className="flex-row flex-wrap gap-3">
            {exploreFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                className="rounded-2xl p-3 flex flex-col items-center justify-center"
                // style={{ backgroundColor: feature.backgroundColor }}
                onPress={() => handleFeaturePress(feature)}
              >
                <View className="mb-3 items-start">
                  <Animated.View
                    style={{
                      transform: [
                        {
                          translateY:
                            featureAnimations[
                              feature.id as keyof typeof featureAnimations
                            ] || featureAnimations.categories,
                        },
                      ],
                    }}
                  >
                    <View
                      className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center overflow-hidden"
                      style={{ backgroundColor: feature.backgroundColor }}
                    >
                      <Image
                        source={feature.image}
                        style={{ width: 28, height: 28, borderRadius: 8 }}
                        contentFit="contain"
                      />
                    </View>
                  </Animated.View>
                </View>
                <Text
                  className={
                    "text-sm font-NunitoSemiBold text-textColor-100 text-center "
                  }
                  style={{ color: feature.backgroundColor }}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {feature.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Category Grid
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
        </View> */}

        {/* Flash Deals Section */}
        <View className="mt-8 px-5">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              {/* <FontAwesome name="bolt" size={20} color="#EF4444" /> */}
             <Text className="text-2xl font-NunitoBold"> 🔥</Text>
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
                    )?.url ||
                    item?.media?.[0]?.url ||
                    "";

                  return (
                    <TouchableOpacity
                      key={item?.id}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/(home)/details",
                          params: { id: item.id },
                        })
                      }
                      className="w-32 bg-white rounded-2xl overflow-hidden border border-gray-100 mr-2"
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
                        <View className="absolute top-1 left-1 bg-primary-100 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-NunitoSemiBold">
                            {item?.condition?.toUpperCase() || "New"}
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

        {/* Categories */}
        
        <View className="mt-6 px-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {(categories?.categories || []).map((categoryItem: any, index: number) => {
              const iconName = categoryItem?.iconName || "shape";
              const iconLibrary = categoryItem?.iconLib || "MaterialCommunityIcons";
              const iconColors = [
                "#4F46E5",
                "#059669",
                "#D97706",
                "#DB2777",
                "#2563EB",
                "#7C3AED",
                "#0891B2",
                "#EA580C",
              ];
              const iconColor = iconColors[index % iconColors.length];
              const renderIcon = () => {
                if (iconLibrary === "Ionicons") {
                  return <Ionicons name={iconName} size={20} color={iconColor} />;
                }
                if (iconLibrary === "AntDesign") {
                  return <AntDesign name={iconName} size={20} color={iconColor} />;
                }
                if (iconLibrary === "Feather") {
                  return <Feather name={iconName} size={20} color={iconColor} />;
                }
                return <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />;
              };

              return (
                <TouchableOpacity
                  key={categoryItem?.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/(home)/category",
                      params: {
                        category: categoryItem?.name || categoryItem?.title,
                        id: String(categoryItem?.id),
                      },
                    })
                  }
                  className="mr-3 items-center"
                >
                  <View className="h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-[#F5F7FF]">
                    {renderIcon()}
                  </View>
                  <Text
                    className="mt-2 max-w-[56px] text-center text-xs font-NunitoSemiBold text-black"
                    numberOfLines={2}
                  >
                    {categoryItem?.name || categoryItem?.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2x2 Feature Banners */}
        <View className="mt-6 px-5 w-full">
          {/* <View className="flex-row flex-wrap justify-between gap-3"> */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 170 }}  >
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/(tabs)/(home)/category", params: { category: "Jobs & Services", id: "jobs" } })}
              className="w-[30%] rounded-2xl overflow-hidden relative"
              style={{ height: 120 }}
            >
              <LinearGradient
                colors={["#ECFDF5", "#D1FAE5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 p-4 flex-row items-center justify-between"
              >
                <View style={{ flex: 1, zIndex: 1 }}>
                  <Text className="text-lg font-RalewayBold text-[#065F46]">Jobs & Services</Text>
                  <Text className="text-sm font-NunitoMedium text-[#065F46] opacity-90 mt-1">Best professionals</Text>
                  <TouchableOpacity className="mt-3 bg-[#059669] px-4 py-2 rounded-full w-[100px] flex-row items-center justify-center">
                    <Text className="text-white font-NunitoSemiBold">Explore </Text>
                    <FontAwesome5 name="arrow-right" size={12} color="white" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("../../../assets/images/Worker.png")}
                  style={{ width: 70, height: 70, borderRadius: 12, position: "absolute", right: 12, top: 10 }}
                  contentFit="cover"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: "/(tabs)/(home)/category", params: { category: "Travel & Logistics", id: "travel" } })}
              className="w-[30%] rounded-2xl overflow-hidden relative"
              style={{ height: 120 }}
            >
              <LinearGradient
                colors={["#EEF2FF", "#E0E7FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 p-4 flex-row items-center justify-between"
              >
                <View style={{ flex: 1, zIndex: 1 }}>
                  <Text className="text-lg font-RalewayBold text-[#1E3A8A]">Travel & Logistics</Text>
                  <Text className="text-sm font-NunitoMedium text-[#1E3A8A] opacity-90 mt-1">Safe deliveries, fast trips</Text>
                  <TouchableOpacity className="mt-3 bg-[#2563EB] px-4 py-2 rounded-full w-[100px] flex-row items-center justify-center">
                    <Text className="text-white font-NunitoSemiBold">Explore </Text>
                    <FontAwesome5 name="arrow-right" size={12} color="white" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("../../../assets/images/benz.png")}
                  style={{ width: 80, height: 80, borderRadius: 12, position: "absolute", right: 12, top: 12 }}
                  contentFit="cover"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: "/(tabs)/(home)/category", params: { category: "Real Estate & Property", id: "property" } })}
              className="w-[30%] rounded-2xl overflow-hidden relative"
              style={{ height: 120 }}
            >
              <LinearGradient
                colors={["#F5F3FF", "#F0EBFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 p-4 flex-row items-center justify-between"
              >
                <View style={{ flex: 1, zIndex: 1 }}>
                  <Text className="text-lg font-RalewayBold text-[#6D28D9]">Real Estate & Property</Text>
                  <Text className="text-sm font-NunitoMedium text-[#6D28D9] opacity-90 mt-1">Homes & spaces for rent</Text>
                  <TouchableOpacity className="mt-3 bg-[#7C3AED] px-4 py-2 rounded-full w-[100px] flex-row items-center justify-center">
                    <Text className="text-white font-NunitoSemiBold">Explore </Text>
                    <FontAwesome5 name="arrow-right" size={12} color="white" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("../../../assets/images/house.png")}
                  style={{ width: 70, height: 70, borderRadius: 12, position: "absolute", right: 12, top: 12 }}
                  contentFit="cover"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push({ pathname: "/(tabs)/(home)/category", params: { category: "Electronics & Gadgets", id: "electronics" } })}
              className="w-[30%] rounded-2xl overflow-hidden relative"
              style={{ height: 120 }}
            >
              <LinearGradient
                colors={["#FFFBEB", "#FFF7ED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 p-4 flex-row items-center justify-between"
              >
                <View style={{ flex: 1, zIndex: 1 }}>
                  <Text className="text-lg font-RalewayBold text-[#C2410C]">Electronics & Gadgets</Text>
                  <Text className="text-sm font-NunitoMedium text-[#C2410C] opacity-90 mt-1">Top gadgets and accessories</Text>
                  <TouchableOpacity className="mt-3 bg-[#EA580C] px-4 py-2 rounded-full w-[100px] flex-row items-center justify-center">
                    <Text className="text-white font-NunitoSemiBold">Explore </Text>
                    <FontAwesome5 name="arrow-right" size={12} color="white" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
                <Image
                  source={require("../../../assets/images/electronics.png")}
                  style={{ width: 70, height: 70, borderRadius: 12, position: "absolute", right: 12, top: 20 }}
                  contentFit="cover"
                />
              </LinearGradient>
            </TouchableOpacity>
        </ScrollView>
          {/* </View> */}
        </View>

        {/* Jobs and Services */}
        <View className="mt-8 px-5 pb-8">
          {/* Jobs */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-RalewayBold text-textColor-100">
              Jobs and Services
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/(home)/category",
                  params: { category: "Jobs & Services" },
                })
              }
            >
              <Text className="text-lg font-NunitoBold text-primary-100">
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between gap-3 mb-6">
            {jobsLoading ? (
              [...Array(2)].map((_, i) => (
                <View
                  key={i}
                  className="w-[48%] h-28 bg-gray-200 rounded-2xl animate-pulse"
                />
              ))
            ) : jobsListings && jobsListings.length > 0 ? (
              jobsListings.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/(home)/details",
                      params: { id: item.id },
                    })
                  }
                  className="w-[48%] bg-white border border-gray-100 rounded-2xl p-3"
                >
                  <View className="w-full h-16 rounded-xl overflow-hidden mb-2 bg-gray-100">
                    {item?.media?.[0]?.url ? (
                      <Image
                        source={{ uri: item.media[0].url }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-full h-full flex items-center justify-center">
                        <FontAwesome
                          name="briefcase"
                          size={24}
                          color="#004CFF"
                        />
                      </View>
                    )}
                  </View>
                  <Text className="text-sm font-NunitoSemiBold text-textColor-100">
                    {item?.title || item?.name}
                  </Text>
                  {item?.price != null && (
                    <Text className="text-sm font-RalewayBold text-primary-100 mt-1">
                      {formatCurrency(item.price, "NGN", "Nigerian Naira")}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-sm font-RalewayMedium text-textColor-100">
                No jobs found
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom padding */}
    </SafeAreaView>
  );
};

export default index;
