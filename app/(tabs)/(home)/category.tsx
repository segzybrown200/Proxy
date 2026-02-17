import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Dashboard from "../../../assets/icons/Dashboard.svg";
import { SearchComponent } from "../../../components/SearchInput";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { AntDesign, Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useCategoryListings } from "hooks/useHooks";


const category = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const params = useLocalSearchParams();
  const { category, allCategories, id, subCategoryId } = params;
  const { listings, isLoading, loadMore, isReachingEnd } = useCategoryListings(
    {
      categoryId: id as string | undefined,
      subCategoryId: subCategoryId as string | undefined,
    }

  );
  const backendCategories: any = useMemo(() => {
    if (allCategories) {
      try {
        const parsed = JSON.parse(allCategories as string);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return null;
  }, [allCategories]);
  const selectedCategory =
    backendCategories?.find((c: any) => String(c.id) === String(id)) || null;

  useEffect(() => {
    if (category && category !== "Category") {
      setSelected([category as string]);
    } else {
      setSelected([]);
    }
  }, [category]);
  const subCategoryName = params?.subCategoryName as string;


  const renderListings = ({ item }: any) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/(tabs)/(home)/details",
          params: { item: JSON.stringify(item) },
        })
      }
      className="mt-5 w-[49%] border border-primary-100 rounded-lg"
    >
      <Image
        source={{ uri: item?.media[0]?.url }}
        style={{ width: "100%", height: 160 }}
        className="rounded-lg border-4 border-white shadow-2xl"
        contentFit="cover"
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
            {item.seller?.vendorApplication?.location?.city},
            {item.seller?.vendorApplication?.location?.country}
          </Text>
        </View>
      </View>
      <View className="bg-primary-100 p-2 rounded-b-lg absolute top-4 right-2">
        <Text className="text-white font-NunitoLight">Verified ID</Text>
      </View>
    </TouchableOpacity>
  );

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
          {/* Subcategories (if present) */}
          {selectedCategory?.subCategories &&
            selectedCategory.subCategories.length > 0 && (
              <View className="mt-4">
                <Text className="font-RalewayBold text-lg mb-2">
                  Subcategories
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4 }}
                >
                  {selectedCategory.subCategories.map((sub: any) => (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/(home)/category",
                          params: {
                            category: selectedCategory?.name,
                            id: String(selectedCategory?.id),
                            subCategoryId: String(sub.id),
                            subCategoryName: sub.name,
                            allCategories: JSON.stringify(
                              backendCategories || []
                            ),
                          },
                        })
                      }
                      className="px-3 py-2 mr-2 bg-primary-100/10 rounded-full"
                    >
                      <Text className="text-primary-100 font-NunitoMedium">
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          <View className="mt-5 flex  flex-row items-center justify-between">
            <Text className="font-RalewayBold text-2xl">
              {subCategoryName ? subCategoryName : category} Listings
            </Text>
          </View>
          {isLoading && (!listings || listings.length === 0) ? (
            <View className="mt-5 flex-row flex-wrap justify-between">
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={`skeleton-${i}`}
                  className="mt-5 w-[49%] h-64 bg-gray-200 rounded-lg"
                />
              ))}
            </View>
          ) : (
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
                ) : isReachingEnd && listings?.length === 0 ? (
                  <Text className="text-center font-NunitoRegular text-gray-400 my-4">
                    No more listings
                  </Text>
                ) : null
              }
            />
          )}
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
              {(backendCategories).map((data: any) => (
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
