import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
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
import { useEffect, useMemo } from "react";
import { AntDesign, Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useCategoryListings } from "hooks/useHooks";

const Data = [
  { id: 1, title: "Electronic", icon: <Electronic width={75} height={75} /> },
  { id: 2, title: "Fashion", icon: <Fashion width={75} height={75} /> },
  { id: 3, title: "Services", icon: <Services width={75} height={75} /> },
  { id: 4, title: "Automobile", icon: <Automobile width={75} height={75} /> },
  { id: 5, title: "Drugs", icon: <Drugs width={75} height={75} /> },
  { id: 6, title: "Beauty", icon: <Beauty width={75} height={75} /> },
];
const categories = [
  "Fashion",
  "Electronics",
  "Home",
  "Beauty",
  "Sports",
  "Toys",
  "Books",
];
const condition = ["Brand New", "Used", "Refurbuished"];

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
];

const category = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const params = useLocalSearchParams();
  const { category, allCategories, id } = params;
  const { listings, isLoading, loadMore, isReachingEnd } = useCategoryListings(
    id as string
  );
  // Parse categories from params if available
  const backendCategories: any = useMemo(() => {
    if (allCategories) {
      try {
        const parsed = JSON.parse(allCategories as string);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return null;
  }, [allCategories]);
  useEffect(() => {
    if (category && category !== "Category") {
      setSelected([category as string]);
    } else {
      setSelected([]);
    }
  }, [category]);

  const renderListings = ({ item }:any) => (
      <TouchableOpacity onPress={()=>router.push({pathname:"/(tabs)/(home)/details", params:{item:JSON.stringify(item)}})} className="mt-5 w-[49%] border border-primary-100 rounded-lg">
          <Image
            source={{uri: item?.media[0]?.url}}
            className=" w-full h-40 rounded-lg border-4 border-white shadow-2xl"
          />
          <View>
            <View className="p-1 flex-row justify-between items-start">
              <Text className="text-xl font-NunitoRegular text-textColor-100 mt-2">
                {item.title}
              </Text>
              <TouchableOpacity className="flex-row px-2 py-1.5 rounded-full bg-primary-100 justify-between items-center mt-1">
                <FontAwesome6 name="plus" size={18} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="text-[20px] p-1 font-RalewayExtraBold text-textColor-100 ">
              ₦{item.price}
            </Text>

            <View className="relative p-2 mt-2 mb-5">
              <Text className="bg-primary-100/20 text-lg rounded-lg text-primary-100 p-2 font-NunitoSemiBold flex flex-row justify-center items-center">
                {item.condition.toUpperCase()}
              </Text>
              <Text className="font-NunitoMedium text-lg">
                {item.seller?.vendorApplication?.location?.city},{item.seller?.vendorApplication?.location?.country}
              </Text>
            </View>
          </View>
          <View className="bg-primary-100 p-2 rounded-b-lg absolute top-4 right-2">
            <Text className="text-white font-NunitoLight">Verified ID</Text>
          </View>
        </TouchableOpacity>
  )

  return (
    <SafeAreaView className="flex-1 bg-[#sF9FAFB] p-4">
      <View className=" mt-5 flex flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/(home)")}
          className="rounded-full bg-primary-100 p-2"
        >
          <Dashboard width={20} height={20} />
        </TouchableOpacity>
        <Text className="font-RalewayBold text-3xl">
          {category === "Category" ? "Category" : category}
        </Text>
      </View>

      <View className="mt-5 flex  flex-row items-center">
        <SearchComponent
          placeholder="Search......"
          otherStyles={"flex-1"}
          white="yes"
        />
      </View>

      {category !== "Category" && (
        <View>
          <View className="mt-5 flex  flex-row items-center justify-between">
            <Text className="font-RalewayBold text-2xl">
              {category} Listings
            </Text>
          </View>
            <FlatList
              data={listings}
              keyExtractor={(item) => item.id}
              renderItem={renderListings}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              scrollEnabled={true}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              contentContainerStyle={{ paddingBottom: 140, paddingTop: 10 }}
              ListFooterComponent={() =>
                isLoading ? (
                  <ActivityIndicator size="large" color="#004CFF" />
                ) : isReachingEnd && listings?.length === 0  ? (
                  <Text className="text-center font-NunitoRegular text-gray-400 my-4">
                    No more listings
                  </Text>
                ) : null
              }
            />
        </View>
      )}

      {category === "Category" && (
        <View>
          <Text className="mt-5 self-center font-RalewayBold text-2xl">
            Please select a category
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
          >
            <View className="mt-5 flex  flex-wrap flex-row  ">
              {(backendCategories || Data).map((data: any) => (
                <TouchableOpacity
                  key={data.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/(home)/category",
                      params: {
                        category: data.name || data.title,
                        id: String(data.id),
                        allCategories: JSON.stringify(backendCategories || []),
                      },
                    })
                  }
                  className="flex flex-col items-center w-[32%] mb-5"
                >
                  {/* If backend data, show icon from iconLib/iconName, else fallback to static icon */}
                  {data.iconLib && data.iconName ? (
                    <View className="rounded-xl bg-white p-3">
                      {/* You can add more icon libraries as needed */}
                      {data.iconLib === "Ionicons" ? (
                        <Ionicons
                          name={data.iconName}
                          size={75}
                          color={"#004CFF"}
                        />
                      ) : data.iconLib === "AntDesign" ? (
                        <AntDesign
                          name={data.iconName}
                          size={75}
                          color={"#004CFF"}
                        />
                      ) : data.iconLib === "Feather" ? (
                        <Feather
                          name={data.iconName}
                          size={75}
                          color={"#004CFF"}
                        />
                      ) : null}
                    </View>
                  ) : (
                    <View className="rounded-xl bg-white p-3">{data.icon}</View>
                  )}
                  <Text className="font-RalewayMedium text-lg text-center">
                    {data.name || data.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

export default category;
