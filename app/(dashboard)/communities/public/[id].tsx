import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  Dimensions,
  BackHandler,
} from "react-native";
import {
  IndianRupee,
  HeartIcon,
  PaperclipIcon,
  Video,
} from "lucide-react-native";

import { useAuthStore } from "@/store/useAuthStore";
import ThemedView from "@/components/ThemedView";
import ProfileTopbar from "@/components/profileTopbar";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { useRoute } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import CommunityPassBuyMessage from "./CommPassBuyMessage";
import { useGiftingStore } from "@/store/useGiftingStore";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVideosStore } from "@/store/useVideosStore";

const { height } = Dimensions.get("window");

export default function PublicCommunityPage() {
  const [activeTab, setActiveTab] = useState<string>("videos");
  const [communityData, setCommunityData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowingCommunity, setIsFollowingCommunity] = useState(false);
  const [isFollowingLoading, setFollowingLoading] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  const [hasCommunityPass, setHasCommunityPass] = useState<boolean>(false);

  const [videoType, setVideoType] = useState("long");

  const { token, user } = useAuthStore();
  const { setVideosInZustand } = useVideosStore();

  const {
    isPurchasedCommunityPass,
    clearCommunityPassData,
    creator,
    giftSuccessMessage,
  } = useGiftingStore();

  const route = useRoute();
  const router = useRouter();

  const { id } = route.params as { id: string };
  // const id = "6890586c8039a7684646c364";

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  useEffect(() => {
    const fetchUserVideos = async () => {
      if (activeTab !== "videos") {
        return;
      }

      setIsLoadingVideos(true);
      try {
        console.log("🔄 Fetching videos for type:", videoType);
        const response = await fetch(
          `${BACKEND_API_URL}/community/${id}/videos?videoType=${videoType}`,
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
        console.log("✅ Videos fetched:", data.videos?.length || 0);
        setVideos(data.videos || []);
        setVideosInZustand(data.videos || []);
      } catch (err) {
        console.error("❌ Error fetching community videos:", err);
        setVideos([]);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    const fetchUserLikeVideos = async () => {
      setIsLoadingVideos(true);
      try {
        console.log("🔄 Fetching Like videos for tab:", activeTab);
        const response = await fetch(
          `${BACKEND_API_URL}/user/liked-videos-community/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch community like videos"
          );
        }
        console.log("✅ Like Videos fetched:", data.videos?.length || 0);
        setVideos(data.videos || []);
        setVideosInZustand(data.videos || []);
      } catch (err) {
        console.error("❌ Error fetching community like videos:", err);
        setVideos([]);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    if (token && id) {
      if (videoType == "long") {
        fetchUserVideos();
      } else if (videoType == "liked") {
        fetchUserLikeVideos();
      }
    }
  }, [activeTab, videoType, token, id, BACKEND_API_URL]);

  useFocusEffect(
    useCallback(() => {
      const fetchCommunityData = async () => {
        try {
          const response = await fetch(`${BACKEND_API_URL}/community/${id}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || "Failed to fetch community profile"
            );
          }

          console.log("🏘️ Community data received:", {
            name: data.name,
            profile_photo: data.profile_photo,
            founder: data.founder,
          });
          setCommunityData(data);
          setIsFollowingCommunity(
            data.followers.some(
              (follower: { _id: string }) => follower._id === user?.id
            )
          );
        } catch (error) {
          console.log(error);
          Alert.alert("An unknown error occurred.");
          // Alert.alert(
          //   "Error",
          //   error instanceof Error
          //     ? error.message
          //     : "An unknown error occurred while fetching community data."
          // );
        } finally {
          setIsLoading(false);
        }
      };

      if (token && id) {
        fetchCommunityData();
      }
    }, [id, token, isFollowingCommunity])
  );

  useFocusEffect(
    useCallback(() => {
      const checkIfFollowCommunity = async () => {
        if (!token || !id) {
          return;
        }

        try {
          const response = await fetch(
            `${BACKEND_API_URL}/community/${id}/following-status`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (!response.ok)
            throw new Error("Failed while checking community follow status");
          const data = await response.json();
          // console.log("check follow community", data);
          setIsFollowingCommunity(data.status);
        } catch (err) {
          console.log("Error in community check status", err);
        }
      };

      if (token && id) {
        checkIfFollowCommunity();
      }
    }, [token, id])
  );

  const followCommunity = async () => {
    try {
      setFollowingLoading(true);
      const response = await fetch(
        `${BACKEND_API_URL}/${isFollowingCommunity ? "caution/community/unfollow" : "community/follow"}`,
        {
          method: !isFollowingCommunity ? "POST" : "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ communityId: id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to follow community profile");
      }

      console.log("Follow comm data", data);
      setIsFollowingCommunity(data.isFollowingCommunity);
    } catch (error) {
      console.log(error);
      Alert.alert("An unknown error occurred.");
      // Alert.alert(
      //   "Error",
      //   error instanceof Error
      //     ? error.message
      //     : "An unknown error occurred while following community."
      // );
    } finally {
      setFollowingLoading(false);
    }
  };

  // Check if Community pass is already purchased
  useFocusEffect(
    useCallback(() => {
      const HasCommunityPass = async () => {
        try {
          const response = await fetch(
            `${BACKEND_API_URL}/user/has-community-access/${id}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || "Failed to fetch user creator pass"
            );
          }

          console.log("has Creator pass", data);
          setHasCommunityPass(data.data.hasCommunityAccess);
        } catch (error) {
          console.log(error);
          Alert.alert("An unknown error occurred.");
          // Alert.alert(
          //   "Error",
          //   error instanceof Error
          //     ? error.message
          //     : "An unknown error occurred while following user."
          // );
        } finally {
          setIsLoading(false);
        }
      };

      if (id && token) {
        HasCommunityPass();
      }
    }, [id, token])
  );

  // Handle section changes
  const handleSectionChange = (section: string) => {
    setActiveTab(section);
  };

  // Navigate to user profile
  const navigateToUserProfile = (userId: string) => {
    console.log("🔄 Navigating to user profile:", userId);
    try {
      router.push(`/(dashboard)/profile/public/${userId}` as any);
    } catch (error) {
      console.error("❌ Navigation error:", error);
    }
  };

  // Render functions for videos - consistent thumbnail format
  const renderVideoItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      className="relative aspect-[9/16] w-full rounded-lg overflow-hidden mb-3"
      onPress={() =>
        router.push({
          pathname: "/(dashboard)/long/GlobalVideoPlayer",
          params: { startIndex: index.toString() },
        })
      }
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          className="w-full h-full object-cover"
        />
      ) : (
        <View className="w-full h-full flex items-center justify-center bg-gray-800">
          <Video size={40} color="white" />
          <Text className="text-white text-xs mt-2">Loading...</Text>
        </View>
      )}

      {/* Video overlay info */}
      <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <Text className="text-white text-sm font-medium" numberOfLines={2}>
          {item.title || item.name || "Untitled"}
        </Text>
        {item.created_by && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              navigateToUserProfile(item.created_by._id);
            }}
            className="mt-1"
          >
            <Text className="text-gray-300 text-xs">
              @{item.created_by.username}
            </Text>
          </TouchableOpacity>
        )}
        <View className="flex-row items-center mt-1 space-x-3">
          {item.views && (
            <Text className="text-gray-400 text-xs">{item.views} views</Text>
          )}
          {item.likes && (
            <Text className="text-gray-400 text-xs">{item.likes} likes</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGridItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      className="relative aspect-[9/16] flex-1 rounded-lg overflow-hidden m-1"
      onPress={() =>
        router.push({
          pathname: "/(dashboard)/long/GlobalVideoPlayer",
          params: { startIndex: index.toString() },
        })
      }
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          className="w-full h-full object-cover"
        />
      ) : (
        <View className="w-full h-full flex items-center justify-center bg-gray-800">
          <Video size={20} color="white" />
        </View>
      )}

      {/* Compact overlay for grid */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
        <Text className="text-white text-xs font-medium" numberOfLines={1}>
          {item.title || item.name || "Untitled"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : (
        <SafeAreaView className="flex-1" edges={[]}>
          <FlatList
            ListHeaderComponent={
              <View className="max-w-4xl -mt-24 relative mx-6 pt-24">
                <ProfileTopbar
                  isMore={false}
                  name={communityData?.name}
                  hashtag={false}
                />
                <View className="items-center justify-center gap-4 h-fit w-full mt-6">
                  <Image
                    source={{
                      uri: getProfilePhotoUrl(
                        communityData?.profile_photo,
                        "community"
                      ),
                    }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 2,
                      borderColor: "white",
                      resizeMode: "cover",
                    }}
                  />
                  <Text className="text-white text-center text-sm">
                    {communityData?.founder &&
                      `By @${communityData?.founder.username}`}
                  </Text>
                  {/* {profileData.isPrivate && (
                      <Text className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Private
                      </Text>
                    )} */}
                </View>

                {/* Section Navigation */}
                <View className="mt-6 flex-row justify-around items-center border-gray-800">
                  <TouchableOpacity
                    className={`flex flex-col gap-1 items-center pb-4 flex-1 ${activeTab === "followers" ? "border-b-2 border-white" : ""}`}
                    onPress={() => {
                      // router.push({
                      //   pathname: "/(communities)/CommunitySections",
                      //   params: {
                      //     communityId: id,
                      //     communityName: communityData?.name,
                      //     section: "followers",
                      //   },
                      // } as any);
                    }}
                  >
                    <Text className="font-bold text-lg text-white">
                      {communityData?.followers?.length || 0}
                    </Text>
                    <Text
                      className={`text-md ${activeTab === "followers" ? "text-white" : "text-gray-400"}`}
                    >
                      Followers
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex flex-col gap-1 items-center pb-4 flex-1 ${activeTab === "creators" ? "border-b-2 border-white" : ""}`}
                  // onPress={() => {
                  //   router.push({
                  //     pathname: "/(communities)/CommunitySections",
                  //     params: {
                  //       communityId: id,
                  //       communityName: communityData?.name,
                  //       section: "creators",
                  //     },
                  //   } as any);
                  // }}
                  >
                    <Text className="font-bold text-lg text-white">
                      {communityData?.creators?.length || 0}
                    </Text>
                    <Text
                      className={`text-md ${activeTab === "creators" ? "text-white" : "text-gray-400"}`}
                    >
                      <Text
                        className={`text-md ${activeTab === "creators" ? "text-white" : "text-gray-400"}`}
                      >
                        Creators
                      </Text>
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex flex-col gap-1 items-center pb-4 flex-1 ${activeTab === "videos" ? "border-b-2 border-white" : ""}`}
                    onPress={() => handleSectionChange("videos")}
                  >
                    <Text className="font-bold text-lg text-white">
                      {videos.length || 0}
                    </Text>
                    <Text
                      className={`text-md ${activeTab === "videos" ? "text-white" : "text-gray-400"}`}
                    >
                      Videos
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Buttons */}
                <View className="flex flex-row w-full items-center mt-5 md:mt-0" style={{ gap: 12 }}>
                  <TouchableOpacity
                    onPress={followCommunity}
                    className="px-4 py-2 rounded-xl bg-transparent border border-gray-400"
                    style={{ flex: 1 }}
                  >
                    <Text className="text-white text-center font-medium">
                      {!isFollowingCommunity ? "Follow" : "Following"}
                    </Text>
                  </TouchableOpacity>

                  {!hasCommunityPass && (
                    <TouchableOpacity
                      onPress={() => {
                        if (communityData?.community_fee_type !== "free") {
                          router.push({
                            pathname:
                              "/(dashboard)/PurchasePass/PurchaseCommPass/[id]",
                            params: { id: id },
                          });
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-transparent border border-gray-400"
                      style={{ flex: 1 }}
                    >
                      {communityData?.community_fee_type === "free" ? (
                        <Text className="text-white text-center font-medium">Free</Text>
                      ) : (
                        <View className="flex-row items-center justify-center">
                          <Text className="text-white font-medium">Join at </Text>
                          <IndianRupee color={"white"} size={13} />
                          <Text className="text-white font-medium">
                            {communityData?.community_fee_amount}/month
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}

                  {hasCommunityPass && (
                    <TouchableOpacity
                      className="rounded-xl overflow-hidden"
                      style={{ flex: 1 }}
                    >
                      <LinearGradient
                        colors={[
                          "#4400FFA6",
                          "#FFFFFF",
                          "#FF00004D",
                          "#FFFFFF",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-[1px] rounded-xl"
                      >
                        <View className="px-4 py-2 rounded-xl bg-black items-center justify-center">
                          <Text className="text-white font-medium text-center">
                            Purchased
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Bio */}
                {communityData?.bio && (
                  <View className="mt-6 flex flex-col items-center justify-center px-4">
                    <Text className="text-gray-400 text-xs text-center">
                      {communityData?.bio}
                    </Text>
                  </View>
                )}

                {/* Video Type Tabs - Only show when videos section is active */}
                {activeTab === "videos" && (
                  <View className="mt-4 border-gray-700">
                    <View className="flex flex-row justify-around items-center">
                      <TouchableOpacity
                        className={`pb-4 flex-1 items-center justify-center border-b-2 ${videoType === "long" ? "border-white" : "border-transparent"}`}
                        onPress={() => setVideoType("long")}
                      >
                        <PaperclipIcon
                          color={videoType === "long" ? "white" : "gray"}
                        />
                      </TouchableOpacity>
                      {/* <TouchableOpacity
                        className={`pb-4 flex-1 items-center justify-center border-b-2 ${videoType === "liked" ? "border-white" : "border-transparent"}`}
                        onPress={() => setVideoType("liked")}
                      >
                        <HeartIcon
                          color={videoType === "liked" ? "white" : "gray"}
                          fill={videoType === "liked" ? "white" : "transparent"}
                        />
                      </TouchableOpacity> */}
                    </View>
                  </View>
                )}

                {/* Search Bar - Only show for followers and creators */}
                {(activeTab === "followers" || activeTab === "creators") && (
                  <View className="mt-4 px-4">
                    <View className="bg-gray-800 rounded-lg px-4 py-3 flex-row items-center">
                      <Text className="text-gray-400 flex-1">Search...</Text>
                    </View>
                  </View>
                )}
              </View>
            }
            data={activeTab === "videos" ? (isLoadingVideos ? [] : videos) : []}
            key={`${activeTab}-${videoType}`}
            keyExtractor={(item) => item._id}
            renderItem={videoType === "long" ? renderVideoItem : renderGridItem}
            numColumns={activeTab === "videos" && videoType === "liked" ? 3 : 1}
            columnWrapperStyle={
              activeTab === "videos" && videoType === "liked"
                ? { justifyContent: "space-between" }
                : undefined
            }
            ListEmptyComponent={
              activeTab === "videos" && isLoadingVideos ? (
                <View className="flex-1 h-64 items-center justify-center">
                  <ActivityIndicator size="large" color="white" />
                </View>
              ) : activeTab === "videos" ? (
                <View className="flex-1 h-64 items-center justify-center">
                  <Video size={48} color="gray" />
                  <Text className="text-gray-400 text-center mt-4">
                    {`No ${videoType} videos yet`}
                  </Text>
                </View>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 4 }}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      )}

      {isPurchasedCommunityPass && (
        <View className="z-10 absolute w-full">
          <CommunityPassBuyMessage
            isVisible={true}
            onClose={clearCommunityPassData}
            creator={creator}
            amount={giftSuccessMessage}
          />
        </View>
      )}
    </ThemedView>
  );
}
