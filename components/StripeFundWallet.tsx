// import React, { useEffect, useState } from 'react';
// import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
// import { initStripe, CardField, useConfirmPayment } from '@stripe/stripe-react-native';
// import { useSelector, useDispatch } from 'react-redux';
// import { selectUser } from '../global/authSlice';
// import { createStripePaymentIntent, fundWalletStripe, getWalletBalance } from '../api/api';
// import { setWallet } from '../global/walletSlice';

// const StripeFundWallet: React.FC = () => {
//   const [amount, setAmount] = useState('');
//   const [cardDetails, setCardDetails] = useState<any>(null);
//   const { confirmPayment } = useConfirmPayment();
//   const user = useSelector(selectUser) as any;
//   const token = (user && user.data && user.data.token) || null;
//   const dispatch = useDispatch();

//   useEffect(() => {
//     if (!(global as any).__stripeInit) {
//       initStripe({
//         publishableKey: 'pk_test_51SWC8PKosm6nlnYmvcbkgsMCp3X1oSNc2WZ60oYTKH99plGcg8Jy9VsGHnoSVTLXHOaFnZkTNS7tjn8ZuMnhJx0s005ryiV8lp',
//       });
//       (global as any).__stripeInit = true;
//     }
//   }, []);
  

//   const handleFund = async () => {
//     try {
//       const amt = Number(amount);
//       if (!amt || amt <= 0) return Alert.alert('Enter a valid amount');
//       if (!cardDetails || !cardDetails.complete) return Alert.alert('Enter complete card details');

//       // convert NGN to USD (same fallback as payment screen)
//       const convertNgnToUsd = (amountNgn: number, rate?: number) => {
//         const fallbackRate = rate ?? 0.002;
//         return amountNgn * fallbackRate;
//       };

//       const usdAmount = convertNgnToUsd(amt);
//       const amountInSmallestUnit = Math.round(usdAmount * 100);

//       const resp = await createStripePaymentIntent({ amount: amountInSmallestUnit, currency: 'usd', receipt_email: user?.data?.user?.email }, token);
//       const clientSecret = resp?.data?.clientSecret || resp?.data?.client_secret;
//       if (!clientSecret) throw new Error('Missing client secret from server.');

//       console.log(resp.data)

//       const { error, paymentIntent } = await confirmPayment(clientSecret, {
//         paymentMethodType: 'Card',
//         paymentMethodData: {
//           billingDetails: {
//             name: user?.data?.user?.name || '',
//             email: user?.data?.user?.email || undefined,
//             phone: user?.data?.user?.phone || undefined,
//             address: {
//               country: 'NG',
//             },
//           },
//         },
//       });
//       console.log(paymentIntent)

//       if (error) {
//         console.warn('Stripe confirmPayment error', error);
//         return Alert.alert('Payment failed', error.message || '');
//       }

//       const paymentIntentId = (paymentIntent as any)?.id || (paymentIntent as any)?.paymentIntentId || '';
//       if (!paymentIntentId) throw new Error('Missing payment intent id');

//       // Notify backend to credit wallet
//       const fundRes = await fundWalletStripe({ amount: amt, paymentIntentId }, token);
//       const fundData = fundRes.data || fundRes;

//       // Refresh wallet balance
//       try {
//         const balRes = await getWalletBalance(token);
//         const w = (balRes.data || balRes).data || (balRes.data || balRes);
//         // console.log(balRes?.data?.data)
//         if (w) dispatch(setWallet({ id: w.walletId, balance: w.balance, currency: w.currency, updatedAt: w.updatedAt }));
//       } catch (e) {}

//       Alert.alert('Success', fundData.message || 'Wallet funded successfully');
//     } catch (err: any) {
//       console.error('StripeFund error', err);
//       Alert.alert('Error', err?.message || 'Failed to fund wallet');
//     }
//   };

//   return (
//     <View style={{ marginVertical: 12 }}>
//       <Text className="text-lg font-RalewaySemiBold mb-2">Pay with Card (Stripe)</Text>
//       <TextInput
//         placeholder="Amount"
//         keyboardType="numeric"
//         value={amount}
//         onChangeText={setAmount}
//         className="border border-gray-200 font-RalewayMedium rounded-lg p-3 mb-3"
//       />
//       <View className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
//         <CardField
//           postalCodeEnabled={false}
//           placeholders={{ 
//             number: '4242 4242 4242 4242',
//             expiration: 'MM/YY',
//             cvc: 'CVC'
//           }}
//           cardStyle={{ 
//             backgroundColor: '#FFFFFF', 
//             textColor: '#000000',
//             borderColor: '#E5E7EB',
//             borderWidth: 1,
//             borderRadius: 8,
//           }}
//           style={{ height: 60, marginVertical: 4 }}
//           onCardChange={(card) => {
//             setCardDetails(card);
//             // Debug log to see card state
//             console.log('Card details:', card);
//           }}
//         />
//       </View>
//       <TouchableOpacity onPress={handleFund} className="bg-primary-100 rounded-lg p-3 items-center">
//         <Text className="text-white font-NunitoBold">Pay {amount ? `₦${amount}` : ''}</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default StripeFundWallet;

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { initStripe, usePaymentSheet } from '@stripe/stripe-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../global/authSlice';
import { createStripePaymentIntent, createStripeWalletIntent, fundWalletStripe, getWalletBalance } from '../api/api';
import { setWallet } from '../global/walletSlice';
import { showError, showSuccess } from 'utils/toast';
import { mutate } from 'swr';

