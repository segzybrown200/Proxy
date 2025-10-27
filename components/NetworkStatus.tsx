import React, { useEffect, useState } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, Platform } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

/**
 * Global network status modal.
 * Shows a bottom modal when there is no connectivity or the connection is very poor (2G).
 * Provides Retry and Proceed Anyway actions. Proceed will hide the modal until connectivity changes.
 */
export default function NetworkStatus() {
  const [netState, setNetState] = useState<NetInfoState | null>(null);
  const [proceedAnyway, setProceedAnyway] = useState(false);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setNetState(state);
      // reset proceedAnyway when connectivity status actually changes
      setProceedAnyway(false);
    });

    // initial fetch
    NetInfo.fetch().then(setNetState).catch(() => {});

    return () => sub();
  }, []);

  if (!netState) return null;

  const { isConnected, isInternetReachable, details } = netState;
  // Cellular generation can be '2g' | '3g' | '4g' | '5g' | null
  // treat 2g as poor
  // when not connected or internet not reachable, show blocking modal
  const cellularGen: string | null = (details as any)?.cellularGeneration ?? null;
  const poorConnection = !isConnected || isInternetReachable === false || cellularGen === "2g" || cellularGen === "slow-2g";

  const show = poorConnection && !proceedAnyway;

  const title = !isConnected || isInternetReachable === false ? "No internet connection" : "Weak connection";
  const message = !isConnected || isInternetReachable === false
    ? "It looks like you don't have an internet connection. Some features are disabled until you reconnect."
    : "Your connection appears to be slow (2G). Sending/receiving messages and media may fail or be slow.";

  const handleRetry = () => {
    NetInfo.fetch().then((s) => setNetState(s)).catch(() => {});
  };

  const handleProceed = () => {
    // allow user to continue despite poor connection for this session
    setProceedAnyway(true);
  };

  return (
    <Modal visible={show} transparent animationType="slide">
      <View style={styles.overlay} pointerEvents="auto">
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.retry]} onPress={handleRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.proceed]} onPress={handleProceed}>
              <Text style={styles.proceedText}>Proceed anyway</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Detected: {isConnected ? (cellularGen ?? 'online') : 'offline'} {Platform.OS === 'ios' ? '(iOS)' : ''}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  container: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginHorizontal: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    marginBottom: 12,
    color: "#333",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  } as any,
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 110,
    alignItems: "center",
  },
  retry: {
    backgroundColor: "#efefef",
  },
  proceed: {
    backgroundColor: "#2563eb",
  },
  retryText: {
    color: "#111",
    fontWeight: "600",
  },
  proceedText: {
    color: "#fff",
    fontWeight: "700",
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
});
