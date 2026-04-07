import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSessionContext } from "../../../global/SessionProvider";
import { useSelector } from "react-redux";
import { selectUser } from "../../../global/authSlice";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import { useLocalSearchParams, useNavigation, useRouter, router } from "expo-router";
import { useGetConversions } from "hooks/useHooks";
import { markMessagesAsRead } from "api/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

type Message = {
  id: string;
  tempId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  delivered?: boolean;
  read?: boolean;
  // Add unique key for React rendering
  _key?: string;
};
const getUserOnlineStatus = (userObject: any): boolean => {
  // Try all possible paths where isOnline might exist
  return Boolean(
    userObject?.seller?.Session?.[0]?.isOnline ||  // Nested seller path
    userObject?.Session?.[0]?.isOnline ||          // Direct Session path
    false                                          // Fallback value
  );
};

function generateMessageKey(message: Message): string {
  const baseId = message.id || message.tempId;
  const timestamp = new Date(message.createdAt).getTime();
  return `${baseId}-${message.senderId}-${timestamp}`;
}

// Deduplicate messages by id (preferred) or tempId, preserving original order.
function dedupeMessages(arr: Message[] | undefined) {
  if (!arr || !Array.isArray(arr)) return [];
  
  const seen = new Set<string>();
  const out: Message[] = [];
  
  // Process messages in reverse to keep the latest version
  for (const message of [...arr].reverse()) {
    if (!message) continue;
    
    // Generate a unique identifier for deduplication
    const dedupeKey = message.id || message.tempId;
    if (!dedupeKey) continue;
    
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      // Ensure the message has a unique _key property
      out.push({
        ...message,
        _key: message._key || generateMessageKey(message)
      });
    }
  }
  
  // Reverse back to maintain original order
  return out.reverse();
}



const Chat = () => {
  // const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message> | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const ackRead = useRef<(senderId: string[], receiverId: string) => void>(() => {});
  const {seller, user:userProfile} = useLocalSearchParams()


    let sellers = null;
  let users = null;
  
  try {
    sellers = seller ? JSON.parse(seller as string) : null;
    users = userProfile ? JSON.parse(userProfile as string) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
  }

  if (!sellers || !users) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Invalid user data</Text>
      </View>
    );
  }

  
  const receiverId = sellers?.seller?.id || sellers?.id;
  // console.log(sellers?.Session[0])

  
  // Get user from Redux
  const user = useSelector(selectUser) as any;
  const token = (user && (user as any)?.data.token) || null;
  // For now receiverId is hardcoded; replace with route param or prop
  const { isLoading, isError, messages: userMessages, mutate } = useGetConversions(receiverId, token);

  const CACHE_KEY_PREFIX = 'conversations:';

  // Load cached messages for this conversation (so UI shows something even if network fails)
  useEffect(() => {
    let mounted = true;
    const loadCache = async () => {
      if (!receiverId) return;
      try {
        const key = `${CACHE_KEY_PREFIX}${receiverId}`;
        const raw = await AsyncStorage.getItem(key);
        if (raw && mounted) {
          const parsed = JSON.parse(raw) as Message[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed.map(m => ({ ...m, _key: m._key || generateMessageKey(m) })));
          }
        }
      } catch (e) {
        console.warn('Failed to load cached conversation', e);
      }
    };
    loadCache();
    return () => { mounted = false };
  }, [receiverId]);

  // Persist messages to local storage whenever they change
  useEffect(() => {
    const persist = async () => {
      try {
        if (!receiverId) return;
        const key = `${CACHE_KEY_PREFIX}${receiverId}`;
        await AsyncStorage.setItem(key, JSON.stringify(messages));
      } catch (e) {
        console.warn('Failed to persist conversation cache', e);
      }
    };
    // don't block UI
    persist();
  }, [messages, receiverId]);
  

  // initialize local messages from backend cache
