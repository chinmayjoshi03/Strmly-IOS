import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FlatList,
  Dimensions,
  ActivityIndicator,
  Text,
  Pressable,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ThemedView from "@/components/ThemedView";
import { CONFIG } from "@/Constants/config";
import { VideoItemType } from "@/types/VideosType";
import { Link, useFocusEffect, useLocalSearchParams } from "expo-router";
import VideoPlayer from "./_components/VideoPlayer";
import { useVideosStore } from "@/store/useVideosStore";
import { useOrientationStore } from "@/store/useOrientationStore";
import { useGiftingStore } from "@/store/useGiftingStore";

const { height: screenHeight } = Dimensions.get("window");
const VIDEO_HEIGHT = screenHeight;

const GlobalVideoPlayer: React.FC = () => {
  const params = useLocalSearchParams<{
    startIndex?: string;
    videoType?: string;
  }>();
  const startIndex = params.startIndex;
  const videoType = params.videoType ?? null;

  const [videos, setVideos] = useState<VideoItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [nowRenderVideo, setNowRenderVideo] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const { storedVideos, setVideoType } = useVideosStore();
  const { isLandscape } = useOrientationStore();
  const { isPurchasedSeries, isVideoPurchased, isPurchasedPass, isPurchasedCommunityPass } = useGiftingStore();
  const flatListRef = useRef<FlatList>(null);
  const debounceRef = useRef<NodeJS.Timeout | number | null>(null);

  useEffect(() => {
    if (storedVideos.length > 0 && videos.length == 0) {
      setVideos(storedVideos);
      const index = Math.min(
        Math.max(parseInt(startIndex ?? "0", 10), 0),
        storedVideos.length - 1
      );
      setVisibleIndex(index);
      setLoading(false);
      setNowRenderVideo(true);
    }
  }, [storedVideos, startIndex]);

  useFocusEffect(
    useCallback(() => {
      setVideoType(videoType ?? null);
      console.log('🌍 GlobalVideoPlayer focused with access states:', {
        isPurchasedSeries,
        isVideoPurchased,
        isPurchasedPass,
        isPurchasedCommunityPass,
        videoType
      });
    }, [videoType, isPurchasedSeries, isVideoPurchased, isPurchasedPass, isPurchasedCommunityPass])
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (viewableItems.length > 0) {
        const currentIndex = viewableItems[0].index;
        setVisibleIndex(currentIndex);
      }
    }, 100);
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 95,
    minimumViewTime: 100,
    waitForInteraction: true,
  }).current;

 const renderItem = useCallback(
  ({ item, index }: { item: VideoItemType; index: number }) => {
    if (index !== visibleIndex) {
      return <ThemedView style={{ height: VIDEO_HEIGHT }} />;
    }

    return (
      <ThemedView style={{ 
        height: VIDEO_HEIGHT, 
        paddingBottom: 200 // Add bottom padding to prevent progress bar from going off-screen
      }}>
        <VideoPlayer
          key={`video-${item._id}`}
          videoData={item}
          isActive={index === visibleIndex}
          isGlobalPlayer={true}
          showCommentsModal={showCommentsModal}
          setShowCommentsModal={setShowCommentsModal}
        />
      </ThemedView>
    );
  },
  [visibleIndex, showCommentsModal]
);

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: VIDEO_HEIGHT,
      offset: VIDEO_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback(
    (item: VideoItemType, index: number) => `${item._id}-${index}`,
    []
  );

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <ThemedView
            style={{ height: VIDEO_HEIGHT }}
            className="justify-center items-center"
          >
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white mt-4">Loading videos...</Text>
          </ThemedView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <ThemedView
            style={{ height: VIDEO_HEIGHT }}
            className="justify-center items-center px-4"
          >
            <Text className="text-white text-center mb-4">
              Oops something went wrong!
            </Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                setError(null);
              }}
              className="bg-blue-600 px-4 py-2 rounded"
            >
              <Text className="text-white">Retry</Text>
            </Pressable>
          </ThemedView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (videos.length === 0) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
          <ThemedView
            style={{ height: VIDEO_HEIGHT }}
            className="justify-center items-center"
          >
            <Text className="text-lg text-white">No Videos Available</Text>
            <Text className="text-lg text-white">
              Want to Upload your own{" "}
              <Link href={"/studio"} className="text-blue-500">
                Upload
              </Link>
            </Text>
          </ThemedView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={[]}>
        <FlatList
          ref={flatListRef}
          data={videos}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          initialScrollIndex={visibleIndex}
          pagingEnabled
          scrollEnabled={!showCommentsModal && !isLandscape}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={1}
          // updateCellsBatchingPeriod={100}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          style={{ height: VIDEO_HEIGHT }}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          snapToInterval={VIDEO_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          bounces={false}
          scrollEventThrottle={16}
          disableIntervalMomentum={true}
          contentContainerStyle={{ backgroundColor: "#000" }}
          overScrollMode="never"
          alwaysBounceVertical={false}
        />
    </SafeAreaView>
  );
};

export default GlobalVideoPlayer;
