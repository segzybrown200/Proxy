import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCartItems, selectCartTotal, increaseQuantity, decreaseQuantity, removeFromCart } from "global/listingSlice";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CustomButton from "components/CustomButton";
import { selectIsVisitor } from "global/authSlice";

const CartScreen = () => {
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const select = useSelector(selectIsVisitor);

  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="items-center">
          <View className="bg-[#F6F6F6] p-6 rounded-full mb-5">
            <Ionicons name="bag-outline" size={60} color="#0056FF" />
          </View>
          <Text className="text-3xl font-RalewayBold">Your Cart is Empty</Text>
          <Text className="text-center text-xl text-gray-500 mt-2 w-70 font-NunitoLight">
            Looks like you haven’t added any items yet. Start shopping and
            discover products you’ll love
          </Text>
         <View className="w-full px-5 flex flex-row mt-6">
          <CustomButton title="Start Shopping" handlePress1={()=>router.push("/(tabs)/(home)")}/>
         </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center mt-12 p-5 mb-4">
        <View className="flex-row items-center">
          <TouchableOpacity className="bg-primary-100 rounded-full p-2" onPress={() => router.back()}>
            <Ionicons name="grid-outline" size={20} color="white" />
          </TouchableOpacity>
          </View>
        <Text className="text-3xl font-RalewayBold ml-2">Cart</Text>
        <View className="bg-[#0056FF] ml-2 px-2 rounded-full">
          <Text className="text-white font-NunitoBold text-sm">
            {cartItems.length}
          </Text>
        </View>
      </View>

      {/* Cart List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {cartItems.map((item:any) => (
          <View
            key={item.id}
            className="flex-row items-center bg-[#F6F6F6] rounded-2xl p-3 mb-4"
          >
            <Image
              source={{uri: item.media?.[0]?.url}}
              className="w-20 h-20 rounded-xl"
              resizeMode="cover"
            />

            <View className="flex-1 ml-4">
              <Text className="font-NunitoBold text-base">{item.title}</Text>
              <Text className="font-NunitoRegular text-gray-500">
                {/* Add variant or other info if needed */}
              </Text>
              <Text className="font-NunitoBold text-lg mt-1">
                ₦{item.price.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => dispatch(removeFromCart(item.id))}
              className="absolute top-2 left-2 bg-white p-1.5 rounded-full shadow-sm"
            >
              <Ionicons name="trash-outline" size={18} color="red" />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => dispatch(decreaseQuantity(item.id))}
                className="bg-[#EEF1FF] p-1 rounded-full"
              >
                <Ionicons name="remove-outline" size={22} color="#0056FF" />
              </TouchableOpacity>
              <Text className="mx-2 text-base font-NunitoBold">
                {item.quantity}
              </Text>
              <TouchableOpacity
                onPress={() => dispatch(increaseQuantity(item.id))}
                className="bg-[#EEF1FF] p-1 rounded-full"
              >
                <Ionicons name="add-outline" size={22} color="#0056FF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Total + Checkout */}
      <View className="absolute bottom-0 left-0 right-0 bg-white p-5 border-t border-gray-100 shadow-lg">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-600 font-NunitoRegular text-lg">
            Total
          </Text>
          <Text className="text-2xl font-NunitoBold text-[#0056FF]">
            ₦{total.toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => (
            select ? Alert.alert("Login as a User", "Please log in to proceed with the payment") : router.push("/(tabs)/(home)/payment")
          )}
          className="bg-[#0056FF] py-4 rounded-2xl items-center"

        >
          <Text className="text-white font-NunitoBold text-lg">
            Proceed to Checkout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;
