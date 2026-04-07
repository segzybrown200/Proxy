import { useEffect, useRef } from "react";
import { Alert, AppState, AppStateStatus, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
/* ==============================
   🔧 CONFIGURATION
   ============================== */
const API_URL = "https://proxy-backend-1rfl.onrender.com/api"; // change to your backend base
const SOCKET_URL = "https://proxy-backend-1rfl.onrender.com"; // same origin as backend

/* ==============================
   🧠 HOOK: useSessionAndSocket
   ============================== */

export function useSessionAndSocket(
  token: string | null,
  user: { id: string; email?: string } | null
) {
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const appState = useRef(AppState.currentState);

  // Axios instance with auth header
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
  });

  /* ----------------------------------
         1️⃣ Register session after login (reuse stored sessionId if present)
         ---------------------------------- */
  useEffect(() => {
    if (!token || !user) return;
    (async () => {
      try {
        // Get Expo push token (request permissions if needed)
        let deviceToken: string | null = null;
        try {
          const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;


        if (!projectId) {
          console.error('No project ID found. Please configure in app.json');
          return;
        }
          if (finalStatus === "granted") {
            const tokenData = await Notifications.getExpoPushTokenAsync({
              projectId: projectId,
            });

            // tokenData may be an object like { data: 'ExponentPushToken[...]' } or a string
            // normalize to string
            // @ts-ignore
            deviceToken = tokenData.data ?? tokenData;
    
            if (Platform.OS === "android") {
              Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
              });
            }
          } else {
            console.warn("Push notification permissions not granted");
          }
        } catch (e) {
          console.error("Error fetching Expo push token:", e);
        }

        // try to reuse existing sessionId stored locally to avoid creating duplicates
        const sessionId = await AsyncStorage.getItem("sessionId");

        const payload: any = {
          device: Platform.OS === "ios" ? "iPhone" : "Android Device",
          deviceToken,
          devicePlatform: Platform.OS === "ios" ? "iOS" : "expo",
        };
        if (sessionId) {
          // include sessionId so backend updates existing session instead of creating a new one
          payload.sessionId = sessionId;
        }

        const { data } = await api.post("/sessions/register", payload);

        const sid = data.data?.id ?? data.sessionId ?? data.session_id ?? null;
        if (sid) {
          sessionIdRef.current = sid;
          await AsyncStorage.setItem("sessionId", sid);
        }
        if (sid) initSocketAndJoin(token, sid, user.id);
      } catch (err: any) {
        console.error(
          "❌ registerDeviceSession error:",
          err.response?.data || err.message
        );
      }
    })();
  }, [token, user]);

  /* ----------------------------------
         2️⃣ Handle app foreground/background
         ---------------------------------- */
  useEffect(() => {
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, []);

  async function handleAppStateChange(nextState: AppStateStatus) {
    try {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        await updateSessionOnline(true);
        if (socketRef.current && sessionIdRef.current && user) {
          socketRef.current.emit("join", {
            sessionId: sessionIdRef.current,
            userId: user.id,
          });
        }
      } else if (nextState.match(/inactive|background/)) {
        await updateSessionOnline(false);
      }
      appState.current = nextState;
    } catch (err) {
      console.error("AppStateChange error:", err);
    }
  }

  /* ----------------------------------
         3️⃣ Init Socket.IO connection
         ---------------------------------- */
  function initSocketAndJoin(token: string, sessionId: string, userId: string) {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SOCKET_URL, {
      // allow polling first, then upgrade to websocket. Many proxies (Render, nginx, etc.)
      // block direct websocket upgrades — enabling polling here helps the handshake succeed
      // and then the client will upgrade when possible.
      transports: ["polling", "websocket"],
      auth: { token },
      // Increase reconnection attempts for flaky connections
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔗 Socket connected:", socket.id);
      socket.emit("join", { sessionId, userId });
    });

    socket.on("joined", (payload) => console.log("🟢 Joined socket:", payload));
    socket.on("disconnect", (reason) =>
      console.log("🔴 Socket disconnected:", reason)
    );
    socket.on("error", (err) => console.error("⚠️ Socket error:", err));

    // Listening events
    // socket.on("receive_message", (msg) => console.log("📩 New message:", msg));
    // socket.on("typing", ({ from }) => console.log("✍️ Typing:", from));
    // socket.on("stop_typing", ({ from }) => console.log("🙅‍♂️ Stop typing:", from));
    // socket.on("message_delivered", (data) => console.log("✅ Delivered:", data));
    // socket.on("messages_read", (data) => console.log("👁 Read:", data));

    // Clear any existing listeners to prevent duplicates
    socket.removeAllListeners("receive_message");
    socket.removeAllListeners("typing");
    socket.removeAllListeners("stop_typing");
    socket.removeAllListeners("message_delivered");
    socket.removeAllListeners("messages_read");
  }

  /* ----------------------------------
         4️⃣ Update session online/offline
         ---------------------------------- */
  async function updateSessionOnline(isOnline: boolean) {
    try {
      const sid = sessionIdRef.current;
      if (!sid || !token) return;
      await api.put(`/sessions/update/${sid}`, { isOnline });
    } catch (err: any) {
      console.error(
        "updateSessionOnline error:",
        err.response?.data || err.message
      );
    }
  }

  /* ----------------------------------
         5️⃣ Messaging helpers
         ---------------------------------- */

  function sendMessage(payload: {
    receiverId: string;
    content?: string;
    listingId?: string;
    tempId?: string;
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
  }) {
    socketRef.current?.emit("send_message", payload);
  }

  async function sendMediaMessage(receiverId: string, type: "image" | "pdf") {
    try {
      let base64 = "";
      let mediaType: "image" | "pdf" = type;

      if (type === "image") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: true,
          quality: 0.8,
        });
        if (result.canceled) return;
        base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
        });
        if (result.canceled || !result.assets?.[0]?.uri) return;
        const file = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (
          fileInfo.exists &&
          "size" in fileInfo &&
          fileInfo.size &&
          fileInfo.size > 10 * 1024 * 1024
        ) {
          Alert.alert("File too large", "Maximum allowed size is 10MB");
          return;
        }
        const b64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64 = `data:application/pdf;base64,${b64}`;
      }

      if (!socketRef.current) throw new Error("Socket not connected");

      socketRef.current.emit("send_message", {
        receiverId,
        media: base64,
        mediaType,
      });

      console.log(`📤 ${mediaType.toUpperCase()} sent`);
    } catch (err) {
      console.error("sendMediaMessage error:", err);
    }
  }

  // --- Typing indicators
  function emitTyping(to: string) {
    socketRef.current?.emit("typing", { to });
  }
  function emitStopTyping(to: string) {
    socketRef.current?.emit("stop_typing", { to });
  }

  // --- Message status
  function ackDelivered(messageId: string) {
    socketRef.current?.emit("ack_delivered", { messageId });
  }
  function ackRead(messageIds: string[], senderId: string) {
    socketRef.current?.emit("ack_read", { messageIds, senderId });
  }
  /* ----------------------------------
   🛵 Rider Helper Functions
   ---------------------------------- */
  async function updateRiderLocation(
    lat: number,
    lng: number,
    riderId: string
  ) {
    try {
      console.log(riderId);
      socketRef.current?.emit("rider_update_location", {
        riderId,
        lat,
        lng,
      });
    } catch (err) {
      console.error("updateRiderLocation error:", err);
    }
  }

  function toggleRiderOnline(isOnline: boolean, riderId: string) {
    socketRef.current?.emit("rider_toggle_online", {
      riderId,
      isOnline,
    });
    console.log("🟢 Rider status toggled:", isOnline ? "Online" : "Offline");
  }

  function acceptDelivery(deliveryId: string, riderId: string) {
    socketRef.current?.emit("rider_accept_delivery", {
      riderId,
      deliveryId,
    });
    console.log("✅ Rider accepted delivery:", deliveryId);
  }

  // Helper: run callback once socket is ready/connected
  function onSocketReady(cb: (socket: Socket) => void) {
    const s = socketRef.current;
    if (s && s.connected) {
      cb(s);
      return () => {};
    }
    if (s) {
      const handler = () => cb(s);
      s.once("connect", handler);
      return () => s.off("connect", handler);
    }
    // fallback: poll until available
    const timer = setInterval(() => {
      const ss = socketRef.current;
      if (ss && ss.connected) {
        cb(ss);
        clearInterval(timer);
      }
    }, 250);
    return () => clearInterval(timer);
  }

  /* ----------------------------------
         6️⃣ Cleanup on logout
         ---------------------------------- */
  async function cleanupOnLogout() {
    try {
      if (token) await api.post("/sessions/logout");
      await updateSessionOnline(false);
      socketRef.current?.disconnect();
      socketRef.current = null;
      // remove stored sessionId so next login/register will create a fresh session if needed
      try {
        await AsyncStorage.removeItem("sessionId");
      } catch (e) {
        console.warn("Failed to remove sessionId from storage", e);
      }
      console.log("👋 Session and socket cleaned up");
    } catch (err: any) {
      console.error(
        "cleanupOnLogout error:",
        err.response?.data || err.message
      );
    }
  }

  return {
    sendMediaMessage,
    emitTyping,
    sendMessage,
    emitStopTyping,
    ackDelivered,
    ackRead,
    onSocketReady,
    cleanupOnLogout,
    getSessionId: () => sessionIdRef.current,
    getSocket: () => socketRef.current,
    updateRiderLocation,
    toggleRiderOnline,
    acceptDelivery,
  };
}
