import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { IndianRupee, HeartIcon, PaperclipIcon } from "lucide-react-native"; // React Native Lucide icons
import { useAuthStore } from "@/store/useAuthStore";
import { useLocalSearchParams, useRouter } from "expo-router"; // Expo Router for navigation
import { useThumbnailsGenerate } from "@/utils/useThumbnailGenerator";
import ThemedView from "@/components/ThemedView";
import ProfileTopbar from "@/components/profileTopbar";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get('window');

export default function PublicCommunityPage() {
  const [activeTab, setActiveTab] = useState("long");
  const [communityData, setCommunityData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const { isLoggedIn, token } = useAuthStore();
  const router = useRouter();

  // const id = "686cc5084b2928ecdc64f263";
  const { id } = useLocalSearchParams();

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  const thumbnails = useThumbnailsGenerate(
    useMemo(
      () =>
        videos.map((video) => ({
          id: video._id,
          url: video.videoUrl,
        })),
      [videos]
    )
  );

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/(auth)/Sign-in"); // Use router.push for navigation in Expo Router
      return;
    }

    const fetchUserVideos = async () => {
      setIsLoadingVideos(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("type", activeTab);
        const response = await fetch(
          `${BACKEND_API_URL}/community/${id}/videos?videoType=${activeTab}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch community videos");
        }
        console.log("videos", data);
        setVideos(data.videos);
      } catch (err) {
        console.error("Error fetching community videos:", err);
        Alert.alert(
          "Error",
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching videos."
        );
      } finally {
        setIsLoadingVideos(false);
      }
    };

    if (token && id) {
      fetchUserVideos();
    }
  }, [isLoggedIn, activeTab, router, token, id]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/(auth)/Sign-in");
      return;
    }

    const fetchCommunityData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${BACKEND_API_URL}/community/${id}`, {
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

        console.log(data);
        setCommunityData(data);
      } catch (error) {
        console.log(error);
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "An unknown error occurred while fetching community data."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (token && id) {
      fetchCommunityData();
    }
  }, [isLoggedIn, router, id, token]);

  const followCommunity = async () => {
    try {
      setIsFollowing(true);
      const response = await fetch(`${BACKEND_API_URL}/community/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ communityId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to follow community profile");
      }

      console.log(data);
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "An unknown error occurred while following community."
      );
    } finally {
      setIsFollowing(false);
    }
  };

  const renderVideoItem = ({ item }: { item: any }) => (
    <Pressable className="w-full h-[100vh] mb-4 relative rounded-lg overflow-hidden bg-black">
      {item.thumbnailUrl !== "" ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          alt="video thumbnail"
          className="w-full h-full object-cover"
        />
      ) : thumbnails[item._id] ? (
        <Image
          source={{ uri: thumbnails[item._id] }}
          alt="video thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <View className="w-full h-full flex items-center justify-center">
          <Text className="text-white text-xs">Loading...</Text>
        </View>
      )}
    </Pressable>
  );

  const renderGridItem = ({ item }: { item: any }) => (
    <TouchableOpacity className="relative aspect-[9/16] flex-1 rounded-sm overflow-hidden">
      {item.thumbnailUrl !== "" ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          alt="video thumbnail"
          className="w-full h-full object-cover"
        />
      ) : thumbnails[item._id] ? (
        <Image
          source={{ uri: thumbnails[item._id] }}
          alt="video thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <View className="w-full h-full flex items-center justify-center">
          <Text className="text-white text-xs">Loading...</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={{ height }}>
      <SafeAreaView>
        {/* Cover Image */}
        {!isLoading && (
          <View className="h-48 relative">
            <ProfileTopbar
              isMore={false}
              hashtag={true}
              name={communityData?.name}
            />
          </View>
        )}

        {isLoading ? (
          <View className="w-full flex items-center justify-center h-full">
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : (
          <View className="max-w-4xl -mt-28 relative mx-6">
            <View className="flex flex-col items-center md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
              <View className="relative flex flex-col items-center w-full">
                {/* Replaced Avatar with Image for simplicity, you can create a custom Avatar component */}
                <View className="size-24 rounded-full border border-white overflow-hidden">
                  <Image
                    source={{
                      uri: communityData?.profile_photo,
                    }}
                    className="w-full h-full object-cover rounded-full"
                  />
                </View>
                <View className="flex flex-row items-center justify-center w-full mt-2">
                  <Text className="text-gray-400">
                    {communityData?.founder &&
                      `By @ ${communityData?.founder.username}`}
                  </Text>
                  {communityData?.isPrivate && (
                    <Text className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Private
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Stats */}
            <View className="mt-6 flex flex-row justify-around items-center">
              <TouchableOpacity
                className="flex flex-col gap-1 items-center"
                onPress={() => setActiveTab("followers")}
              >
                <Text className="font-bold text-lg text-white">
                  {communityData?.followers?.length || 0}
                </Text>
                <Text className="text-gray-400 text-md">Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex flex-col gap-1 items-center"
                onPress={() => setActiveTab("following")}
              >
                <Text className="font-bold text-lg text-white">
                  {communityData?.creators?.length || 0}
                </Text>
                <Text className="text-gray-400 text-md">Creators</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex flex-col gap-1 items-center"
                onPress={() => setActiveTab("posts")}
              >
                <Text className="font-bold text-lg text-white">
                  {communityData?.total_uploads || 0}
                </Text>
                <Text className="text-gray-400 text-md">Videos</Text>
              </TouchableOpacity>
            </View>

            {/* Buttons */}
            <View className="flex flex-row w-full items-center justify-center gap-2 mt-5 md:mt-0">
              <TouchableOpacity
                onPress={() => followCommunity()}
                className="flex-1 px-4 py-2 rounded-xl bg-transparent border border-gray-400"
              >
                <Text className="text-white text-center">Follow</Text>
              </TouchableOpacity>

              {communityData?.community_fee_type !== "free" && (
                <TouchableOpacity className="flex-1 px-4 py-2 rounded-xl bg-transparent border border-white">
                  {communityData?.community_fee_type === "free" ? (
                    <Text className="text-white text-center">Free</Text>
                  ) : (
                    <View className="flex-row items-center justify-center">
                      <Text className="text-white">Join at </Text>
                      <IndianRupee color={"white"} size={13} />
                      <Text className="text-white text-center">
                        {communityData?.community_fee_amount}/month
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Bio */}
            <View className="mt-6 flex flex-col items-center justify-center px-4">
              <Text className="text-gray-400 text-xs text-center">
                {communityData?.bio}
              </Text>
            </View>

            {/* Tabs */}
            <View className="mt-6 border-gray-700">
              <View className="flex flex-row justify-around items-center">
                <TouchableOpacity
                  className={`pb-4 flex-1 items-center justify-center`}
                  onPress={() => setActiveTab("long")}
                >
                  <PaperclipIcon
                    color={activeTab === "long" ? "white" : "gray"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  className={`pb-4 flex-1 items-center justify-center`}
                  onPress={() => setActiveTab("likes")}
                >
                  <HeartIcon
                    color={activeTab === "likes" ? "white" : "gray"}
                    fill={activeTab === "likes" ? "white" : ""}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <>
          {isLoadingVideos ? (
            <View className="w-full h-96 flex items-center justify-center mt-20">
              <ActivityIndicator size="large" color="white" />
            </View>
          ) : activeTab === "long" ? (
            <FlatList
              data={videos}
              keyExtractor={(item) => item._id}
              renderItem={renderVideoItem}
              contentContainerStyle={{
                paddingBottom: 30,
                paddingHorizontal: 0,
              }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={videos}
              keyExtractor={(item) => item._id}
              renderItem={renderGridItem}
              numColumns={3}
              contentContainerStyle={{
                paddingBottom: 30,
                paddingHorizontal: 0,
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      </SafeAreaView>
    </ThemedView>
  );
}
