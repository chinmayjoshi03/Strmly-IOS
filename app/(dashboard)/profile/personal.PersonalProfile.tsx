import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
  Pressable,
} from "react-native";
import { CONFIG } from "@/Constants/config";
import { MoreVertical } from "lucide-react-native";

import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@/store/useAuthStore";
import { getProfilePhotoUrl } from "@/utils/profileUtils";

import ProfileTopbar from "@/components/profileTopbar";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVideosStore } from "@/store/useVideosStore";
import { getDeviceInfo, getResponsiveStyles } from "@/utils/deviceUtils";
import VideoGridSkeleton from "@/components/VideoGridSkeleton";

export default function PersonalProfilePage() {
  const [activeTab, setActiveTab] = useState("videos");
  const [userData, setUserData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [selectedVideoMenu, setSelectedVideoMenu] = useState<string | null>(
    null
  );



  // Ref to track if component has mounted to prevent unnecessary effects
  const hasMounted = useRef(false);

  const { token, user } = useAuthStore();
  const { setVideosInZustand } = useVideosStore();

  const router = useRouter();

  // Get device info and responsive styles
  const deviceInfo = getDeviceInfo();
  const responsiveStyles = getResponsiveStyles();

  // Derive logged-in state from token
  const isLoggedIn = !!token;

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;



  // Refresh profile data when auth store user changes (e.g., after profile update)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    
    if (
      user?.profile_photo &&
      userData &&
      user.profile_photo !== userData.profile_photo
    ) {
      console.log(
        "🔄 Auth store profile photo changed, refreshing profile data"
      );
      // Update userData with the new profile photo from auth store
      setUserData((prev: any) =>
        prev ? { ...prev, profile_photo: user.profile_photo } : prev
      );
    }
  }, [user?.profile_photo]); // Only depend on user profile photo, not userData

  const fetchUserVideos = useCallback(
    async (pageToFetch: number) => {
      if (!token) return;
      
      // For page 1 (initial load), ignore loading and hasMore checks
      if (pageToFetch > 1 && (isLoadingVideos || !hasMore)) return;

      if (pageToFetch === 1) setIsLoadingVideos(true);

      try {
        const response = await fetch(
          `${CONFIG.API_BASE_URL}/user/videos?type=long&page=${pageToFetch}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch user videos");
        }

        if (pageToFetch === 1) {
          setVideos(data.videos); // first page → replace
          setHasInitiallyLoaded(true); // Mark as initially loaded
        } else {
          setVideos((prev) => [...prev, ...data.videos]); // next pages → append
        }

        if (data.videos.length === 0) {
          setHasMore(false); // stop when no more videos
        }

        setPage(pageToFetch);
      } catch (err) {
        console.error("Error fetching user videos:", err);
        Alert.alert(
          "Error",
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching videos."
        );
        if (pageToFetch === 1) {
          setHasInitiallyLoaded(true); // Mark as loaded even on error
        }
      } finally {
        setIsLoadingVideos(false);
      }
    },
    [token, isLoadingVideos, hasMore]
  );

  const fetchUserSeries = useCallback(
    async () => {
      if (!token || isLoadingSeries) return;

      setIsLoadingSeries(true);

      try {
        console.log('🔍 fetchUserSeries Debug Info:');
        console.log('  - API Base URL:', CONFIG.API_BASE_URL);
        console.log('  - Token exists:', !!token);

        const url = `${CONFIG.API_BASE_URL}/series/user?t=${Date.now()}`;
        console.log('  - Full URL:', url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });

        console.log('📊 Response Debug Info:');
        console.log('  - Status:', response.status);
        console.log('  - Status Text:', response.statusText);

        if (!response.ok) {
          // Handle the specific case where user has no series (backend returns 404 instead of 200)
          if (response.status === 404) {
            try {
              const errorData = await response.json();
              console.log('❌ Error response data:', errorData);
              
              // If the error message indicates no series found, treat it as success with empty array
              if (errorData.error === "No series found for this user") {
                console.log('✅ No series found - treating as empty result');
                setSeries([]);
                return; // Exit early, don't throw error
              }
            } catch (parseError) {
              console.log('❌ Could not parse 404 error response as JSON');
            }
          }
          
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || "Failed to fetch user series");
        }

        const data = await response.json();
        console.log('✅ Raw API response:', data);

        // Handle case where data.data might be undefined or not an array
        if (!data.data || !Array.isArray(data.data)) {
          console.log('⚠️ Invalid data structure, treating as empty array');
          setSeries([]);
          return;
        }

        // Transform series data - only show first episode of each series in grid
        const firstEpisodes: any[] = [];
        
        data.data.forEach((seriesItem: any) => {
          // Only include series that have episodes
          if (seriesItem.episodes && seriesItem.episodes.length > 0) {
            console.log('📺 Series:', seriesItem.title, 'Episodes:', seriesItem.episodes.length);
            
            // Only take the first episode for grid display
            const firstEpisode = seriesItem.episodes[0];
            console.log('🎬 First episode data:', {
              name: firstEpisode.name,
              duration: firstEpisode.duration,
              videoUrl: firstEpisode.videoUrl,
              thumbnailUrl: firstEpisode.thumbnailUrl
            });
            
            firstEpisodes.push({
              ...firstEpisode,
              seriesId: seriesItem._id,
              seriesTitle: seriesItem.title,
              seriesGenre: seriesItem.genre,
              seriesType: seriesItem.type,
              episodeIndex: 0, // Always 0 since it's the first episode
              totalEpisodesInSeries: seriesItem.episodes.length,
              allSeriesEpisodes: seriesItem.episodes, // Store all episodes for navigation
              // Ensure video URL is properly set
              videoUrl: firstEpisode.videoUrl || firstEpisode.video_url,
              // Add required access structure for VideoPlayer compatibility
              access: {
                isPurchased: seriesItem.access?.isPurchased || true, // Use series access or default to true
                isPlayable: seriesItem.access?.isPlayable || true,
                accessType: seriesItem.access?.accessType || "free",
                freeRange: seriesItem.access?.freeRange || null,
                price: seriesItem.price || 0,
              },
              hasCreatorPassOfVideoOwner: seriesItem.hasCreatorPassOfVideoOwner || false,
              // Ensure other required properties exist
              likes: firstEpisode.likes || 0,
              shares: firstEpisode.shares || 0,
              views: firstEpisode.views || 0,
              gifts: firstEpisode.gifts || 0,
              // Add missing properties for VideoProgressBar compatibility
              duration: firstEpisode.duration || firstEpisode.video_duration || 120, // Default to 2 minutes if no duration
              name: firstEpisode.name || `Episode 1`,
              amount: firstEpisode.amount || seriesItem.price || 0,
              // Ensure created_by structure exists
              created_by: firstEpisode.created_by || seriesItem.created_by || {
                _id: "unknown",
                username: "Unknown",
                profile_photo: "",
              },
              // Add series reference for VideoProgressBar
              series: {
                _id: seriesItem._id,
                title: seriesItem.title,
                price: seriesItem.price || 0,
                total_episodes: seriesItem.episodes.length,
                episodes: seriesItem.episodes.map((ep: any, idx: number) => ({
                  _id: ep._id,
                  episode_number: idx + 1,
                  name: ep.name || `Episode ${idx + 1}`,
                })),
              },
            });
          }
        });

        console.log('📊 Transformed first episodes data:', firstEpisodes.length, 'series with first episodes');
        setSeries(firstEpisodes);
        setHasInitiallyLoaded(true); // Mark as initially loaded
      } catch (err) {
        console.error("Error fetching user series:", err);
        // Don't show alert for "no series found" case
        if (err instanceof Error && !err.message.includes("No series found")) {
          Alert.alert(
            "Error",
            err.message || "An unknown error occurred while fetching series."
          );
        }
        setHasInitiallyLoaded(true); // Mark as loaded even on error
      } finally {
        setIsLoadingSeries(false);
      }
    },
    [token, isLoadingSeries]
  );

  // Single useFocusEffect to handle all data fetching
  useFocusEffect(
    useCallback(() => {
      if (!token || !isLoggedIn) {
        router.replace("/(auth)/Sign-up");
        return;
      }

      // Fetch user profile data
      const fetchUserData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`${CONFIG.API_BASE_URL}/user/profile`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to fetch user profile");
          }

          console.log("Fetched fresh user data:", data.user);
          setUserData(data.user);
          setIsError(null);
        } catch (error) {
          console.log("error", error);
          setIsError(
            error instanceof Error
              ? error.message
              : "An unknown error occurred."
          );
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserData();
    }, [token, isLoggedIn])
  );

  // Handle tab changes separately to avoid re-fetching profile data
  useEffect(() => {
    if (!token || !hasMounted.current) return;
    
    console.log('🔄 Tab changed to:', activeTab);
    
    if (activeTab === "videos") {
      console.log('📹 Fetching videos...');
      setVideos([]);
      setPage(1);
      setHasMore(true);
      setIsLoadingVideos(false); // Reset loading state
      setHasInitiallyLoaded(false); // Reset initial load state
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        fetchUserVideos(1);
      }, 100);
    } else if (activeTab === "series") {
      console.log('📺 Fetching series...');
      setHasInitiallyLoaded(false); // Reset initial load state
      fetchUserSeries();
    }
  }, [activeTab]); // Only depend on activeTab to avoid infinite loops



  const handleDeleteUserVideo = async (videoId: string) => {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}/caution/video/long/${videoId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoId: videoId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user video");
      }
      console.log("delete response videos", data);
      fetchUserVideos(1); // Refresh videos after deletion
      Alert.alert("Success", "Video deleted successfully");
    } catch (error) {
      console.log(error);
    }
  };

  const renderGridItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      className="relative aspect-[9/16] flex-1 rounded-sm overflow-hidden"
      onPress={() => {
        const { setVideoType } = useVideosStore.getState();
        setVideoType('videos');
        setVideosInZustand(videos);
        router.push({
          pathname: "/(dashboard)/long/GlobalVideoPlayer",
          params: { startIndex: index.toString() },
        });

        console.log("item", item);
      }}
    >
      {item.thumbnailUrl !== "" ? (
        <Image
          source={{
            uri: `${item.thumbnailUrl}`,
          }}
          alt="video thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <View className="w-full h-full flex items-center justify-center">
          <Text className="text-white text-xs">Loading...</Text>
        </View>
      )}

      <Pressable
        onPress={() => {
          setSelectedVideoMenu(item._id);
          setShowVideoMenu((prev) => !prev);
        }}
        className="bg-white bg-opacity-50 rounded-full p-1 absolute top-2 right-2"
      >
        <MoreVertical className="bg-black" size={10} />
      </Pressable>

      {selectedVideoMenu === item._id && showVideoMenu && (
        <View className="absolute top-8 right-2 bg-white rounded-md shadow-md px-2 py-1">
          <Pressable
            onPress={() => handleDeleteUserVideo(item._id)}
            className="px-3"
          >
            <Text className="text-red-500 text-sm">Delete</Text>
          </Pressable>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSeriesItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      className="relative aspect-[9/16] flex-1 rounded-sm overflow-hidden"
      onPress={() => {
        // Set all episodes from this series for the video player
        const { setVideoType } = useVideosStore.getState();
        setVideoType('series');
        
        // Transform all episodes from this series for video player
        const allEpisodesFromSeries = item.allSeriesEpisodes.map((episode: any, episodeIndex: number) => ({
          ...episode,
          seriesId: item.seriesId,
          seriesTitle: item.seriesTitle,
          seriesGenre: item.seriesGenre,
          seriesType: item.seriesType,
          episodeIndex: episodeIndex,
          totalEpisodesInSeries: item.totalEpisodesInSeries,
          // Ensure video URL is properly set
          videoUrl: episode.videoUrl || episode.video_url,
          // Add required access structure for VideoPlayer compatibility
          access: item.access, // Use the same access as the first episode
          hasCreatorPassOfVideoOwner: item.hasCreatorPassOfVideoOwner,
          // Ensure other required properties exist
          likes: episode.likes || 0,
          shares: episode.shares || 0,
          views: episode.views || 0,
          gifts: episode.gifts || 0,
          // Add missing properties for VideoProgressBar compatibility
          duration: episode.duration || episode.video_duration || 120,
          name: episode.name || `Episode ${episodeIndex + 1}`,
          amount: episode.amount || item.amount,
          // Ensure created_by structure exists
          created_by: episode.created_by || item.created_by,
          // Add series reference for VideoProgressBar
          series: item.series,
        }));
        
        setVideosInZustand(allEpisodesFromSeries);
        router.push({
          pathname: "/(dashboard)/long/GlobalVideoPlayer",
          params: { 
            startIndex: "0", // Always start from first episode
            videoType: 'series'
          },
        });
        console.log("Playing series:", item.seriesTitle, "starting from episode 1 of", item.totalEpisodesInSeries, "episodes");
      }}
    >
      {item.thumbnailUrl !== "" ? (
        <Image
          source={{
            uri: `${item.thumbnailUrl}`,
          }}
          alt="episode thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <View className="w-full h-full flex items-center justify-center bg-gray-800">
          <Image
            source={require("../../../assets/episode.png")}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Episode indicator overlay */}
      <View className="absolute bottom-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1">
        <Text className="text-white text-xs font-medium">
          E1 {item.totalEpisodesInSeries > 1 && `of ${item.totalEpisodesInSeries}`}
        </Text>
      </View>

      {/* Series title overlay */}
      <View className="absolute top-2 left-2 bg-black bg-opacity-70 rounded px-2 py-1">
        <Text className="text-white text-xs" numberOfLines={1}>
          {item.seriesTitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={[]}>
      {/* <ThemedView className="flex-1"> */}

      {/* Content Grid/List */}
      <FlatList
        key={activeTab} // Force re-render when switching tabs
        data={activeTab === "videos" ? videos : series}
        keyExtractor={(item) => item._id}
        renderItem={activeTab === "videos" ? renderGridItem : renderSeriesItem}
        numColumns={3} // Both videos and series use 3-column grid
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 0 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onEndReached={activeTab === "videos" ? () => fetchUserVideos(page + 1) : undefined}
        onEndReachedThreshold={0.8}
        ListHeaderComponent={
          <>
            {!isLoading && (
              <View className="h-48 relative">
                <ProfileTopbar hashtag={false} name={userData?.username} />
              </View>
            )}

            {/* Profile Info */}
            {isLoading ? (
              <View className="w-full h-96 flex items-center justify-center -mt-20 relative">
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : isError ? (
              <View className="flex-1 items-center justify-center h-60 -mt-20">
                <Text className="text-white text-center">
                  Sorry, it looks like an error occurred:{" "}
                  {typeof isError === "string" ? isError : "Unknown error"}
                </Text>
              </View>
            ) : (
              <View 
                className={`max-w-4xl -mt-28 relative ${deviceInfo.isTabletDevice ? '' : 'mx-6'}`}
                style={deviceInfo.isTabletDevice ? responsiveStyles.profileContainer : {}}
              >
                <View className="flex flex-col items-center md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
                  <View className="relative" style={responsiveStyles.profilePictureContainer}>
                    <Image
                      source={{
                        uri: getProfilePhotoUrl(
                          userData?.profile_photo,
                          "user"
                        ),
                      }}
                      style={[
                        deviceInfo.isTabletDevice ? responsiveStyles.profilePictureSize : responsiveStyles.profilePictureSizePhone,
                        {
                          borderWidth: 2,
                          borderColor: "white",
                          resizeMode: "cover",
                        }
                      ]}
                    />

                    <View className="flex flex-row gap-2 items-center justify-center mt-2">
                      <Text className="text-gray-400">
                        @{userData?.username}
                      </Text>
                      {userData?.creator_profile?.verification_status ===
                        "verified" && (
                          <Text className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                            Verified
                          </Text>
                        )}
                    </View>
                  </View>
                </View>

                {/* Stats */}
                <View 
                  className={`mt-6 flex-row items-center ${deviceInfo.isTabletDevice ? 'justify-between' : 'justify-around'}`} 
                  style={deviceInfo.isTabletDevice ? responsiveStyles.statsContainer : {}}
                >
                  <TouchableOpacity
                    className="flex flex-col gap-1 items-center"
                    onPress={() =>
                      router.push({
                        pathname: "/(dashboard)/profile/ProfileSections",
                        params: {
                          section: "followers",
                          userName: userData?.username || "Username",
                        },
                      })
                    }
                  >
                    <Text className="font-bold text-lg text-white">
                      {userData?.followers.length || 0}
                    </Text>
                    <Text className="text-gray-400 text-md">Followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex flex-col gap-1 items-center"
                    onPress={() =>
                      router.push({
                        pathname: "/(dashboard)/profile/ProfileSections",
                        params: {
                          section: "myCommunity",
                          userName: userData?.username || "User",
                        },
                      })
                    }
                  >
                    <Text className="font-bold text-lg text-white">
                      {userData?.community.length || 0}
                    </Text>
                    <Text className="text-gray-400 text-md">Community</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex flex-col gap-1 items-center"
                    onPress={() =>
                      router.push({
                        pathname: "/(dashboard)/profile/ProfileSections",
                        params: {
                          section: "following",
                          userName: userData?.username || "User",
                        },
                      })
                    }
                  >
                    <Text className="font-bold text-lg text-white">
                      {userData?.following.length || 0}
                    </Text>
                    <Text className="text-gray-400 text-md">Followings</Text>
                  </TouchableOpacity>
                </View>

                <View 
                  className="flex flex-row w-full items-center justify-center mt-5"
                  style={deviceInfo.isTabletDevice ? responsiveStyles.buttonRowSpacing : responsiveStyles.buttonRowSpacingPhone}
                >
                  {/* My Community Button */}
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(dashboard)/profile/ProfileSections",
                        params: {
                          section: "myCommunity",
                          userName: userData?.username || "User",
                        },
                      })
                    }
                    className="px-4 py-2 rounded-lg border border-gray-400"
                    style={deviceInfo.isTabletDevice ? responsiveStyles.buttonPadding : {}}
                  >
                    <Text className="text-white text-center" style={deviceInfo.isTabletDevice ? responsiveStyles.buttonTextSize : responsiveStyles.buttonTextSizePhone}>
                      My Community
                    </Text>
                  </TouchableOpacity>

                  {/* Dashboard Button (Gradient Border) */}
                  <TouchableOpacity
                    onPress={() =>
                      router.push("/(dashboard)/profile/Dashboard")
                    }
                    className="px-4 py-2 rounded-lg border border-gray-400"
                    style={deviceInfo.isTabletDevice ? responsiveStyles.buttonPadding : {}}
                  >
                    <Text className="text-white text-center" style={deviceInfo.isTabletDevice ? responsiveStyles.buttonTextSize : responsiveStyles.buttonTextSizePhone}>
                      Dashboard
                    </Text>
                  </TouchableOpacity>
                </View>

                <View 
                  className="flex-1 flex-row w-full items-center justify-center mt-3"
                  style={deviceInfo.isTabletDevice ? responsiveStyles.buttonRowSpacing : responsiveStyles.buttonRowSpacingPhone}
                >
                  <TouchableOpacity
                    onPress={() => router.push("/Profile/EditProfile")}
                    className="px-4 py-2 border border-gray-400 rounded-lg"
                    style={deviceInfo.isTabletDevice ? responsiveStyles.buttonPadding : {}}
                  >
                    <Text className="text-white text-center" style={deviceInfo.isTabletDevice ? responsiveStyles.buttonTextSize : responsiveStyles.buttonTextSizePhone}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push("/(dashboard)/profile/History")}
                    className="px-4 py-2 border border-gray-400 rounded-lg"
                    style={deviceInfo.isTabletDevice ? responsiveStyles.buttonPadding : {}}
                  >
                    <Text className="text-white text-center" style={deviceInfo.isTabletDevice ? responsiveStyles.buttonTextSize : responsiveStyles.buttonTextSizePhone}>History</Text>
                  </TouchableOpacity>

                  {/* <TouchableOpacity
                    onPress={() => router.push("/(dashboard)/profile/access")}
                    className="px-4 py-2 border border-gray-400 rounded-lg"
                    style={deviceInfo.isTabletDevice ? responsiveStyles.buttonPadding : {}}
                  >
                    <Text className="text-white text-center" style={deviceInfo.isTabletDevice ? responsiveStyles.buttonTextSize : responsiveStyles.buttonTextSizePhone}>Access</Text>
                  </TouchableOpacity> */}
                </View>

                {/* Bio */}
                <View className="my-2 flex flex-col items-center justify-center px-4">
                  <Text className="text-gray-400 text-center text-sm">
                    {userData?.bio}
                  </Text>
                </View>
              </View>
            )}

            {/* Tabs */}
            <View className="mt-1 border-b border-gray-700">
              <View className="flex-1 flex-row justify-around items-center">
                <TouchableOpacity
                  className={`pb-4 flex-1 items-center justify-center`}
                  onPress={() => setActiveTab("videos")}
                >
                  <Image
                    source={require("../../../assets/images/logo.png")}
                    style={{ 
                      width: 24, 
                      height: 24,
                      opacity: activeTab === "videos" ? 1 : 0.5
                    }}
                    resizeMode="contain"
                  />
                  <Text className={`text-sm mt-1 ${activeTab === "videos" ? "text-white" : "text-gray-400"}`}>
                    Videos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`pb-4 flex-1 items-center justify-center`}
                  onPress={() => setActiveTab("series")}
                >
                  <Image
                    source={require("../../../assets/episode.png")}
                    style={{ 
                      width: 24, 
                      height: 24,
                      opacity: activeTab === "series" ? 1 : 0.5
                    }}
                    resizeMode="contain"
                  />
                  <Text className={`text-sm mt-1 ${activeTab === "series" ? "text-white" : "text-gray-400"}`}>
                    Series
                  </Text>
                </TouchableOpacity>
              </View>
            </View>




          </>
        }
        ListEmptyComponent={() => {
          // Show skeleton when loading OR when we haven't initially loaded yet
          if (!hasInitiallyLoaded || 
              (activeTab === "videos" && isLoadingVideos) || 
              (activeTab === "series" && isLoadingSeries)) {
            return <VideoGridSkeleton count={12} />;
          }
          
          // Only show empty state when we have initially loaded and there's no data
          if (activeTab === "videos" && hasInitiallyLoaded && !isLoadingVideos) {
            return (
              <View className="items-center justify-center px-4 py-20">
                <Image
                  source={require("../../../assets/images/logo.png")}
                  style={{ width: 48, height: 48, opacity: 0.5 }}
                  resizeMode="contain"
                />
                <Text className="text-white text-xl text-center mt-2">
                  No videos found
                </Text>
                <Text className="text-gray-400 text-center mt-1">
                  Upload your first video to get started
                </Text>
              </View>
            );
          }
          
          if (activeTab === "series" && hasInitiallyLoaded && !isLoadingSeries) {
            return (
              <View className="items-center justify-center px-4 py-20">
                <Image
                  source={require("../../../assets/episode.png")}
                  style={{ width: 48, height: 48 }}
                  resizeMode="contain"
                />
                <Text className="text-white text-xl text-center mt-2">
                  No episodes found
                </Text>
                <Text className="text-gray-400 text-center mt-1">
                  Create your first series to get started
                </Text>
              </View>
            );
          }
          
          return null;
        }}
        ListFooterComponent={
          // Show loading indicator only when loading more pages (not initial load)
          (activeTab === "videos" && isLoadingVideos && videos.length > 0) ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color="white" />
            </View>
          ) : null
        }
      />
      {/* </ThemedView> */}
    </SafeAreaView>
  );
}
