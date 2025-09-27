import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  FlatList,
  Dimensions,
  BackHandler, // For opening external links
} from "react-native";
import { CONFIG } from "@/Constants/config";
import { HeartIcon, PaperclipIcon } from "lucide-react-native";

import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@/store/useAuthStore";
import { getProfilePhotoUrl } from "@/utils/profileUtils";

import ThemedView from "@/components/ThemedView";
import ProfileTopbar from "@/components/profileTopbar";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVideosStore } from "@/store/useVideosStore";

const { height } = Dimensions.get("window");

export default function PersonalProfilePage() {
  const [activeTab, setActiveTab] = useState("long");
  const [userData, setUserData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { token, user } = useAuthStore();
  const { setVideosInZustand, appendVideos } = useVideosStore();

  const router = useRouter();

  // Derive logged-in state from token
  const isLoggedIn = !!token;

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  useFocusEffect(
    useCallback(() => {
      if (!token || !isLoggedIn) {
        router.replace("/(auth)/Sign-up");
        return;
      }
    }, [token, isLoggedIn])
  );

  // Refresh profile data when auth store user changes (e.g., after profile update)
  useEffect(() => {
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
  }, [user?.profile_photo, userData?.profile_photo]);

  const fetchUserVideos = useCallback(
    async (pageToFetch: number) => {
      if (!token || isLoadingVideos || !hasMore) return;

      if (pageToFetch === 1) setIsLoadingVideos(true);

      try {
        const response = await fetch(
          `${CONFIG.API_BASE_URL}/user/videos?type=${activeTab}&page=${pageToFetch}`,
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
      } finally {
        setIsLoadingVideos(false);
      }
    },
    [token, activeTab, isLoadingVideos, hasMore]
  );

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      if (activeTab === "repost") {
        userReshareVideos();
        return;
      }

      setVideos([]);
      setPage(1);
      setHasMore(true);
      fetchUserVideos(1);
    }, [token, activeTab])
  );

  useFocusEffect(
    useCallback(() => {
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
          console.log(
            "Profile counts - Followers:",
            data.user.totalFollowers,
            "Following:",
            data.user.totalFollowing,
            "Communities:",
            data.user.totalCommunities
          );
          setUserData(data.user);
          setIsError(null);
        } catch (error) {
          console.log("error", error);
          setIsError(
            error instanceof Error
              ? error.message
              : "An unknown error occurred."
          );
          Alert.alert(
            "Error",
            error instanceof Error
              ? error.message
              : "An unknown error occurred."
          );
        } finally {
          setIsLoading(false);
        }
      };

      if (token) {
        fetchUserData();
      }
    }, [router, token])
  );

  const userReshareVideos = async () => {
    if (!token && activeTab !== "repost") return;

    try {
      const response = await fetch(`${BACKEND_API_URL}/user/reshares`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch user reshare videos");
      }

      setVideos(data.enriched_reshares);
      // console.log("reshare videos", data.enriched_reshares.length);
    } catch (error) {
      console.log(error);
      // Alert.alert(
      //   "Error",
      //   error instanceof Error
      //     ? error.message
      //     : "An unknown error occurred while fetching user reshare videos."
      // );
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const renderGridItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      className="relative aspect-[9/16] flex-1 rounded-sm overflow-hidden"
      onPress={() => {
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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={[]}>
      {/* <ThemedView className="flex-1"> */}
            
      {/* Video Grid */}
      <FlatList
        data={videos}
        keyExtractor={(item) => item._id}
        renderItem={renderGridItem}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 0 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onEndReached={() => fetchUserVideos(page + 1)}
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
              <View className="max-w-4xl -mt-28 relative mx-6">
                <View className="flex flex-col items-center md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
                  <View className="relative">
                    <Image
                      source={{
                        uri: getProfilePhotoUrl(
                          userData?.profile_photo,
                          "user"
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
                <View className="mt-6 flex-row justify-around items-center">
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

                <View className="flex flex-row w-full items-center justify-center gap-2 mt-5">
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
                    className="px-4 py-2 rounded-lg border border-white"
                  >
                    <Text className="text-white text-center font-bold">
                      My Community
                    </Text>
                  </TouchableOpacity>

                  {/* Dashboard Button (Gradient Border) */}
                  <TouchableOpacity
                    onPress={() =>
                      router.push("/(dashboard)/profile/Dashboard")
                    }
                    className="px-4 py-2 rounded-lg border border-white" // Use rounded-md for consistency
                  >
                    <Text className="text-white text-center font-bold">
                      Dashboard
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-1 flex-row w-full items-center justify-center gap-2 mt-5">
                  <TouchableOpacity
                    onPress={() => router.push("/Profile/EditProfile")}
                    className="px-4 py-2 border border-gray-400 rounded-lg"
                  >
                    <Text className="text-white text-center">Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push("/(dashboard)/profile/History")}
                    className="px-4 py-2 border border-gray-400 rounded-lg"
                  >
                    <Text className="text-white text-center">History</Text>
                  </TouchableOpacity>

                                   <TouchableOpacity
                    onPress={() => router.push("/(dashboard)/profile/access")}
                    className="px-4 py-2 border border-gray-400 rounded-lg"
                  >
                    <Text className="text-white text-center">Access</Text>
                  </TouchableOpacity>
                </View>

                {/* Bio */}
                <View className="my-6 flex flex-col items-center justify-center px-4">
                  <Text className="text-gray-400 text-center text-sm">
                    {userData?.bio}
                  </Text>
                </View>
              </View>
            )}

            {/* Tabs */}
            {/* <View className="mt-6 border-b border-gray-700">
                <View className="flex-1 flex-row justify-around items-center">
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
                    onPress={() => {
                      setActiveTab(() => "repost");
                      userReshareVideos();
                    }}
                  >
                    <Image
                      source={require("../../../assets/images/repost.png")}
                      className={`size-7 ${activeTab === "repost" ? "text-white font-semibold" : " opacity-55"}`}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`pb-4 flex-1 items-center justify-center`}
                    onPress={() => setActiveTab("liked")}
                  >
                    <HeartIcon
                      color={activeTab === "liked" ? "white" : "gray"}
                      fill={activeTab === "liked" ? "white" : ""}
                    />
                  </TouchableOpacity>
                </View>
              </View> */}

            {isLoadingVideos && (
              <View className="w-full h-96 flex-1 items-center justify-center mt-20">
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}

            {videos.length === 0 && !isLoadingVideos && (
              <View className="items-center h-20 justify-center">
                <Text className="text-white text-xl text-center">
                  No videos found
                </Text>
              </View>
            )}
          </>
        }
      />
      {/* </ThemedView> */}
    </SafeAreaView>
  );
}
