import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Image
} from "react-native";
import { TextInput } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Dashboard from "../../../assets/icons/Dashboard.svg";
import { SearchComponent } from "../../../components/SearchInput";
import Filter from "../../../assets/icons/filter.svg";
import Electronic from "../../../assets/icons/Electronics.svg";
import Fashion from "../../../assets/icons/Fashion.svg";
import Services from "../../../assets/icons/handshake 1.svg";
import Automobile from "../../../assets/icons/AutoMobile.svg";
import Drugs from "../../../assets/icons/tablets.svg";
import Beauty from "../../../assets/icons/Beauty blog.svg";
import { router, useLocalSearchParams } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";
import { useNewListings, usePopularListings } from "../../../hooks/useHooks";

const Data1 = [
  {
    id: "1",
    name: "Electronics",
    image: <Electronic width={25} height={25} />,
  },
  { id: "3", name: "AutoMobile", image: <Automobile width={25} height={25} /> },
  { id: "4", name: "Drugs", image: <Drugs width={25} height={25} /> },
  { id: "2", name: "Fashion", image: <Fashion width={25} height={25} /> },
  { id: "5", name: "Beauty", image: <Beauty width={25} height={25} /> },
  { id: "6", name: "Services", image: <Services width={25} height={25} /> },
];

const Listings = () => {
    const {route} = useLocalSearchParams();
    const {isLoading:NewListingsLoading, listings:NewListing, isError:NewError} = useNewListings();
    const {isLoading:PopularIsLoading, popular:PopularListing, isError:PopularError} = usePopularListings();
  return (
    <SafeAreaView className="flex-1 bg-[#sF9FAFB] p-4">
      <View className=" mt-5 flex flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/(home)")}
          className="rounded-full bg-primary-100 p-2"
        >
          <Dashboard width={20} height={20} />
        </TouchableOpacity>
        <Text className="font-RalewayBold text-3xl">{route === "Listings" ? "New Listings" : "Popular Selling"}</Text>
      </View>

      <View className="mt-5 flex  flex-row items-center">
        <SearchComponent
          placeholder="Search......"
          otherStyles={"flex-1"}
          white="yes"
        />
      </View>

      <View className="mt-8 flex-row flex-wrap  justify-between">
        {Data1.map((item) => (
          <View
            key={item.id}
            className="w-[32%] flex-row bg-primary-100/20 items-center p-2 rounded-lg mb-3"
          >
            {item.image}
            <Text className="text-base font-NunitoMedium text-primary-100 ml-1">
              {item.name}
            </Text>
          </View>
        ))}
      </View>
         <View className="flex flex-row flex-wrap justify-between gap-1">
            {(route === "Listings" ? NewListing?.data : PopularListing?.data)?.map((item:any)=>(
                     <TouchableOpacity key={item?.id} onPress={()=>router.push({pathname: "/(tabs)/(home)/details", params:{item: JSON.stringify(item)}})} className="mt-5 w-[49%] border border-primary-100 rounded-lg">
              <View className="w-full h-40 rounded-lg border-4 border-white shadow-2xl overflow-hidden">
                <Image
                  source={{uri: item?.media?.find((media: any) => media.mimeType === 'image/jpeg')?.url || item?.media[0]?.url}}
                  className="w-full h-full"
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
                <Text className="text-[30px] p-1 font-RalewayExtraBold text-textColor-100 ">
                  {item?.price}
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
    </SafeAreaView>
  );
};

export default Listings;
