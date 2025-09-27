import React, { useState, useCallback } from "react";
import {
  FlatList,
  Dimensions,
  ActivityIndicator,
  Text,
  View,
} from "react-native";
import ThemedView from "@/components/ThemedView";
import { VideoItemType } from "@/types/VideosType";
import { useLocalSearchParams } from "expo-router";
import VideoPlayer from "@/app/(dashboard)/long/_components/VideoPlayer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type GiftType = {
  creator: {
    _id: string;
    username: string;
    profile_photo: string;
  };
  videoId: string;
};

const { height: screenHeight } = Dimensions.get("screen");
const insets = useSafeAreaInsets();
// const VIDEO_HEIGHT = screenHeight - 100 - insets.bottom;

const GlobalVideoPlayer: React.FC = () => {
  const [loading] = useState(false); // Set to false since we're not actually loading anything
  const [error] = useState<string | null>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const { data } = useLocalSearchParams();
   const VIDEO_HEIGHT = screenHeight - insets.top - insets.bottom;
  const videos = data ? JSON.parse(data as string) : [];


  // OPTIMIZATION 1: Stabilize the onViewableItemsChanged callback
  // This prevents FlatList from re-rendering just because the parent re-rendered.
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setVisibleIndex(viewableItems[0].index);
    }
  }, []); // Empty dependency array means this function is created only once.

  // OPTIMIZATION 2: Memoize the renderItem function
  // This prevents creating a new render function on every parent render.
  const renderItem = useCallback(
    ({ item, index }: { item: VideoItemType; index: number }) => (
      <View style={{ 
        height: VIDEO_HEIGHT, 
        width: '100%', 
        overflow: 'hidden',
        backgroundColor: '#000'
      }}>
        <VideoPlayer
          videoData={item}
          isActive={index === visibleIndex}
          isGlobalPlayer={true}
          containerHeight={VIDEO_HEIGHT}
        />
      </View>
    ),
    [visibleIndex]
  );

  // OPTIMIZATION 3: Use consistent VIDEO_HEIGHT for layout calculations
  // This ensures all videos have the same height and prevents layout issues
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: VIDEO_HEIGHT,
      offset: VIDEO_HEIGHT * index,
      index,
    }),
    [VIDEO_HEIGHT]
  );

  if (loading) {
    return (
      <ThemedView style={{ flex: 1 }} className="justify-center items-center">
        <ActivityIndicator size="large" color="white" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={{ flex: 1 }} className="justify-center items-center">
        <Text className="text-white">{error}</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'black' }}>
      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        getItemLayout={getItemLayout}
        pagingEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ 
          itemVisiblePercentThreshold: 95,
          minimumViewTime: 200,
          waitForInteraction: false
        }}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={1}
        removeClippedSubviews={false}
        bounces={false}
        disableIntervalMomentum={true}
        scrollEventThrottle={16}
        snapToInterval={VIDEO_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: '#000' }}
        overScrollMode="never" // Android: prevent over-scrolling
        alwaysBounceVertical={false} // iOS: prevent bouncing
      />
    </ThemedView>
  );
};

export default GlobalVideoPlayer;