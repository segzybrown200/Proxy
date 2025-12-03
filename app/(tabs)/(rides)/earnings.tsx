import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

interface EarningsSummary {
  period: string;
  amount: string;
  rides: number;
  avgPerRide: string;
}

interface Transaction {
  id: string;
  date: string;
  type: "earning" | "withdrawal";
  amount: string;
  description: string;
}

const Earnings = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">(
    "today"
  );

  // Mock data - replace with actual API calls
  const summaries: Record<string, EarningsSummary> = {
    today: {
      period: "Today",
      amount: "$45.00",
      rides: 5,
      avgPerRide: "$9.00",
    },
    week: {
      period: "This Week",
      amount: "$320.00",
      rides: 35,
      avgPerRide: "$9.14",
    },
    month: {
      period: "This Month",
      amount: "$1,280.00",
      rides: 142,
      avgPerRide: "$9.01",
    },
  };

  const transactions: Transaction[] = [
    {
      id: "1",
      date: "Today, 2:30 PM",
      type: "earning",
      amount: "$12.00",
      description: "Order #123 completed",
    },
    {
      id: "2",
      date: "Today, 1:15 PM",
      type: "earning",
      amount: "$15.00",
      description: "Order #122 completed",
    },
    {
      id: "3",
      date: "Today, 12:00 PM",
      type: "withdrawal",
      amount: "-$100.00",
      description: "Withdrawal to bank account",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header with Period Selector */}
      <View className="bg-white p-6">
        <Text className="text-2xl font-bold mb-4">Earnings</Text>
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          {(["today", "week", "month"] as const).map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              className={`flex-1 py-2 rounded-lg ${
                selectedPeriod === period ? "bg-white shadow" : ""
              }`}
            >
              <Text
                className={`text-center font-medium ${
                  selectedPeriod === period ? "text-primary" : "text-gray-500"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Earnings Summary */}
      <View className="bg-primary mx-4 mt-4 p-6 rounded-xl">
        <Text className="text-white opacity-80">Total Earnings</Text>
        <Text className="text-white text-3xl font-bold mt-1">
          {summaries[selectedPeriod].amount}
        </Text>
        <View className="flex-row justify-between mt-4 pt-4 border-t border-white/20">
          <View>
            <Text className="text-white opacity-80">Rides</Text>
            <Text className="text-white font-bold mt-1">
              {summaries[selectedPeriod].rides}
            </Text>
          </View>
          <View>
            <Text className="text-white opacity-80">Avg. per Ride</Text>
            <Text className="text-white font-bold mt-1">
              {summaries[selectedPeriod].avgPerRide}
            </Text>
          </View>
        </View>
      </View>

      {/* Transactions */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-bold mb-3">Recent Transactions</Text>
        {transactions.map((transaction) => (
          <View
            key={transaction.id}
            className="bg-white p-4 rounded-xl mb-3 shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">
                  {transaction.description}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  {transaction.date}
                </Text>
              </View>
              <Text
                className={`font-bold ${
                  transaction.type === "earning"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.amount}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default Earnings;