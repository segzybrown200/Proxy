import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { selectUser } from "../../../global/authSlice";
import { reportContent } from "../../../api/api";
import { showError, showSuccess } from "../../../utils/toast";

type ReportTargetType = "LISTING" | "USER" | "MESSAGE";

const REPORT_TYPES: Array<{ value: ReportTargetType; label: string }> = [
  { value: "LISTING", label: "Listing" },
  { value: "USER", label: "User" },
  { value: "MESSAGE", label: "Message" },
];

const REPORT_REASONS = [
  { value: "HARASSMENT", label: "Harassment" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "FRAUD", label: "Fraud" },
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Other" },
];

const getShortReference = (value: string | undefined | null, prefix: string) => {
  const raw = (value || "").toString().trim();
  if (!raw) return "";

  const simplified = raw.replace(/[^a-zA-Z0-9]/g, "");
  if (!simplified) return "";

  if (simplified.length <= 6) {
    return `${prefix}-${simplified.toUpperCase()}`;
  }

  return `${prefix}-${simplified.slice(-6).toUpperCase()}`;
};

const ReportScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useSelector(selectUser) as any;

  const initialTargetType = useMemo(() => {
    const raw = params.targetType;
    if (typeof raw === "string") {
      const normalized = raw.toUpperCase();
      return REPORT_TYPES.some((item) => item.value === normalized)
        ? (normalized as ReportTargetType)
        : "USER";
    }
    return "USER";
  }, [params.targetType]);

  const [targetType, setTargetType] = useState<ReportTargetType>(initialTargetType);
  const [targetId, setTargetId] = useState(() => {
    const raw = params.targetId;
    const prefix =
      initialTargetType === "LISTING"
        ? "LST"
        : initialTargetType === "MESSAGE"
          ? "MSG"
          : "USR";

    return typeof raw === "string" ? getShortReference(raw, prefix) : "";
  });
  const [reason, setReason] = useState("HARASSMENT");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const targetLabel = useMemo(() => {
    const rawLabel = params.targetLabel;
    if (typeof rawLabel === "string" && rawLabel.trim()) return rawLabel;
    return "this item";
  }, [params.targetLabel]);

  const handleSubmit = () => {
    const token = user?.data?.token;
    if (!token) {
      showError("Please log in to submit a report");
      return;
    }

    if (!targetId.trim()) {
      showError("Please enter a target ID before submitting");
      return;
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    const token = user?.data?.token;
    if (!token || !targetId.trim()) {
      setShowConfirm(false);
      return;
    }

    setShowConfirm(false);
    setLoading(true);

    try {
      await reportContent(
        {
          targetType,
          targetId: targetId.trim(),
          reason,
        },
        token,
      );

      showSuccess("Report submitted successfully");
      router.back();
    } catch (error: any) {
      const message =
        error?.message ||
        error?.error ||
        error?.response?.data?.message ||
        "Failed to submit report";
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-gray-200 px-4 pb-4 pt-14">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 rounded-full bg-[#ECF0F4] p-2">
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-RalewayBold text-black">Report</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <Text className="text-lg font-RalewayBold text-black">Report {targetLabel}</Text>
          <Text className="mt-2 text-sm font-NunitoRegular text-gray-600">
            Share what is going on so our team can review it quickly.
          </Text>
        </View>

        <View className="mt-6">
          <Text className="mb-3 text-base font-RalewayBold text-black">What do you want to report?</Text>
          <View className="flex-row flex-wrap">
            {REPORT_TYPES.map((item) => {
              const selected = item.value === targetType;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setTargetType(item.value)}
                  className={`mr-2 mb-2 rounded-full px-4 py-2 ${selected ? "bg-primary-100" : "bg-gray-100"}`}
                >
                  <Text className={`font-NunitoMedium ${selected ? "text-white" : "text-gray-700"}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mt-6">
          <Text className="mb-2 text-base font-RalewayBold text-black">Short reference</Text>
          <TextInput
            value={targetId}
            onChangeText={setTargetId}
            placeholder="e.g. LST-AB12CD"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-NunitoRegular"
            autoCapitalize="characters"
          />
          <Text className="mt-2 text-sm font-NunitoRegular text-gray-500">
            Use a short reference for the selected {targetType.toLowerCase()} instead of the full identifier.
          </Text>
        </View>

        <View className="mt-6">
          <Text className="mb-3 text-base font-RalewayBold text-black">Reason</Text>
          <View>
            {REPORT_REASONS.map((item) => {
              const selected = item.value === reason;
              return (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setReason(item.value)}
                  className={`mb-2 flex-row items-center justify-between rounded-xl border px-4 py-3 ${selected ? "border-primary-100 bg-blue-50" : "border-gray-200 bg-white"}`}
                >
                  <Text className={`font-NunitoMedium ${selected ? "text-primary-100" : "text-gray-700"}`}>
                    {item.label}
                  </Text>
                  {selected ? <Ionicons name="checkmark-circle" size={18} color="#2563EB" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="mt-8 rounded-xl bg-primary-100 px-4 py-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-RalewayBold text-white">Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full rounded-2xl bg-white p-5">
            <Text className="text-xl font-RalewayBold text-black">Confirm report</Text>
            <Text className="mt-2 text-sm font-NunitoRegular text-gray-600">
              Are you sure you want to submit this report?
            </Text>

            <View className="mt-6 flex-row justify-end">
              <TouchableOpacity onPress={() => setShowConfirm(false)} className="mr-3 rounded-lg px-4 py-3">
                <Text className="font-NunitoSemiBold text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSubmit} className="rounded-lg bg-primary-100 px-4 py-3">
                <Text className="font-NunitoSemiBold text-white">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ReportScreen;
