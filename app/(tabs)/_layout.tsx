import React from 'react'
import { View } from 'react-native'
import { Tabs, usePathname } from 'expo-router'

import HomeIcon from '../../assets/icons/Home.svg'
import HomeIconFocused from '../../assets/icons/Home-focused.svg'
import SearchIcon from '../../assets/icons/Search.svg'
import SearchIconFocused from '../../assets/icons/Search-focused.svg'
import ProfileIcon from '../../assets/icons/profile.svg'
import ProfileIconFocused from '../../assets/icons/profile-focused.svg'
import BagIcon from '../../assets/icons/bag.svg'
import BagIconFocused from '../../assets/icons/bag-focused.svg'
import { useSelector } from 'react-redux'
import { selectCartItems } from 'global/listingSlice'

const _layout = () => {
  const cartItems = useSelector(selectCartItems);
  const pathname = usePathname();

    const showTabBar =
    pathname === "/" ||
    pathname === "/cart" ||
    pathname === "/search" ||
    pathname === "/profile";
    pathname === "/category";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: showTabBar ? {
          backgroundColor: 'white',
          borderTopWidth: 0,
          paddingBottom: 5,
          height: 80,
          paddingTop: 10,
        } : { display: "none" },
      }}
      backBehavior="order"
    >
      <Tabs.Screen
        name="(home)"
        options={{
          popToTopOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <View className={focused ? 'bg-[#004CFF] rounded-full p-2' : ''}>
              {focused ? <HomeIconFocused width={24} height={24} /> : <HomeIcon width={24} height={24} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        
        options={{
          popToTopOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <View className={focused ? 'bg-[#004CFF] rounded-full p-2' : ''}>
              {focused ? <SearchIconFocused width={24} height={24} /> : <SearchIcon width={24} height={24} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          popToTopOnBlur: true,
          tabBarBadge: cartItems.length > 0 ? cartItems.length : undefined,
          tabBarIcon: ({ focused }) => (
            <View className={focused ? 'bg-[#004CFF] rounded-full p-2' : ''}>
              {focused ? <BagIconFocused width={24} height={24} /> : <BagIcon width={24} height={24} />}
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="(profile)"

        options={{
          popToTopOnBlur: true,
          tabBarIcon: ({ focused }) => (
            <View className={focused ? 'bg-[#004CFF] rounded-full p-2' : ''}>
              {focused ? <ProfileIconFocused width={24} height={24} /> : <ProfileIcon width={24} height={24} />}
            </View>
          ),
        }}
      />
      {/* Hide the tab */}
    </Tabs>
  )
}

export default _layout