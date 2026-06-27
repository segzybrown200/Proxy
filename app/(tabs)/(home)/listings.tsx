import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Image } from 'expo-image';
import React, { useState } from "react";
import { formatCurrency } from "../../../utils/currency";
import { SafeAreaView } from "react-native-safe-area-context";
import Dashboard from "../../../assets/icons/Dashboard.svg";
import { SearchComponent } from "../../../components/SearchInput";
import { router, useLocalSearchParams } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { useNewListings, usePopularListings } from "../../../hooks/useHooks";
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


const Listings = () => {
  const {route, subCategoryId, subCategoryName} = useLocalSearchParams();
  const {isLoading:NewListingsLoading, listings:NewListing, isError:NewError, mutate: mutateNew} = useNewListings();
  const {isLoading:PopularIsLoading, popular:PopularListing, isError:PopularError, mutate: mutatePopular} = usePopularListings();
  const [refreshing, setRefreshing] = useState(false);
  const activeSubCategoryId = subCategoryId as string | undefined;
  const headerTitle = activeSubCategoryId ? (subCategoryName || 'Filtered Listings') : (route === "Listings" ? "New Listings" : "Popular Selling");

  return (
    <SafeAreaView className="flex-1 bg-[#sF9FAFB] p-4">
      <View className=" mt-5 flex flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/(home)")}
          className="rounded-full bg-primary-100 p-2"
        >
          <Dashboard width={20} height={20} />
        </TouchableOpacity>
        <Text className="font-RalewayBold text-3xl">{headerTitle}</Text>
      </View>

      <View className="mt-5 flex  flex-row items-center">
        <SearchComponent
          placeholder="Search......"
          otherStyles={"flex-1"}
          white="yes"
        />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await Promise.all([mutateNew(), mutatePopular()]);
              } catch (e) {
                console.log("Refresh error:", e);
              }
              setRefreshing(false);
            }}
            colors={["#004CFF"]}
            tintColor="#004CFF"
          />
        }
      >
        {/* Seller Opportunity Banner */}
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}
        >
          <TouchableOpacity 
            onPress={() => router.push("/(tabs)/(home)/seller-onboarding")}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-1">
              <Text className="text-white font-RalewayBold text-lg mb-1">Sell Similar Items?</Text>
              <Text className="text-white/80 font-NunitoRegular text-sm">Browse items you love and start selling</Text>
            </View>
            <View className="bg-white/20 rounded-full p-3">
              <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </LinearGradient>

         <View className="flex flex-row flex-wrap justify-between gap-1">
              {((route === "Listings" ? NewListing?.data : PopularListing?.data) || [])
                .filter((item:any) => {
                  if (!activeSubCategoryId) return true;
                  return String(item?.subCategoryId || item?.subCategory?.id || '') === String(activeSubCategoryId);
                })
                .map((item:any)=>(
                    <TouchableOpacity key={item?.id} onPress={()=>router.push({pathname: "/(tabs)/(home)/details", params:{id: item.id}})} className="mt-5 w-[49%] border border-primary-100 rounded-lg" style={{ position: 'relative' }}>
              <View className="w-full h-40 rounded-lg border-4 border-white shadow-2xl overflow-hidden">
                <Image
                  source={{uri: item?.media?.find((media: any) => media.mimeType === 'image/jpeg')?.url || item?.media[0]?.url}}
                  style={{width: '100%', height: '100%'}}
                  contentFit="cover"
                />
              </View>
              <View>
                <View className="p-1 flex-row justify-between items-start">
                  <Text numberOfLines={2} className="text-lg font-NunitoRegular text-textColor-100 mt-2 w-[70%]">
                    {item?.title}
                  </Text>
                  <TouchableOpacity className="flex-row px-2 py-1.5 rounded-full bg-primary-100 justify-between items-center mt-1">
                    <FontAwesome6 name="plus" size={18} color="white" />
                  </TouchableOpacity>
                </View>
                <Text className="text-[25px] p-1 font-RalewayExtraBold text-textColor-100 ">
                  {formatCurrency(item?.price, 'NGN', "en-NG")}
                </Text>

                <View className="relative p-2 mt-2 mb-5">
                  <Text className="bg-primary-100/20 text-lg rounded-lg text-primary-100 p-2 font-NunitoSemiBold flex flex-row justify-center items-center">
                    {item?.condition.toUpperCase()}
                  </Text>
                  <Text className="font-NunitoMedium text-lg">
                    {item?.seller?.vendorApplication?.location?.city},{item?.seller?.vendorApplication?.location?.country}
                  </Text>
                </View>
              </View>
              <View className="bg-primary-100 p-2 rounded-b-lg absolute top-4 right-2">
                <Text className="text-white font-NunitoLight">Verified ID</Text>
              </View>
            </TouchableOpacity>
            ))}
          </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Listings;
