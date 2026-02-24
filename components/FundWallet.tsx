import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { fundWalletPaystack, getWalletBalance } from '../api/api';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../global/authSlice';
import { Paystack } from 'react-native-paystack-webview';
import { setWallet } from '../global/walletSlice';

const quickAmounts = [500, 1000, 2000, 5000];

const FundWallet: React.FC = () => {
  const user = useSelector(selectUser) as any;
  const token = (user && user.data && user.data.token) || null;
  const dispatch = useDispatch();
  const [showPaystack, setShowPaystack] = useState(false);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  const onQuick = (val: number) => setAmount(String(val));

  const handlePaystack = async () => {
    try {
      const amt = Number(amount);
      if (!amt) return Alert.alert('Provide amount');
      // If reference is provided use manual verification flow
      if (reference) {
        const res = await fundWalletPaystack({ amount: amt, reference }, token);
        Alert.alert('Success', res.data?.message || 'Wallet funded');
        return;
      }

      // Otherwise open Paystack webflow
      setShowPaystack(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to fund');
    }
  };

  const handlePaystackSuccess = async (res: any) => {
    try {
      setShowPaystack(false);
      const response = res?.transactionRef?.message;
      const ref = res?.transactionRef?.trxref;
      const amt = Number(amount);
      if (response === 'Approved' && ref) {
        const apiRes = await fundWalletPaystack({ amount: amt, reference: ref }, token);
        Alert.alert('Success', apiRes.data?.message || 'Wallet funded');
        // refresh wallet balance
        try {
          const balRes = await getWalletBalance(token);
          const w = (balRes.data || balRes).data || (balRes.data || balRes);
          console.log(balRes.data?.data)
          if (w) dispatch(setWallet({ id: w.walletId, balance: w.balance, currency: w.currency, updatedAt: w.updatedAt }));
        } catch (e) {}
      } else {
        Alert.alert('Payment not approved');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to process payment');
    }
  };

  const handlePaystackCancel = () => {
    setShowPaystack(false);
    Alert.alert('Payment Cancelled', 'You cancelled the transaction.');
  };

  return (
    <View>
      <Text className="text-lg font-RalewaySemiBold mb-2">Manual Top-up (Paystack)</Text>
      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        className="border border-gray-200 font-RalewayRegular rounded-lg p-3 mb-3"
      />

      <View className="flex-row gap-2 mb-3">
        {quickAmounts.map((q) => (
          <TouchableOpacity key={q} onPress={() => onQuick(q)} className="bg-[#F3F4F6] px-3 py-2 rounded-lg">
            <Text className="font-NunitoRegular">{q}</Text>
          </TouchableOpacity>
        ))}
      </View>


      <TouchableOpacity onPress={handlePaystack} className="bg-primary-100 rounded-lg p-3 items-center mb-2">
        <Text className="text-white font-NunitoBold">Pay with Paystack</Text>
      </TouchableOpacity>

      {showPaystack && (
        <Paystack
          paystackKey="pk_test_fc0397fd630ab49899a47805ed9e4204d6ed0fca"
          amount={Number(amount)}
          billingEmail={user?.data?.user?.email || ''}
          activityIndicatorColor="blue"
          onCancel={handlePaystackCancel}
          onSuccess={handlePaystackSuccess}
          autoStart={true}
          channels={[ 'bank', 'card', 'bank_transfer', 'ussd', 'apple_pay',  ]}
        />
      )}

      <Text className="text-sm text-gray-400 mt-2">Or use Stripe below to pay with card.</Text>
    </View>
  );
};

export default FundWallet;
