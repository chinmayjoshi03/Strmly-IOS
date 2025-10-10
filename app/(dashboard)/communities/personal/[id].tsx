import React, { useEffect, useMemo, useState } from "react";
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
  Users,
  Video,
} from "lucide-react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import { useThumbnailsGenerate } from "@/utils/useThumbnailGenerator";
import ThemedView from "@/components/ThemedView";
import ProfileTopbar from "@/components/profileTopbar";
import Constants from "expo-constants";
import VideoPlayer from "@/app/(dashboard)/long/_components/VideoPlayer";
import BottomNavBar from "@/components/BottomNavBar";
import { communityActions } from "@/api/community/communityActions";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDeviceInfo, getResponsiveStyles } from "@/utils/deviceUtils";
import { useVideosStore } from "@/store/useVideosStore";

export default function PersonalCommunityPage() {
  const [activeTab, setActiveTab] = useState("videos");
  const [communityData, setCommunityData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Get device info and responsive styles
  const deviceInfo = getDeviceInfo();
  const responsiveStyles = getResponsiveStyles();

  // Video player state
  const [isVideoPlayerActive, setIsVideoPlayerActive] = useState(false);
  const [currentVideoData, setCurrentVideoData] = useState<any>(null);
  const [currentVideoList, setCurrentVideoList] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // Section data states
  const [followers, setFollowers] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingCreators, setIsLoadingCreators] = useState(false);
  const [videoType, setVideoType] = useState("long");

  const { token } = useAuthStore();
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { setVideosInZustand } = useVideosStore();

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  useEffect(() => {
    const fetchUserVideos = async () => {
      if (activeTab !== "videos") {
        return;
      }

      setIsLoadingVideos(true);
      try {
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

        setVideos(data.videos || []);
        setVideosInZustand(data.videos || []);
      } catch (err) {
        console.error("Error fetching community videos:", err);
        setVideos([]);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    if (token && id) {
      fetchUserVideos();
    }
  }, [activeTab, videoType, token, id]);

  useEffect(() => {
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
  }, [id, token]);

  // Fetch followers
  const fetchFollowers = async () => {
    if (!token || !id) return;

    setIsLoadingFollowers(true);
    try {
      const result = await communityActions.getCommunityFollowers(token, id);
      console.log(
        "✅ Personal Community - Followers fetched:",
        result.followers?.length || 0
      );
      console.log("👥 Personal Community - Followers data:", result.followers);
      setFollowers(result.followers || []);
    } catch (error) {
      console.error("❌ Personal Community - Error fetching followers:", error);
      Alert.alert("Error", "Failed to fetch followers");
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  // Fetch creators
  const fetchCreators = async () => {
    if (!token || !id) return;

    console.log("📥 Personal Community - Fetching creators for community:", id);
    setIsLoadingCreators(true);
    try {
      const result = await communityActions.getCommunityCreators(token, id);
      console.log(
        "✅ Personal Community - Creators fetched:",
        result.creators?.length || 0
      );
      console.log("👥 Personal Community - Creators data:", result.creators);
      setCreators(result.creators || []);
    } catch (error) {
      console.error("❌ Personal Community - Error fetching creators:", error);
      Alert.alert("Error", "Failed to fetch creators");
    } finally {
      setIsLoadingCreators(false);
    }
  };

  // Handle section changes
  const handleSectionChange = (section: string) => {
    console.log("🔄 Personal Community - Section changed to:", section);
    console.log("📊 Personal Community - Current data:", {
      followers: followers.length,
      creators: creators.length,
      videos: videos.length,
    });
    setActiveTab(section);

    if (section === "followers" && followers.length === 0) {
      console.log("📥 Personal Community - Fetching followers...");
      fetchFollowers();
    } else if (section === "creators" && creators.length === 0) {
      console.log("📥 Personal Community - Fetching creators...");
      fetchCreators();
    }
  };

  // Navigate to user profile
  const navigateToUserProfile = (userId: string) => {
    console.log("🔄 Personal Community - Navigating to user profile:", userId);
    console.log("🔄 Router object:", router);
    try {
      const path = `/(dashboard)/profile/public/${userId}`;
      console.log("🔄 Navigation path:", path);
      router.push(path as any);
      console.log("✅ Navigation call completed");
    } catch (error) {
      console.error("❌ Navigation error:", error);
      Alert.alert(
        "Navigation Error",
        `Failed to navigate to user profile: ${error.message}`
      );
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

      {/* Play button overlay */}
      <View className="absolute inset-0 items-center justify-center">
        <View className="bg-black/50 rounded-full p-3">
          <Video size={24} color="white" fill="white" />
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

      {/* Small play button */}
      <View className="absolute top-2 right-2">
        <View className="bg-black/50 rounded-full p-1">
          <Video size={12} color="white" fill="white" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render user item for followers/creators sections
  const renderUserItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        className="flex-row items-center p-3 border-b border-gray-800"
        onPress={() => {
          navigateToUserProfile(item._id);
        }}
        activeOpacity={0.7}
        style={{ backgroundColor: "rgba(255,255,255,0.05)" }} // Add slight background for debugging
      >
        <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 mr-3">
          <Image
            source={
              item?.profile_photo
                ? {
                  uri: item.profile_photo,
                }
                : require("../../../../assets/images/user.png")
            }
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: "white",
              resizeMode: "cover",
            }}
          />
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium">{item.username}</Text>
          {item.name && (
            <Text className="text-gray-400 text-sm">{item.name}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={[]}>
      <ThemedView className="flex-1">
        {/* Cover Image */}
        {!isLoading && (
          <View className="h-fit relative">
            <ProfileTopbar
              isMore={true}
              hashtag={true}
              name={communityData?.name}
            />
          </View>
        )}

        {isLoading ? (
          <View className="absolute left-0 right-0 h-96 items-center justify-center">
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={
              <View
                className={`max-w-4xl mt-6 relative mb-4 ${deviceInfo.isTabletDevice ? '' : 'mx-6'}`}
                style={deviceInfo.isTabletDevice ? responsiveStyles.profileContainer : {}}
              >
                <View className="flex flex-col items-center">
                  <View className="relative flex-col items-center w-full" style={deviceInfo.isTabletDevice ? responsiveStyles.profilePictureContainer : {}}>
                    <Image
                      source={
                        communityData?.profile_photo
                          ? {
                            uri: communityData.profile_photo,
                          }
                          : require("../../../../assets/images/user.png")
                      }
                      style={
                        deviceInfo.isTabletDevice
                          ? [
                            responsiveStyles.profilePictureSize,
                            {
                              borderWidth: 2,
                              borderColor: "white",
                              resizeMode: "cover",
                            }
                          ]
                          : {
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            borderWidth: 2,
                            borderColor: "white",
                            resizeMode: "cover",
                          }
                      }
                    />
                    <View className="flex items-center justify-center w-full mt-2">
                      <Text className="text-gray-400 text-center">
                        {communityData?.founder &&
                          `By @${communityData?.founder.username}`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Section Navigation */}
                <View
                  className={`mt-6 flex flex-row items-center border-b border-gray-800 ${deviceInfo.isTabletDevice ? 'justify-between' : 'justify-around'}`}
                  style={deviceInfo.isTabletDevice ? responsiveStyles.statsContainer : {}}
                >
                  <TouchableOpacity
                    className={`flex flex-col gap-1 items-center pb-4 flex-1 ${activeTab === "followers" ? "border-b-2 border-white" : ""}`}
                  // onPress={() =>
                  //   router.push({
                  //     pathname: "/(communities)/CommunitySections",
                  //     params: {
                  //       section: "followers",
                  //       communityId: communityData._id,
                  //       communityName: communityData.name,
                  //     },
                  //   })
                  // }
                  >
                    <Text
                      className="font-bold text-white"
                      style={deviceInfo.isTabletDevice ? responsiveStyles.communityStatsText : { fontSize: 18 }}
                    >
                      {communityData?.followers?.length || 0}
                    </Text>
                    <Text
                      className={`${activeTab === "followers" ? "text-white" : "text-gray-400"} text-md`}
                      style={deviceInfo.isTabletDevice ? responsiveStyles.communityStatsLabel : {}}
                    >
                      Followers
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex flex-col gap-1 items-center pb-4 flex-1 ${activeTab === "creators" ? "border-b-2 border-white" : ""}`}
                  // onPress={() => handleSectionChange("creators")}
                  >
                    <Text
                      className="font-bold text-white"
                      style={deviceInfo.isTabletDevice ? responsiveStyles.communityStatsText : { fontSize: 18 }}
                    >
                      {communityData?.creators?.length || 0}
                    </Text>
                    <Text
                      className={`${activeTab === "creators" ? "text-white" : "text-gray-400"} text-md`}
                      style={deviceInfo.isTabletDevice ? responsiveStyles.communityStatsLabel : {}}
                    >
                      Creators
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex flex-col gap-1 items-center pb-4 flex-1 ${activeTab === "videos" ? "border-b-2 border-white" : ""}`}
                  // onPress={() => handleSectionChange("videos")}
                  >
                    <Text
                      className="font-bold text-white"
                      style={deviceInfo.isTabletDevice ? responsiveStyles.communityStatsText : { fontSize: 18 }}
                    >
                      {videos.length || 0}
                    </Text>
                    <Text
                      className={`${activeTab === "videos" ? "text-white" : "text-gray-400"} text-md`}
                      style={deviceInfo.isTabletDevice ? responsiveStyles.communityStatsLabel : {}}
                    >
                      Videos
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Buttons */}
                <View
                  className={`flex-row w-full items-center justify-center mt-5 md:mt-0 ${deviceInfo.isTabletDevice ? '' : 'gap-3'}`}
                  style={deviceInfo.isTabletDevice ? responsiveStyles.buttonRowSpacing : {}}
                >
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(communities)/EditCommunity",
                        params: { communityId: communityData._id },
                      })
                    }
                    className={`flex-1 rounded-xl bg-transparent border border-gray-400 ${deviceInfo.isTabletDevice ? '' : 'px-4 py-2'}`}
                    style={deviceInfo.isTabletDevice ? responsiveStyles.buttonPadding : {}}
                  >
                    <Text
                      className="text-white text-center"
                      style={deviceInfo.isTabletDevice ? responsiveStyles.buttonTextSize : {}}
                    >
                      Edit Community
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(communities)/public/CommunityAnalytics",
                        params: { communityId: communityData._id },
                      })
                    }
                    className={`flex-1 rounded-xl bg-transparent border border-gray-400 ${deviceInfo.isTabletDevice ? '' : 'px-4 py-2'}`}
                    style={deviceInfo.isTabletDevice ? responsiveStyles.buttonPadding : {}}
                  >
                    <Text
                      className="text-white text-center"
                      style={deviceInfo.isTabletDevice ? responsiveStyles.buttonTextSize : {}}
                    >
                      View Analytics
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Bio */}
                <View className="mt-6 flex flex-col items-center justify-center px-4">
                  <Text className="text-gray-400 text-xs text-center">
                    {communityData?.bio}
                  </Text>
                </View>

                {/* Video Type Tabs - Only show when videos section is active */}
                {activeTab === "videos" && (
                  <View className="mt-4 border-b border-gray-700">
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
                      className={`pb-4 flex-1 items-center justify-center border-b-2 ${videoType === "series" ? "border-white" : "border-transparent"}`}
                      onPress={() => setVideoType("series")}
                    >
                      <HeartIcon
                        color={videoType === "series" ? "white" : "gray"}
                        fill={videoType === "series" ? "white" : "transparent"}
                      />
                    </TouchableOpacity> */}
                    </View>
                  </View>
                )}

                {/* Search Bar - Only show for followers and creators */}
                {(activeTab === "followers" || activeTab === "creators") && (
                  <View
                    className={deviceInfo.isTabletDevice ? "mt-4" : "mt-4 px-4"}
                    style={deviceInfo.isTabletDevice ? responsiveStyles.containerPadding : {}}
                  >
                    <View
                      className={`bg-gray-800 rounded-lg flex-row items-center ${deviceInfo.isTabletDevice ? '' : 'px-4 py-3'}`}
                      style={deviceInfo.isTabletDevice ? responsiveStyles.searchInput : {}}
                    >
                      <Text
                        className="text-gray-400 flex-1"
                        style={{ fontSize: deviceInfo.isTabletDevice ? 18 : 16 }}
                      >
                        Search...
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            }
            data={(() => {
              const data =
                activeTab === "videos"
                  ? isLoadingVideos
                    ? []
                    : videos
                  : activeTab === "followers"
                    ? isLoadingFollowers
                      ? []
                      : followers
                    : activeTab === "creators"
                      ? isLoadingCreators
                        ? []
                        : creators
                      : [];
              console.log(
                `📋 Personal Community - FlatList data for ${activeTab}:`,
                data.length,
                "items"
              );
              return data;
            })()}
            key={`${activeTab}-${videoType}`}
            keyExtractor={(item) => item._id}
            renderItem={
              activeTab === "videos"
                ? videoType === "long"
                  ? renderVideoItem
                  : renderGridItem
                : renderUserItem
            }
            numColumns={
              activeTab === "videos" && videoType === "series" ? 3 : 1
            }
            columnWrapperStyle={
              activeTab === "videos" && videoType === "series"
                ? { justifyContent: "space-between" }
                : undefined
            }
            ListEmptyComponent={
              (activeTab === "videos" && isLoadingVideos) ||
                (activeTab === "followers" && isLoadingFollowers) ||
                (activeTab === "creators" && isLoadingCreators) ? (
                <View className="flex-1 h-64 items-center justify-center">
                  <ActivityIndicator size="large" color="white" />
                </View>
              ) : (
                <View className="flex-1 h-64 items-center justify-center">
                  {activeTab === "videos" && <Video size={48} color="gray" />}
                  {activeTab === "followers" && (
                    <Users size={48} color="gray" />
                  )}
                  {activeTab === "creators" && <Users size={48} color="gray" />}
                  <Text className="text-gray-400 text-center mt-4">
                    {activeTab === "videos"
                      ? `No ${videoType} videos yet`
                      : activeTab === "followers"
                        ? "No followers yet"
                        : "No creators yet"}
                  </Text>
                </View>
              )
            }
            contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 4 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
