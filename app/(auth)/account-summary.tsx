import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const AccountSummary = () => {
  const { role } = useLocalSearchParams();
  const isVendor = role === "vendor";

  const title = isVendor ? "Welcome, Future Seller" : "Ready to Shop";
  const subtitle = isVendor
    ? "A powerful vendor experience is waiting. Discover what you can do on Proxy before you launch your store."
    : "A smarter local marketplace is ready for you. Discover the benefits before you create your user account.";

  const highlights = isVendor
    ? [
        { icon: "storefront-outline", label: "Sell products to nearby customers" },
        { icon: "clipboard-list-outline", label: "Manage orders and inventory easily" },
        { icon: "chart-line", label: "Track sales and grow smarter" },
        { icon: "cash-multiple", label: "Secure payouts and support" },
      ]
    : [
        { icon: "shopping-outline", label: "Discover local sellers and deals" },
        { icon: "truck-fast-outline", label: "Fast delivery and pickup options" },
        { icon: "shield-check-outline", label: "Secure checkout and order tracking" },
        { icon: "heart-outline", label: "Save favorites and repeat orders" },
      ];

  const primaryButtonText = isVendor ? "Start Selling" : "Register as User";
  const primaryAction = () => {
    if (isVendor) {
      router.push("/(tabs)/(home)/seller-onboarding");
    } else {
      router.push("/(auth)/register");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B1120]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-3 pt-8 pb-10">
        <View className="relative rounded-[40px] bg-gradient-to-br from-[#4338CA] via-[#7C3AED] to-[#C084FC] p-7 shadow-2xl shadow-purple-900/30 mb-8">
          <View className="absolute -right-8 top-10 w-32 h-32 rounded-full bg-white/10" />
          <View className="absolute left-0 top-20 w-20 h-20 rounded-full bg-white/10" />
          <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-5">
            <Ionicons name="chevron-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-4xl font-RalewayBold text-white mb-4">{title}</Text>
          <Text className="text-base font-NunitoRegular text-white/85 leading-7">{subtitle}</Text>
          <View className="mt-6 rounded-3xl bg-white/10 p-4">
            <Text className="uppercase text-xs tracking-[0.32em] text-white/70 font-NunitoBold mb-2">You’ll get</Text>
            <Text className="text-sm text-white/80 leading-6">
              {isVendor
                ? "A simple vendor introduction, benefits overview, and a clear path to launch your store."
                : "A fast and secure user registration flow so you can start shopping right away."}
            </Text>
          </View>
        </View>

        <View className="grid gap-4">
          {highlights.map((item, index) => (
            <View key={index} className="rounded-[30px] bg-slate-950/90 border border-white/10 p-5 shadow-xl">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-3xl bg-purple-600/15 items-center justify-center">
                  <MaterialCommunityIcons name={item.icon} size={24} color="#A78BFA" />
                </View>
                <Text className="flex-1 text-base font-NunitoRegular text-slate-100">{item.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-8 space-y-4 gap-3">
          <TouchableOpacity
            onPress={primaryAction}
            className={`rounded-[30px] py-4 items-center ${isVendor ? "bg-white" : "bg-primary-100"}`}
          >
            <Text className={`text-lg font-NunitoBold ${isVendor ? "text-[#5B21B6]" : "text-white"}`}>{primaryButtonText}</Text>
          </TouchableOpacity>

          {!isVendor && (
            <TouchableOpacity onPress={() => router.push("/(auth)/login")} className="rounded-[30px] border border-white/10 py-4 items-center">
              <Text className="text-base font-NunitoBold text-white">Already have an account? Login</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mt-8 rounded-[30px] mb-60 border border-white/10 bg-white/5 p-5 shadow-lg">
          <Text className="text-sm uppercase tracking-[0.2em] font-NunitoBold text-slate-300 mb-3">Next step</Text>
          <Text className="text-sm font-NunitoRegular text-slate-300 leading-6">
            {isVendor
              ? "You’ll review the seller benefits and then enter the seller onboarding flow to learn how to set up your shop."
              : "You’ll continue to the standard account registration page where you can sign up and verify your profile."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountSummary;
