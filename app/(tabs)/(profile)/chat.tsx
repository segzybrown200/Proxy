import React, { useEffect, useRef, useState } from "react";
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
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useGetConversions } from "hooks/useHooks";

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
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const listRef = useRef<FlatList<Message> | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const {seller, user:userProfile} = useLocalSearchParams()

  const sellers = JSON.parse(seller as string)
  const users = JSON.parse(userProfile as string)

  
  const receiverId = sellers?.seller?.id;

  // Get user from Redux
  const user = useSelector(selectUser) as any;
  const token = (user && (user as any)?.data.token) || null;
  // For now receiverId is hardcoded; replace with route param or prop
  const {isLoading, isError, messages:userMessages } = useGetConversions(receiverId, token)


  console.log(userMessages)



  const session = useSessionContext();
  const { emitTyping, emitStopTyping, ackDelivered, sendMessage, sendMediaMessage, getSocket, onSocketReady } = session || {};

  const API_URL = "https://proxy-backend-6of2.onrender.com/api";

  useEffect(() => {
    const cleanup = onSocketReady((socket:any) => {
      const handleReceive = (message: any) => {
        // If server returns tempId mapping, update optimistic message
        if (message.tempId) {
          setMessages((prev) =>
            prev.map((m) => (m.tempId === message.tempId ? { ...m, id: message.id || m.id, delivered: true, ...message } : m))
          );
        } else {
          setMessages((prev) => [...prev, message]);
        }
        // ack received
        if (message.id) ackDelivered(message.id);
      };

      const handleSent = (data: any) => {
        // server confirms message saved: replace optimistic entry
        setMessages((prev) =>
          prev.map((m) => (m.tempId === data.tempId ? { ...m, id: data.id, createdAt: data.createdAt, delivered: true } : m))
        );
      };

      const handleDelivered = (data: { messageId?: string; tempId?: string }) => {
        setMessages((prev) =>
          prev.map((m) =>
            data.tempId ? (m.tempId === data.tempId ? { ...m, delivered: true } : m) : m.id === data.messageId ? { ...m, delivered: true } : m
          )
        );
      };

      const handleRead = (data: { messageIds: string[] }) => {
        setMessages((prev) => prev.map((m) => (data.messageIds.includes(m.id) || data.messageIds.includes(m.tempId || "") ? { ...m, read: true } : m)));
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

      return () => {
        socket.off("receive_message", handleReceive);
        socket.off("message_sent", handleSent);
        socket.off("message_delivered", handleDelivered);
        socket.off("messages_read", handleRead);
        socket.off("typing");
        socket.off("stop_typing");
        socket.off("user_online");
        socket.off("user_offline");
      };
    });

    return cleanup;
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
    };

    setMessages((prev) => [...prev, msg]);
    sendMessage({
      receiverId,
      content: "",
      tempId,
      imageUrl: msg.imageUrl,
      fileUrl: msg.fileUrl,
    });

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendTextMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tempId = Date.now().toString();
    const msg: Message = {
      id: tempId,
      tempId,
      senderId: user?.data?.user.id,
      receiverId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, msg]);
    sendMessage({ receiverId, content: trimmed, tempId });
    setText("");
    Keyboard.dismiss();
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.data?.user?.id;
    return (
      <View
        className={`px-4 my-2 ${isMyMessage ? "items-end" : "items-start"}`}
      >
        <View
          className={`${
            isMyMessage ? "bg-primary-100" : "bg-white"
          } rounded-2xl p-3 max-w-[75%] shadow-sm`}
        >
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              className="w-48 h-36 rounded-lg"
            />
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
                  {item.fileName || "View document"}
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
              {item.content}
            </Text>
          ) : null}
        </View>
        <Text className="text-xs font-NunitoRegular text-gray-400 mt-1">
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
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
  
    if (isError) {
      return (
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
          <Text className="text-red-500 font-NunitoSemiBold">{isError.code}</Text>
        </SafeAreaView>
      );
    }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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
            source={{uri: sellers?.seller.kycDocument.selfieUrl || "https://via.placeholder.com/150"}}
            className="w-10 h-10 rounded-full mr-3"
          />
          <View>
            <Text className="font-RalewayBold text-xl text-black">
              {sellers?.seller.name}
            </Text>
            <Text
              className={`text-base font-NunitoLight ${
                isOtherUserTyping
                  ? "text-primary-100"
                  : sellers?.seller?.Session[0]?.isOnline
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            >
              {isOtherUserTyping
                ? "Typing..."
                : sellers?.seller?.Session[0]?.isOnline
                ? "Online"
                : "Offline"}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
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
              onChangeText={setText}
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
