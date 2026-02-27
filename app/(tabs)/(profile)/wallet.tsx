import React, { useEffect, useState } from 'react';
import { SafeAreaView, FlatList, View, TouchableOpacity, Text, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import WalletBalance from '../../../components/WalletBalance';
import FundWallet from '../../../components/FundWallet';
import StripeFundWallet from '../../../components/StripeFundWallet';
import { useWalletTransactions, useWalletBalance } from '../../../hooks/useHooks';
import { useDispatch, useSelector } from 'react-redux';
import { setTransactions, selectWalletTransactions } from '../../../global/walletSlice';
import { selectUser } from '../../../global/authSlice';

const WalletScreen: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as any;
  const token = user?.data?.token;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { transactions: fetchedTxs, isLoading, mutate: mutateTransactions } = useWalletTransactions(token, { limit: 50, skip: 0 });
  const { mutate: mutateBalance } = useWalletBalance(token);
  const transactions = useSelector(selectWalletTransactions) as any[];

  useEffect(() => {
    if (Array.isArray(fetchedTxs) && fetchedTxs.length > 0) {
      dispatch(setTransactions(fetchedTxs));
    }
  }, [fetchedTxs, dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh both balance and transactions
      await Promise.all([
        mutateBalance?.(),
        mutateTransactions?.()
      ]);
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  // console.log(user?.data?.token)

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mt-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="bg-[#ECF0F4] rounded-full p-2 mr-3">
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-2xl font-NunitoBold">Wallet</Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item: any) => item.id || item.reference || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#0056FF']}
            tintColor="#0056FF"
          />
        }
        ListHeaderComponent={() => (
          <View>
            {/* Balance Card */}
            <View className="bg-primary-100 rounded-2xl p-5 mb-5">
              <View style={{ marginTop: 12 }}>
                <WalletBalance token={token} />
              </View>
            </View>

            {/* Actions Card */}
            <View className="bg-[#F7F9FC] rounded-2xl p-5 mb-5">
              <Text className="text-lg font-RalewaySemiBold mb-3">Add Funds</Text>
              <Text className="text-gray-500 font-NunitoRegular text-sm mb-3">Top up your wallet using Stripe or Paystack.</Text>
              <FundWallet />
              <View style={{ height: 12 }} />
              <StripeFundWallet />
            </View>

            <View className="bg-white rounded-2xl p-3 mb-5 border border-gray-100">
              <Text className="text-lg font-RalewaySemiBold mb-3">Recent activity</Text>
            </View>
          </View>
        )}
        renderItem={({ item }: any) => {
          const isCredit = (item.type || '').toUpperCase() === 'CREDIT';
          return (
            <View style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isCredit ? '#ECFDF5' : '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text className={isCredit ? 'text-green-600 font-RalewaySemiBold' : 'text-red-600 font-RalewaySemiBold'}>{isCredit ? '+' : '-'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-base font-RalewaySemiBold text-gray-900">{item.description || item.type || 'Transaction'}</Text>
                <Text className="text-sm text-gray-500 mt-1">{item.reference || item.id}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text className={isCredit ? 'font-RalewaySemiBold text-green-600' : 'font-RalewaySemiBold text-red-600'}>{isCredit ? '+' : '-'}{Number(item.amount).toLocaleString()}</Text>
                <Text className="text-xs text-gray-400 mt-1">{new Date(item.createdAt || item.created_at || Date.now()).toLocaleDateString()}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          isLoading ? <ActivityIndicator /> : <Text className="text-gray-500 font-RalewayRegular">No transactions yet.</Text>
        )}
        contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 0, paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
};

export default WalletScreen;
