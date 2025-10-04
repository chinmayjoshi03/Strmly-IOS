import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import {
  X,
  Unlock,
  Calendar,
  Ban,
  Heart,
  Paperclip,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { useAuthStore } from "@/store/useAuthStore";
import Constants from "expo-constants";
import { useGiftingStore } from "@/store/useGiftingStore";
import { SafeAreaView } from "react-native-safe-area-context";

const SeriesAccess = () => {
  const [seriesData, setSeriesData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const { token } = useAuthStore();
  const { initiateSeries } = useGiftingStore();

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);
  nextMonth.setDate(today.getDate() + 1); // Next day of same date next month

  const formatDate = (date: Date) =>
    `${date.getDate()} ${date.toLocaleString("default", { month: "long" })}`;

  const validFrom = formatDate(today);
  const validTo = formatDate(nextMonth);

  useEffect(() => {
    if (!id && !token) return;

    const fetchSeriesData = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/series/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch series data");
        }

        setSeriesData(data.data);
        console.log("Series data", data.data);
      } catch (error) {
        console.log(error);
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "An unknown error occurred while fetching series data."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (token && id) {
      fetchSeriesData();
    }
  }, [token, id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={[]}>
      <View className="flex-1 bg-black">

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color="white" />
          </TouchableOpacity>
          <View className="w-6" />
        </View>

        {/* Content - Shifted upward */}
        <View className="flex-1 items-center justify-center px-6 mt-[-90px]">
          {/* Paperclip Icon */}
          <View className="mb-8">
            <View className="w-20 h-20 rounded-2xl items-center justify-center">
              <Paperclip size={75} color="white" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-white text-2xl font-bold mb-2">
            Series Access
          </Text>

          {/* Features Card */}
          <View className="w-full max-w-md rounded-2xl mb-8 overflow-hidden">
            {/* Grey Border */}
            <View className="p-[2px] rounded-3xl bg-black">
              {/* Inner Card with Black Background */}
              <View className="bg-black rounded-3xl p-8 border border-gray-900">
                {/* Feature 1 */}
                <View className="flex-row items-start mb-8">
                  <View className="mr-6 mt-1">
                    <Unlock size={28} color="#10B981" />
                  </View>
                  <Text className="text-white text-sm flex-1 leading-6">
                    Unlock all episodes in this series by{" "}
                    {seriesData?.created_by?.username}
                  </Text>
                </View>

                {/* Feature 2 */}
                <View className="flex-row items-start mb-8">
                  <View className="mr-6 mt-1">
                    <Calendar size={28} color="white" />
                  </View>
                  <Text className="text-white text-sm flex-1 leading-6">
                    Valid from {validFrom} to {validTo}
                  </Text>
                </View>

                {/* Feature 3 */}
                <View className="flex-row items-start mb-8">
                  <View className="mr-6 mt-1">
                    <Ban size={28} color="white" />
                  </View>
                  <Text className="text-white text-sm flex-1 leading-6">
                    Access to all future episodes in this series
                  </Text>
                </View>

                {/* Feature 4 */}
                <View className="flex-row items-start">
                  <View className="mr-6 mt-1">
                    <Heart size={28} color="#EF4444" fill="#EF4444" />
                  </View>
                  <Text className="text-white text-sm flex-1 leading-6">
                    Support the creator's ongoing series
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Join Button */}
          <View className="rounded-3xl border border-gray-800 bg-black">
            <TouchableOpacity
              onPress={() => {
                initiateSeries(seriesData);
                router.replace(
                  `/(payments)/SeriesPassBuy/${seriesData?.created_by?._id}`
                );
              }}
              className="px-8 py-4 rounded-full"
            >
              <Text className="text-white text-lg font-medium">
                Join at ₹{seriesData?.price}/series
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SeriesAccess;