import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSearchListings } from "hooks/useHooks";
import { formatCurrency } from "utils/currency";
import Dashboard from "../../../assets/icons/Dashboard.svg";

const SearchResults = () => {
  const params = useLocalSearchParams();
  const raw = params?.filters as string | undefined;
  const filters = useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw as string);
    } catch (e) {
      return null;
    }
  }, [raw]);


  const { listings, isLoading, isError, mutate } = useSearchListings(filters);
  console.log(listings)

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: "./details", params: { id: item.id } })}
      className="mt-5 w-[49%] border border-primary-100 rounded-lg"
    >
      <Image source={{ uri: item?.media?.[0]?.url }} className=" w-full h-40 rounded-lg border-4 border-white shadow-2xl" />
      <View>
        <View className="p-1 flex-row justify-between items-start">
          <Text className="text-xl font-NunitoRegular text-textColor-100 mt-2">{item.title}</Text>
        </View>
  <Text className="text-[20px] p-1 font-RalewayExtraBold text-textColor-100 ">{formatCurrency(item.price)}</Text>
        <View className="relative p-2 mt-2 mb-5">
          <Text className="bg-primary-100/20 text-lg rounded-lg text-primary-100 p-2 font-NunitoSemiBold flex flex-row justify-center items-center">{item.condition?.toUpperCase()}</Text>
          <Text className="font-NunitoMedium text-lg">{item.seller?.vendorApplication?.location?.city},{item.seller?.vendorApplication?.location?.country}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#004CFF" />
        <Text className="mt-3 font-NunitoMedium text-gray-500">Searching...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 font-NunitoSemiBold">Failed to fetch search results</Text>
        <TouchableOpacity onPress={() => mutate?.()} className="mt-4 px-4 py-2 bg-primary-100 rounded">
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#sF9FAFB] p-4">
      <View className=" mt-5 flex flex-row items-center gap-4">
        <TouchableOpacity onPress={() => router.back()} className="rounded-full bg-primary-100 p-2">
          <Dashboard width={20} height={20} />
        </TouchableOpacity>
        <Text className="font-RalewayBold text-3xl">Search Results</Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 10 }}
        ListEmptyComponent={() => (
          <Text className="text-center font-NunitoRegular text-gray-400 my-4">No results found</Text>
        )}
      />
    </SafeAreaView>
  );
};

export default SearchResults;
