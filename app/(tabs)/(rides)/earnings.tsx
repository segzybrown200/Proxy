import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { useSelector } from "react-redux";
import { selectUser } from "../../../global/authSlice";
import { useRiderWallet, useRiderWalletHistory, useRiderHeldEscrow } from "../../../hooks/useHooks";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const Earnings = () => {
  const [selectedPeriod] = useState<"today" | "week" | "month">("today");
  const user: any = useSelector(selectUser);
  const token = user?.data?.token || null;

  const { balance, totalEarned, isLoading: loadingBalance } = useRiderWallet(token);
  const { transactions, isLoading: loadingTx } = useRiderWalletHistory(token, { limit: 50, skip: 0 });
  const { transactions: heldEscrow, isLoading: loadingHeld } = useRiderHeldEscrow(token, { limit: 50, skip: 0 });

  // Calculate days until release for each held item
  const getReleasesInfo = (releaseAt: string) => {
    const now = new Date();
    const release = new Date(releaseAt);
    const daysLeft = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (daysLeft > 0) {
      return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
    } else if (hoursLeft > 0) {
      return `${hoursLeft}h left`;
    } else {
      return 'Releasing soon';
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Back header */}
      <View className="flex-row items-center border border-b border-gray-300 px-5 pt-16 pb-4">
        <TouchableOpacity
          className="bg-[#F1F4F9] p-3 rounded-full"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#0D1321" />
        </TouchableOpacity>
        <Text className="text-2xl font-RalewayBold ml-4">Earnings</Text>
      </View>

      {/* Header */}
      <View className="bg-white p-6 mt-4">
        <Text className="text-2xl font-RalewayBold mb-2">Earnings</Text>
        <Text className="text-gray-500 font-NunitoRegular">Overview of your rider earnings and transactions</Text>
        {/* Note about payment schedule */}
        <Text className="text-sm text-yellow-700 mt-2 font-NunitoRegular">
          Earnings are paid into your account every three days. Please check your balance accordingly.
        </Text>
      </View>

      {/* Summary */}
      <View className="bg-primary-100 mx-4 mt-4 p-6 rounded-xl">
        <Text className="text-white opacity-80 font-RalewayRegular">Current Balance</Text>
        <Text className="text-white text-3xl font-RalewayBold mt-1">₦{loadingBalance ? '...' : Number(balance).toLocaleString()}</Text>
        <Text className="text-white opacity-80 mt-2 font-NunitoRegular">Total Earned: ₦{loadingBalance ? '...' : Number(totalEarned).toLocaleString()}</Text>
      </View>

      {/* Held escrow transactions */}
      <View className="px-4 mt-6 mb-6">
        <View className="flex-row items-center mb-3">
          <MaterialCommunityIcons name="lock-clock" size={20} color="#d97706" />
          <Text className="text-lg font-RalewaySemiBold ml-2">Held Escrow</Text>
        </View>
        <Text className="text-sm text-gray-600 mb-3 leading-5">
          Earnings held in escrow release to your account every three days. Track pending payouts below.
        </Text>
        {loadingHeld ? (
          <ActivityIndicator />
        ) : heldEscrow.length === 0 ? (
          <Text className="text-gray-500 font-RalewayRegular">No held funds at the moment.</Text>
        ) : (
          <FlatList
            data={heldEscrow}
            keyExtractor={(i:any) => i.transactionId || i.id}
            scrollEnabled={false}
            nestedScrollEnabled={false}
            renderItem={({item}: any) => {
              const riderEarnings = item.pricing?.riderEarnings || 0;
              const shippingFee = item.pricing?.shippingFee || 0;
              const total = item.pricing?.total || 0;
              const releaseInfo = getReleasesInfo(item.releaseAt);
              
              return (
                <TouchableOpacity
                  onPress={() => router.push(`/(rides)/earnings?tx=${item.transactionId}`)}
                  className="bg-white p-4 rounded-xl mb-3 border-l-4 border-yellow-500"
                >
                  {/* Top row - Release info */}
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center flex-1">
                      <MaterialCommunityIcons name="clock-outline" size={16} color="#d97706" />
                      <Text className="text-sm font-NunitoSemiBold text-yellow-600 ml-2">{releaseInfo}</Text>
                    </View>
                    <Text className="text-xs font-NunitoRegular text-gray-500">{item.delivery?.status}</Text>
                  </View>

                  {/* Middle row - Order total and rider earnings */}
                  <View className="mb-3 pb-3 border-b border-gray-200">
                    <Text className="text-sm font-NunitoRegular text-gray-600 mb-1">Order Total: ₦{Number(total).toLocaleString()}</Text>
                    <Text className="text-lg font-RalewaySemiBold text-yellow-700">Your Share: ₦{Number(riderEarnings + shippingFee).toLocaleString()}</Text>
                  </View>

                  {/* Bottom row - Delivery location summary */}
                  <View className="flex-row items-start">
                    <View className="flex-1">
                      <Text className="text-xs font-NunitoRegular text-gray-500 mb-1">Completed {new Date(item.createdAt).toLocaleDateString()}</Text>
                      <Text className="text-xs font-NunitoRegular text-gray-600 line-clamp-1">{item.delivery?.dropoffAddress}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Transactions */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-RalewaySemiBold mb-3">Recent Transactions</Text>
        {loadingTx ? (
          <ActivityIndicator />
        ) : transactions.length === 0 ? (
          <Text className="text-gray-500 font-RalewayRegular">No transactions yet.</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(i:any) => i.id}
            scrollEnabled={false}
            nestedScrollEnabled={false}
            renderItem={({item}: any) => (
              <TouchableOpacity
                onPress={() => router.push(`/(rides)/earnings?tx=${item.id}`)}
                className="bg-white p-4 rounded-xl mb-3 shadow-sm"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-gray-800 font-NunitoRegular">{item.description || item.type}</Text>
                    <Text className="text-gray-500 text-sm mt-1">{new Date(item.createdAt || item.created_at).toLocaleString()}</Text>
                  </View>
                  <Text className={`font-RalewaySemiBold ${item.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>₦{Number(item.amount).toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default Earnings;