const StripeFundWallet: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
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
  


  const initializePaymentSheet = async (amountNgn: number) => {
    const resp = await createStripeWalletIntent(
      { amountNgn, receipt_email: user?.data?.user?.email },
      token
    );
    const clientSecret = resp?.data?.clientSecret || resp?.data?.client_secret;
    if (!clientSecret) throw new Error('Missing client secret from server.');

    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Proxy',
      defaultBillingDetails: {
        name: user?.data?.user?.name || '',
        email: user?.data?.user?.email || undefined,
        phone: user?.data?.user?.phone || undefined,
        address: { country: 'NG' },
      },
      googlePay: { merchantCountryCode: 'NG', testEnv: true },
    });

    if (error) throw error;
    return clientSecret;
  };

  // const handleFund = async () => {
  //   try {
  //     setLoading(true);
  //     const amt = Number(amount);
  //     if (!amt || amt <= 0) {
  //       Alert.alert('Error', 'Enter a valid amount');
  //       setLoading(false);
  //       return;
  //     }

  //     // convert NGN to USD using real-time exchange rate
  //     const convertNgnToUsd = (amountNgn: number, rate?: number) => {
  //       const finalRate = exchangeRate ?? 0.0065; // Use fetched rate, or fallback
  //       return amountNgn * finalRate;
  //     };
  //     console.log(exchangeRate)

  //     const usdAmount = convertNgnToUsd(amt);
  //     console.log(usdAmount)
  //     const amountInSmallestUnit = Math.round(usdAmount * 100);

  //     console.log(amountInSmallestUnit)
      
  //     // Initialize the payment sheet
  //     const clientSecret = await initializePaymentSheet(amountInSmallestUnit);
      
  //     // Present the payment sheet to the user
  //     const { error, paymentOption } = await presentPaymentSheet();
      
  //     if (error) {
  //       showError(error.message || 'Payment failed');
  //       setLoading(false);
  //       return;
  //     }
      
  //     // Extract the payment intent ID from the client secret
  //     const paymentIntentId = clientSecret.split('_secret_')[0];
      
  //     // Notify backend to credit wallet - send the USD amount in cents to match what Stripe processed
  //     const fundRes = await fundWalletStripe({ amount: amountInSmallestUnit, paymentIntentId }, token);

  //     const fundData = fundRes.data || fundRes;
  //     mutate("/wallet/balance")

  //     // Refresh wallet balance
  //     try {
  //       const balRes = await getWalletBalance(token);
  //       const w = (balRes.data || balRes).data || (balRes.data || balRes);

  //       if (w) {
  //         dispatch(setWallet({ 
  //           id: w.walletId, 
  //           balance: w.balance, 
  //           currency: w.currency, 
  //           updatedAt: w.updatedAt 
  //         }));
  //       }
  //     } catch (e) {
  //       showError('Failed to refresh wallet balance');
  //     }

  //    showSuccess(fundData.message || 'Wallet funded successfully');
  //    setAmount('');
  //   } catch (err: any) {
  //     showError(err?.message || 'Failed to fund wallet');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

    const handleFund = async () => {
    try {
      setLoading(true);
      const amt = Number(amount);
      if (!amt || amt <= 0) return Alert.alert('Enter a valid amount');

      const clientSecret = await initializePaymentSheet(amt);
      const { error } = await presentPaymentSheet();
      if (error) {
        showError(error.message || 'Payment failed');
        setLoading(false);
        return;
      }

      const paymentIntentId = clientSecret.split('_secret_')[0];
      await fundWalletStripe({ amountNgn: amt, paymentIntentId }, token);

      mutate('/wallet/balance'); // stale‑while‑revalidate

      // refresh wallet state as before…
      const balRes = await getWalletBalance(token);
      const w = (balRes.data || balRes).data || (balRes.data || balRes);
      if (w) dispatch(setWallet({ id: w.walletId, balance: w.balance, currency: w.currency, updatedAt: w.updatedAt }));

      showSuccess('Wallet funded successfully');
      setAmount('');
    } catch (err: any) {
      showError(err?.message || 'Failed to fund wallet');
    } finally {
      setLoading(false);
    }
  };

  // …JSX unchanged except for removing rate-related state…


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
      <TouchableOpacity 
        onPress={handleFund} 
        className="bg-primary-100 rounded-lg p-3 items-center"
        disabled={loading}
      >
        <Text className="text-white font-NunitoBold">
          {loading ? "Processing..." : `Pay ${amount ? `₦${amount}` : ''}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default StripeFundWallet;
