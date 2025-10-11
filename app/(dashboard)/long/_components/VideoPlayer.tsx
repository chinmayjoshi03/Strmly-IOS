import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Dimensions,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  usePlayerStore,
  setActivePlayer,
  clearActivePlayer,
} from "@/store/usePlayerStore";
import VideoControls from "./VideoControls";
import { VideoItemType } from "@/types/VideosType";
import CommentsSection from "./CommentSection";
import GiftingMessage from "./GiftingMessage";
import { router } from "expo-router";
import { useGiftingStore } from "@/store/useGiftingStore";
import SeriesPurchaseMessage from "./SeriesPurcchaseMessaage";
import CreatorPassBuyMessage from "./CreatorPassBuyMessage";
import VideoBuyMessage from "./VideoBuyMessage";
import { useIsFocused } from "@react-navigation/native";
import { useAuthStore } from "@/store/useAuthStore";
import { PanGestureHandler, State } from "react-native-gesture-handler";

import * as ScreenOrientation from "expo-screen-orientation";
import { useOrientationStore } from "@/store/useOrientationStore";
import VideoProgressBar from "./VideoProgressBar";
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

type Props = {
  videoData: VideoItemType;
  isActive: boolean;
  isGlobalPlayer: boolean;
  showCommentsModal?: boolean;
  setShowCommentsModal?: (show: boolean) => void;
  onEpisodeChange?: (episodeData: any) => void;
  onStatsUpdate?: (stats: {
    likes?: number;
    gifts?: number;
    shares?: number;
    comments?: number;
  }) => void;
  containerHeight?: number;
};

