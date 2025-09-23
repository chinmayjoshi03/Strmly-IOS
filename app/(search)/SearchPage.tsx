import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  ImageBackground,
  ScrollView,
  BackHandler,
  Platform,
} from "react-native";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import ThemedText from "@/components/ThemedText";
import { useSearch } from "./hooks/useSearch";
import { communityActions } from "@/api/community/communityActions";
import { useAuthStore } from "@/store/useAuthStore";
import { CONFIG } from "@/Constants/config";
import VideoPlayer from "@/app/(dashboard)/long/_components/VideoPlayer";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height: page_height } = Dimensions.get("window");
const itemSize = width / 3;

const SearchScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState<boolean>(false);
  const [trendingError, setTrendingError] = useState<string>("");

  // Video player state
  const [isVideoPlayerActive, setIsVideoPlayerActive] = useState(false);
  const [currentVideoData, setCurrentVideoData] = useState<any>(null);
  const [currentVideoList, setCurrentVideoList] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const tabs = ["Videos", "Accounts", "Communities"];

  const { token } = useAuthStore();
  const {
    searchResults,
    isLoading: searchLoading,
    error: searchError,
    performSearch,
    clearSearch,
  } = useSearch();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/poppins/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/poppins/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/poppins/Poppins-SemiBold.ttf"),
    "Poppins-Medium": require("../../assets/fonts/poppins/Poppins-Medium.ttf"),
    "Poppins-Light": require("../../assets/fonts/poppins/Poppins-Light.ttf"),
    "Inter-Light": require("../../assets/fonts/inter/Inter-Light.ttf"),
    "Inter-SemiBold": require("../../assets/fonts/inter/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../../assets/fonts/inter/Inter-Bold.ttf"),
    "Inter-ExtraBold": require("../../assets/fonts/inter/Inter-ExtraBold.ttf"),
  });

  // Load trending videos on component mount
  // useEffect(() => {
  //     loadTrendingVideos();
  // }, []);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (isVideoPlayerActive) {
        closeVideoPlayer();
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [isVideoPlayerActive]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearchActive(true);
        performSearch(searchQuery);
      } else {
        setIsSearchActive(false);
        clearSearch();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch, clearSearch]);

  const loadTrendingVideos = async () => {
    if (!token) return;

    setTrendingLoading(true);
    setTrendingError("");

    try {
      // Use the videos/trending endpoint instead of community/trending-videos
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/videos/trending?page=1&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch trending videos: ${response.status}`);
      }

      const data = await response.json();
      console.log("Trending videos response:", data);

      // The videos/trending endpoint returns data.data array
      const videos = data.data || [];
      console.log("📹 Loaded trending videos:", videos.length, "videos");
      console.log(
        "📹 First video sample:",
        videos[0]
          ? {
              id: videos[0]._id,
              title: videos[0].title || videos[0].name,
              hasVideoUrl: !!(videos[0].videoUrl || videos[0].video),
              thumbnailUrl: videos[0].thumbnailUrl || videos[0].thumbnail,
            }
          : "No videos"
      );
      setTrendingVideos(videos);
    } catch (error) {
      console.error("Error loading trending videos:", error);
      setTrendingError(
        error instanceof Error
          ? error.message
          : "Failed to load trending videos"
      );
      // Set empty array instead of hardcoded data
      setTrendingVideos([]);
    } finally {
      setTrendingLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const getCurrentTabData = () => {
    if (!isSearchActive) return [];

    switch (selectedTab) {
      case 0:
        return searchResults.videos || [];
      case 1:
        return searchResults.accounts || [];
      case 2:
        return searchResults.communities || [];
      default:
        return [];
    }
  };

  // Navigation functions
  const navigateToCommunity = (communityId: string) => {
    if (communityId && communityId !== "none") {
      console.log("🔄 Navigating to community:", communityId);
      router.push(`/(dashboard)/communities/public/${communityId}`);
    }
  };

  const navigateToProfile = (userId: string) => {
    if (userId) {
      console.log("🔄 Navigating to profile:", userId);
      router.push(`/(dashboard)/profile/public/${userId}`);
    }
  };

  const navigateToVideoPlayer = (videoData: any, allVideos: any[]) => {
    console.log(
      "🎬 Opening video player for:",
      videoData.title || videoData.name
    );
    // Find the index of the current video in the array
    const currentIndex = allVideos.findIndex(
      (video) => video._id === videoData._id
    );

    // Set video player state to show the integrated player
    setCurrentVideoData(videoData);
    setCurrentVideoList(allVideos);
    setCurrentVideoIndex(currentIndex >= 0 ? currentIndex : 0);
    setIsVideoPlayerActive(true);
  };

  const closeVideoPlayer = () => {
    setIsVideoPlayerActive(false);
    setCurrentVideoData(null);
    setCurrentVideoList([]);
    setCurrentVideoIndex(0);
    setShowCommentsModal(false);
  };

  // Define the viewable items changed callback at component level
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentVideoIndex(viewableItems[0].index);
    }
  }, []);

  // Render video items with thumbnail styling
  const renderVideoItem = ({ item }: { item: any }) => {
    const thumbnailUrl =
      item.thumbnail ||
      item.thumbnailUrl ||
      item.posterUrl ||
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";
    const communityId =
      item.community?._id || item.community?.id || item.communityId;

    return (
      <TouchableOpacity
        onPress={() => {
          // For search results, always try to play the video if it has videoUrl
          if (item.videoUrl || item.video) {
            const currentTabVideos = getCurrentTabData();
            navigateToVideoPlayer(item, currentTabVideos);
          } else {
            console.log("⚠️ No video URL found for:", item.title || item.name);
          }
        }}
      >
        <ImageBackground
          source={{ uri: thumbnailUrl }}
          style={styles.imageTile}
          imageStyle={{ resizeMode: "cover" }}
        >
          <View style={styles.trendingOverlay}>
            <Text style={styles.label}>
              {item.title || item.name || "Untitled"}
            </Text>
            {item.community && (
              <Text style={styles.communityLabel}>{item.community.name}</Text>
            )}
            {item.created_by && (
              <Text style={styles.communityLabel}>
                @{item.created_by.username}
              </Text>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  // Render account items like followers/following in profile
 // Render account items like followers/following in profile
const renderAccountItem = ({ item }: { item: any }) => {
  const userName = item.username || item.name || "user";
  const profilePhoto = item.profile_photo || item.profile_picture;
  const userId = item._id || item.id;
  
  // Calculate followers count from the array if followers_count is not provided
  const followersCount = item.followers_count ?? 
    (item.followers ? item.followers.length : 0);

  console.log("🖼️ Account image data:", {
    username: userName,
    profile_photo: item.profile_photo,
    profile_picture: item.profile_picture,
    followers_count: followersCount,
    finalUrl: getProfilePhotoUrl(profilePhoto, "user"),
  });

  return (
    <TouchableOpacity
      style={styles.accountRow}
      onPress={() => {
        if (userId) {
          navigateToProfile(userId);
        } else {
          console.log("⚠️ No user ID found for account:", item.username);
        }
      }}
    >
      <View style={styles.accountRowContent}>
        <Image
          source={{ uri: getProfilePhotoUrl(profilePhoto, "user") }}
          style={styles.accountAvatar}
          onError={() => {
            console.log(
              "Failed to load account profile photo:",
              item.username
            );
          }}
        />
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{item.username}</Text>
          {item.bio && (
            <Text style={styles.accountBio} numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.accountStats}>
        <Text style={styles.accountStatsNumber}>
          {followersCount}
        </Text>
        <Text style={styles.accountStatsLabel}>Followers</Text>
      </View>
    </TouchableOpacity>
  );
};

  // Render community items like communities in profile
  const renderCommunityItem = ({ item }: { item: any }) => {
    const communityName = item.name || "community";
    const profilePhoto = item.profile_photo;
    const communityId = item._id || item.id;

    console.log("🖼️ Community image data:", {
      name: communityName,
      profile_photo: item.profile_photo,
      finalUrl: getProfilePhotoUrl(profilePhoto, "community"),
    });

    return (
      <TouchableOpacity
        style={styles.communityRow}
        onPress={() => {
          if (communityId) {
            navigateToCommunity(communityId);
          } else {
            console.log("⚠️ No community ID found for community:", item.name);
          }
        }}
      >
        <View style={styles.communityRowContent}>
          <Image
            source={{ uri: getProfilePhotoUrl(profilePhoto, "community") }}
            style={styles.communityAvatar}
            onError={() => {
              console.log("Failed to load community profile photo:", item.name);
            }}
          />
          <View style={styles.communityInfo}>
            <Text style={styles.communityName}>{item.name}</Text>
            {item.founder && (
              <Text style={styles.communityFounder}>
                @{item.founder.username}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.communityStats}>
          <View style={styles.communityStatsItem}>
            <Text style={styles.communityStatsNumber}>
              {item.creators?.length || 0}
            </Text>
            <Text style={styles.communityStatsLabel}>Creators</Text>
          </View>
          <View style={styles.communityStatsItem}>
            <Text style={styles.communityStatsNumber}>
              {item.followers?.length || 0}
            </Text>
            <Text style={styles.communityStatsLabel}>Followers</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Choose the appropriate render function based on the selected tab
  const renderSearchResultItem = ({ item }: { item: any }) => {
    switch (selectedTab) {
      case 0:
        return renderVideoItem({ item });
      case 1:
        return renderAccountItem({ item });
      case 2:
        return renderCommunityItem({ item });
      default:
        return renderVideoItem({ item });
    }
  };

  const renderTrendingItem = ({ item }: { item: any }) => {
    const communityId =
      item.community?._id || item.community?.id || item.communityId;

    return (
      <TouchableOpacity
        onPress={() => {
          // For trending videos, navigate to community public page
          if (communityId) {
            navigateToCommunity(communityId);
          } else {
            console.log(
              "⚠️ No community ID found for trending video:",
              item.title || item.name
            );
          }
        }}
      >
        <ImageBackground
          source={{
            uri:
              item.thumbnailUrl ||
              item.thumbnail ||
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
          }}
          style={styles.imageTile}
          imageStyle={{ resizeMode: "cover" }}
        >
          <View style={styles.trendingOverlay}>
            <Text style={styles.label}>
              {item.title || item.name || "Untitled"}
            </Text>
            {item.community && (
              <Text style={styles.communityLabel}>{item.community.name}</Text>
            )}
            {item.created_by && (
              <Text style={styles.communityLabel}>
                @{item.created_by.username}
              </Text>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>LOADING...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ height: page_height, backgroundColor: "black" }}>
      <View style={{ ...styles.container, height: page_height }}>

        <TextInput
          placeholder="Search"
          placeholderTextColor="#ccc"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Show tabs only when searching */}
        {isSearchActive && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectionTabContainer}
            contentContainerStyle={styles.selectionTab}
          >
            {tabs.map((label, index) => (
              <TouchableOpacity
                style={[
                  styles.selectionButton,
                  selectedTab === index ? styles.selectedButton : {},
                ]}
                key={index}
                onPress={() => setSelectedTab(index)}
              >
                <ThemedText
                  style={[
                    styles.tab,
                    selectedTab === index ? styles.selectedText : {},
                  ]}
                >
                  {label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Loading indicator */}
        {(searchLoading || trendingLoading) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {/* Error message */}
        {(searchError || trendingError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Error: {searchError || trendingError}
            </Text>
          </View>
        )}

        {/* Content */}
        {!(searchLoading || trendingLoading) && (
          <FlatList
            data={isSearchActive ? getCurrentTabData() : trendingVideos}
            numColumns={isSearchActive && selectedTab !== 0 ? 1 : 3} // Show videos in grid (3 columns), others in list (1 column)
            key={isSearchActive ? `search-${selectedTab}` : "default"} // Force re-render when switching modes or tabs
            keyExtractor={(item, index) =>
              isSearchActive
                ? `search-${item.id || item._id || index}`
                : `default-${item._id || index}`
            }
            renderItem={
              isSearchActive ? renderSearchResultItem : renderTrendingItem
            }
            contentContainerStyle={[
              isSearchActive && selectedTab !== 0
                ? styles.searchResultsContainer
                : styles.grid,
              { paddingBottom: 100 },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              isSearchActive ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No {tabs[selectedTab].toLowerCase()} found for "
                    {searchQuery}"
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {selectedTab === 0 &&
                      "Try searching for video names or descriptions"}
                    {selectedTab === 1 &&
                      "Try searching for usernames or emails"}
                    {selectedTab === 2 &&
                      "Try searching for series titles, genres, or languages"}
                  </Text>
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>
                      Try searching for:
                    </Text>
                    {selectedTab === 0 && (
                      <Text style={styles.suggestionText}>
                        • Video names or descriptions
                      </Text>
                    )}
                    {selectedTab === 1 && (
                      <Text style={styles.suggestionText}>
                        • @username or email addresses
                      </Text>
                    )}
                    {selectedTab === 2 && (
                      <Text style={styles.suggestionText}>
                        • "Action", "Comedy", "Drama"
                      </Text>
                    )}
                    {selectedTab === 2 && (
                      <Text style={styles.suggestionText}>
                        • "English", "Hindi", "Tamil"
                      </Text>
                    )}
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Integrated Video Player */}
        {isVideoPlayerActive && currentVideoData && (
          <View style={styles.videoPlayerOverlay}>
            <FlatList
              data={currentVideoList}
              keyExtractor={(item) => item._id}
              renderItem={({ item, index }) => (
                <VideoPlayer
                  isGlobalPlayer={false}
                  key={`${item._id}-${index === currentVideoIndex}`}
                  videoData={item}
                  isActive={index === currentVideoIndex}
                  showCommentsModal={showCommentsModal}
                  setShowCommentsModal={setShowCommentsModal}
                />
              )}
              style={{ flex: 1 }}
              getItemLayout={(_, index) => ({
                length: Dimensions.get("screen").height,
                offset: Dimensions.get("screen").height * index,
                index,
              })}
              initialScrollIndex={currentVideoIndex}
              pagingEnabled
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              snapToInterval={Dimensions.get("screen").height}
              snapToAlignment="start"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Container and basic layout
container: {
  backgroundColor: "#000",
  paddingTop: Platform.OS === 'ios' ? -40 : 0  // Negative padding to reduce space
},
searchInput: {
  backgroundColor: "rgba(255,255,255,0.1)",
  color: "#fff",
  paddingHorizontal: 15,
  paddingVertical: 6,
  marginHorizontal: 15,
  marginBottom: 15,
  marginTop: Platform.OS === 'ios' ? -35 : 0,  // Add this line
  borderRadius: 25,
  fontSize: 16,
  fontFamily: "Poppins-Regular",
},

  // Tab selection styles
  selectionTabContainer: {
    flexGrow: 0,
    marginBottom: 15,
  },
  selectionTab: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  selectionButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginRight: 40,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  selectedButton: {
    borderBottomColor: "#fff",
  },
  tab: {
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    color: "#9CA3AF",
  },
  selectedText: {
    color: "#fff",
    fontFamily: "Poppins-SemiBold",
  },

  // Grid and tile styles
  grid: {
    paddingHorizontal: 5,
  },
  imageTile: {
    width: itemSize,
    height: itemSize * 1.4,
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  label: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    marginBottom: 2,
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontFamily: "Poppins-Regular",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },

  // Search results container
  searchResultsContainer: {
    padding: 10,
  },

  // Overlay styles
  trendingOverlay: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    width: "100%",
  },
  communityLabel: {
    color: "#ccc",
    fontSize: 12,
    fontFamily: "Poppins-Light",
    marginTop: 2,
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    color: "#ccc",
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
    fontFamily: "Poppins-Light",
    textAlign: "center",
    marginBottom: 20,
  },
  suggestionsContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  suggestionsTitle: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 8,
  },
  suggestionText: {
    color: "#ccc",
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },

  // Account styling (similar to followers/following in profile)
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  accountRowContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  accountBio: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: "Poppins-Light",
    marginTop: 2,
  },
  accountStats: {
    alignItems: "center",
  },
  accountStatsNumber: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  accountStatsLabel: {
    color: "#aaa",
    fontSize: 12,
    fontFamily: "Poppins-Light",
  },

  // Community styling (similar to communities in profile)
  communityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  },
  communityRowContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  communityAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  communityFounder: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: "Poppins-Light",
    marginTop: 2,
  },
  communityStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  communityStatsItem: {
    alignItems: "center",
    marginLeft: 12,
  },
  communityStatsNumber: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  communityStatsLabel: {
    color: "#aaa",
    fontSize: 12,
    fontFamily: "Poppins-Light",
  },

  // Video player overlay
  videoPlayerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    zIndex: 1000,
  },
});

export default SearchScreen;
