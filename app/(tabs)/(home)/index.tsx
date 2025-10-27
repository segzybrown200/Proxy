import * as Location from "expo-location";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { SearchComponent } from "components/SearchInput";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView } from "react-native-gesture-handler";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { selectUser } from "global/authSlice";
import { useCategory, useNewListings, usePopularListings } from "hooks/useHooks";
import Ionicons from "react-native-vector-icons/Ionicons";
import { AntDesign, Feather } from "@expo/vector-icons";


const index = () => {
  const [userAddress, setUserAddress] = useState<string>('');
  const [loadingAddress, setLoadingAddress] = useState<boolean>(true);

   const {categories, isError, isLoading} = useCategory()
   const {isLoading:PopularisLoading,  popular, isError:popularError} = usePopularListings()
   const {isLoading:NewListingsLocading,  listings:NewListing, isError:NewError} = useNewListings()

   const NewList = NewListing?.data || []

   const getImageUrl = () => {
      const jpegMedia = NewList[0]?.media?.find((media: any) => media.mimeType === 'image/jpeg');
      if (jpegMedia) {
        return jpegMedia.url;
      } else if (NewList?.media && NewList.media.length > 0) {
        return NewList.media[0].url;
      }
      return null;
    };
  


   

   

  // Helper to fetch and store location
  const fetchAndStoreLocation = async () => {
    try {
      setLoadingAddress(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserAddress('Location permission denied');
        setLoadingAddress(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const rev = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      let address = '';
      if (rev && rev.length > 0) {
        const place = rev[0];
        const parts: string[] = [];
        if (place.name) parts.push(place.name);
        if (place.street) parts.push(place.street);
        if (place.city) parts.push(place.city);
        if (place.region) parts.push(place.region);
        if (place.postalCode) parts.push(place.postalCode);
        if (place.country) parts.push(place.country);
        address = parts.join(', ');
      }
      if (!address) {
        address = `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`;
      }
      setUserAddress(address);
      await AsyncStorage.setItem('userLocation', JSON.stringify({ address, coords: loc.coords }));
    } catch (e) {
      setUserAddress('Unable to fetch location');
    }
    setLoadingAddress(false);
  };

  // On mount, load or fetch location
  useEffect(() => {
    const loadLocation = async () => {
      setLoadingAddress(true);
      try {
        const locationJSON = await AsyncStorage.getItem('userLocation');
        if (locationJSON) {
          const location = JSON.parse(locationJSON);
          setUserAddress(location.address || '');
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


 if (isLoading || PopularisLoading || NewListingsLocading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#004CFF" />
        <Text className="mt-3 font-NunitoMedium text-gray-500">Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (isError || NewError || popularError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 font-NunitoSemiBold">Failed to load stats</Text>
      </SafeAreaView>
    );
  }

 




        
  return (
    <SafeAreaView className="flex-1 flex p-5 bg-white">
      <View className="flex-row items-center mt-8 justify-between">
        <View className="w-[75%]">
          <View className="flex-row items-center">
            <Text className="text-2xl  font-RalewayBold text-textColor-100">
              Deliver to
            </Text>
            <FontAwesome6 name="chevron-down" size={18} color="#000" />
          </View>
          <Text className="text-base font-NunitoMedium  w-[80%] text-primary-100">
            {loadingAddress ? 'Loading address...' : userAddress || 'No address found'}
          </Text>
        </View>

        <View className="flex-row w-[45%] items-center gap-3">
          <TouchableOpacity className="px-2 py-2 bg-[#F3F4F6] rounded-full">
            <FontAwesome name="bell" size={24} color="#004CFF" />
          </TouchableOpacity>
          <Image
            source={require("../../../assets/images/artist-2 1.png")}
            style={{ width: 40, height: 40, borderRadius: 999 }}
          />
        </View>
      </View>
      <View className="mt-8">
        <SearchComponent placeholder="Search" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-5">
        <View className="mt-8 flex-row justify-between items-center">
          <Text className="text-xl font-NunitoMedium text-textColor-100">
            Shop by Category
          </Text>
          <TouchableOpacity onPress={()=>router.push({pathname: "/(tabs)/(home)/category", params: {category: "Category", allCategories: JSON.stringify(categories?.categories || [])}})} className="flex-row items-center gap-1">
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
            [...Array(4)].map((_, index) => (
              <View
                key={`skeleton-${index}`}
                className="w-[32%] h-[50px] bg-gray-100 rounded-lg mb-3 animate-pulse"
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
            categories?.categories.slice(0, 6).map((item:any) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/(home)/category",
                    params: {
                      id: item.id,
                      category: item.name,
                      allCategories: JSON.stringify(categories?.categories || [])
                    },
                  })
                }
                key={item.id}
                className="w-[32%] bg-primary-100/10 p-2 rounded-lg mb-3"
              >
               <View className="flex-row items-center">
                {
                  item.iconLib === "Ionicons" ? (
                    <View className={`w-8 h-8 rounded-full items-center justify-center `}>
                      <Ionicons name={item.iconName} size={18} color={"#004CFF"} />
                    </View>
                  ) : item.iconLib === "AntDesign" ? (
                    <View className={`w-8 h-8 rounded-full items-center justify-center `}>
                      <AntDesign name={item.iconName} size={18} color={"#004CFF"} />
                    </View>
                  ) : item.iconLib === "Feather" ? (
                    <View className={`w-8 h-8 rounded-full items-center justify-center `}>
                      <Feather name={item.iconName} size={18} color={'#004CFF'} />
                    </View>
                  ) : null
                }
                <Text numberOfLines={2} className="text-sm font-NunitoMedium text-primary-100 ml-1 flex-1">
                  {item.name}
                </Text>
               </View>
              </TouchableOpacity>
            ))
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
            <TouchableOpacity onPress={()=>router.push({pathname: "/(tabs)/(home)/listings", params: {route: "Selling"}})} className="flex-row items-center gap-1">
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

             {/* List of Popular Selling Items */}
          <View className="flex flex-row flex-wrap justify-between gap-1">
            {
              popular?.data?.slice(0, 4).map((item:any)=>(
                     <TouchableOpacity key={item?.id} onPress={()=>router.push({pathname: "/(tabs)/(home)/details", params:{item: JSON.stringify(item)}})} className="mt-5 w-[49%] border border-primary-100 rounded-lg">
              <View className="w-full h-40 rounded-lg border-4 border-white shadow-2xl overflow-hidden">
                <Image
                  source={{uri: item?.media?.find((media: any) => media.mimeType === 'image/jpeg')?.url || item?.media[0]?.url}}
                  className="w-full h-full"
                  onLoad={() => item?.id}
                  onError={(error) => console.log('Popular Image load error:', error.nativeEvent.error)}
                  loadingIndicatorSource={require("../../../assets/images/sneaker.png")}
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
              ))
            }
  
          </View>
         
        </View>

        {/* New Listing */}
        <View>
            <View className="mt-8 flex-row justify-between items-center">
            <Text className="text-xl font-NunitoMedium text-textColor-100">
              New Listing
            </Text>
            <TouchableOpacity onPress={()=>router.push({pathname: "/(tabs)/(home)/listings", params: {route: "Listings"}})} className="flex-row items-center gap-1">
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
            {
              NewListing?.data?.slice(0, 4).map((item:any)=>(
                     <TouchableOpacity key={item?.id} onPress={()=>router.push({pathname: "/(tabs)/(home)/details", params:{item: JSON.stringify(item)}})} className="mt-5 w-[49%] border border-primary-100 rounded-lg">
              {(() => {
                const jpegImage = item?.media?.find((media: any) => media.mimeType === 'image/jpeg');
                const imageUrl = jpegImage?.url || item?.media[0]?.url;
                return (
                  <View className="w-full h-40 rounded-lg border-4 border-white shadow-2xl overflow-hidden">
                    <Image
                      source={{uri: imageUrl}}
                      className="w-full h-full"
                      onLoad={() =>item?.id}
                      onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
                      loadingIndicatorSource={require("../../../assets/images/sneaker.png")}
                    />
                  </View>
                );
              })()}
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

              ))
            }
       
  
          </View>
          </View>
      </ScrollView>

      {/* rest of home screen content */}
    </SafeAreaView>
  );
};

export default index;
