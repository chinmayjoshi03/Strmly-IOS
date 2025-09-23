import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  FlatList,
  Dimensions,
} from "react-native";
import {
  LinkIcon,
  HeartIcon,
  IndianRupee,
  PaperclipIcon,
} from "lucide-react-native";
import { useAuthStore } from "@/store/useAuthStore";
import ThemedView from "@/components/ThemedView"; // Assuming this is a basic wrapper for styling
import ProfileTopbar from "@/components/profileTopbar"; // Assuming this is the converted ProfileTopbar
import { LinearGradient } from "expo-linear-gradient"; // For the gradient border
import Constants from "expo-constants";
import { useRoute } from "@react-navigation/native";
import { router, useFocusEffect } from "expo-router";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVideosStore } from "@/store/useVideosStore";
import { set } from "lodash";

const { height } = Dimensions.get("window");

export default function PublicProfilePageWithId() {
  const [activeTab, setActiveTab] = useState("long");
  const [userData, setUserData] = useState<any>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<any[]>([]);

  const [videos, setVideos] = useState<any[]>([]);

  const [hasCreatorPass, setHasCreatorPass] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [following, setFollowing] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const [page, setPage] = useState(1);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { token } = useAuthStore();
  const { setVideosInZustand, appendVideos } = useVideosStore();

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  const route = useRoute();
  const { id } = route.params as { id: string };

  const fetchUserVideos = useCallback(
    async (pageToFetch: number) => {
      if (!token || !id || isLoadingVideos || !hasMore) return;
      setIsLoadingVideos(true);

      try {
        console.log(`Fetching videos for user ${id}`);
        const response = await fetch(
          `${BACKEND_API_URL}/user/videos/${id}?type=${activeTab}&page=${pageToFetch}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch user videos");
        }

        if (data.videos.length === 0) {
          setHasMore(false); // no more pages
          return;
        }

        if (pageToFetch === 1) {
          setVideos(data.videos); // replace
          // setVideosInZustand(data.videos);
        } else {
          setVideos((prev) => [...prev, ...data.videos]); // append
          appendVideos(data.videos);
        }
        setPage(pageToFetch); // update page
      } catch (err) {
        console.error("Error fetching user videos:", err);
        Alert.alert("Error", "Unable to fetch videos.");
      } finally {
        setIsLoadingVideos(false);
      }
    },
    [token, id, activeTab, isLoadingVideos, hasMore]
  );

  // Reset videos when tab changes
  useFocusEffect(
    useCallback(() => {
      if (!id || activeTab === "repost" || activeTab === "liked") return;

      setVideos(() => []);
      setPage(1);
      setHasMore(true);
      fetchUserVideos(1); // fetch first page
    }, [id, token, activeTab])
  );

  useFocusEffect(
    useCallback(() => {
      if (!id) return;

      const fetchUserData = async () => {
        try {
          const response = await fetch(
            `${BACKEND_API_URL}/user/profile/${id}`,
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
            throw new Error(data.message || "Failed to fetch user profile");
          }

          setUserData(data.user);
          setIsFollowing(data.user?.isBeingFollowed);
          setFollowing(data.user.totalFollowers);
          console.log("Pubic User data", data.user);
          setUserError(null);
          if (data.user?.tags && data.user.tags.length > 2) setShowMore(true);

          // Set communities from user data
          if (data.user?.userDetails?.my_communities) {
            console.log(
              "Setting communities:",
              data.user.userDetails.my_communities
            );
            setCommunities(data.user.userDetails.my_communities);
          } else {
            console.log("No communities found in user data");
            setCommunities([]);
          }
        } catch (error) {
          console.log(error);
          setUserError(
            error instanceof Error
              ? error.message
              : "An unknown error occurred while fetching user data."
          );
          Alert.alert("An unknown error occurred.");
          // Alert.alert(
          //   "Error",
          //   error instanceof Error
          //     ? error.message
          //     : "An unknown error occurred while fetching user data."
          // );
        } finally {
          setIsLoading(false);
        }
      };

      if (token && id) {
        fetchUserData();
      }
    }, [token, id, router])
  );

  const fetchUserLikedVideos = async () => {
    setIsLoadingVideos(true);
    setVideos([]); // Clear previous videos
    try {
      const response = await fetch(
        `${BACKEND_API_URL}/user/profile/${id}/liked-videos`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch user liked videos");
      }

      setVideos(data.data);
      setVideosInZustand(data.data);
      console.log("Liked videos", data.data);
    } catch (err) {
      console.error("Error fetching user liked videos:", err);
      Alert.alert("An unknown error occurred.");
      // Alert.alert(
      //   "Error",
      //   err instanceof Error
      //     ? err.message
      //     : "An unknown error occurred while fetching videos."
      // );
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const fetchUserReshareVideos = async () => {
    if (!id && !token && activeTab !== "repost") return;

    try {
      const response = await fetch(`${BACKEND_API_URL}/user/reshares/${id}`, {
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
      setVideosInZustand(data.enriched_reshares);
      console.log("reshare videos", data.enriched_reshares);
    } catch (error) {
      console.log(error);
      // Alert.alert("An unknown error occurred.");
      // Alert.alert(
      //   "Error",
      //   error instanceof Error
      //     ? error.message
      //     : "An unknown error occurred while fetching user reshare videos."
      // );
    } finally {
      setIsLoading(false);
    }
  };

  const followCreator = async () => {
    try {
      const response = await fetch(
        `${BACKEND_API_URL}/user/${!isFollowing ? "follow" : "unfollow"}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            !isFollowing
              ? {
                  followUserId: id,
                }
              : { unfollowUserId: id }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to follow user profile");
      }

      console.log(data);
      setIsFollowing(data.isFollowing);
      setFollowing(data.user.followers);
      // Alert.alert(
      //   isFollowing
      //     ? "You unFollowed this creator"
      //     : "You are now Following this creator"
      // );
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

  useFocusEffect(
    useCallback(() => {
      const hasCreatorPass = async () => {
        try {
          const response = await fetch(
            `${BACKEND_API_URL}/user/has-creator-pass/${id}`,
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
          setHasCreatorPass(data.hasCreatorPass);
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
        hasCreatorPass();
      }
    }, [id, token])
  );

  const openLink = (url: string) => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url; // default to https
    }
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const renderGridItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      className="relative aspect-[9/16] flex-1 rounded-sm overflow-hidden"
      onPress={() => {
        setVideosInZustand(videos);
        console.log('index:', index)
        router.push({
          pathname: "/(dashboard)/long/GlobalVideoPlayer",
          params: { startIndex: index },
        });
      }}
    >
      {item.thumbnailUrl !== "" ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
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
      <ThemedView style={{ flex: 1 }}>
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id}
          renderItem={renderGridItem}
          numColumns={3}
          contentContainerStyle={{
            paddingBottom: 30,
            paddingHorizontal: 0,
          }}
          onEndReached={() => fetchUserVideos(page + 1)}
          onEndReachedThreshold={0.8}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {userError !== null ? (
                <View className="h-full w-full items-center justify-center">
                  <Text className="text-white text-xl">
                    No such user exists
                  </Text>
                </View>
              ) : (
                <View className="flex-1 gap-5">
                  {!isLoading && (
                    <View className="h-48 relative">
                      <ProfileTopbar
                        hashtag={false}
                        isMore={false}
                        name={userData?.userDetails?.username}
                      />
                    </View>
                  )}

                  {/* Profile Info */}
                  {isLoading ? (
                    <View className="w-full h-96 flex items-center justify-center -mt-20 relative">
                      <ActivityIndicator size="large" color="#F1C40F" />
                    </View>
                  ) : (
                    <View className="max-w-4xl -mt-32 relative mx-6">
                      <View className="flex flex-col items-center md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
                        <View className="items-center">
                          <View className="size-24 border-white border rounded-full overflow-hidden">
                            <Image
                              source={{
                                uri: getProfilePhotoUrl(
                                  userData?.userDetails?.profile_photo,
                                  "user"
                                ),
                              }}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </View>

                          <View className="flex flex-row gap-2 items-center justify-center mt-2">
                            <Text className="text-gray-400">
                              @{userData?.userDetails?.username}
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
                        className={`mt-6 flex-row items-center ${userData?.userDetails?.creator_profile?.creator_pass_price !== 0 && !hasCreatorPass ? "justify-evenly gap-4" : "justify-center gap-5"}`}
                      >
                        <TouchableOpacity
                          className="text-center items-center"
                          // onPress={() => router.push("/communities?type=followers")}
                        >
                          <Text className="font-semibold text-lg text-white">
                            {following}
                          </Text>
                          <Text className="text-gray-400 text-md font-thin">
                            Followers
                          </Text>
                        </TouchableOpacity>

                        {/* Follow Button */}
                        <TouchableOpacity
                          onPress={() => followCreator()}
                          className="h-9 px-7 py-2 rounded-lg border border-white"
                        >
                          <Text className="text-white text-center font-semibold">
                            {isFollowing ? "Following" : "Follow"}
                          </Text>
                        </TouchableOpacity>

                        {/* Access Button with Gradient Border */}
                        {userData?.userDetails?.creator_profile
                          ?.creator_pass_price !== 0 && !hasCreatorPass ? (
                          <TouchableOpacity
                            onPress={() =>
                              router.push({
                                pathname:
                                  "/(dashboard)/PurchasePass/PurchaseCreatorPass/[id]",
                                params: { id: userData?.userDetails._id },
                              })
                            }
                            className={`h-10 rounded-lg overflow-hidden`}
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
                              className="p-[1px] rounded-lg flex-1"
                            >
                              <View
                                className={`flex-1 px-2 rounded-lg bg-black items-center justify-center`}
                              >
                                <View className="flex-row items-center justify-center">
                                  <Text className="text-white text-center">
                                    Access at
                                  </Text>
                                  <IndianRupee color={"white"} size={13} />
                                  <Text className="text-white text-center ml-0.5">
                                    {
                                      userData?.userDetails?.creator_profile
                                        ?.creator_pass_price
                                    }
                                    /month
                                  </Text>
                                </View>
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        ) : userData?.userDetails?.creator_profile
                            .creator_pass_price !== 0 ? (
                          <TouchableOpacity
                            className={`h-10 rounded-lg overflow-hidden`}
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
                              className="p-[1px] rounded-lg flex-1"
                            >
                              <View
                                className={`flex-1 px-4 rounded-lg bg-black items-center justify-center`}
                              >
                                <View className="flex-row items-center justify-center">
                                  <Text className="text-white text-center">
                                    Joined
                                  </Text>
                                </View>
                              </View>
                            </LinearGradient>
                          </TouchableOpacity>
                        ) : (
                          <></>
                        )}
                      </View>

                      {/* Social Media Links - Moved here to replace hashtags */}
                      {userData?.userDetails?.social_media_links &&
                        Object.values(
                          userData.userDetails.social_media_links
                        ).some((link) => link) && (
                          <View className="mt-5 flex-row justify-center gap-8 flex-wrap">
                            {userData.userDetails.social_media_links
                              .snapchat && (
                              <TouchableOpacity
                                onPress={() =>
                                  openLink(
                                    userData.userDetails.social_media_links
                                      .snapchat
                                  )
                                }
                                className="w-10 h-10 rounded-lg overflow-hidden"
                                style={{ backgroundColor: "#FFFC00" }}
                              >
                                <Image
                                  source={require("../../../../assets/images/snapchat.png")}
                                />
                              </TouchableOpacity>
                            )}
                            {userData.userDetails.social_media_links
                              .instagram && (
                              <TouchableOpacity
                                onPress={() =>
                                  openLink(
                                    userData.userDetails.social_media_links
                                      .instagram
                                  )
                                }
                              >
                                <Image
                                  source={require("../../../../assets/images/insta.png")}
                                  className="size-10"
                                />
                              </TouchableOpacity>
                            )}
                            {userData.userDetails.social_media_links
                              .youtube && (
                              <TouchableOpacity
                                onPress={() =>
                                  openLink(
                                    userData.userDetails.social_media_links
                                      .youtube
                                  )
                                }
                              >
                                <Image
                                  source={require("../../../../assets/images/yt.png")}
                                  className="size-10"
                                />
                              </TouchableOpacity>
                            )}
                            {userData.userDetails.social_media_links
                              .facebook && (
                              <TouchableOpacity
                                onPress={() =>
                                  openLink(
                                    userData.userDetails.social_media_links
                                      .facebook
                                  )
                                }
                                className="w-10 h-10 rounded-lg overflow-hidden"
                                style={{ backgroundColor: "#1877F2" }}
                              >
                                <View className="w-full h-full items-center justify-center">
                                  <Text className="text-white text-lg font-bold">
                                    f
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            )}
                            {userData.userDetails.social_media_links
                              .twitter && (
                              <TouchableOpacity
                                onPress={() =>
                                  openLink(
                                    userData.userDetails.social_media_links
                                      .twitter
                                  )
                                }
                                className="w-10 border border-gray-800 h-10 rounded-lg overflow-hidden"
                                style={{ backgroundColor: "#000000" }}
                              >
                                <View className="w-full h-full items-center justify-center">
                                  <Text className="text-white text-lg font-bold">
                                    𝕏
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}

                      {/* Bio - Moved below social media links with larger font */}
                      <View className="mt-4 flex flex-col items-center justify-center px-4">
                        {userData?.userDetails?.bio && (
                          <Text className="text-gray-400 text-sm text-center">
                            {userData?.userDetails?.bio}
                          </Text>
                        )}
                        {userData?.website && (
                          <View className="mt-2 flex flex-row flex-wrap gap-4 text-gray-400 justify-center">
                            <TouchableOpacity
                              onPress={() => Linking.openURL(userData.website)}
                              className="flex-row items-center"
                            >
                              <LinkIcon className="w-4 h-4 mr-1 text-white" />
                              <Text className="text-white underline">
                                {userData.website}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* Communities as Hashtags */}
                      {/* {communities.length > 0 && (
                        <View className="flex flex-row flex-wrap w-full items-center justify-center gap-2 mt-3">
                          {communities.slice(0, 2).map((community) => (
                            <TouchableOpacity
                              key={community._id}
                              onPress={() => {
                                router.push({
                                  pathname:
                                    "/(dashboard)/communities/public/[id]",
                                  params: { id: community._id },
                                });
                              }}
                              className="px-4 py-2 border border-gray-400 rounded-[8px]"
                            >
                              <Text className="text-white">
                                #{community.name}
                              </Text>
                            </TouchableOpacity>
                          ))}

                          {communities.length > 2 && (
                            <TouchableOpacity
                              onPress={() => {
                                router.push({
                                  pathname:
                                    "/(dashboard)/profile/ProfileSections",
                                  params: {
                                    section: "myCommunity",
                                    userName: userData?.username,
                                  },
                                });
                              }}
                              className="px-4 py-2 border border-gray-400 rounded-[8px]"
                            >
                              <Text className="text-white">More</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )} */}
                    </View>
                  )}

                  {/* Tabs */}
                  <View className="mt-6">
                    {/* <View className="flex-1 flex-row justify-around items-center">
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
                          fetchUserReshareVideos();
                        }}
                      >
                        <Image
                          source={require("../../../../assets/images/repost.png")}
                          className="w-6 h-6"
                          tintColor={activeTab === "repost" ? "white" : "gray"} // Apply tintColor for coloring images
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        className={`pb-4 flex-1 items-center justify-center`}
                        onPress={() => {
                          setActiveTab("liked");
                          fetchUserLikedVideos();
                        }}
                      >
                        <HeartIcon
                          color={activeTab === "liked" ? "white" : "gray"}
                          fill={activeTab === "liked" ? "white" : ""}
                        />
                      </TouchableOpacity>
                    </View> */}

                    {videos.length === 0 && !isLoadingVideos && (
                      <View className="items-center h-20 justify-center">
                        <Text className="text-white text-xl text-center">
                          No videos found
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </>
          }
          ListFooterComponent={
            isLoadingVideos ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : null
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}