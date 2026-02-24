import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../global/authSlice';
import { setTransactions, selectWalletTransactions } from '../global/walletSlice';
import { useWalletTransactions } from '../hooks/useHooks';

const WalletTransactions: React.FC = () => {
  const user = useSelector(selectUser) as any;
  const token = (user && user.data && user.data.token) || null;
  const dispatch = useDispatch();
  const transactions = useSelector(selectWalletTransactions) as any[];

  // console.log(token)

  const { transactions: fetchedTxs, isLoading } = useWalletTransactions(token, { limit: 50, skip: 0 });
  console.log(transactions)

  useEffect(() => {
    if (Array.isArray(fetchedTxs) && fetchedTxs.length > 0) {
      dispatch(setTransactions(fetchedTxs));
    }
  }, [fetchedTxs, dispatch]);

  if (isLoading) return <ActivityIndicator />;

  const renderTx = (item: any) => {
    const isCredit = (item.type || '').toUpperCase() === 'CREDIT';
    const amountColor = isCredit ? '#10B981' : '#EF4444';
    return (
      <View style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isCredit ? '#ECFDF5' : '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ color: isCredit ? '#059669' : '#DC2626', fontWeight: '700' }}>{isCredit ? '+' : '-'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{item.description || item.type || 'Transaction'}</Text>
          <Text style={{ color: '#6B7280', marginTop: 4 }}>{item.reference || item.id}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: amountColor, fontWeight: '700', fontSize: 15 }}>{isCredit ? '+' : '-'}{Number(item.amount).toLocaleString()}</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 6 }}>{new Date(item.createdAt || item.created_at || Date.now()).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ marginTop: 8 }}>
      <Text className="text-lg font-RalewaySemiBold mb-3">Recent activity</Text>
      {transactions.length === 0 ? (
        <Text className="text-gray-500">No transactions yet.</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item: any) => item.id || item.reference || Math.random().toString()}
          renderItem={({ item }: any) => renderTx(item)}
        />
      )}
    </View>
  );
};

export default WalletTransactions;
