import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Platform,
  StyleSheet

} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";

import { router } from "expo-router";

import VideoUploadFlow from "../upload/VideoUploadFlow";
import { SeriesSelectionScreen, SeriesAnalyticsScreen } from "./screens";
import SimpleSeriesCreationScreen from "./screens/SimpleSeriesCreationScreen";
import SeriesDetailsScreen from "./screens/SeriesDetailsScreen";
import { Series } from "./types";
import { useStudioDrafts } from "./hooks/useStudioDrafts";
import { useSeries } from "./hooks/useSeries";
import { useDeleteActions } from "./hooks/useDeleteActions";
import DropdownMenu from "./components/DropdownMenu";
import { CONFIG } from "../../Constants/config";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ThemedView from "@/components/ThemedView";

const { height } = Dimensions.get("window");

const StrmlyStudio = () => {
  const [activeTab, setActiveTab] = useState<"draft" | "series">("draft");
  const [selectedSeries, setSelectedSeries] = useState<string | null>("3");
  const [currentScreen, setCurrentScreen] = useState<
    | "main"
    | "upload"
    | "series-creation"
    | "series-selection"
    | "series-analytics"
    | "series-details"
  >("main");
  const [selectedSeriesForAnalytics, setSelectedSeriesForAnalytics] =
    useState<Series | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraftData, setEditingDraftData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debug state changes
  console.log("🎬 Studio State:", {
    activeTab,
    currentScreen,
    selectedSeriesId,
  });

  // Use the real drafts and series hooks
  const {
    drafts,
    loading: draftsLoading,
    error: draftsError,
    refetch: refetchDrafts,
  } = useStudioDrafts();
  const {
    series,
    loading: seriesLoading,
    error: seriesError,
    refetch: refetchSeries,
    refreshKey,
  } = useSeries();
  const { deleteDraft, deleteSeries, confirmDelete } = useDeleteActions();

  // Refresh series data when returning to main screen and series tab is active
  useEffect(() => {
    if (currentScreen === "main" && activeTab === "series") {
      console.log("🔄 Auto-refreshing series data on main screen focus");
      refetchSeries();
    }
  }, [currentScreen, activeTab]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("🎯 StrmlyStudio screen focused, refreshing data...");
      if (activeTab === "series") {
        refetchSeries();
      } else {
        refetchDrafts();
      }
    }, [activeTab])
  );

  // Navigation handlers
  const goToUploadFlow = () => {
    console.log("📤 Going to upload flow");
    setCurrentScreen("upload");
  };

  const goToSeriesCreation = () => {
    console.log("🎬 Going to series creation");
    setCurrentScreen("series-creation");
  };

  const goToSeriesSelection = () => {
    console.log("📋 Going to series selection");
    setCurrentScreen("series-selection");
  };

  const goToMain = () => {
    console.log("🏠 Going back to main");
    setCurrentScreen("main");
    setSelectedSeriesId(null);
    // Refresh series data when returning to main screen
    if (activeTab === "series") {
      refetchSeries();
    }
  };

  const goToSeriesDetails = (seriesId: string) => {
    console.log("📊 Going to series details for:", seriesId);
    setSelectedSeriesId(seriesId);
    setCurrentScreen("series-details");
  };

  // Handle upload flow completion
  const handleUploadComplete = () => {
    console.log("✅ Upload completed, refreshing data...");
    refetchDrafts();
    // Also refresh series data in case an episode was added to a series
    refetchSeries();
    setEditingDraftId(null);
    setEditingDraftData(null);
    goToMain();
  };

  // Handle upload flow cancellation
  const handleUploadCancel = () => {
    setEditingDraftId(null);
    setEditingDraftData(null);
    goToMain();
  };

  // Handle draft editing
  const handleEditDraft = async (draftId: string) => {
    console.log("📝 Editing draft:", draftId);
    try {
      // Fetch full draft data
      const { token } = require("@/store/useAuthStore").useAuthStore.getState();
      if (!token) {
        console.error("No auth token available");
        return;
      }

      const response = await fetch(`${CONFIG.API_BASE_URL}/drafts/${draftId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch draft details");
      }

      const data = await response.json();
      console.log("📋 Fetched draft data for editing:", data.draft);
      setEditingDraftId(draftId);
      setEditingDraftData(data.draft);
      setCurrentScreen("upload");
    } catch (error) {
      console.error("Error fetching draft for editing:", error);
      // Could show an alert here
    }
  };

  // Handle series creation completion
  const handleSeriesCreated = (series: Series) => {
    console.log(
      "✅ Series created, refreshing series list and switching to series tab"
    );
    setActiveTab("series");
    goToMain();
    // Delay the refresh slightly to ensure the screen transition is complete
    setTimeout(() => {
      refetchSeries();
    }, 100);
  };

  // Handle series creation back
  const handleSeriesCreationBack = () => {
    goToMain();
  };

  // Handle series selection
  const handleSeriesSelected = (series: Series) => {
    goToSeriesCreation();
  };

  // Handle add new series from selection
  const handleAddNewSeries = () => {
    goToSeriesCreation();
  };

  // Handle series selection back
  const handleSeriesSelectionBack = () => {
    goToMain();
  };

  // Handle draft deletion
  const handleDeleteDraft = async (draftId: string, draftName: string) => {
    confirmDelete("draft", draftName, async () => {
      try {
        await deleteDraft(draftId);
        refetchDrafts(); // Refresh the drafts list
      } catch (error) {
        console.error("Failed to delete draft:", error);
        Alert.alert(
          "Delete Failed",
          `Failed to delete draft "${draftName}". ${error instanceof Error ? error.message : "Please try again."}`,
          [{ text: "OK" }]
        );
      }
    });
  };

  // Handle series deletion
  const handleDeleteSeries = async (seriesId: string, seriesName: string) => {
    confirmDelete("series", seriesName, async () => {
      try {
        console.log("🗑️ Starting series deletion for:", seriesId);
        await deleteSeries(seriesId);
        console.log("✅ Series deleted successfully, refreshing list...");

        // Immediately refresh the series list
        refetchSeries();
        console.log("🔄 Series list refresh triggered immediately");
      } catch (error) {
        console.error("Failed to delete series:", error);
        Alert.alert(
          "Delete Failed",
          `Failed to delete series "${seriesName}". ${error instanceof Error ? error.message : "Please try again."}`,
          [{ text: "OK" }]
        );
      }
    });
  };

  // Render screens based on currentScreen state
  if (currentScreen === "upload") {
    return (
      <VideoUploadFlow
        onComplete={handleUploadComplete}
        onCancel={handleUploadCancel}
        draftData={editingDraftData}
      />
    );
  }

  if (currentScreen === "series-creation") {
    console.log("🎬 Rendering SimpleSeriesCreationScreen");
    return (
      <SimpleSeriesCreationScreen
        onBack={handleSeriesCreationBack}
        onSeriesCreated={handleSeriesCreated}
      />
    );
  }

  if (currentScreen === "series-selection") {
    return (
      <SeriesSelectionScreen
        onBack={handleSeriesSelectionBack}
        onSeriesSelected={handleSeriesSelected}
        onAddNewSeries={handleAddNewSeries}
      />
    );
  }

  if (currentScreen === "series-details" && selectedSeriesId) {
    return (
      <SeriesDetailsScreen
        seriesId={selectedSeriesId}
        onBack={goToMain}
        onAddNewEpisode={() => {
          console.log("📤 Going to upload flow from series details");
          goToUploadFlow();
        }}
      />
    );
  }

  if (currentScreen === "series-analytics" && selectedSeriesForAnalytics) {
    return (
      <SeriesAnalyticsScreen
        series={selectedSeriesForAnalytics}
        onBack={goToMain}
        onEditAccess={() => { }}
        onAddNewEpisode={() => { }}
        onEpisodeMenuPress={() => { }}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={[]}>
      {/* <ThemedView className="flex-1"> */}

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 mt-2">
        <TouchableOpacity
          onPress={() => {
            console.log("🔙 Back button pressed in StrmlyStudio");
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-medium">Strmly studio</Text>
        <View className="w-6" />
      </View>

      {/* Tab Navigation */}
      <View className="flex-row py-4">
        <TouchableOpacity
          className="flex-1 items-center"
          onPress={() => setActiveTab("draft")}
        >
          <Text
            className={`text-2xl font-medium ${activeTab === "draft" ? "text-white" : "text-gray-400"}`}
          >
            My draft
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 items-center"
          onPress={() => {
            setActiveTab("series");
            // Refresh series data when switching to series tab
            refetchSeries();
          }}
        >
          <Text
            className={`text-2xl font-medium ${activeTab === "series" ? "text-white" : "text-gray-400"}`}
          >
            Series
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              console.log("🔄 Pull-to-refresh triggered");
              setIsRefreshing(true);
              try {
                if (activeTab === "series") {
                  await refetchSeries();
                } else {
                  await refetchDrafts();
                }
              } finally {
                setIsRefreshing(false);
              }
            }}
            tintColor="#FFFFFF"
            colors={["#FFFFFF"]}
          />
        }
      >
        {activeTab === "draft" ? (
          // Drafts List
          <>
            {draftsLoading ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#F1C40F" />
                <Text className="text-gray-400 mt-2">Loading drafts...</Text>
              </View>
            ) : draftsError ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-red-400 text-center mb-4">
                  Error loading drafts: {draftsError}
                </Text>
                <TouchableOpacity
                  onPress={refetchDrafts}
                  className="bg-gray-600 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : drafts.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons name="document-outline" size={48} color="#666" />
                <Text className="text-gray-400 text-center mt-4">
                  No drafts yet
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  Upload a video to create your first draft
                </Text>
              </View>
            ) : (
              drafts.map((draft) => (
                <TouchableOpacity
                  key={draft.id}
                  onPress={() => {
                    console.log("🎬 Opening draft for editing:", draft.id);
                    handleEditDraft(draft.id);
                  }}
                >
                  {Platform.OS === 'ios' ? (
                    // iOS version
                    <View style={styles.container}>
                      <View style={styles.gradientContainer}>
                        <View style={styles.thumbnailContainer}>
                          {draft.thumbnail ? (
                            <Image
                              source={{ uri: draft.thumbnail }}
                              style={styles.thumbnail}
                              resizeMode="cover"
                            />
                          ) : (
                            <Image
                              source={require("../../assets/drafts-icon.png")}
                              style={{ width: 50, height: 50 }}
                              resizeMode="contain"
                            />
                          )}
                        </View>

                        <View style={styles.textContainer}>
                          <Text style={styles.title}>{draft.title}</Text>
                          <Text style={styles.date}>{draft.date}</Text>
                          {draft.description && (
                            <Text style={styles.description} numberOfLines={1}>
                              {draft.description}
                            </Text>
                          )}
                        </View>

                        <View style={styles.dropdownContainer}>
                          <DropdownMenu
                            options={[
                              {
                                id: "delete",
                                label: "Delete",
                                icon: "trash-outline",
                                color: "#EF4444",
                                onPress: () =>
                                  handleDeleteDraft(draft.id, draft.title),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    // Android version
                    <LinearGradient
                      colors={["#000000", "#0a0a0a", "#1a1a1a"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="flex-row items-center rounded-lg p-3 mb-3"
                      style={{
                        shadowColor: "#ffffff",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 3,
                      }}
                    >
                      <View className="w-12 h-12 rounded-lg mr-3 overflow-hidden">
                        {draft.thumbnail ? (
                          <Image
                            source={{ uri: draft.thumbnail }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <Image
                              source={require("../../assets/drafts-icon.png")}
                              style={{ width: 50, height: 50 }}
                              resizeMode="contain"
                            />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text className="text-white text-lg font-medium">
                          {draft.title}
                        </Text>
                        <Text className="text-gray-400 text-base">
                          {draft.date}
                        </Text>
                        {draft.description && (
                          <Text
                            className="text-gray-500 text-sm mt-1"
                            numberOfLines={1}
                          >
                            {draft.description}
                          </Text>
                        )}
                      </View>
                      <DropdownMenu
                        options={[
                          {
                            id: "delete",
                            label: "Delete",
                            icon: "trash-outline",
                            color: "#EF4444",
                            onPress: () =>
                              handleDeleteDraft(draft.id, draft.title),
                          },
                        ]}
                      />
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          // Series List
          <>
            {seriesLoading ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#F1C40F" />
                <Text className="text-gray-400 mt-2">Loading series...</Text>
              </View>
            ) : seriesError ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-red-400 text-center mb-4">
                  Error loading series: {seriesError}
                </Text>
                <TouchableOpacity
                  onPress={refetchSeries}
                  className="bg-gray-600 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : series.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Svg width={48} height={48} viewBox="0 0 41 40" fill="none">
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M28.1193 31.4285V20C28.1193 18.9896 27.718 18.0206 27.0035 17.3062C26.2891 16.5918 25.3202 16.1904 24.3098 16.1904H7.16695C6.1566 16.1904 5.18763 16.5918 4.47321 17.3062C3.75878 18.0206 3.35742 18.9896 3.35742 20V31.4285C3.35742 32.4389 3.75878 33.4078 4.47321 34.1223C5.18763 34.8367 6.1566 35.238 7.16695 35.238H24.3098C25.3202 35.238 26.2891 34.8367 27.0035 34.1223C27.718 33.4078 28.1193 32.4389 28.1193 31.4285Z"
                    stroke="#666"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <Path
                    d="M31.9284 31.4285V18.1047C31.9284 16.5891 31.3264 15.1357 30.2548 14.0641C29.1831 12.9924 27.7297 12.3904 26.2141 12.3904H26.2046L9.07129 12.4209"
                    stroke="#666"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <Path
                    d="M35.738 27.619V16.2038C35.738 14.1831 34.9353 12.2451 33.5064 10.8163C32.0776 9.38744 30.1397 8.58472 28.119 8.58472H28.1056L12.8809 8.60948"
                    stroke="#666"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
                <Text className="text-gray-400 text-center mt-4">
                  No series yet
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  Create your first series to get started
                </Text>
              </View>
            ) : (
              <View key={refreshKey}>
                {/* Show a subtle loading indicator when refreshing */}
                {isRefreshing && (
                  <View className="flex-row items-center justify-center py-2 mb-2">
                    <ActivityIndicator size="small" color="#F1C40F" />
                    <Text className="text-gray-400 ml-2 text-sm">
                      Updating...
                    </Text>
                  </View>
                )}
                {series.map((seriesItem) => (
                  <TouchableOpacity
                    key={seriesItem.id}
                    onPress={() => goToSeriesDetails(seriesItem.id)}
                    activeOpacity={0.7}
                    style={{ marginVertical: 8 }}
                  >
                    {Platform.OS === 'ios' ? (
                      // iOS version
                      <View style={[
                        styles.gradientContainer,
                        selectedSeries === seriesItem.id && styles.selectedContainer
                      ]}>
                        {/* Thumbnail */}
                        {seriesItem.thumbnail ? (
                          <Image
                            source={{ uri: seriesItem.thumbnail }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <Image
                            source={require("../../assets/episode.png")}
                            style={styles.iosPlaceholder}
                            resizeMode="contain"
                          />
                        )}

                        {/* Series Info */}
                        <View style={styles.infoContainer}>
                          <Text
                            style={styles.iosTitle}
                            numberOfLines={1}
                          >
                            {seriesItem.title}
                          </Text>
                          <Text style={styles.iosDate}>
                            {seriesItem.date}
                          </Text>
                          <Text style={styles.iosGenre}>
                            {seriesItem.genre} • {seriesItem.type}
                          </Text>
                        </View>

                        {/* Episode Count */}
                        <View style={styles.iosEpisodeContainer}>
                          <Text style={styles.iosEpisodeLabel}>
                            Total Episode
                          </Text>
                          <Text style={styles.iosEpisodeCount}>
                            {seriesItem.episodes.toString().padStart(2, "0")}
                          </Text>
                        </View>

                        {/* Dropdown Menu */}
                        <View style={styles.dropdownContainer}>
                          <DropdownMenu
                            options={[
                              {
                                id: "delete",
                                label: "Delete",
                                icon: "trash-outline",
                                color: "#EF4444",
                                onPress: () =>
                                  handleDeleteSeries(
                                    seriesItem.id,
                                    seriesItem.title
                                  ),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    ) : (
                      // Android version
                      <LinearGradient
                        colors={["#000000", "#0a0a0a", "#1a1a1a"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className={`flex-row items-center rounded-lg p-3 mb-3 ${selectedSeries === seriesItem.id
                            ? "border-2 border-blue-500"
                            : ""
                          }`}
                        style={{
                          shadowColor: "#ffffff",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 3,
                        }}
                      >
                        <View className="w-10 h-10 mr-2 items-center justify-center">
                          {seriesItem.thumbnail ? (
                            <Image
                              source={{ uri: seriesItem.thumbnail }}
                              className="w-full h-full rounded"
                              resizeMode="cover"
                            />
                          ) : (
                            <Image
                              source={require("../../assets/episode.png")}
                              style={{ width: 28, height: 28 }}
                              resizeMode="contain"
                            />
                          )}
                        </View>

                        <View className="flex-1">
                          <Text
                            className="text-white text-base font-medium"
                            numberOfLines={1}
                          >
                            {seriesItem.title}
                          </Text>
                          <Text className="text-gray-400 text-sm">
                            {seriesItem.date}
                          </Text>
                          <Text className="text-gray-500 text-xs">
                            {seriesItem.genre} • {seriesItem.type}
                          </Text>
                        </View>

                        <View className="items-end mr-2">
                          <Text className="text-gray-400 text-xs">
                            Total Episode
                          </Text>
                          <Text className="text-white text-sm font-medium">
                            {seriesItem.episodes.toString().padStart(2, "0")}
                          </Text>
                        </View>

                        <DropdownMenu
                          options={[
                            {
                              id: "delete",
                              label: "Delete",
                              icon: "trash-outline",
                              color: "#EF4444",
                              onPress: () =>
                                handleDeleteSeries(
                                  seriesItem.id,
                                  seriesItem.title
                                ),
                            },
                          ]}
                        />
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Section */}
      <View className="absolute px-4 bottom-10 left-0 right-0">
        {/* Action Button */}
        <TouchableOpacity
          className="bg-gray-200 rounded-full py-4 items-center"
          onPress={() => {
            if (activeTab === "draft") {
              goToUploadFlow();
            } else {
              // Go directly to series creation screen from studio
              goToSeriesCreation();
            }
          }}
        >
          <Text className="text-black text-lg font-medium">
            {activeTab === "draft" ? "Upload new video" : "Add new series"}
          </Text>
        </TouchableOpacity>
      </View>
      {/* </ThemedView> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    // Shadow for iOS
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Shadow for Android
    elevation: 3,
  },
  gradientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'linear-gradient(90deg, #000000,rgb(0, 0, 0),rgb(11, 11, 11))',
  },
  thumbnailContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
  },
  placeholderIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#666',
    borderRadius: 6,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  description: {
    color: '#888',
    fontSize: 14,
  },


  selectedContainer: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },

  androidThumbnail: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  iosThumbnail: {
    width: 48,
    height: 48,
    marginRight: 12,
  },


  androidPlaceholder: {
    width: 28,
    height: 28,
  },
  iosPlaceholder: {
    width: 32,
    height: 32,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },

  androidTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  iosTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 4,
  },
  androidDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  iosDate: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 4,
  },
  genre: {
    color: '#6b7280',
  },
  androidGenre: {
    fontSize: 12,
    color: '#6b7280',
  },
  iosGenre: {
    fontSize: 14,
    color: '#6b7280',
  },
  episodeContainer: {
    alignItems: 'flex-end',
  },
  androidEpisodeContainer: {
    marginRight: 8,
  },
  iosEpisodeContainer: {
    marginRight: 12,
  },
  episodeLabel: {
    color: '#9ca3af',
  },
  androidEpisodeLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  iosEpisodeLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  episodeCount: {
    color: 'white',
    fontWeight: '500',
  },
  androidEpisodeCount: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  iosEpisodeCount: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  dropdownContainer: {
    justifyContent: 'center',
  },

});

export default StrmlyStudio;


