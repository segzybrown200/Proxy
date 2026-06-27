import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";

const ChooseRole = () => {
  return (
    <SafeAreaView className="flex-1 bg-[#0B1120]">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-5 mt-9 pt-8 pb-10"
      >
        <View className="relative mb-8">
          <View className="absolute -right-8 top-0 w-32 h-32 rounded-full bg-purple-500/20" />
          <View className="absolute left-0 top-20 w-20 h-20 rounded-full bg-white/10" />
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-6"
          >
            <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
          </TouchableOpacity>

          <Text className="text-4xl font-RalewayBold text-white mb-4">
            Join Proxy
          </Text>
          <Text className="text-base font-NunitoRegular text-slate-300 leading-7">
            Choose your path to the best local marketplace experience. Shop as a
            customer or become a vendor and grow your business.
          </Text>
        </View>

        <View className="space-y-5">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(auth)/account-summary",
                params: { role: "user" },
              })
            }
            className="rounded-[30px] border border-white/10 bg-slate-900/90 p-6 shadow-xl"
          >
            <View className="flex-row items-start">
              <View>
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="rounded-3xl bg-primary-100/15 p-3">
                    <Ionicons name="person-outline" size={24} color="#7C3AED" />
                  </View>
                  <Text className="text-2xl font-RalewayBold text-white mb-2">
                    Register as User
                  </Text>
                </View>
                <Text className="text-sm font-NunitoRegular text-slate-300 leading-6">
                  Shop from verified sellers, get fast delivery, and enjoy
                  exclusive deals.
                </Text>
              </View>
            </View>
            <View className="mt-5 flex-row items-center justify-between">
              <Text className="text-sm font-NunitoBold text-primary-100">
                Continue as User
              </Text>
              <Ionicons name="chevron-forward" size={22} color="#7C3AED" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(auth)/account-summary",
                params: { role: "vendor" },
              })
            }
            className="rounded-[30px] border mt-4 border-purple-500/30 bg-gradient-to-r from-[#6D28D9] to-[#9333EA] p-6 shadow-xl"
          >
            <View className="flex-row justify-between items-start">
              <View>
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="rounded-3xl bg-white/10 p-3">
                    <Ionicons
                      name="storefront-outline"
                      size={24}
                      color="white"
                    />
                  </View>
                  <Text className="text-2xl font-RalewayBold text-white mb-2">
                    Register as Vendor
                  </Text>
                </View>
                <Text className="text-sm font-NunitoRegular text-purple-100 leading-6">
                  Start selling locally, manage orders, and grow your business
                  with Proxy.
                </Text>
              </View>
            </View>
            <View className="mt-5 flex-row items-center justify-between">
              <Text className="text-sm font-NunitoBold text-white">
                View Vendor Benefits
              </Text>
              <Ionicons name="chevron-forward" size={22} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <View className="mt-8 rounded-[32px] bg-white/5 border border-white/10 p-5 shadow-lg">
          <Text className="text-sm uppercase tracking-[0.2em] font-NunitoBold text-slate-300 mb-3">
            Quick note
          </Text>
          <Text className="text-sm font-NunitoRegular text-slate-300 leading-6">
            If you already have an account, you can sign in from the login
            screen. Otherwise choose the path that fits your goals best.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChooseRole;
