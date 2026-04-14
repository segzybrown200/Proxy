import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { formatCurrency } from "utils/currency";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  selectCartItems,
  increaseQuantity,
  decreaseQuantity,
} from "global/listingSlice";
import { selectUser } from "global/authSlice";
import { useListingDetails, useSearchListings } from "../../../hooks/useHooks";
import { showError } from "../../../utils/toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 300;

const Details = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const selector: any = useSelector(selectUser);
  const params = useLocalSearchParams();

  const scrollRef = useRef<ScrollView | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { id }: any = useLocalSearchParams();

  const user = selector?.data?.user;
  const { listing: item, isLoading, isError } = useListingDetails(id);
  const sellerId = item?.seller?.id || item?.seller?._id || item?.seller?.userId;
  // const { listings: otherListings, isLoading: otherLoading } = useSearchListings(
  //   sellerId ? { sellerId, limit: 6, excludeId: item?.id } : null
  // );

  const cartItem = item ? cartItems.find((ci: any) => ci.id === item.id) : null;

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white p-4">
        <View className="h-[280px] w-full rounded-3xl bg-gray-200" />
        <View className="h-8 mt-6 w-3/5 rounded-full bg-gray-200" />
        <View className="h-5 mt-3 w-1/2 rounded-full bg-gray-200" />
        <View className="h-4 mt-4 w-full rounded-full bg-gray-200" />
        <View className="h-4 mt-3 w-full rounded-full bg-gray-200" />
        <View className="h-4 mt-3 w-4/5 rounded-full bg-gray-200" />

        <View className="mt-6 h-24 w-full rounded-3xl bg-gray-200" />
        <View className="mt-4 h-24 w-full rounded-3xl bg-gray-200" />

        <Text className="mt-8 text-base font-NunitoRegular text-gray-400">Loading vendor listings...</Text>
        <View className="mt-4 flex-row space-x-3">
          <View className="h-40 w-[45%] rounded-3xl bg-gray-200" />
          <View className="h-40 w-[45%] rounded-3xl bg-gray-200" />
        </View>
      </SafeAreaView>
    );
  }

  if (!item || isError) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-4">
        <Text className="text-gray-600 font-NunitoRegular text-center">
          {isError ? "Failed to load item details." : "Item not found."}
        </Text>
        <TouchableOpacity
          className="mt-4 bg-primary-100 px-4 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-NunitoSemiBold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Carousel */}
      <View style={{ height: CAROUSEL_HEIGHT }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}
        >
          {item?.media
            ?.filter(
              (img: any) =>
                !item.isDigital || img.mimeType === "image/jpeg",
            )
            .map((img: any) => (
              <Image
                key={img.id}
                source={{ uri: img.url }}
                style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}
                contentFit="cover"
              />
            ))}
        </ScrollView>

        {/* overlay buttons */}
        <TouchableOpacity
          className="absolute left-4 top-14 rounded-full bg-white p-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <View className="absolute right-6 bottom-4 rounded-lg bg-primary-100 p-3 py-1">
          <Text className="text-white font-NunitoLight">Verified ID</Text>
        </View>

        {/* dots */}
        <View className="absolute left-0 right-0 -bottom-7 flex-row justify-center items-center">
          {item?.media
            ?.filter(
              (img: any) =>
                !item.isDigital || img.mimeType === "image/jpeg",
            )
            .map((i: any, inx: number) => (
              <View
                key={i?.id || inx}
                style={{
                  width: i.id || inx === activeIndex ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 4,
                  backgroundColor:
                    i.id || inx === activeIndex ? "#2563EB" : "#D1D5DB",
                }}
              />
            ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-4 py-4">
          <Text className="text-2xl mt-6 font-RalewayBold">
            {item.title}
          </Text>
          {/* <View className="flex-row items-center gap-3 mt-2">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text className="ml-1 font-NunitoSemiBold">{product.rating}</Text>
                </View>
                <Text className="ml-2 font-NunitoSemiBold">⭐ {product.likes}</Text>
                <Text className="ml-2 font-NunitoSemiBold">👍 {product.views}</Text>
              </View> */}

          <Text className="mt-4 text-gray-600 font-NunitoRegular">
            {item.description}
          </Text>
          <View className="mt-6 flex flex-row gap-3 items-center">
            <View className="">
              <Text className="text-lg font-RalewayMedium text-gray-500">
                Condition
              </Text>
              <Text className="mt-1 font-NunitoBold capitalize text-lg">
                {item.condition}
              </Text>
            </View>

            <View className=" flex flex-row flex-wrap gap-2 justify-between ">
              {item?.extraDetails.length > 0 &&
                item?.extraDetails?.map((details: any, index: number) => (
                  <View key={index} className=" ">
                    <Text className="text-lg font-RalewayMedium text-gray-500">
                      {details.title}
                    </Text>
                    <Text className="mt-1 font-NunitoBold capitalize text-lg">
                      {details.description}
                    </Text>
                  </View>
                ))}
            </View>
          </View>

          <View className="mt-6">
            <View className="flex flex-row gap-4 mb-1">
              <Text className="font-NunitoBold text-lg text-textColor-100">
                Vendors Address
              </Text>
              <Text className=" font-NunitoBold text-lg">
                {item?.seller?.vendorApplication?.location?.city},{" "}
                {item?.seller?.vendorApplication?.location?.country}
              </Text>
            </View>
            <Text className="text-gray-500 mt-1 font-NunitoLight">
              {item?.seller?.vendorApplication?.location?.Address}
            </Text>
          </View>

          <View className="mt-6 flex-row items-center  justify-between">
            <View className="flex-row items-center relative ">
              <Image
                source={{ uri: item?.seller?.kycDocument?.selfieUrl }}
                style={{ width: 48, height: 48, borderRadius: 100 }}
                className="rounded-full"
                contentFit="cover"
              />
              <View className="ml-3">
                <Text className="font-NunitoSemiBold text-lg">
                  Vendor Profile
                </Text>
                <Text className="text-sm text-gray-500 font-NunitoRegular">
                  Name: {item?.seller.name}
                </Text>
                <Text className="text-sm font-NunitoRegular text-gray-500">
                  Phone.No {item?.seller.phone}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)/(profile)/chat",
                  params: {
                    seller: JSON.stringify(item),
                    user: JSON.stringify(user),
                  },
                })
              }
              className="bg-primary-100 px-3 py-2 rounded-md"
            >
              <Text className="text-white font-NunitoSemiBold">Start Chat</Text>
            </TouchableOpacity>
          </View>

          {/* <View className="px-4 mt-8">
            <Text className="text-xl font-RalewayBold mb-4">More from this vendor</Text>
            {otherLoading ? (
              <View className="space-y-4">
                <View className="h-44 w-full rounded-3xl bg-gray-200" />
                <View className="h-44 w-full rounded-3xl bg-gray-200" />
              </View>
            ) : otherListings?.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
                {otherListings.map((listing: any) => (
                  <TouchableOpacity
                    key={listing.id}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/(home)/details",
                        params: { id: listing.id },
                      })
                    }
                    className="mr-4 w-[220px] rounded-3xl bg-white border border-gray-200 overflow-hidden"
                    style={{ elevation: 2 }}
                  >
                    <Image
                      source={{ uri: listing?.media?.[0]?.url }}
                      style={{ width: 220, height: 140 }}
                      contentFit="cover"
                    />
                    <View className="p-3">
                      <Text numberOfLines={2} className="font-NunitoBold text-base">
                        {listing.title}
                      </Text>
                      <Text className="mt-2 text-gray-500 font-NunitoRegular">
                        {formatCurrency(listing.price)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text className="text-gray-500 font-NunitoRegular">
                No other listings from this vendor yet.
              </Text>
            )}
          </View> */}
        </View>
      </ScrollView>

      {/* bottom bar */}
      <View className="absolute left-0 right-0 bottom-6 bg-white px-4 py-4 border-t border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-gray-500 font-RalewayMedium">Price</Text>
          <Text className="text-2xl font-RalewayBold mt-1 ">
            {formatCurrency(item?.price)}
          </Text>
        </View>
        {cartItem ? (
          <View className="flex-row items-center bg-white rounded-lg">
            <TouchableOpacity
              className="px-2 py-2 bg-primary-100 rounded-l-lg"
              onPress={() => dispatch(decreaseQuantity(item.id))}
            >
              <Ionicons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="px-4 py-2">
              <Text className="text-lg font-NunitoBold">
                {cartItem.quantity}
              </Text>
            </View>
            <TouchableOpacity
              className="px-2 py-2 bg-primary-100 rounded-r-lg"
              onPress={() => dispatch(increaseQuantity(item.id))}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-primary-100 px-6 py-3 rounded-lg"
            onPress={() =>
              dispatch(
                addToCart({
                  id: item.id,
                  title: item.title,
                  price: item.price,
                  quantity,
                  media: item.media,
                  seller: item.seller,
                }),
              )
            }
          >
            <Text className="text-white font-NunitoSemiBold">Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Details;
