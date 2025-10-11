import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface VideoGridSkeletonProps {
  count?: number;
}

const SkeletonItem: React.FC = () => {
  const shimmerTranslateX = useSharedValue(-width);

  useEffect(() => {
    shimmerTranslateX.value = withRepeat(
      withTiming(width, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslateX.value }],
    };
  });

  return (
    <View
      className="bg-gray-800 rounded-sm overflow-hidden flex-1 mx-0.5 mb-1"
      style={{
        aspectRatio: 9 / 16, // 9:16 aspect ratio to match video thumbnails
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            width: width * 0.5,
          }}
        />
      </Animated.View>
    </View>
  );
};

const VideoGridSkeleton: React.FC<VideoGridSkeletonProps> = ({ count = 9 }) => {
  // Create rows of 3 items each
  const rows = [];
  for (let i = 0; i < count; i += 3) {
    const rowItems = [];
    for (let j = 0; j < 3; j++) {
      if (i + j < count) {
        rowItems.push(<SkeletonItem key={i + j} />);
      }
    }
    rows.push(
      <View key={i} className="flex-row px-2 mb-1">
        {rowItems}
      </View>
    );
  }

  return (
    <View className="mt-4">
      {rows}
    </View>
  );
};

export default VideoGridSkeleton;