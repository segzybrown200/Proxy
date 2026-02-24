import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { setWallet } from '../global/walletSlice';
import { useWalletBalance } from '../hooks/useHooks';

interface Props {
  token?: string;
}

const WalletBalance: React.FC<Props> = ({ token }) => {
  const dispatch = useDispatch();
  const { balance, currency, updatedAt, walletId, isLoading } = useWalletBalance(token);



  useEffect(() => {
    if (walletId !== undefined) {
      dispatch(setWallet({ id: walletId, balance, currency, updatedAt }));
    }
  }, [walletId, balance, currency, updatedAt, dispatch]);

  if (isLoading) return <ActivityIndicator color="#004CFF" />;

  return (
    <View style={{ padding: 12 }}>
      <Text className="text-white font-RalewayRegular">Available balance</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
        <Text className="text-xl text-white mr-2 font-RalewayMedium">{currency || '₦'}</Text>
        <Text className="text-4xl text-[#caf0f8] font-NunitoBold">{Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>
      {updatedAt ? <Text className="text-sm font-RalewayRegular  text-white mt-2">Updated {new Date(updatedAt).toLocaleString()}</Text> : null}
    </View>
  );
}

export default WalletBalance;
