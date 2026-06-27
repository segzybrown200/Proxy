import React, { useRef } from "react";
import { View } from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";

import HomeIcon from "../../assets/icons/Home.svg";
import HomeIconFocused from "../../assets/icons/Home-focused.svg";
import SearchIcon from "../../assets/icons/Search.svg";
import SearchIconFocused from "../../assets/icons/Search-focused.svg";
import ProfileIcon from "../../assets/icons/profile.svg";
import ProfileIconFocused from "../../assets/icons/profile-focused.svg";
import BagIcon from "../../assets/icons/bag.svg";
import BagIconFocused from "../../assets/icons/bag-focused.svg";
import { useSelector } from "react-redux";
import { selectCartItems } from "../../global/listingSlice";

const _layout = () => {
  const cartItems = useSelector(selectCartItems);
  const pathname = usePathname();
  const router = useRouter();

  const showTabBar =
    pathname === "/" ||
    pathname === "/cart" ||
    pathname === "/search" ||
    pathname === "/profile" ||
    pathname === "/category";

  return (
    <Tabs
      initialRouteName="(home)"
      backBehavior="order"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: showTabBar
          ? {
              backgroundColor: "white",
              borderTopWidth: 0,
              paddingBottom: 5,
              height: 80,
              paddingTop: 10,
            }
          : { display: "none" },
      }}
    >
      <Tabs.Screen
        name="(home)"
        listeners={({ navigation }) => ({
          tabPress: () => {
            try {
              const state = navigation.getState && navigation.getState();
              const root = state?.routes?.[0]?.name;
              if (root) navigation.navigate(root);
            } catch (e) {}
          },
        })}
        options={{
          popToTopOnBlur: true,
          // ensure pressing the tab always returns the stack to its root
          tabBarIcon: ({ focused }) => (
            <View className={focused ? "bg-[#004CFF] rounded-full p-2" : ""}>
              {focused ? (
                <HomeIconFocused width={24} height={24} />
              ) : (
                <HomeIcon width={24} height={24} />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        listeners={({ navigation }) => ({
          tabPress: () => {
            try {
              const state = navigation.getState && navigation.getState();
              const root = state?.routes?.[0]?.name;
              if (root) navigation.navigate(root);
            } catch (e) {}
          },
        })}
        options={{
          popToTopOnBlur: true,

          tabBarIcon: ({ focused }) => (
            <View className={focused ? "bg-[#004CFF] rounded-full p-2" : ""}>
              {focused ? (
                <SearchIconFocused width={24} height={24} />
              ) : (
                <SearchIcon width={24} height={24} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        listeners={({ navigation }) => ({
          tabPress: () => {
            try {
              const state = navigation.getState && navigation.getState();
              const root = state?.routes?.[0]?.name;
              if (root) navigation.navigate(root);
            } catch (e) {}
          },
        })}
        options={{
          popToTopOnBlur: true,
          tabBarBadge: cartItems.length > 0 ? cartItems.length : undefined,
          tabBarIcon: ({ focused }) => (
            <View className={focused ? "bg-[#004CFF] rounded-full p-2" : ""}>
              {focused ? (
                <BagIconFocused width={24} height={24} />
              ) : (
                <BagIcon width={24} height={24} />
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="(profile)"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); // stop default behavior

            navigation.reset({
              index: 0,
              routes: [{ name: "(profile)" }], // reset stack to root
            });
          },
        })}
        options={{
          popToTopOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <View className={focused ? "bg-[#004CFF] rounded-full p-2" : ""}>
              {focused ? (
                <ProfileIconFocused width={24} height={24} />
              ) : (
                <ProfileIcon width={24} height={24} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="(rides)"
        options={{
          popToTopOnBlur: true,
          href: null, // 👈 this hides it from showing in the tab bar
          headerShown: false,
        }}
      />
      {/* Hide the tab */}
    </Tabs>
  );
};

export default _layout;
