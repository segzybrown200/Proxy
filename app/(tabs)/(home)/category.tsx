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
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCategoryListings, useCategory } from "../../../hooks/useHooks";


const category = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const params = useLocalSearchParams();
  const { category, id, subCategoryId } = params;
  const { categories } = useCategory();
  const { listings, isLoading, loadMore, isReachingEnd } = useCategoryListings(
    {
      categoryId: id as string | undefined,
      subCategoryId: subCategoryId as string | undefined,
    }

  );
  const backendCategories: any = useMemo(() => categories?.categories || [], [categories]);
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
          params: { id: item.id },
        })
      }
      className="mt-5 w-[49%] border border-primary-100 rounded-lg overflow-hidden"
      style={{ height: 240, position: 'relative' }}
    >
      <View style={{ flex: 1, position: 'relative' }}>
        <Image
          source={{ uri: item?.media[0]?.url }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
          onError={(error) => console.log('Listing image load error:', error)}
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
            <Text className="text-white text-xl font-NunitoRegular" numberOfLines={2}>
              {item.title}
            </Text>
            <TouchableOpacity className="flex-row px-2 py-1.5 rounded-full bg-primary-100 justify-between items-center">
              <FontAwesome6 name="plus" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <View>
            <Text className="text-white text-[20px] font-RalewayExtraBold">
              ₦{item.price}
            </Text>
            <Text className="bg-primary-100/20 text-lg rounded-lg text-primary-100 p-2 font-NunitoSemiBold flex flex-row justify-center items-center mt-2">
              {item.condition.toUpperCase()}
            </Text>
            <Text className="font-NunitoMedium text-lg text-white">
              {item.seller?.vendorApplication?.location?.city}, {item.seller?.vendorApplication?.location?.country}
            </Text>
          </View>
        </LinearGradient>
      </View>
      <View className="bg-primary-100 p-2 rounded-b-lg absolute bottom-2 right-2">
        <Text className="text-white font-NunitoLight">Verified ID</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item, index }: any) => {
    const gradientList = [
      { colors: ['#60A5FA', '#2563EB'] },
      { colors: ['#3B82F6', '#1D4ED8'] },
      { colors: ['#1E40AF', '#1E3A8A'] },
      { colors: ['#60A5FA', '#3B82F6'] },
      { colors: ['#93C5FD', '#60A5FA'] },
      { colors: ['#2563EB', '#1E40AF'] },
    ];
    const g = gradientList[index % gradientList.length];
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/(home)/category",
            params: {
              category: item.name || item.title,
              id: String(item.id),
            },
          })
        }
        className="w-[48%] mb-4"
        style={{
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {item.imageUrl ? (
          <View style={{ height: 140, borderRadius: 12, overflow: 'hidden' }}>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12 }}
              contentFit="cover"
              onError={(error) => console.log('Category image load error:', error)}
            />
            <LinearGradient
              colors={g.colors.map((color: string) => color + '80') as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 12,
              }}
            >
              <Text className="text-white font-RalewayMedium text-base text-center">
                {item.name || item.title}
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <LinearGradient
            colors={g.colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              padding: 12,
              height: 140,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ width: 62, height: 62, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              {item.iconLib === 'Ionicons' ? (
                <Ionicons name={item.iconName} size={30} color={'#fff'} />
              ) : item.iconLib === 'AntDesign' ? (
                <AntDesign name={item.iconName} size={30} color={'#fff'} />
              ) : item.iconLib === 'Feather' ? (
                <Feather name={item.iconName} size={30} color={'#fff'} />
              ) : (
                <Text className="text-white font-NunitoBold text-lg">{(item.name || '').charAt(0)}</Text>
              )}
            </View>
            <Text className="text-white font-RalewayMedium text-base text-center mt-1">
              {item.name || item.title}
            </Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

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

      {/* Seller Opportunity Banner */}
      <LinearGradient
        colors={["#667EEA", "#764BA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 12, marginBottom: 16, marginTop: 12, overflow: 'hidden' }}
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
                  className="mt-5 w-[49%] h-60 bg-gray-200 rounded-lg"
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

          <FlatList
            data={backendCategories}
            keyExtractor={(item) => item.id}
            renderItem={renderCategory}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingBottom: 300, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default category;
