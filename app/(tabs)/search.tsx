import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  RefreshControl,
} from "react-native";
import React, { useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Dashboard from "../../assets/icons/Dashboard.svg";
import { SearchComponent } from "../../components/SearchInput";
import Filter from "../../assets/icons/filter.svg";
import { router } from "expo-router";
import { useCategory } from "hooks/useHooks";


const condition = ["new", "used"];
interface Props {
  placeholder: string;
  otherStyles: string;
  white: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
}

const search = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string[]>([]);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(200);
  const [maxDistance, setMaxDistance] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { categories, isError, isLoading, mutate } = useCategory();

  // Load recent searches on component mount
  React.useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const searches = await AsyncStorage.getItem('recentSearches');
        if (searches) {
          setRecentSearches(JSON.parse(searches));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    };
    loadRecentSearches();
  }, []);
      // categories is an array of category objects: { id, name, ... }

  // selected will store category ids (string[])
  const toggleCategory = (categoryId: string) => {
    if (selected.includes(categoryId)) {
      // unselect
      setSelected(selected.filter((c) => c !== categoryId));
    } else {
      // select
      setSelected([...selected, categoryId]);
    }
  };
  const toggleCondition = (condition: string) => {
    if (selectedCondition.includes(condition)) {
      // unselect
      setSelectedCondition(selectedCondition.filter((c) => c !== condition));
    } else {
      // select
      setSelectedCondition([...selectedCondition, condition]);
    }
  };
  const resetAll = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelected([]);
    setSelectedCondition([]);
    setLow(0);
    setHigh(200);
    setMaxDistance("");
    setIsVisible(false);
  };
    const applyFilters = async () => {
      // build params to send to /search
      const params: any = {};
      if (searchTerm && searchTerm.trim()) params.q = searchTerm.trim();
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      // backend expects a single categoryId - use first selected id if present
      if (selected && selected.length > 0) params.categoryId = selected[0];
      if (selectedCondition && selectedCondition.length > 0) params.condition = selectedCondition[0];
      if (maxDistance) params.radiusKm = maxDistance;

      // Try to get user location from AsyncStorage
      try {
        const raw = await AsyncStorage.getItem('addresses');
        const addresses = raw ? JSON.parse(raw) : [];
        if (addresses.length > 0) {
          const { latitude, longitude } = addresses[0];
          if (latitude && longitude) {
            params.lat = latitude;
            params.lng = longitude;
          }
        }
      } catch (e) {
        // ignore if not available
      }

      // navigate to results screen and pass filters as query params
      router.push({
        pathname: "./(home)/search-results",
        params: { filters: JSON.stringify(params) },
      });
      setIsVisible(false);
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
        <Text className="font-RalewayBold text-3xl">Search</Text>
      </View>

      <View className="mt-5 flex  flex-row items-center">
        <SearchComponent
          placeholder="Search......"
          otherStyles={"flex-1"}
          white="yes"
          value={searchTerm}
          onChangeText={(text) => {
            setSearchTerm(text);
            setShowRecentSearches(text.length > 0);
          }}
          onSubmitEditing={async () => {
            if (searchTerm.trim()) {
              // Add to recent searches
              const newSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
              setRecentSearches(newSearches);
              await AsyncStorage.setItem('recentSearches', JSON.stringify(newSearches));
              setShowRecentSearches(false);
              
              router.push({
                pathname: "./(home)/search-results",
                params: { filters: JSON.stringify({ q: searchTerm.trim() }) },
              });
            }
          }}
        />

        {/* Recent Searches Dropdown */}
        {showRecentSearches && recentSearches.length > 0 && (
          <View className="absolute top-full left-0 right-12 bg-white rounded-lg shadow-lg z-50 mt-1">
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                className="flex-row items-center px-4 py-3 border-b border-gray-100"
                onPress={() => {
                  setSearchTerm(search);
                  setShowRecentSearches(false);
                  router.push({
                    pathname: "./(home)/search-results",
                    params: { filters: JSON.stringify({ q: search }) },
                  });
                }}
              >
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text className="ml-3 font-NunitoRegular">{search}</Text>
                <TouchableOpacity
                  className="ml-auto"
                  onPress={async (e) => {
                    e.stopPropagation();
                    const newSearches = recentSearches.filter(s => s !== search);
                    setRecentSearches(newSearches);
                    await AsyncStorage.setItem('recentSearches', JSON.stringify(newSearches));
                  }}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <TouchableOpacity
          className="ml-3 rounded-md bg-primary-100 p-2"
          onPress={() => setIsVisible(true)}
        >
          <Filter width={30} height={30} />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.3)",
              justifyContent: "flex-end",
              alignItems: "flex-end",
            }}
          >
            <View className="max-h-min w-full bg-white p-4">
              <View className="flex flex-row items-center justify-between">
                <Text className="font-RalewaySemiBold text-lg text-primary-100">
                  Cancel
                </Text>
                <Text className="font-RalewaySemiBold text-lg text-textColor-50">
                  Filter
                </Text>
                <TouchableOpacity onPress={resetAll}>
                  <Text className="font-RalewaySemiBold text-lg text-primary-100">
                    Reset All
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Price Range */}
              <View className="mt-5">
                <Text className="mb-2 font-RalewaySemiBold text-xl">
                  Price Range
                </Text>
                <View className="flex flex-row items-center justify-between">
                  <TextInput
                    className="w-[48%] rounded-lg bg-[#F6F6F6] p-3 font-NunitoRegular"
                    placeholder="Min Price"
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                  <TextInput
                    className="w-[48%] rounded-lg bg-[#F6F6F6] p-3 font-NunitoRegular"
                    placeholder="Max Price"
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>
              </View>

              {/* Category */}
              <View className="mt-5">
                <Text className="mb-2 font-RalewaySemiBold text-xl">Category</Text>
                {/* Select Category - scrollable for long lists */}
                <View className="max-h-44">
                  <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {(categories?.categories || []).map((cat: any) => {
                      const isSelected = selected.includes(cat.id);
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => toggleCategory(cat.id)}
                          className={`${isSelected ? "bg-primary-100" : "bg-primary-400"} rounded-lg p-2 mr-3 mb-3`}
                        >
                          <Text className={`${isSelected ? "font-NunitoSemiBold text-white" : "font-NunitoSemiBold text-primary-100"}`}>
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* Condition */}
              <View className="mt-5">
                <Text className="mb-2 font-RalewaySemiBold text-xl">
                  Condition
                </Text>
                {/* Selet Category */}
                <View className="flex flex-row flex-wrap items-center gap-3">
                  {condition.map((con, index) => {
                    const isSelectedCondition = selectedCondition.includes(con);
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => toggleCondition(con)}
                        className={`flex flex-row items-center gap-2 rounded-lg  p-2 
                      ${isSelectedCondition ? " bg-primary-100" : "bg-primary-400"}
                      `}
                      >
                        <Text
                          className={`${isSelectedCondition ? "font-NunitoSemiBold text-white" : "font-NunitoSemiBold text-primary-100"}`}
                        >
                          {con}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Location Range */}
              <View className="mt-5">
                <Text className="mb-2 font-RalewaySemiBold text-xl">
                  Location Range (km)
                </Text>
                <View className="mb-4 flex flex-row items-center justify-between">
                  {/* Min distance - disabled */}
                  <TextInput
                    className="w-[48%] rounded-lg bg-[#F6F6F6] p-3 font-NunitoRegular text-gray-400"
                    placeholder="Min km"
                    value={"0"}
                    editable={false}
                  />
                  {/* Max distance - editable */}
                  <TextInput
                    className="w-[48%] rounded-lg bg-[#F6F6F6] p-3 font-NunitoRegular"
                    placeholder="Max km"
                    keyboardType="numeric"
                    value={maxDistance}
                    onChangeText={setMaxDistance}
                  />
                </View>
              </View>

              {/* Reset / Apply row */}
              <View className="mt-4 flex-row  items-center justify-center">
                <TouchableOpacity
                  onPress={applyFilters}
                  className="px-4 py-2 rounded-lg bg-primary-100"
                >
                  <Text className="text-white font-NunitoBold text-lg">Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
};

export default search;