useEffect(() => {
    try {
      if (userMessages && Array.isArray(userMessages.messages)) {
        const deduped = dedupeMessages(userMessages.messages);
        setMessages(deduped);
        
        // Find messages from the other user that aren't read
        const unreadFromSender = deduped.some(
          m => !m.read && m.senderId === receiverId
        );
          
        if (unreadFromSender) {
          // Send read receipt via socket for real-time update
          if (ackRead.current) {
            ackRead.current([receiverId],  user?.data?.user.id);
          }
          
          // Update via API for persistence
          if (receiverId) {
            markMessagesAsRead(receiverId, token)
              .then(() => {
                // Update local message state to show read receipts
                setMessages(prev => 
                  prev.map(m => 
                    m.senderId === receiverId ? { ...m, read: true } : m
                  )
                );
              })
              .catch(error => console.error("Failed to mark messages as read:", error));
          }
        }
      }
    } catch (e) {
      console.warn("Failed to initialize messages from userMessages", e);
    }
  }, [userMessages]);


  // cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current as any);
        typingTimeout.current = null;
      }
      // ensure we tell the server we stopped typing
      try {
        if (isTyping && emitStopTyping && receiverId) emitStopTyping(receiverId);
      } catch (e) {
        // ignore
      }
    };
  }, []);



  const session = useSessionContext();
  const { emitTyping, emitStopTyping, ackDelivered, sendMessage, sendMediaMessage, getSocket, onSocketReady } = session || {};

  const API_URL = "https://proxy-backend-1rfl.onrender.com/api";
  const visibleMessages = useRef(new Set<string>());

  useEffect(() => {
    let isMounted = true;
    const messageCache = new Set();

    const cleanup = onSocketReady((socket:any) => {
      // Clear existing listeners to prevent duplicates
      socket.removeAllListeners();
      
      const handleReceive = (message: any) => {
        if (!isMounted || !message) return;
        
        // Generate a unique message identifier
        const msgKey = message.id || message.tempId;
        if (!msgKey) return;

        // If we've already processed this message, skip it
        if (messageCache.has(msgKey)) return;
        messageCache.add(msgKey);
        
        setMessages(prev => {
          // Handle tempId case (optimistic update)
          if (message.tempId) {
            const updated = prev.map(m => 
              m.tempId === message.tempId ? 
                { ...m, id: message.id || m.id, delivered: true, ...message } : 
                m
            );
            return dedupeMessages(updated);
          }
          
          // Handle new message case
          const exists = prev.some(m => 
            (m.id === message.id) || 
            (m.tempId === message.tempId)
          );
          if (exists) return prev;
          
          return dedupeMessages([...prev, message]);
        });

        // Acknowledge message receipt
        if (message.id) ackDelivered(message.id);
      };
 

      const handleSent = (data: any) => {
        // server confirms message saved: replace optimistic entry in local state
        setMessages((prev) => prev.map((m) => (m.tempId === data.tempId ? { ...m, id: data.id, createdAt: data.createdAt, delivered: true } : m)));
      };

      const handleDelivered = (data: { messageId?: string; tempId?: string }) => {
        // mark message delivered in local state
        setMessages((prev) => prev.map((m) => (data.tempId ? (m.tempId === data.tempId ? { ...m, delivered: true } : m) : m.id === data.messageId ? { ...m, delivered: true } : m)));
      };

      const handleRead = (data: { messageIds: string[] }) => {
        // mark messages as read in local state
        setMessages((prev) => prev.map((m) => (data.messageIds.includes(m.id) || data.messageIds.includes(m.tempId || "") ? { ...m, read: true } : m)));
      };

      // Initialize ackRead function
      ackRead.current = (senderId: string[], receiverId: string) => {
        socket.emit("message:read", { senderId, receiverId });
      };

      socket.on("receive_message", handleReceive);
      socket.on("message_sent", handleSent);
      socket.on("message_delivered", handleDelivered);
      socket.on("messages_read", handleRead);

      socket.on("typing", (payload: { from: string }) => {
        const { from } = payload;
        if (from === receiverId) setIsOtherUserTyping(true);
      });

      socket.on("stop_typing", (payload: { from: string }) => {
        const { from } = payload;
        if (from === receiverId) setIsOtherUserTyping(false);
      });

      socket.on("user_online", (payload: { userId: string }) => {
        const { userId } = payload;
        if (userId === receiverId) setIsOtherUserOnline(true);
      });

      socket.on("user_offline", (payload: { userId: string }) => {
        const { userId } = payload;
        if (userId === receiverId) setIsOtherUserOnline(false);
      });

      // Clear message cache periodically to prevent memory leaks
      const cacheClearInterval = setInterval(() => {
        messageCache.clear();
      }, 1000 * 60 * 5); // Clear every 5 minutes

      return () => {
        socket.removeAllListeners();
        clearInterval(cacheClearInterval);
      };
    });

    return () => {
      isMounted = false;
      cleanup();
      messageCache.clear();
      visibleMessages.current.clear();
    };
  }, [receiverId]);


  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => showSub.remove();
  }, []);

  const uploadFile = async (uri: string, type: string, name: string) => {
    try {
      setSendingFile(true);
      const formData = new FormData();
      formData.append("file", {
        uri,
        type,
        name,
      } as any);

      const { data } = await axios.post(`${API_URL}/media/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      return data.data?.url;
    } catch (err: any) {
      console.error("Upload error:", err.response?.data || err.message);
      Alert.alert("Upload failed", "Could not upload file. Try again.");
      return null;
    } finally {
      setSendingFile(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your photos.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!res.canceled && res.assets?.length) {
      const uri = res.assets[0].uri;
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      await handleSendMedia(compressed.uri, "image/jpeg", "image.jpg");
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;
    const file = result.assets[0];
    await handleSendMedia(file.uri, "application/pdf", file.name || "document.pdf");
  };

  const handleSendMedia = async (uri: string, type: string, name: string) => {
    const uploadedUrl = await uploadFile(uri, type, name);
    if (!uploadedUrl) return;

    const tempId = Date.now().toString();
    const msg: Message = {
      id: tempId,
      tempId,
      senderId: user?.data?.user?.id,
      receiverId,
      content: "",
      imageUrl: type.startsWith("image/") ? uploadedUrl : undefined,
      fileUrl: type === "application/pdf" ? uploadedUrl : undefined,
      fileName: type === "application/pdf" ? name : undefined,
      createdAt: new Date().toISOString(),
      _key: `msg-${tempId}-${sellers?.user?.id || sellers?.id}-${Date.now()}`
    }; 
    setMessages((prev) => {
      // Check for any existing message with the same tempId
      const exists = prev.some(m => m.tempId === tempId);
      if (exists) return prev;
      return dedupeMessages([...prev, msg]);
    });
    
    // rely on socket events and local state instead of updating SWR cache
    sendMessage({ receiverId, content: "", tempId, imageUrl: msg.imageUrl, fileUrl: msg.fileUrl });

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);;
  };

  const stopTypingNow = () => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current as any);
      typingTimeout.current = null;
    }
    if (isTyping && emitStopTyping && receiverId) {
      try {
        emitStopTyping(receiverId);
      } catch (e) {
        console.warn("emitStopTyping failed", e);
      }
    }
    setIsTyping(false);
  };

  const handleTextChange = (val: string) => {
    setText(val);
    // emit typing when user starts typing
    if (!isTyping && emitTyping && receiverId) {
      try {
        emitTyping(receiverId);
        setIsTyping(true);
      } catch (e) {
        console.warn("emitTyping failed", e);
      }
    }

    // reset typing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current as any);
    }
    typingTimeout.current = setTimeout(() => {
      stopTypingNow();
    }, 2000);
  };
  

  const sendTextMessage = () => {
    // stop typing before sending
    stopTypingNow();
    const trimmed = text.trim();
    if (!trimmed) return;
    const cleanedText = cleanSensitiveInfo(trimmed);
    const tempId = Date.now().toString();

    const msg: Message = {
      id: tempId,
      tempId,
      senderId: user?.data?.user.id,
      receiverId,
      content: cleanedText,
      createdAt: new Date().toISOString(),
      _key: `msg-${tempId}-${user?.data?.user?.id}-${Date.now()}`
    };


    setMessages((prev) => {
      // Check for any existing message with the same tempId
      const exists = prev.some(m => m.tempId === tempId);
      if (exists) return prev;
      return dedupeMessages([...prev, msg]);
    });
    
    // rely on socket events and local state instead of updating SWR cache
    sendMessage({ receiverId, content: cleanedText, tempId });
    setText("");
    Keyboard.dismiss();
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };



   const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    const newUnreadMessages: string[] = [];
    
    viewableItems.forEach(({ item }) => {
      if (item && !item.read && item.senderId !== user?.data?.user?.id && !visibleMessages.current.has(item.id)) {
        visibleMessages.current.add(item.id);
        newUnreadMessages.push(item.id);
      }
    });
    
      if (newUnreadMessages.length > 0 && receiverId) {
        // Send read receipt via socket
        if (ackRead.current) {
          ackRead.current([receiverId], user?.data?.user?.id);
        }
        
        // Update via API for persistence
        markMessagesAsRead(receiverId, token)
          .then(() => {
            // Update local message state to show read receipts
            setMessages(prev => 
              prev.map(m => 
                m.senderId === receiverId ? { ...m, read: true } : m
              )
            );
          })
          .catch((error: Error) => console.error("Failed to mark messages as read:", error));
      }
  }, [user?.data?.user?.id, token]);
  const renderMessage = ({ item }:any) => {
    const isMyMessage = item.senderId === user?.data?.user?.id;
    return (
      <View
      key={item.id}
        className={`px-4 my-2 ${isMyMessage ? "items-end" : "items-start"}`}
      >
        <View
          className={`${
            isMyMessage ? "bg-primary-100" : "bg-white"
          } rounded-2xl p-3 max-w-[75%] shadow-sm`}
        >
          {item?.mediaUrl && (
            <TouchableOpacity onPress={() => setSelectedImage(item?.mediaUrl)}>
              <Image
                source={{ uri: item?.mediaUrl }}
                // className="w-48 h-36 rounded-lg"
                contentFit="cover"
                style={{ resizeMode: "cover", borderRadius: 10, width: 192, height: 144 }}
              />
            </TouchableOpacity>
          )}

          {item.fileUrl && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert("PDF", "Open PDF file?");
                // You can integrate PDF viewer here
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={22} color="#333" />
                <Text className="ml-2 text-blue-600 underline">
                  {item?.fileName || "View document"}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {item.content ? (
            <Text
              className={`font-NunitoMedium text-lg ${
                isMyMessage ? "text-white" : "text-black"
              } mt-2`}
            >
              {item?.content}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center mt-1">
          <Text className="text-xs font-NunitoRegular text-gray-400">
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          {/* status indicators for messages sent by current user */}
           {isMyMessage ? (
            <View className="ml-2 flex-row items-center">
              {/** sending (optimistic) */}
              {(!item.id || (item.tempId && !item.deliveredAt && !item.id)) && (
                <Ionicons name="time-outline" size={14} color="#999" />
              )}

              {/** sent but not delivered */}
              {(item.id && !item.deliveredAt && !item.readAt) && (
                <Ionicons name="checkmark" size={14} color="#999" />
              )}

              {/** delivered (double check) */}
              {(item.deliveredAt && !item.readAt) && (
                <Ionicons name="checkmark-done" size={14} color="#999" />
              )}

              {/** read/seen (double check colored) */}
              {item.readAt && (
                <Ionicons name="checkmark-done" size={14} color="#34C759" />
              )}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

   if (isLoading) {
      return (
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#004CFF" />
          <Text className="mt-3 font-NunitoMedium text-gray-500">Loading Messages...</Text>
        </SafeAreaView>
      );
    }
  
      // If fetching messages failed, don't immediately replace existing UI if we already
      // have messages in state. Show a small non-blocking banner and allow retry.
      if (isError && messages.length === 0) {
        return (
          <SafeAreaView className="flex-1 justify-center items-center bg-white">
            <Text className="text-red-500 font-NunitoSemiBold">Failed to load messages. Please try again Later</Text>
          </SafeAreaView>
        );
      }

  // Function to clean sensitive information from text
  const cleanSensitiveInfo = (text: string) => {
    // Remove account numbers (typical formats: 10-12 digits)
    return text.replace(/\b\d{10,12}\b/g, '[ACCOUNT_NUMBER_REMOVED]');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {selectedImage && (
        <View className="absolute inset-0 z-50 bg-black bg-opacity-90 justify-center items-center">
          <TouchableOpacity 
            className="absolute top-10 right-5 z-50" 
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
         <View className="w-full h-full justify-center items-center"> 
           <Image 
          style={{width: '100%', height: '80%', borderRadius: 10}}
            source={{ uri: selectedImage }} 
            className="h-[80%]" 
            contentFit="cover"
          />
         </View>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View className="px-4 pt-14 pb-7 flex-row items-center border-b border-gray-200 bg-white">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#ECF0F4] rounded-full p-2 mr-3"
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Image
            source={{uri: sellers?.seller?.kycDocument?.selfieUrl || sellers?.kycDocument?.selfieUrl || "https://via.placeholder.com/150"}}
            style={{width: 40, height: 40, borderRadius: 20, marginRight: 12}}
            className="rounded-full mr-3"
            contentFit="cover"
          />
          <View>
            <Text className="font-RalewayBold text-xl text-black">
              {sellers?.seller?.name || sellers?.name}
            </Text>
            <Text
              className={`text-base font-NunitoLight ${
                isOtherUserTyping
                  ? "text-primary-100"
                  : getUserOnlineStatus(sellers)
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            >
              {isOtherUserTyping
                ? "Typing..."
                : getUserOnlineStatus(sellers)
                ? "Online"
                : "Offline"}
            </Text>
          </View>
        </View>

        {/* Messages */}
        {isError ? (
          <View className="mx-4 my-3 p-3 rounded-md bg-yellow-100 flex-row items-center justify-between">
            <Text className="text-yellow-800 font-RalewayBold flex-1 mr-2">Unable to refresh messages — showing cached messages.</Text>
            <TouchableOpacity onPress={() => mutate?.()} className="px-3 py-1 bg-yellow-200 rounded">
              <Text className="text-yellow-800 font-NunitoMedium">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m._key || generateMessageKey(m)}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{
            viewAreaCoveragePercentThreshold: 50,
            minimumViewTime: 500
          }}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input Area */}
        <View className="px-3 py-6 bg-white border-t border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={pickImage} className="p-2 mr-1">
              <Ionicons name="image-outline" size={22} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickPdf} className="p-2 mr-2">
              {sendingFile ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="document-text-outline" size={22} color="#333" />
              )}
            </TouchableOpacity>

            <TextInput
              value={text}
              onChangeText={handleTextChange}
              placeholder="Type a message"
              className="flex-1 px-3 font-NunitoMedium py-4 bg-gray-100 rounded-full text-black"
              multiline
              blurOnSubmit={false}
            />

            <TouchableOpacity
              onPress={sendTextMessage}
              className="ml-2 bg-primary-100 p-3 rounded-full items-center justify-center"
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;
