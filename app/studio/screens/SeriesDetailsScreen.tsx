import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  FlatList,
  Dimensions,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CONFIG } from "@/Constants/config";
import { useAuthStore } from "@/store/useAuthStore";
import { router, useLocalSearchParams } from "expo-router";
import EpisodeList from "../components/EpisodeList";
import VideoPlayer from "@/app/(dashboard)/long/_components/VideoPlayer";
import Constants from "expo-constants";
import { useVideosStore } from "@/store/useVideosStore";

interface SeriesDetailsScreenProps {
  seriesId?: string;
  onBack?: () => void;
  onAddNewEpisode?: () => void;
}

interface SeriesData {
  _id: string;
  title: string;
  description: string;
  price: number;
  genre: string;
  language: string;
  type: string;
  status: string;
  total_episodes: number;
  episodes: Episode[];
  release_date: string;
  seasons: number;
  likes: number;
  shares: number;
  views: number;
  earned_till_date: number;
  total_earned: number;
  created_by: {
    _id: string;
    username: string;
    email: string;
  };
  analytics: {
    total_likes: number;
    total_views: number;
    total_shares: number;
    total_reshares: number;
    followers_gained_through_series: number;
    engagement_rate: number;
  };
  hasCreatorPassOfVideoOwner: boolean;
  access: {
    isPlayable: true;
    freeRange: {
      start_time: 22;
      display_till_time: 22;
    };
    isPurchased: true;
    accessType: "creator_pass";
  };
  createdAt: string;
  updatedAt: string;
}

interface Episode {
  _id: string;
  name: string;
  description: string;
  type: string;
  amount: number;
  videoUrl: string;
  thumbnailUrl: string;
  episode_number: number;
  season_number: number;
  created_by: {
    _id: string;
    username: string;
    email: string;
  };
  views: number;
  likes: number;
  gifts: number;
  creatorPassDetails: any;
}

const SeriesDetailsScreen: React.FC<SeriesDetailsScreenProps> = ({
  seriesId: propSeriesId,
  onBack,
  onAddNewEpisode,
}) => {
  // Get parameters from route if not provided as props
  const params = useLocalSearchParams();
  const seriesId = propSeriesId || (params.seriesId as string);

  // Helper function for back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Early return if no seriesId
  if (!seriesId) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text className="text-red-400 text-center mb-4">
          Series ID is required
        </Text>
        <TouchableOpacity
          onPress={handleBack}
          className="bg-gray-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const [seriesData, setSeriesData] = useState<SeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {setVideoType, setVideosInZustand} = useVideosStore();

  const fetchSeriesDetails = async (showLoadingIndicator = true) => {
    try {
      const { token } = useAuthStore.getState();

      if (!token) {
        setError("Authentication required");
        if (showLoadingIndicator) {
          setLoading(false);
        }
        setRefreshing(false);
        return;
      }

      // Use the series by ID API to get specific series with episodes
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/series/${seriesId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      console.log("seres by id..");
      
      if (response.ok && result.data) {
        setSeriesData(result.data);
        setVideosInZustand(result.data.episodes);
        setError(null); // Clear any previous errors
      } else {
        setError(result.error || "Failed to fetch series details");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSeriesDetails();
  }, [seriesId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSeriesDetails(false);
  }, [seriesId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Video player functions
  const handleVideoPlayerOpen = (episode: Episode, allEpisodes: Episode[]) => {
    console.log(
      "🎬 Opening video player for episode:",
      episode.amount,
      episode.creatorPassDetails
    );

    setVideoType('series');
    const currentIndex = allEpisodes.findIndex((ep) => ep._id === episode._id);
    router.push({
      pathname: '/(dashboard)/long/GlobalVideoPlayer',
      params: {videoType: 'series', startIndex: currentIndex}
    })
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 mt-12">
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-medium">Series Details</Text>
          <View className="w-6" />
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F1C40F" />
          <Text className="text-gray-400 mt-4">Loading series details...</Text>
        </View>
      </View>
    );
  }

  if (error || !seriesData) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 mt-12">
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-medium">Series Details</Text>
          <View className="w-6" />
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-red-400 text-center mb-4">{error}</Text>
          <TouchableOpacity
            onPress={() => fetchSeriesDetails(true)}
            className="bg-gray-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 mt-4">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
          
        </TouchableOpacity>
        <Text className="text-white text-xl font-medium">
          {seriesData.title}
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={["#FFFFFF"]}
          />
        }
      >
        {/* Series Info */}
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-lg font-medium">
                Total episode:{" "}
                {(seriesData.total_episodes || 0).toString().padStart(2, "0")}
              </Text>
              <Text className="text-gray-400 text-sm">
                Launch on {formatDate(seriesData.release_date)}
              </Text>
            </View>
          </View>

          {/* Analytics */}
          <View className="flex-row justify-between mb-8">
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">
                {formatNumber(seriesData.analytics?.total_views || 0)}
              </Text>
              <Text className="text-gray-400 text-sm">Total view</Text>
            </View>
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">
                ₹{formatNumber(seriesData.total_earned || 0)}
              </Text>
              <Text className="text-gray-400 text-sm">Total earning</Text>
            </View>
          </View>
        </View>

        {/* Episodes List */}
        <View className="px-4">
          <EpisodeList
            episodes={seriesData.episodes || []}
            seriesTitle={seriesData.title}
            seriesId={seriesData._id}
            onEpisodeDeleted={() => fetchSeriesDetails(false)}
            onVideoPlayerOpen={handleVideoPlayerOpen}
          />
        </View>

        {/* Add some bottom padding */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
};

export default SeriesDetailsScreen;