const VideoPlayer = ({
  videoData,
  isActive,
  isGlobalPlayer = false,
  showCommentsModal = false,
  setShowCommentsModal,
  onEpisodeChange,
  onStatsUpdate,
  containerHeight,
}: Props) => {
  const {
    isGifted,
    isVideoPurchased,
    giftSuccessMessage,
    creator,
    videoName,
    series,
    isPurchasedPass,
    isPurchasedSeries,
    clearGiftingData,
    clearSeriesData,
    clearVideoAccessData,
    clearPassData,
    setPurchaseSuccessCallback,

    isPurchasedCommunityPass,





  } = useGiftingStore();

  // Paid video states
  const [haveCreator, setHaveCreator] = useState(false);
  const [checkCreatorPass, setCheckCreatorPass] = useState(false);
  const [haveAccess, setHaveAccess] = useState(false);
  const [accessVersion, setAccessVersion] = useState(0);


  const [accessCheckedAPI, setAccessCheckedAPI] = useState(false);
  const { user } = useAuthStore();

  const [showWallet, setShowWallet] = useState(true);
  const [showBuyOption, setShowBuyOption] = useState(false);

  // Player store
  const { _updateStatus } = usePlayerStore.getState();
  const isMutedFromStore = usePlayerStore((state) => state.isMuted);

  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  // ✅ NEW: Initial seek states
  const [isInitialSeekComplete, setIsInitialSeekComplete] = useState(false);
  // ✅ NEW: Track if this is the first time becoming active for this video
  const [hasBeenActiveBefore, setHasBeenActiveBefore] = useState(false);

  // Speed control states
  const [currentSpeedLevel, setCurrentSpeedLevel] = useState(0); // 0 = 1x, 1 = 1.25x, 2 = 1.5x, 3 = 2x, 4 = 3x
  const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
  const speedLevels = [1.0, 1.25, 1.5, 2.0, 3.0];
  const speedLabels = ["1x", "1.25x", "1.5x", "2x", "3x"];

  // Local stats
  const [localStats, setLocalStats] = useState({
    likes: videoData.likes || 0,
    gifts: videoData.gifts || 0,
    shares: videoData.shares || 0,
    comments: videoData.comments?.length || 0,
  });

  // Comments refresh trigger
  const [commentsRefreshTrigger, setCommentsRefreshTrigger] = useState(0);

  const mountedRef = useRef(true);
  const statusListenerRef = useRef<any>(null);
  const timeListenerRef = useRef<any>(null);
  const playerRef = useRef<any>(null);

  const hasShownAccessModal = useRef(false);
  const modalDismissed = useRef(false);

  const VIDEO_HEIGHT = containerHeight || screenHeight;
  const isFocused = useIsFocused();

  // Speed control functions
  const updatePlaybackSpeed = (speedLevel: number) => {
    if (player && speedLevel >= 0 && speedLevel < speedLevels.length) {
      const newSpeed = speedLevels[speedLevel];
      player.playbackRate = newSpeed;
      setCurrentSpeedLevel(speedLevel);
      
      // Add haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Show speed indicator
      setShowSpeedIndicator(true);
      setTimeout(() => setShowSpeedIndicator(false), 2000);
      
      console.log(`Speed changed to: ${speedLabels[speedLevel]}`);
    }
  };

  const handleSpeedSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Right swipe: 1x → 1.25x → 1.5x → 2x → 3x → 1x (cycle back)
      let nextLevel;
      
      if (currentSpeedLevel >= speedLevels.length - 1) {
        // If at maximum speed (3x), cycle back to 1x
        nextLevel = 0;
      } else {
        // Otherwise, increase to next level
        nextLevel = currentSpeedLevel + 1;
      }
      
      if (nextLevel !== currentSpeedLevel) {
        updatePlaybackSpeed(nextLevel);
      }
    } else {
      // Left swipe - reverse order cycling: 1x → 3x → 2x → 1.5x → 1.25x → 1x
      let nextLevel;
      
      switch (currentSpeedLevel) {
        case 0: // 1x → 3x (jump to highest speed)
          nextLevel = 4; // 3x
          break;
        case 4: // 3x → 2x
          nextLevel = 3; // 2x
          break;
        case 3: // 2x → 1.5x
          nextLevel = 2; // 1.5x
          break;
        case 2: // 1.5x → 1.25x
          nextLevel = 1; // 1.25x
          break;
        case 1: // 1.25x → 1x (back to normal)
          nextLevel = 0; // 1x
          break;
        default:
          nextLevel = 0; // fallback to 1x
      }
      
      if (nextLevel !== currentSpeedLevel) {
        updatePlaybackSpeed(nextLevel);
      }
    }
  };

  // Track gesture state to prevent multiple triggers
  const gestureRef = useRef({ lastTrigger: 0, isProcessing: false });

  const onGestureEvent = (event: any) => {
    const { translationX, velocityX, state } = event.nativeEvent;
    const now = Date.now();
    
    // Prevent rapid successive triggers
    if (gestureRef.current.isProcessing || now - gestureRef.current.lastTrigger < 300) {
      return;
    }
    
    // Only handle horizontal swipes with sufficient velocity and distance
    if (Math.abs(velocityX) > 400 && Math.abs(translationX) > 40) {
      gestureRef.current.isProcessing = true;
      gestureRef.current.lastTrigger = now;
      
      if (translationX > 0) {
        // Right swipe - increase speed
        handleSpeedSwipe('right');
      } else {
        // Left swipe - decrease speed
        handleSpeedSwipe('left');
      }
      
      // Reset processing flag after a delay
      setTimeout(() => {
        gestureRef.current.isProcessing = false;
      }, 200);
    }
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      // Reset processing flag when gesture ends
      setTimeout(() => {
        gestureRef.current.isProcessing = false;
      }, 100);
    }
  };





  // FIX: Update local stats when videoData changes (e.g., when switching videos)
  useEffect(() => {
    setLocalStats({
      likes: videoData.likes || 0,
      gifts: videoData.gifts || 0,
      shares: videoData.shares || 0,
      comments: videoData.comments?.length || 0,
    });
  }, [
    videoData._id,
    videoData.likes,
    videoData.gifts,
    videoData.shares,
    videoData.comments?.length,
  ]);

  useEffect(() => {
    const handlePurchaseSuccess = () => {
      console.log('Purchase success detected in VideoPlayer, updating access');

      // Increment access version to trigger re-evaluation
      setAccessVersion(prev => prev + 1);

      // Update access states based on purchase type
      if (isVideoPurchased) {
        console.log('Video purchased, granting access');
        setHaveAccess(true);
      }

      if (isPurchasedPass || isPurchasedCommunityPass) {
        console.log('Creator pass purchased, granting creator access');
        setHaveCreator(true);
        setCheckCreatorPass(true);
      }

      if (isPurchasedSeries) {
        console.log('Series purchased, granting access');
        setHaveAccess(true);
      }
    };

    // Set up the callback in the store
    setPurchaseSuccessCallback(handlePurchaseSuccess);

    // Cleanup function
    return () => {
      setPurchaseSuccessCallback(() => { });
    };
  }, [
    setPurchaseSuccessCallback,
    isVideoPurchased,
    isPurchasedPass,
    isPurchasedCommunityPass,
    isPurchasedSeries
  ]);

  // Full screen:
  const { setOrientation, isLandscape } = useOrientationStore();

  // Access check states
  const [fetchVideoDataAccess, setFetchVideoDataAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [canPlayVideo, setCanPlayVideo] = useState(false);

  // Create player with proper cleanup
  const player = useVideoPlayer(videoData?.videoUrl || "", (p) => {
    p.loop = true;
    p.muted = isMutedFromStore;
    p.playbackRate = speedLevels[currentSpeedLevel];
  });

  // Awake mobile screen
  useEffect(() => {
    if (isActive && canPlayVideo && isReady) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }

    return () => {
      deactivateKeepAwake(); // cleanup
    };
  }, [isActive, canPlayVideo, isReady]);

  useEffect(() => {
    playerRef.current = player;
    return () => {
      playerRef.current = null;
    };
  }, [player]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);



  // Set Access and Creator pass state of user when data comes
  useEffect(() => {
    setHaveAccess(videoData.access.isPurchased);
    setHaveCreator(videoData.hasCreatorPassOfVideoOwner);
    setFetchVideoDataAccess(true);
  }, [videoData.hasCreatorPassOfVideoOwner, videoData.access.isPurchased]);

  // Update access if newly purchased
  useEffect(() => {
    if ((isPurchasedSeries || isVideoPurchased) && !haveAccess) {
      console.log('VideoPlayer: Updating access due to purchase. isPurchasedSeries:', isPurchasedSeries, 'isVideoPurchased:', isVideoPurchased);
      setHaveAccess(true);
    }
  }, [isVideoPurchased, isPurchasedSeries, haveAccess]);

  useEffect(() => {
    console.log('VideoPlayer Access Debug:', {
      videoId: videoData._id,
      haveAccess,
      haveCreator,
      'videoData.access.isPurchased': videoData.access.isPurchased,
      'isPurchasedSeries': isPurchasedSeries,
      'isVideoPurchased': isVideoPurchased,
      'combined access': haveAccess || haveCreator || videoData.access.isPurchased
    });
  }, [haveAccess, haveCreator, videoData.access.isPurchased, isPurchasedSeries, isVideoPurchased, videoData._id]);

  // Update creator pass if just purchased
  useEffect(() => {
    if (
      checkCreatorPass &&
      !haveCreator &&
      !videoData.hasCreatorPassOfVideoOwner
    ) {
      setHaveCreator(true);
    }
  }, [checkCreatorPass, haveCreator, videoData.hasCreatorPassOfVideoOwner]);

  useEffect(() => {
    if (!videoData || !fetchVideoDataAccess) return;

    setAccessChecked(false);

    console.log('VideoPlayer Access Check:', {
      videoId: videoData._id,
      isOwner: videoData.created_by._id === user?.id,
      amount: videoData.amount,
      haveCreator,
      haveAccess,
      accessVersion, // This will trigger re-evaluation when purchases happen
      isVideoPurchased,
      isPurchasedSeries,
      isPurchasedPass,
      isPurchasedCommunityPass
    });

    if (
      videoData.created_by._id !== user?.id &&
      videoData.amount !== 0 &&
      fetchVideoDataAccess
    ) {
      // Check all forms of access
      const hasAnyAccess = haveCreator || haveAccess || videoData.access.isPurchased || isVideoPurchased || isPurchasedSeries || isPurchasedPass || isPurchasedCommunityPass;

      if (!hasAnyAccess) {
        console.log('No access found, allowing free portion play');
        setCanPlayVideo(true); // Allow video to play free portion
      } else {
        console.log('Access granted, allowing full video play');
        setCanPlayVideo(true);
      }
    } else {
      console.log('User owns video or video is free, allowing play');
      setCanPlayVideo(true);
    }

    setAccessChecked(true);
  }, [
    videoData,
    user?.id,
    haveCreator,
    haveAccess,
    fetchVideoDataAccess,
    accessVersion, // Include accessVersion to trigger re-evaluation
    isVideoPurchased,
    isPurchasedSeries,
    isPurchasedPass,
    isPurchasedCommunityPass
  ]);

  // Handle player status changes
  useEffect(() => {
    if (!player || !videoData?.videoUrl) return;

    const handleStatusChange = ({ status, error }: any) => {
      if (!mountedRef.current) return;

      setIsReady(status === "readyToPlay");
      setIsBuffering(status === "loading");
      setPlayerError(!!error);

      if (error) {
        console.error("Video player error:", error);
      }
    };

    statusListenerRef.current = player.addListener(
      "statusChange",
      handleStatusChange
    );

    return () => {
      if (statusListenerRef.current) {
        statusListenerRef.current.remove();
        statusListenerRef.current = null;
      }
    };
  }, [player, videoData?.videoUrl]);

  // ✅ NEW: Handle initial seek completion callback
  const handleInitialSeekComplete = () => {
    console.log('Initial seek completed for video:', videoData._id);
    setIsInitialSeekComplete(true);
  };

  // ✅ UPDATED: Handle video playback with initial seek logic and proper state management
  useEffect(() => {
    if (!player || !videoData?.videoUrl) return;

    const hasStartTime = videoData?.access?.freeRange?.start_time > 0;

    const shouldPlay =
      accessChecked &&
      canPlayVideo &&
      isReady &&
      isActive &&
      isFocused &&
      !isGifted &&
      !playerError &&
      // ✅ NEW: Only play if initial seek is complete (for videos with start time) or no start time
      (!hasStartTime || isInitialSeekComplete);

    console.log(`VideoPlayer ${videoData._id}: Playback decision`, {
      shouldPlay,
      accessChecked,
      canPlayVideo,
      isReady,
      isActive,
      isFocused,
      isGifted: !!isGifted,
      playerError,
      isInitialSeekComplete,
      hasStartTime
    });

    try {
      if (shouldPlay) {
        console.log(`VideoPlayer ${videoData._id}: Starting playback`);
        player.muted = isMutedFromStore;
        player.play();
        setActivePlayer(player);
        usePlayerStore.getState().smartPlay();
      } else {
        console.log(`VideoPlayer ${videoData._id}: Pausing playback`);
        player.pause();
        if (!isFocused || !isActive) {
          player.muted = true; // Ensure muted when inactive
          clearActivePlayer();
        }
      }
    } catch (error) {
      console.error("Error controlling video playback:", error);
      setPlayerError(true);
    }
  }, [
    accessChecked,
    canPlayVideo,
    isReady,
    isActive,
    isFocused,
    isGifted,
    isMutedFromStore,
    player,
    playerError,
    videoData?.videoUrl,
    videoData._id,
    isInitialSeekComplete, // ✅ NEW: Include initial seek state
    videoData?.access?.freeRange?.start_time, // ✅ NEW: Include start time
  ]);

  // ✅ FIXED: Reset initial seek state when video changes or becomes active
  useEffect(() => {
    setIsInitialSeekComplete(false);
    setHasBeenActiveBefore(false);
    
    // Reset all player states when video changes
    setIsReady(false);
    setIsBuffering(false);
    setPlayerError(false);
    setAccessChecked(false);
    setCanPlayVideo(false);
    
    // Reset speed control when video changes
    setCurrentSpeedLevel(0);
    setShowSpeedIndicator(false);
    
    console.log(`VideoPlayer: Resetting states for video ${videoData._id}`);
  }, [videoData._id, videoData?.access?.freeRange?.start_time]);

  // ✅ NEW: Reset states when becoming inactive to ensure clean state for next activation
  useEffect(() => {
    if (!isActive) {
      console.log(`VideoPlayer: Video ${videoData._id} became inactive, resetting seek states`);
      setIsInitialSeekComplete(false);
      setHasBeenActiveBefore(false);
      
      // Ensure player is properly paused and muted when inactive
      if (player) {
        try {
          player.pause();
          player.muted = true;
          clearActivePlayer();
        } catch (error) {
          console.log("Error pausing inactive player:", error);
        }
      }
    } else {
      console.log(`VideoPlayer: Video ${videoData._id} became active`);
    }
  }, [isActive, videoData._id, player]);

  // ✅ FIXED: Only reset to start time on FIRST activation, not on orientation changes
  useEffect(() => {
    if (isActive && player && videoData?.access?.freeRange?.start_time > 0) {
      // Only reset to start time if this is the first time becoming active for this video
      if (!hasBeenActiveBefore) {
        const startTime = videoData.access.freeRange.start_time;
        if (player.currentTime !== startTime) {
          console.log(`VideoPlayer: Initial reset of video ${videoData._id} to start time: ${startTime}s`);
          player.currentTime = startTime;
          
          // Call the initial seek complete callback after a short delay to ensure seek is processed
          setTimeout(() => {
            console.log(`VideoPlayer: Calling handleInitialSeekComplete for video ${videoData._id}`);
            handleInitialSeekComplete();
          }, 300);
        } else {
          // If already at start time, just call the callback
          handleInitialSeekComplete();
        }
        setHasBeenActiveBefore(true);
      }
      // If hasBeenActiveBefore is true, don't reset - let the user's seek position remain
    } else if (isActive && player && (!videoData?.access?.freeRange?.start_time || videoData?.access?.freeRange?.start_time <= 0)) {
      // For videos without start time, immediately mark initial seek as complete
      if (!hasBeenActiveBefore) {
        console.log(`VideoPlayer: No start time for video ${videoData._id}, marking initial seek complete`);
        handleInitialSeekComplete();
        setHasBeenActiveBefore(true);
      }
    }
  }, [isActive, player, videoData._id, videoData?.access?.freeRange?.start_time, hasBeenActiveBefore]);

  // Handle gifting pause
  useEffect(() => {
    if (!player) return;

    try {
      if (isGifted) {
        player.pause();
      } else if (
        isActive &&
        isFocused &&
        isReady &&
        !playerError &&
        canPlayVideo &&
        (!videoData?.access?.freeRange?.start_time || isInitialSeekComplete) // ✅ NEW: Check initial seek
      ) {
        player.play();
      }
    } catch (error) {
      console.error("Error handling gifting state:", error);
    }
  }, [
    isGifted,
    player,
    isActive,
    isFocused,
    isReady,
    playerError,
    canPlayVideo,
    isInitialSeekComplete, // ✅ NEW: Include initial seek state
    videoData?.access?.freeRange?.start_time,
  ]);

  // Handle focus with improved audio management
  useEffect(() => {
    if (!player) return;

    console.log(`VideoPlayer ${videoData._id}: Focus change`, {
      isFocused,
      isActive,
      isReady,
      canPlayVideo,
      isMutedFromStore
    });

    try {
      if (!isFocused) {
        console.log(`VideoPlayer ${videoData._id}: Lost focus, pausing and muting`);
        player.pause();
        player.muted = true;
        clearActivePlayer();
      } else if (
        isActive &&
        isReady &&
        !isGifted &&
        !playerError &&
        canPlayVideo &&
        (!videoData?.access?.freeRange?.start_time || isInitialSeekComplete) // ✅ NEW: Check initial seek
      ) {
        console.log(`VideoPlayer ${videoData._id}: Gained focus, playing with mute state:`, isMutedFromStore);
        player.muted = isMutedFromStore;
        player.play();
        setActivePlayer(player);
        usePlayerStore.getState().smartPlay();
      }
    } catch (error) {
      console.error("Error handling focus change:", error);
    }
  }, [
    isFocused,
    isActive,
    player,
    isMutedFromStore,
    isReady,
    isGifted,
    playerError,
    canPlayVideo,
    videoData._id,
    isInitialSeekComplete, // ✅ NEW: Include initial seek state
    videoData?.access?.freeRange?.start_time,
  ]);

  // Handle player store updates
  useEffect(() => {
    if (!videoData?.videoUrl || !player) return;

    const handleStatus = (payload: any) => {
      if (isActive && mountedRef.current) {
        _updateStatus(payload.status, payload.error);
      }
    };

    statusListenerRef.current = player.addListener(
      "statusChange",
      handleStatus
    );
    timeListenerRef.current = player.addListener("timeUpdate", handleStatus);

    return () => {
      if (statusListenerRef.current) {
        statusListenerRef.current.remove();
        statusListenerRef.current = null;
      }
      if (timeListenerRef.current) {
        timeListenerRef.current.remove();
        timeListenerRef.current = null;
      }
    };
  }, [isActive, player, _updateStatus, videoData?.videoUrl]);

  // Stats update
  const handleStatsUpdate = (stats: {
    likes?: number;
    gifts?: number;
    shares?: number;
    comments?: number;
  }) => {
    setLocalStats((prev) => ({
      ...prev,
      ...stats,
    }));

    if (onStatsUpdate) {
      onStatsUpdate(stats);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (statusListenerRef.current) {
        statusListenerRef.current.remove();
        statusListenerRef.current = null;
      }
      if (timeListenerRef.current) {
        timeListenerRef.current.remove();
        timeListenerRef.current = null;
      }

      if (playerRef.current) {
        try {
          playerRef.current.pause();
          clearActivePlayer();
          setTimeout(() => {
            if (playerRef.current) {
              try {
                playerRef.current.replace("");
              } catch (error) {
                console.log("Player cleanup error (expected):", error);
              }
            }
          }, 100);
        } catch (error) {
          console.log("Player cleanup error (expected):", error);
        }
      }
    };
  }, []);

  const onToggleFullScreen = async () => {
    try {
      if (isLandscape) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
        setOrientation(false);
      } else {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
        setOrientation(true);
      }
    } catch (err) {
      console.error("Orientation toggle error:", err);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      height: isLandscape ? screenWidth : VIDEO_HEIGHT,
      width: "100%",
      backgroundColor: "#000",
      position: "relative",
    },
    video: {
      width: "100%",
      height: "100%",
    },
    thumbnail: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    spinner: {
      position: "absolute",
      top: "50%",
      left: "50%",
      marginLeft: -20,
      marginTop: -20,
    },
  });

  const styles = StyleSheet.create({
    speedIndicator: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: [{ translateX: -30 }, { translateY: -20 }],
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      zIndex: 100,
    },
    speedText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
    },
  });

  // ✅ Safe fallback → show only thumbnail until access is checked
  if (!accessChecked) {
    return (
      <View style={dynamicStyles.container}>
        <Image
          source={{ uri: videoData.thumbnailUrl }}
          style={dynamicStyles.thumbnail}
        />
      </View>
    );
  }

  if (!videoData?.videoUrl) {
    return <View style={dynamicStyles.container} />;
  }

  if (playerError) {
    return (
      <View
        style={[
          dynamicStyles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Video unavailable
        </Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {player && canPlayVideo ? (
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-50, 50]}
          failOffsetY={[-50, 50]}
          minPointers={1}
          maxPointers={1}
        >
          <View className="relative items-center justify-center">
            <VideoView
              player={player}
              nativeControls={false}
              style={dynamicStyles.video}
              contentFit="cover"
            />
            {isBuffering && (
              <ActivityIndicator
                size="large"
                color="white"
                style={dynamicStyles.spinner}
              />
            )}
            
            {/* Speed Indicator */}
            {showSpeedIndicator && (
              <View style={styles.speedIndicator}>
                <Text style={styles.speedText}>
                  {speedLabels[currentSpeedLevel]}
                </Text>
              </View>
            )}
          </View>
        </PanGestureHandler>
      ) : (
        <View className="relative">
          <Image
            source={{ uri: videoData.thumbnailUrl }}
            style={dynamicStyles.thumbnail}
          />
        </View>
      )}

      <VideoControls
        haveCreatorPass={haveCreator}
        haveAccessPass={haveAccess}
        haveCreator={setCheckCreatorPass}
        checkAccess={setAccessCheckedAPI}
        accessVersion={accessVersion}
        handleInitialSeekComplete={handleInitialSeekComplete}
        showBuyOption={showBuyOption}
        setShowBuyOption={setShowBuyOption}
        showWallet={setShowWallet}
        player={player}
        videoData={{
          ...videoData,
          likes: localStats.likes,
          gifts: localStats.gifts,
          shares: localStats.shares,
          comments: Array(localStats.comments).fill(null),
        }}
        isGlobalPlayer={isGlobalPlayer}
        setShowCommentsModal={setShowCommentsModal}
        onCommentsModalOpen={() => {
          console.log("💰 Comments modal opened, triggering refresh");
          setCommentsRefreshTrigger((prev) => prev + 1);
        }}
        onEpisodeChange={onEpisodeChange}
        onToggleFullScreen={onToggleFullScreen}
        onStatsUpdate={handleStatsUpdate}
      />

      {showWallet && accessCheckedAPI && (
        <View
          className={`absolute left-0 right-0 z-10`}
          style={
            !isGlobalPlayer
              ? isLandscape
                ? { bottom: "8%" }
                : { bottom: "5%" }
              : isLandscape
                ? { bottom: "3%" }
                : { bottom: 5 }
          }
        >
          {/* ✅ UPDATED: Pass combined callback that updates both states */}
          <VideoProgressBar
            player={player}
            isActive={isActive}
            videoId={videoData._id}
            duration={videoData.duration || 0}
            access={videoData.access}
            hasCreatorPassOfVideoOwner={videoData.hasCreatorPassOfVideoOwner}
            onInitialSeekComplete={() => {
              console.log(`VideoPlayer: onInitialSeekComplete called for ${videoData._id}`);
              handleInitialSeekComplete();
            }}
            isVideoOwner={videoData.created_by._id === user?.id}
            haveAccess={haveAccess}
            haveCreator={haveCreator}
            isGlobalPlayer={isGlobalPlayer}
            accessVersion={accessVersion}
            showBuyOption={setShowBuyOption}
            videoData={{
              _id: videoData._id,
              name: videoData.name,
              amount: videoData.amount,
              created_by: {
                _id: videoData.created_by._id,
                username: videoData.created_by.username,
                name: (videoData.created_by as any).name || videoData.created_by.username,
                profile_photo: videoData.created_by.profile_photo,
              },
              series: videoData.series ? {
                _id: videoData.series._id,
                type: videoData.series.type,
                price: videoData.series.price,
              } : null,
            }}
          />
        </View>
      )}

      {showWallet && !isLandscape && (
        <View
          className={`z-10 absolute left-5 ${showWallet ? "top-10" : "top-14"}`}
        >
          {/* <Pressable onPress={() => router.push("/(dashboard)/wallet")}>
            <Image
              source={require("../../../../assets/images/Wallet.png")}
              className="size-10"
            />
          </Pressable> */}
        </View>
      )}

      {isGifted && (
        <View className="z-10 absolute w-full">
          <GiftingMessage
            isVisible={true}
            onClose={clearGiftingData}
            creator={creator}
            amount={giftSuccessMessage}
          />
        </View>
      )}

      {isVideoPurchased && (
        <View className="absolute z-10">
          <VideoBuyMessage
            isVisible={true}
            onClose={clearVideoAccessData}
            creator={creator}
            name={videoName}
            amount={giftSuccessMessage}
          />
        </View>
      )}

      {isPurchasedPass && (
        <View>
          <CreatorPassBuyMessage
            isVisible={true}
            onClose={clearPassData}
            creator={creator}
            amount={giftSuccessMessage}
          />
        </View>
      )}

      {isPurchasedSeries && series && (
        <View>
          <SeriesPurchaseMessage
            isVisible={true}
            onClose={clearSeriesData}
            series={{
              ...series,
              created_by: {
                _id: videoData.created_by._id,
                username: videoData.created_by.username,
                name: (videoData.created_by as any).name || videoData.created_by.username,
                profile_photo: videoData.created_by.profile_photo,
              }
            }}
          />
        </View>
      )}

      {showCommentsModal && setShowCommentsModal && (
        <CommentsSection
          key={`comments-${videoData._id}`} // Stable key per video
          onClose={() => setShowCommentsModal(false)}
          videoId={videoData._id}
          refreshTrigger={commentsRefreshTrigger} // Pass refresh trigger
          onPressUsername={(userId) => {
            try {
              router.push(`/(dashboard)/profile/public/${userId}`);
            } catch (error) {
              console.error("Navigation error:", error);
            }
          }}
          onPressTip={(commentId) => {
            console.log("Open tip modal for comment:", commentId);
          }}
          onCommentAdded={() => {
            const newCommentCount = localStats.comments + 1;
            setLocalStats((prev) => ({
              ...prev,
              comments: newCommentCount,
            }));
            if (onStatsUpdate) {
              onStatsUpdate({ comments: newCommentCount });
            }
          }}
        />
      )}
    </View>
  );
};

export default React.memo(VideoPlayer);