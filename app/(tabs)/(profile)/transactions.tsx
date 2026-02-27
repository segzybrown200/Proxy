import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../global/authSlice';
import { useTransactionHistory } from '../../../hooks/useHooks';

const TransactionHistoryScreen: React.FC = () => {
  const user: any = useSelector(selectUser);
  const token = user?.data?.token || null;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { transactions, isLoading, mutate } = useTransactionHistory(token, {
    limit: 50,
    skip: 0,
  });

  const [filterType, setFilterType] = useState<'ALL' | 'ORDER' | 'WALLET'>('ALL');
  const visibleTxs =
    filterType === 'ALL'
      ? transactions
      : transactions.filter((t: any) => t.type === filterType);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate?.();
    } catch (e) {
      console.error('refresh history error', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalAmount = visibleTxs.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

  const renderItem = ({ item }: any) => {
    const isCredit = (item.direction || '').toUpperCase() === 'CREDIT';
    const amountColor = isCredit ? '#10B981' : '#EF4444';

    let description = item.description || '';
    if (item.type === 'ORDER') {
      description = `Order #${(item.id || '').toString().slice(0, 8)}`;
    }

    const content = (
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: '#F3F4F6',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isCredit ? '#ECFDF5' : '#FEF2F2',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text
            className={
              isCredit
                ? 'text-green-600 font-RalewaySemiBold'
                : 'text-red-600 font-RalewaySemiBold'
            }
          >
            {isCredit ? '+' : '-'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-base font-RalewaySemiBold text-gray-900">
            {description}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">{item.reference || item.id}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text className={`${isCredit ? 'text-green-600' : 'text-red-600'} font-RalewaySemiBold`}>
            {isCredit ? '+' : '-'}{Number(item.amount).toLocaleString()}
          </Text>
          <Text className="text-xs text-gray-400 mt-1">
            {new Date(item.createdAt || item.created_at || Date.now()).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );

    if (item.type === 'ORDER') {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/(profile)/track-order',
              params: { order: JSON.stringify(item) },
            });
          }}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return content;
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      {/* header */}
      <View className="flex-row items-center justify-between mt-10">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#ECF0F4] rounded-full p-2 mr-3"
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-2xl font-NunitoBold">Transactions</Text>
        </View>
      </View>

      {/* filter tabs */}
      <View className="flex-row justify-center mt-4 mb-2">
        {['ALL','ORDER','WALLET'].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilterType(type as any)}
            className={`px-4 py-2 mx-1 rounded-full ${
              filterType === type ? 'bg-primary-100' : 'bg-gray-200'
            }`}
          >
            <Text className={`${filterType === type ? 'text-white' : 'text-gray-700'} font-NunitoSemiBold text-sm`}> 
              {type === 'ALL' ? 'All' : type === 'ORDER' ? 'Orders' : 'Wallet'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* total summary */}
      <View className="items-center mb-3">
        <Text className="font-NunitoSemiBold text-primary-100">
          Total: ₦{totalAmount.toLocaleString()}
        </Text>
        <Text className="text-gray-500 text-xs">{visibleTxs.length} items</Text>
      </View>

      <FlatList
        data={visibleTxs}
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
            <View className="bg-white rounded-2xl p-3 mb-5 border border-gray-100">
              <Text className="text-lg font-RalewaySemiBold mb-3">All payments</Text>
              <Text className="text-gray-500 font-NunitoRegular text-sm">
                This list includes orders and wallet top‑ups.
              </Text>
            </View>
          </View>
        )}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          isLoading ? <ActivityIndicator /> : <Text className="text-gray-500 font-RalewayRegular">No transactions yet.</Text>
        )}
        contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 0, paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;
