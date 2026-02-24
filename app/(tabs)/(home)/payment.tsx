import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Paystack, paystackProps } from "react-native-paystack-webview";
import {
  initStripe,
  CardField,
  useConfirmPayment,
} from "@stripe/stripe-react-native";
import { router, useFocusEffect } from "expo-router";
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from "react-redux";
import { selectIsVisitor, VisitorState } from "global/authSlice";
import { RootState } from "global/store";
import {
  clearCart,
  selectCartItems,
  selectCartTotal,
} from "global/listingSlice";
import { orderPlaced, createStripePaymentIntent, chargeWallet, getWalletBalance, placeWalletOrder } from "api/api";
import { showError } from "utils/toast";

export default function PaymentScreen() {
  const navigation = useNavigation();
  const handleBack = () => {
    try {
      if (navigation && (navigation as any).canGoBack && (navigation as any).canGoBack()) {
        (navigation as any).goBack();
      } else {
        router.replace('/(tabs)/(home)');
      }
    } catch (e) {
      router.replace('/(tabs)/(home)');
    }
  };
  const [addresses, setAddresses] = useState<Array<any>>([]);
  const isVistor = useSelector(selectIsVisitor);
  const dispatch = useDispatch();
  const [shipping, setShipping] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const paystackWebViewRef = useRef<paystackProps.PayStackRef>(null);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const { confirmPayment } = useConfirmPayment();
  const [stripeDebug, setStripeDebug] = useState<string | null>(null);
  const cartItems = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const user: any = useSelector((state: RootState) => state.auth.user);
  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem("addresses");
      const list = raw ? JSON.parse(raw) : [];
      setAddresses(list);
    } catch (e) {
      console.warn("Load addresses failed", e);
    }
  };

 

  const handlePaymentSuccess = async (res: any) => {
    console.log("✅ Payment Successful:", res);
    setShowPaystack(false);
    setLoading(true);
    const response = res["transactionRef"]["message"];
    const ref = res["transactionRef"]["trxref"];
    if (response === "Approved") {
      const data = {
        items: cartItems,
        dropoffAddress: addresses.length > 0 ? addresses[0].address : "",
        dropoffLat: addresses.length > 0 ? addresses[0].latitude : null,
        dropoffLng: addresses.length > 0 ? addresses[0].longitude : null,
        paymentType: "PAYSTACK"
      };
      console.log(data)
      const token = user?.data?.token;

      orderPlaced(data, ref, token)
        .then((response) => {
          dispatch(clearCart());
          setTimeout(() => {
            router.replace("/(tabs)/(home)/congratulations");
            setLoading(false);
          }, 2500);
        })
        .catch((error) => {
          setLoading(false);
          showError("Order placement failed. Please contact support.");
        });
    }
  };

  const handlePaymentCancel = () => {
    setShowPaystack(false);
    Alert.alert("Payment Cancelled", "You cancelled the transaction.");
  };

  const initiatePayment = () => {
    if (isVistor) {
      Alert.alert(
        "Action Required",
        "Please log in to proceed with the payment.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Log In",
            onPress: () => {
              dispatch(VisitorState(false));
              router.replace("/(auth)/login");
            },
          },
        ]
      );
      return;
    } else if (addresses.length === 0) {
      Alert.alert("Action Required", "Please add delivery address", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Navigate to Address",
          onPress: () => {
            dispatch(VisitorState(false));
            router.replace("/(tabs)/(profile)/add-address");
          },
        },
      ]);
    } else {
      if (!selectedMethod) {
        Alert.alert(
          "Select Payment Method",
          "Please select a payment method to continue."
        );
        return;
      }

      if (selectedMethod === "paystack") {
        setShowPaystack(true);
        return;
      }

      if (selectedMethod === "stripe") {
        // Proceed with Stripe flow
        initiateStripePayment();
        return;
      }
      if (selectedMethod === "wallet") {
        initiateWalletPayment();
        return;
      }
    }
  };

  const initiateWalletPayment = async () => {
    setLoading(true);
    try {
      const token = user?.data?.token;
      if (!token) {
        Alert.alert('Please login to use wallet');
        return;
      }

      const data = {
        items: cartItems,
        dropoffAddress: addresses.length > 0 ? addresses[0].address : "",
        dropoffLat: addresses.length > 0 ? addresses[0].latitude : null,
        dropoffLng: addresses.length > 0 ? addresses[0].longitude : null,
        paymentType: "WALLET",
        amountPaidByCustomer: total
      };

      // Call backend to charge wallet and create order atomically

      const orderData = await placeWalletOrder(data, token);

      const resData = orderData.data || orderData;

      console.log(resData)
      // assume success status in response
      dispatch(clearCart());
      router.replace('/(tabs)/(home)/congratulations');
    } catch (err: any) {
      console.warn('Wallet payment error', err);
      const message = err?.response?.data?.message || err?.message || 'Wallet payment failed';
      if (message.toLowerCase().includes('insufficient')) {
        Alert.alert('Insufficient funds', 'Your wallet balance is insufficient. Would you like to top up?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top up', onPress: () => router.push('/(tabs)/(profile)/wallet') }
        ]);
      } else {
        showError(message);
      }
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  useEffect(() => {
    // initialize Stripe (ensure you replace with your publishable key)
    // You may prefer to initialize this in your app root using <StripeProvider>
    if (!(global as any).__stripeInit) {
      initStripe({
        publishableKey:
          "pk_test_51SWC8PKosm6nlnYmvcbkgsMCp3X1oSNc2WZ60oYTKH99plGcg8Jy9VsGHnoSVTLXHOaFnZkTNS7tjn8ZuMnhJx0s005ryiV8lp",
      });
      (global as any).__stripeInit = true;
    }
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = user?.data?.token;
        if (!token) return;
        const res = await getWalletBalance(token);
        const data = res.data || res;
        console.log(data)
        const w = data.data || data;
        if (w && typeof w.balance !== 'undefined') setWalletBalance(Number(w.balance));
      } catch (e) {
        // ignore
      }
    };
    fetchWallet();
  }, [user]);

  const initiateStripePayment = async () => {
    if (!cardDetails || !cardDetails.complete) {
      Alert.alert(
        "Card Required",
        "Please enter complete card details to pay with Stripe."
      );
      return;
    }
    setLoading(true);
    try {
      // Build order payload (same shape used by orderPlaced)
      const data = {
        items: cartItems,
        dropoffAddress: addresses.length > 0 ? addresses[0].address : "",
        dropoffLat: addresses.length > 0 ? addresses[0].latitude : null,
        dropoffLng: addresses.length > 0 ? addresses[0].longitude : null,
        paymentType: "STRIPE",
        amountPaidByCustomer: total
      };

      // Ask backend to create a PaymentIntent and return client secret
      // This endpoint must be implemented on your server: POST /payments/create-payment-intent
      const token = user?.data?.token;

      // Convert app total (assumed NGN) into USD before asking backend
      // for a Stripe PaymentIntent. By default we use a fallback exchange
      // rate (1 USD = 500 NGN -> rate = 1/500 = 0.002). Replace this
      // with a real rate (from your server or an FX API) in production.
      const convertNgnToUsd = (amountNgn: number, rate?: number) => {
        const fallbackRate = rate ?? 0.002; // default: 1 USD = 500 NGN
        return amountNgn * fallbackRate;
      };

      const ngnAmount = total; // total is displayed in NGN in the app
      const usdAmount = convertNgnToUsd(ngnAmount);
      const amountInSmallestUnit = Math.round(usdAmount * 100); // amount in cents
      setStripeDebug("requesting payment intent");
      const resp = await createStripePaymentIntent(
        {
          amount: amountInSmallestUnit,
          currency: "usd",
          receipt_email: user?.data?.user?.email,
        },
        token
      );

      const clientSecret =
        resp?.data?.clientSecret || resp?.data?.client_secret;
      if (!clientSecret) {
        setStripeDebug(
          "no client secret in response: " + JSON.stringify(resp?.data)
        );
      } else {
        setStripeDebug("got client secret");
      }
      if (!clientSecret) {
        throw new Error("Missing client secret from server.");
      }

      // Confirm the payment with the card details collected via CardField
      // Wrap confirmPayment with a timeout to avoid indefinite hanging
      const confirmPromise = confirmPayment(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: {
            name: user?.data?.user?.name || "",
            phone: user?.data?.user?.phone || "",
            email: user?.data?.user?.email || undefined,
          },
        },
      });

      const timeoutMs = 30000; // 30 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Stripe confirmPayment timed out")),
          timeoutMs
        )
      );
      const { error, paymentIntent } = (await Promise.race([
        confirmPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.warn("Stripe confirmPayment error", error);
        setStripeDebug(
          "confirmPayment error: " + (error?.message || JSON.stringify(error))
        );
        showError(error.message || "Stripe payment failed");
        return;
      }

      // Payment succeeded: call orderPlaced on backend using paymentIntent.id (or use client reference)
      const reference =
        (paymentIntent as any)?.id ||
        (paymentIntent as any)?.client_secret ||
        (paymentIntent as any)?.clientSecret ||
        "";
      console.log("payment reference", reference);

      // Optionally send order to backend here, or rely on client to call orderPlaced as before
      await orderPlaced(data, reference, token);
      dispatch(clearCart());
      router.replace('/(tabs)/(home)/congratulations');
    } catch (e: any) {
      console.warn("Stripe payment error", e);
      showError(e?.message || "Stripe payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white px-5 pt-12"
        bounces={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className=" mt-7 mb-7 flex flex-row items-center gap-4 ">
          <TouchableOpacity
            onPress={handleBack}
            className="rounded-full bg-[#ECF0F4] p-2"
          >
            <MaterialIcons name="keyboard-arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="font-RalewaySemiBold text-2xl">Payment</Text>
        </View>

        {/* Address */}
        <View className="bg-gray-50 p-4 rounded-2xl mb-3 border border-gray-200">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-gray-500 font-NunitoBold mb-1">
                Shipping Address
              </Text>
              <Text className="text-gray-800 font-NunitoLight leading-5">
                {addresses.length > 0
                  ? addresses[0].address
                  : "No address selected"}
              </Text>
            </View>
            <TouchableOpacity className="bg-primary-50 rounded-full p-2">
              <Feather name="edit-2" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact */}
        <View className="bg-gray-50 p-4 rounded-2xl mb-5 border border-gray-200">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-gray-500 font-NunitoMedium mb-1">
                Contact Information
              </Text>
              <Text className="text-gray-800 font-NunitoLight">
                {user?.data?.user?.phone || ""}
              </Text>
              <Text className="text-gray-800 font-NunitoLight">
                {user?.data.user?.email || ""}
              </Text>
            </View>
            <TouchableOpacity className="bg-primary-50 rounded-full p-2">
              <Feather name="edit-2" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Items */}
        <View className="mb-6">
        

          <Text className="text-xl font-semibold mb-2 font-NunitoBold">
            Items
          </Text>
          {cartItems.length > 0 &&
            cartItems.map((item: any, index: number) => (
              <View key={index} className=" mb-5">
                <View className="flex-row items-center mb-6">
                  <Image
                    source={{ uri: item.media?.[0]?.url }}
                    resizeMode="cover"
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-gray-700 font-NunitoExtraBold text-lg">
                      {item.title}
                    </Text>
                    <Text className="text-gray-500 font-NunitoMedium">
                      Quantity: {item.quantity}
                    </Text>
                  </View>
                  <Text className="font-RalewayBold text-xl text-gray-900">
                    {" "}
                    ₦{item.price.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
        </View>

        

        {/* Payment Method */}
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-xl font-RalewayBold">Payment Method</Text>
          {/* <TouchableOpacity className="bg-primary-50 mt-2 rounded-full p-2">
          <Feather name="edit-2" size={20} color="white" />
          </TouchableOpacity> */}
        </View>

        <View className="mb-6">
              <TouchableOpacity
              onPress={() => setSelectedMethod("wallet")}
              className={`flex-row items-center justify-between p-4 rounded-2xl mb-2 ${
                selectedMethod === "wallet" ? "bg-blue-50 border border-blue-500" : "bg-gray-50 border border-gray-200"
              }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={selectedMethod === "wallet" ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={selectedMethod === "wallet" ? "#004CFF" : "#9CA3AF"}
                />
                <Text className="ml-2 text-gray-800 font-RalewaySemiBold">Wallet</Text>
              </View>
              <Text className="text-gray-800 font-RalewaySemiBold">{walletBalance !== null ? `₦${walletBalance.toLocaleString()}` : 'Loading...'}</Text>
            </TouchableOpacity>

            {/* Pay with paystack
          <TouchableOpacity
            onPress={() => setSelectedMethod("paystack")}
            className={`flex-row items-center justify-between p-4 rounded-2xl mb-2 ${
              selectedMethod === "paystack"
                ? "bg-blue-50 border border-blue-500"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={
                  selectedMethod === "paystack"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={selectedMethod === "paystack" ? "#004CFF" : "#9CA3AF"}
              />
              <Text className="ml-2 text-gray-800 font-RalewaySemiBold">
                Paystack
              </Text>
            </View>
            <Text className="text-gray-800 font-RalewaySemiBold">
              Pay with Paystack
            </Text>
          </TouchableOpacity>
            
            Pay with Stripe 
          <TouchableOpacity
            onPress={() => setSelectedMethod("stripe")}
            className={`flex-row items-center justify-between p-4 rounded-2xl ${
              selectedMethod === "stripe"
                ? "bg-blue-50 border border-blue-500"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={
                  selectedMethod === "stripe"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={20}
                color={selectedMethod === "stripe" ? "#004CFF" : "#9CA3AF"}
              />
              <Text className="ml-2 text-gray-800 font-RalewaySemiBold">
                Stripe
              </Text>
            </View>
            <Text className="text-gray-800 font-RalewaySemiBold">
              Pay with Card (Stripe)
            </Text>
          </TouchableOpacity>

          {selectedMethod === "stripe" && (
            <View className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <Text className="mb-2 text-gray-700">Card details</Text>
              <CardField
                postalCodeEnabled={false}
                placeholders={{ number: "4242 4242 4242 4242" }}
                cardStyle={{ backgroundColor: "#FFFFFF", textColor: "#000000" }}
                style={{ height: 50 }}
                onCardChange={(card) => setCardDetails(card)}
              />
              <Text className="text-sm text-gray-500 mt-2">
                We use Stripe to securely process your card.
              </Text>
              {stripeDebug && (
                <Text className="text-sm text-red-600 mt-2">
                  Stripe: {stripeDebug}
                </Text>
              )}
            </View>
        </View>
        )} */}
        </View>

        {/* Total + Pay */}
        <View className="flex-row justify-between items-center bg-gray-50 p-4 rounded-2xl mb-36">
          <View>
            <Text className="text-gray-500 font-NunitoBold">Total</Text>
            <Text className="text-2xl font-RalewaySemiBold text-gray-900">
              ₦{total.toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={initiatePayment}
            className="bg-blue-600 px-8 py-3 rounded-full"
          >
            <Text className="text-white font-NunitoBold text-base">Pay</Text>
          </TouchableOpacity>
        </View>

        {/* Paystack WebView */}
        {showPaystack && (
          <Paystack
            paystackKey="pk_test_fc0397fd630ab49899a47805ed9e4204d6ed0fca" // replace with your test key
            amount={total}
            billingEmail={user?.data.user?.email || ""}
            activityIndicatorColor="blue"
            onCancel={handlePaymentCancel}
            onSuccess={handlePaymentSuccess}
            autoStart={true}
            channels={[
              "bank",
              "card",
              "bank_transfer",
              "card",
              "ussd",
              "apple_pay",
            ]}
            // ref={paystackWebViewRef}
          />
        )}
        {loading && (
          <View style={styles.overlay}>
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#1E90FF" />
              <Text
                className="font-RalewayBold text-xl"
                style={styles.loaderTitle}
              >
                Payment is in progress
              </Text>
              <Text
                className="font-NunitoRegular text-lg"
                style={styles.loaderSub}
              >
                Please, wait a few moments
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.95)",
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loaderBox: {
    alignItems: "center",
    padding: 25,
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loaderTitle: { marginTop: 15, color: "#333" },
  loaderSub: { marginTop: 5, color: "#666" },
});
