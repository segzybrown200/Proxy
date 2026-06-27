import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "../global.css";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../global/store";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React from "react";
import { SessionProvider } from "../global/SessionProvider";
import NetworkStatus from "../components/NetworkStatus";
import { logoutState, selectIsVisitor, selectUser } from "../global/authSlice";
import Toast from "react-native-toast-message";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserAuth } from "../api/api";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});
const RootLayoutInner = () => {
  // Remove router navigation logic
  const dispatch = useDispatch();

  const isLoggedIn: any = useSelector(selectUser);
  const isVisitor = useSelector(selectIsVisitor);
  const [checking, setChecking] = React.useState(true);

  const [fontsLoaded] = useFonts({
    "Raleway-Black": require("../assets/fonts/Raleway-Black.ttf"),
    "Raleway-Bold": require("../assets/fonts/Raleway-Bold.ttf"),
    "Raleway-ExtraBold": require("../assets/fonts/Raleway-ExtraBold.ttf"),
    "Raleway-ExtraLight": require("../assets/fonts/Raleway-ExtraLight.ttf"),
    "Raleway-Light": require("../assets/fonts/Raleway-Light.ttf"),
    "Raleway-Medium": require("../assets/fonts/Raleway-Medium.ttf"),
    "Raleway-Regular": require("../assets/fonts/Raleway-Regular.ttf"),
    "Raleway-SemiBold": require("../assets/fonts/Raleway-SemiBold.ttf"),
    "Raleway-Thin": require("../assets/fonts/Raleway-Thin.ttf"),
    "Nunito-Black": require("../assets/fonts/Nunito-Black.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito-ExtraBold.ttf"),
    "Nunito-ExtraLight": require("../assets/fonts/Nunito-ExtraLight.ttf"),
    "Nunito-Light": require("../assets/fonts/Nunito-Light.ttf"),
    "Nunito-Medium": require("../assets/fonts/Nunito-Medium.ttf"),
    "Nunito-Regular": require("../assets/fonts/Nunito-Regular.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito-SemiBold.ttf"),
  });


  useEffect(() => {
    const verifyUser = async () => {
      // Not logged in → no need to check
      if (!isLoggedIn) {
        setChecking(false);
        return;
      }

      // try {
        const res = await getUserAuth(isLoggedIn?.data?.token || "").then((res) => {
          
        }).catch((err) => {
          if (err.message === "User is banned") {
            // 🔥 USER BANNED
            dispatch(logoutState());
            AsyncStorage.removeItem("sessionId");
            AsyncStorage.removeItem("userLocation");
            Toast.show({
              type: "error",
              text1: "Account Banned",
              text2: "You no longer have access to this app.",
            });
          }
          if (err.message === "User not found" || err.status === "Token missing" || err.message === "Authorization header missing") {
            // ❌ Token expired or user deleted
            dispatch(logoutState());
            AsyncStorage.removeItem("sessionId");
            AsyncStorage.removeItem("userLocation");
          }
  
        });

 

      setChecking(false);
    };

    verifyUser();
  }, [isLoggedIn]);
  useEffect(() => {
    if (!fontsLoaded) return;

    SplashScreen.hideAsync(); // hide native splash
  }, [fontsLoaded]);

  // Conditional rendering for onboarding

  if (!fontsLoaded || checking) return null;

  return (
    <React.Fragment>
      <StatusBar style="auto" />
      <NetworkStatus />

      <Stack>
        <Stack.Protected guard={!!isLoggedIn || isVisitor}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!!isLoggedIn && !isVisitor}>
          <Stack.Screen name="rider" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      <Toast
        position="top"
        config={{
          success: ({ text1, text2 }) => (
            <View className="bg-primary-100 w-[80%] mt-6 rounded-xl px-4 py-3">
              <Text className="text-white text-xl font-RalewayExtraBold ">
                {text1}
              </Text>
              <Text className="text-white text-lg font-NunitoMedium">
                {text2}
              </Text>
            </View>
          ),
          error: ({ text1, text2 }) => (
            <View className="bg-red-500 w-[80%] mt-6 rounded-xl px-4 py-3">
              <Text className="text-white text-xl font-RalewayExtraBold">
                {text1}
              </Text>
              <Text className="text-white text-lg font-NunitoMedium">
                {text2}
              </Text>
            </View>
          ),
        }}
      />
    </React.Fragment>
  );
};

const RootLayout = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SessionProvider>
          <RootLayoutInner />
        </SessionProvider>
      </GestureHandlerRootView>
    </PersistGate>
  </Provider>
);

export default RootLayout;
