import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

const VideoAccess = () => {
  const router = useRouter();
  const route = useRoute();
  const [videoData, setVideoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = route.params as { id: string };
  // const id = "68978209f59701af962d1fa5";
  const { token } = useAuthStore();
  const { initiateVideoAccess } = useGiftingStore();

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/videos/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch community profile");
        }

        console.log("video data", data);
        setVideoData(data.video);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token && id) {
      fetchVideoData();
    }
  }, [id, token]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={[]}>
      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 mt-5">
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
            Video Access
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
                    Unlock this premium video by @
                    {videoData?.created_by.username}
                  </Text>
                </View>

                {/* Feature 2 */}
                <View className="flex-row items-start mb-8">
                  <View className="mr-6 mt-1">
                    <Calendar size={28} color="white" />
                  </View>
                  <Text className="text-white text-sm flex-1 leading-6">
                    Lifetime access to this video
                  </Text>
                </View>

                {/* Feature 3 */}
                <View className="flex-row items-start mb-8">
                  <View className="mr-6 mt-1">
                    <Ban size={28} color="white" />
                  </View>
                  <Text className="text-white text-sm flex-1 leading-6">
                    Watch unlimited times with no restrictions
                  </Text>
                </View>

                {/* Feature 4 */}
                <View className="flex-row items-start">
                  <View className="mr-6 mt-1">
                    <Heart size={28} color="#EF4444" fill="#EF4444" />
                  </View>
                  <Text className="text-white text-sm flex-1 leading-6">
                    Directly support the creator's work
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Join Button */}
          <View className="rounded-3xl border border-gray-800 bg-black">
            <TouchableOpacity
              onPress={() => {
                initiateVideoAccess(videoData?.created_by, videoData.name, id);
                router.replace({
                  pathname: `/(payments)/VideoBuy/[id]`,
                  params: { id: id },
                });
              }}
              className="px-8 py-4 rounded-full"
            >
              <Text className="text-white text-lg font-medium">
                Buy for ₹{videoData?.access.price}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default VideoAccess;