import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { initStripe, CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../global/authSlice';
import { createStripePaymentIntent, fundWalletStripe, getWalletBalance } from '../api/api';
import { setWallet } from '../global/walletSlice';

const StripeFundWallet: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [cardDetails, setCardDetails] = useState<any>(null);
  const { confirmPayment } = useConfirmPayment();
  const user = useSelector(selectUser) as any;
  const token = (user && user.data && user.data.token) || null;
  const dispatch = useDispatch();

  useEffect(() => {
    if (!(global as any).__stripeInit) {
      initStripe({
        publishableKey: 'pk_test_51SWC8PKosm6nlnYmvcbkgsMCp3X1oSNc2WZ60oYTKH99plGcg8Jy9VsGHnoSVTLXHOaFnZkTNS7tjn8ZuMnhJx0s005ryiV8lp',
      });
      (global as any).__stripeInit = true;
    }
  }, []);

  const handleFund = async () => {
    try {
      const amt = Number(amount);
      if (!amt || amt <= 0) return Alert.alert('Enter a valid amount');
      if (!cardDetails || !cardDetails.complete) return Alert.alert('Enter complete card details');

      // convert NGN to USD (same fallback as payment screen)
      const convertNgnToUsd = (amountNgn: number, rate?: number) => {
        const fallbackRate = rate ?? 0.002;
        return amountNgn * fallbackRate;
      };

      const usdAmount = convertNgnToUsd(amt);
      const amountInSmallestUnit = Math.round(usdAmount * 100);

      const resp = await createStripePaymentIntent({ amount: amountInSmallestUnit, currency: 'usd', receipt_email: user?.data?.user?.email }, token);
      const clientSecret = resp?.data?.clientSecret || resp?.data?.client_secret;
      if (!clientSecret) throw new Error('Missing client secret from server.');

      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: user?.data?.user?.name || '',
            email: user?.data?.user?.email || undefined,
            phone: user?.data?.user?.phone || undefined,
          },
        },
      });

      if (error) {
        console.warn('Stripe confirmPayment error', error);
        return Alert.alert('Payment failed', error.message || '');
      }

      const paymentIntentId = (paymentIntent as any)?.id || (paymentIntent as any)?.paymentIntentId || '';
      if (!paymentIntentId) throw new Error('Missing payment intent id');

      // Notify backend to credit wallet
      const fundRes = await fundWalletStripe({ amount: amt, paymentIntentId }, token);
      const fundData = fundRes.data || fundRes;

      // Refresh wallet balance
      try {
        const balRes = await getWalletBalance(token);
        const w = (balRes.data || balRes).data || (balRes.data || balRes);
        // console.log(balRes?.data?.data)
        if (w) dispatch(setWallet({ id: w.walletId, balance: w.balance, currency: w.currency, updatedAt: w.updatedAt }));
      } catch (e) {}

      Alert.alert('Success', fundData.message || 'Wallet funded successfully');
    } catch (err: any) {
      console.error('StripeFund error', err);
      Alert.alert('Error', err?.message || 'Failed to fund wallet');
    }
  };

  return (
    <View style={{ marginVertical: 12 }}>
      <Text className="text-lg font-RalewaySemiBold mb-2">Pay with Card (Stripe)</Text>
      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        className="border border-gray-200 font-RalewayMedium rounded-lg p-3 mb-3"
      />
      <View className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
        <CardField
          postalCodeEnabled={false}
        //   placeholder={{ number: '4242 4242 4242 4242' }}
          cardStyle={{ backgroundColor: '#FFFFFF', textColor: '#000000' }}
          style={{ height: 50 }}
          onCardChange={(card) => setCardDetails(card)}
        />
      </View>
      <TouchableOpacity onPress={handleFund} className="bg-primary-100 rounded-lg p-3 items-center">
        <Text className="text-white font-NunitoBold">Pay {amount ? `₦${amount}` : ''}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StripeFundWallet;
