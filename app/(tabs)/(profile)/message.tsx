import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ListRenderItemInfo,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMessages } from '../../../hooks/useHooks'
import { useSelector } from 'react-redux'
import { RootState } from '../../../global/store'

type Conversation = {
  id: string
  name: string
  lastMessage: string
  time: string // formatted time/date
  online?: boolean
}

const conversations: Conversation[] = [
  { id: 'c1', name: 'Amina Bello', lastMessage: 'Thanks! I will ship tomorrow.', time: 'Oct 12 • 14:23', online: true },
  { id: 'c2', name: 'John Doe', lastMessage: 'Can you update the address?', time: 'Oct 11 • 09:12', online: false },
  { id: 'c3', name: 'Sarah Lee', lastMessage: 'Payment received. Thank you!', time: 'Oct 10 • 18:01', online: true },
]
const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();

  // Same day → show only time
  if (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return new Intl.DateTimeFormat("en-NG", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  }

  // Within same year → show "Oct 26 • 8:15 PM"
  if (date.getFullYear() === now.getFullYear()) {
    const formatted = new Intl.DateTimeFormat("en-NG", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
    return formatted.replace(",", " •");
  }

  // Otherwise → full date
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

const Message = () => {
  const user:any = useSelector((state: RootState) => state.auth.user);
  const token = user?.data.token;
  const [refreshing, setRefreshing] = useState(false);

  const { isLoading, messages, isError, mutate } = useMessages(token);
  const data = useMemo(() => conversations, [])


    if (isLoading ) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#004CFF" />
        <Text className="mt-3 font-NunitoMedium text-gray-500">
          Loading messages...
        </Text>
      </View>
    );
  }

  if (isError ) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 font-NunitoSemiBold">
          Failed to load messages
        </Text>
      </View>
    );
  }

    const renderMessageItem = ({item}:any) => (
    
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/(tabs)/(profile)/chat",
          params: { user: JSON.stringify(user?.data?.user), seller: JSON.stringify(item?.user)  },
        })
      }
      className="flex-row px-5 items-center py-5 border-b border-[#F0F2F5]"
    >
      {/* Avatar */}
      <View className="w-12 h-12  relative">
        <Image style={{width: 48, height: 48, borderRadius: 9999}} className='rounded-full' source={{uri: item?.user?.kycDocument?.selfieUrl }} contentFit="cover" />
        {item?.user?.Session[0]?.isOnline && (
          <View className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00E676]" />
        )}
      </View>

      {/* Name & last message */}
      <View className="flex-1 ml-4">
        <Text className="text-lg font-NunitoSemiBold text-[#0D1321]">
          {item?.user?.name || "Unknown User"}
        </Text>
        <Text
          numberOfLines={1}
          className="text-base font-NunitoRegular text-gray-400 mt-1"
        >
          {item?.lastMessage?.content || "No messages yet"}
        </Text>
      </View>

      {/* Time + unread badge */}
      <View className="items-end">
        <Text className="text-sm font-RalewayRegular text-gray-400">
          {formatDateTime(item?.lastMessage?.createdAt) || ""}
        </Text>
        {item?.unreadCount > 0 && (
          <View className="mt-2 bg-[#004CFF] w-6 h-6 rounded-full items-center justify-center">
            <Text className="text-white font-NunitoBold text-sm">
              {item?.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
        <View className="flex-row items-center mt-10">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-[#ECF0F4] rounded-full p-2 mr-3"
              >
                <Ionicons name="chevron-back" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-2xl font-NunitoBold">Message</Text>
            </View>

      <FlatList
        data={messages?.data}
         keyExtractor={(item, index) => item.id?.toString() || `msg-${index}`}
        renderItem={renderMessageItem}
        contentContainerStyle={{ paddingVertical: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await mutate();
              } catch (e) {
                console.log("Refresh error:", e);
              }
              setRefreshing(false);
            }}
            colors={["#004CFF"]}
            tintColor="#004CFF"
          />
        }
        ListEmptyComponent={() => (
          <View className="items-center mt-8">
            <Text className="text-gray-400 font-RalewayMedium">No messages yet.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

export default Message