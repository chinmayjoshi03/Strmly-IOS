import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  PanResponder,
  Text,
  Pressable,
  Alert,
} from "react-native";
import { VideoPlayer } from "expo-video";
import { useAuthStore } from "@/store/useAuthStore";
import Constants from "expo-constants";

const PROGRESS_BAR_HEIGHT = 4; // Thicker progress bar like YouTube/TikTok
const KNOB_SIZE = 14;

type AccessType = {
  isPlayable: boolean;
  freeRange: {
    start_time: number;
    display_till_time: number;
  };
  isPurchased: boolean;
  accessType: string;
  price: number;
};

type Props = {
  videoId: string;
  player: VideoPlayer;
  isActive: boolean;
  hasCreatorPassOfVideoOwner: boolean;
  duration: number;
  access: AccessType;
  onInitialSeekComplete?: () => void;
  isVideoOwner?: boolean;
  haveAccess: boolean;
  haveCreator: boolean;
  showBuyOption: React.Dispatch<React.SetStateAction<boolean>>;
  isGlobalPlayer?: boolean;
  accessVersion?: number;
};

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const VideoProgressBar = ({
  videoId,
  player,
  isActive,
  hasCreatorPassOfVideoOwner,
  duration,
  access,
  showBuyOption,
  onInitialSeekComplete,
  isVideoOwner,
  haveAccess,
  haveCreator,
  isGlobalPlayer = false,
  accessVersion,
}: Props) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [hasPerformedInitialSeek, setHasPerformedInitialSeek] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const dragTimeRef = useRef<number | null>(null);
  const progressBarContainerWidth = useRef<number>(0);
  const progressBarRef = useRef<View>(null);
  const [progressBarX, setProgressBarX] = useState(0);
  const [showAccessModal, setShowAccessModal] = useState(false);

  const initialStartTime = access?.freeRange?.start_time ?? 0;
  const endTime = access?.freeRange?.display_till_time ?? duration;

  const hasShownAccessModal = useRef(false);
  const modalDismissed = useRef(false);
  const initialSeekTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUserInteracted = useRef(false);
  
  // Add persistent interval ref to prevent cleanup issues
  const timeTrackingInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Add component mounted ref to handle cleanup properly
  const isMounted = useRef(true);

  const { token } = useAuthStore();
  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  const hasAccessRef = useRef(haveAccess);

  useEffect(() => {
    hasAccessRef.current = haveAccess;
    console.log("VideoProgressBar - haveAccess changed: ", haveAccess);

    console.log(
      "VideoProgressBar - initialStartTime:",
      initialStartTime,
      "endTime:",
      endTime
    );
  }, [haveAccess]);

  useEffect(() => {
    console.log(
      "VideoProgressBar Debug - Video:",
      videoId,
      "| freeRange start:",
      initialStartTime,
      "end:",
      endTime,
      "duration:",
      duration,
      "| access.isPurchased:",
      access?.isPurchased,
      "| hasAccess prop:",
      hasAccessRef.current,
      "| haveCreator pass:",
      haveCreator,
      "| isVideoOwner:",
      isVideoOwner
    );
  }, [
    initialStartTime,
    endTime,
    duration,
    access?.isPurchased,
    hasAccessRef.current,
    haveCreator,
    isVideoOwner,
    videoId,
  ]);

  // ✅ Wait for video to be ready and perform initial seek
  useEffect(() => {
    if (!player || !isActive) {
      setHasPerformedInitialSeek(false);
      setIsVideoReady(false);
      return;
    }

    // Listen for video ready state
    const statusListener = player.addListener("statusChange", (status) => {
      if (status.status === "readyToPlay" && duration > 0 && !isVideoReady) {
        setIsVideoReady(true);
        console.log("Video is ready, duration:", duration);
      }
    });

    return () => statusListener?.remove();
  }, [player, isActive, duration]);

  // ✅ Perform initial seek when video is ready
  useEffect(() => {
    if (!isVideoReady || hasPerformedInitialSeek || !isActive || initialStartTime <= 0) {
      // If no start time, mark as complete immediately
      if (isVideoReady && !hasPerformedInitialSeek && isActive && initialStartTime <= 0) {
        setHasPerformedInitialSeek(true);
        onInitialSeekComplete?.();
      }
      return;
    }

    // Clear any existing timeout
    if (initialSeekTimeout.current) {
      clearTimeout(initialSeekTimeout.current);
    }

    // Delay the initial seek slightly to ensure video is fully ready
    initialSeekTimeout.current = setTimeout(() => {
      try {
          if (player.currentTime !== initialStartTime && player.currentTime > 0) {
      console.log(`User has already seeked to ${player.currentTime}s, skipping initial seek`);
      setHasPerformedInitialSeek(true);
      onInitialSeekComplete?.();
      return;
    }
        
        console.log(`Performing initial seek to ${initialStartTime}s for video ${videoId}`);
        
        // Seek to start time
        player.currentTime = initialStartTime;
        setCurrentTime(initialStartTime);
        
        setHasPerformedInitialSeek(true);
        onInitialSeekComplete?.();
        console.log(`Video ${videoId} seeked to start time ${initialStartTime}s`);
        
      } catch (seekError) {
        console.error("Error performing initial seek:", seekError);
        setHasPerformedInitialSeek(true); // Mark as done to prevent retry
        onInitialSeekComplete?.();
      }
    }, 300);

    return () => {
      if (initialSeekTimeout.current) {
        clearTimeout(initialSeekTimeout.current);
        initialSeekTimeout.current = null;
      }
    };
  }, [isVideoReady, hasPerformedInitialSeek, isActive, initialStartTime, player, videoId, onInitialSeekComplete]);

  // ✅ Reset state when video changes
  useEffect(() => {
    setHasPerformedInitialSeek(false);
    setIsVideoReady(false);
    hasShownAccessModal.current = false;
    modalDismissed.current = false;
    setShowAccessModal(false);
    setCurrentTime(0);
    
    return () => {
      if (initialSeekTimeout.current) {
        clearTimeout(initialSeekTimeout.current);
        initialSeekTimeout.current = null;
      }
    };
  }, [videoId, accessVersion]);

  // ✅ Component mount/unmount tracking
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeTrackingInterval.current) {
        clearInterval(timeTrackingInterval.current);
        timeTrackingInterval.current = null;
      }
    };
  }, []);

  // ✅ API calls (untouched)
  const saveVideoToHistory = useCallback(async () => {
    if (!token || !videoId) return;
    try {
      const res = await fetch(`${BACKEND_API_URL}/user/history`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.message || "Failed to save video to history");
        return;
      }
      console.log("Video saved to history:", data.message);
    } catch (err) {
      console.error("Failed to save history:", err);
    }
  }, [token, videoId, BACKEND_API_URL]);

  const incrementVideoViews = useCallback(async () => {
    if (!token || !videoId) return;
    try {
      const res = await fetch(`${BACKEND_API_URL}/videos/${videoId}/view`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.message || "Failed to increment video count");
        return;
      }
      console.log(data.message);
    } catch (err) {
      console.error("Failed to increment views:", err);
    }
  }, [token, videoId, BACKEND_API_URL]);

  // ✅ Track 2% milestone (adjusted for start time)
  const hasTriggered2Percent = useRef(false);
  useEffect(() => {
  if (!isActive || duration <= 0 || !hasPerformedInitialSeek) return;

    // Determine if this is a free video or premium video
    const isFreeVideo =
      initialStartTime === 0 && (endTime >= duration || endTime === 0);

    let percentWatched = 0;

    if (isFreeVideo) {
      // For free videos: calculate percentage from 0 to full duration
      percentWatched = (currentTime / duration) * 100;
    } else {
      // For premium videos: calculate percentage from start_time to end_time (existing logic)
      const effectiveDuration = duration - initialStartTime;
      const effectiveCurrentTime = currentTime - initialStartTime;
      percentWatched =
        effectiveDuration > 0
          ? (effectiveCurrentTime / effectiveDuration) * 100
          : 0;
    }

    if (!hasTriggered2Percent.current && percentWatched >= 2) {
      hasTriggered2Percent.current = true;
      console.log(`Triggering 2% milestone for video ${videoId}`);
      saveVideoToHistory();
      incrementVideoViews();
    }
  }, [
    currentTime,
    duration,
    isActive,
    hasPerformedInitialSeek,
    initialStartTime,
    endTime,
    videoId,
    saveVideoToHistory,
    incrementVideoViews,
  ]);

  useEffect(() => {
    if (!isActive) hasTriggered2Percent.current = false;
  }, [isActive]);

  // ✅ FIXED: Improved time tracking that persists across UI hide/show
  // Replace the time tracking useEffect with this version that has better logging:
  useEffect(() => {
    console.log("Access Debug:", {
      videoId,
      hasAccessRef,
      isPurchased: access?.isPurchased,
      isVideoOwner,
      accessType: access?.accessType,
      userHasFullAccess:
        hasAccessRef.current ||
        isVideoOwner ||
        access?.isPurchased ||
        haveCreator,
    });
    // Clear any existing interval
    if (timeTrackingInterval.current) {
      clearInterval(timeTrackingInterval.current);
      timeTrackingInterval.current = null;
    }

  // Only start tracking if video is active and ready
  if (!isActive || !player) {
    return;
  }

    console.log(
      "Starting time tracking for video:",
      videoId,
      "hasAccess:",
      hasAccessRef.current
    );

  // Start continuous time tracking
  timeTrackingInterval.current = setInterval(() => {
    if (!isMounted.current || !player) {
      return;
    }

      try {
        const currentPlayerTime = player.currentTime || 0;

        // Always update current time, regardless of UI visibility
        setCurrentTime(currentPlayerTime);

        // Check if video has reached the end time and user doesn't have access
        const isPremiumVideo = endTime < duration && endTime > 0;
        const userHasFullAccess =
          hasAccessRef.current ||
          isVideoOwner ||
          access?.isPurchased ||
          haveCreator;

        // Enhanced logging
        if (
          isPremiumVideo &&
          !userHasFullAccess &&
          currentPlayerTime >= endTime - 0.1
        ) {
          console.log("Near end time:", {
            currentTime: currentPlayerTime,
            endTime,
            hasShownAccessModal: hasShownAccessModal.current,
            modalDismissed: modalDismissed.current,
            hasAccessRef,
            isVideoOwner,
          });
        }

        // Only show modal if user truly doesn't have access to the full content
        if (
          isPremiumVideo &&
          !userHasFullAccess &&
          currentPlayerTime >= endTime - 0.1
        ) {
          if (!hasShownAccessModal.current && !modalDismissed.current) {
            console.log(
              "Video reached end time, showing access modal. Current time:",
              currentPlayerTime,
              "End time:",
              endTime,
              "hasAccess:",
              hasAccessRef.current,
              "isVideoOwner:",
              isVideoOwner
            );
            hasShownAccessModal.current = true;
            player.pause();
            setShowAccessModal(true);
          }
        }
      } catch (error) {
        console.error("Error in time tracking:", error);
      }
    }, 250);

    return () => {
      if (timeTrackingInterval.current) {
        clearInterval(timeTrackingInterval.current);
        timeTrackingInterval.current = null;
      }
    };
  }, [
    isActive,
    player,
    hasAccessRef.current,
    haveCreator,
    isVideoOwner,
    endTime,
    duration,
    videoId,
  ]);

  // Reset modal state when video changes or becomes inactive
  useEffect(() => {
    if (!isActive) {
      hasShownAccessModal.current = false;
      modalDismissed.current = false;
      setShowAccessModal(false);
    }
  }, [isActive, videoId]);
  useEffect(() => {
    // Reset modal states when video is back at or near the start time
    if (currentTime <= initialStartTime + 0.5) {
      // Add small buffer for precision
      if (hasShownAccessModal.current || modalDismissed.current) {
        console.log("Video back at start, resetting modal states");
        hasShownAccessModal.current = false;
        modalDismissed.current = false;
      }
    }
  }, [currentTime, initialStartTime]);

  // Handle access modal close
  const handleAccessModalClose = () => {
    setShowAccessModal(false);
    modalDismissed.current = true; // Mark as dismissed for this session

    // If user has purchased access, restart from beginning
    if (hasAccessRef.current || isVideoOwner || haveCreator) {
      player.currentTime = initialStartTime;
      setCurrentTime(initialStartTime);
      player.play();
      hasShownAccessModal.current = false;
      modalDismissed.current = false; // Reset since they have access now
    } else {
      // If not purchased, seek back to start time and pause
      player.currentTime = initialStartTime;
      setCurrentTime(initialStartTime);
      player.pause();
      // DON'T reset modalDismissed here - let it stay true for this playthrough
    }
  };

  // ✅ Layout width
  const handleProgressBarLayout = (event: LayoutChangeEvent) => {
    progressBarContainerWidth.current = event.nativeEvent.layout.width;
    progressBarRef.current?.measure((_x, _y, _width, _height, pageX) => {
      setProgressBarX(pageX);
    });
  };

  // ✅ Validate seek position based on access permissions
  const validateSeekTime = (newTimeSeconds: number): boolean => {
    // If user is the video owner, allow seeking anywhere
    console.log("Validating seek to:", hasAccessRef.current);
    if (isVideoOwner) {
      return true;
    }
    
    // Determine if this is a free video (no restrictions) or premium video
    const isFreeVideo =
      access?.accessType === "free" ||
      (initialStartTime === 0 && endTime >= duration);
    const userHasAccess =
      hasAccessRef.current || access?.isPurchased || haveCreator; // This includes video purchase or creator pass
    console.log(
      "hasAccess:",
      hasAccessRef.current,
      "isPurchased:",
      access?.isPurchased,
      "userHasAccess:",
      userHasAccess
    );

    // For free videos: allow seeking anywhere
    if (isFreeVideo) {
      return true;
    }
    
    // For premium videos with access (purchased or creator pass): allow seeking anywhere
    if (userHasAccess || hasCreatorPassOfVideoOwner) {
      return true;
    }
    
    // For premium videos without access: only allow seeking within free range (start_time to display_till_time)
    if (!userHasAccess && !hasCreatorPassOfVideoOwner) {
      // Check if trying to seek before start time
      if (initialStartTime > 0 && newTimeSeconds < initialStartTime) {
        Alert.alert(
          "Content Access Required", 
          "You need to purchase this content to access the full video.",
          [{ text: "OK" }]
        );
        return false;
      }
      
      // Check if trying to seek beyond end time
      if (endTime > 0 && endTime < duration && newTimeSeconds > endTime) {
        Alert.alert(
          "Content Access Required",
          "You need to purchase this content to access the full video.",
          [{ text: "OK" }]
        );
        return false;
      }
    }

    return true;
  };

  // ✅ FIXED: Improved drag handling that syncs better with current time
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        hasUserInteracted.current = true;
        console.log('Drag started, current time:', currentTime);
      },
      onPanResponderMove: (_, gestureState) => {
        const containerWidth = progressBarContainerWidth.current;
        if (containerWidth <= 0) return;

        const relativeX = gestureState.moveX - progressBarX;
        const clampedX = Math.max(0, Math.min(containerWidth, relativeX));
        const seekPercentage = clampedX / containerWidth;
        const newTime = seekPercentage * duration;

        dragTimeRef.current = newTime;
        setDragTime(newTime);
      },
      onPanResponderRelease: async () => {
        const finalTime = dragTimeRef.current;
        if (finalTime != null && validateSeekTime(finalTime)) {
          try {
            console.log("Seeking from", currentTime, "to:", finalTime, "for video:", videoId);
            
            player.pause();
            player.currentTime = finalTime;
            
            // Immediately update local state to prevent UI lag
            setCurrentTime(finalTime);
            
            // Small delay before resuming playback for smooth transition
            setTimeout(() => {
              if (isMounted.current && player) {
                player.play();
              }
            }, 50);
          } catch (error) {
            console.error("Error seeking video:", error);
          }
        }
        setIsDragging(false);
        setDragTime(null);
        dragTimeRef.current = null;
      },
    })
  ).current;

  // ✅ FIXED: Better progress calculation that handles edge cases
  const effectiveTime = isDragging && dragTime != null ? dragTime : currentTime;
  const progress = duration > 0 ? Math.max(0, Math.min(effectiveTime / duration, 1)) : 0;

  if (duration <= 0) return null;

  // Calculate restricted progress for visual indication
  const restrictedProgress =
    !hasAccessRef.current && !isVideoOwner && !haveCreator && endTime > 0
      ? endTime / duration
      : 1;
  const startProgress = initialStartTime > 0 ? initialStartTime / duration : 0;

  return (
    <>
      <View
        ref={progressBarRef}
        style={[
          styles.progressBarContainer,
          isGlobalPlayer && styles.progressBarContainerGlobal, // Apply conditional styling
        ]}
        onLayout={handleProgressBarLayout}
        {...panResponder.panHandlers}
      >
        {/* Background bar */}
        <View style={styles.progressBarBackground} />
        
        {/* Show start time indicator */}
        {initialStartTime > 0 && (
          <View 
            style={[
              styles.startTimeIndicator, 
              { left: `${startProgress * 100}%` }
            ]} 
          />
        )}
        
        {/* Show restricted area if user doesn't have access and it's not a free video */}
        {!hasAccessRef.current &&
          !isVideoOwner &&
          !haveCreator &&
          endTime > 0 &&
          endTime < duration && (
            <View
              style={[
                styles.restrictedArea,
                {
                  position: "absolute",
                  left: `${startProgress * 100}%`,
                  width: `${(restrictedProgress - startProgress) * 100}%`,
                },
              ]}
            />
          )}

        {/* Filled progress */}
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />

        {/* Knob (only while dragging) */}
        {isDragging && (
          <View
            style={[
              styles.knob,
              { left: `${progress * 100}%`, marginLeft: -KNOB_SIZE / 2 },
            ]}
          />
        )}

        {/* Tooltip above knob */}
        {isDragging && dragTime != null && (
          <View
            style={[
              styles.tooltip,
              { left: `${progress * 100}%`, marginLeft: -25 },
            ]}
          >
            <Text style={styles.tooltipText}>{formatTime(dragTime)}</Text>
          </View>
        )}
      </View>

      {showAccessModal && (
        <View style={styles.accessModalOverlay}>
          <View style={styles.accessModalContent}>
            <Text style={styles.accessModalText}>
              🔒 Premium Content
              {"\n\n"}
              You've reached the end of the free preview. Purchase this content to watch the full video and unlock all features.
            </Text>
            <Pressable
              onPress={handleAccessModalClose}
              style={styles.accessModalButton}
            >
              <Text style={styles.accessModalButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  progressBarContainer: {
    width: "100%",
    height: 30,
    justifyContent: "center",
    position: "relative",
  },
  progressBarContainerGlobal: {
    marginBottom: 100, // Add bottom margin only for global player
  },
  progressBarBackground: {
    position: "absolute",
    width: "100%",
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
  },
  startTimeIndicator: {
    position: "absolute",
    width: 2,
    height: PROGRESS_BAR_HEIGHT + 4,
    backgroundColor: "yellow",
    top: (30 - PROGRESS_BAR_HEIGHT - 4) / 2,
  },
  restrictedArea: {
    position: "absolute",
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: "rgba(255, 255, 0, 0.5)", // Yellow tint for free preview area
    borderRadius: 2,
  },
  progressBar: {
    position: "absolute",
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: "white",
    borderRadius: 2,
  },
  knob: {
    position: "absolute",
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "red",
    top: (30 - KNOB_SIZE) / 2,
    zIndex: 20,
  },
  tooltip: {
    position: "absolute",
    bottom: 25,
    backgroundColor: "black",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 30,
  },
  tooltipText: {
    color: "white",
    fontSize: 12,
  },
  accessModalOverlay: {
    position: "absolute",
    top: -200,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 1000,
  },
  accessModalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  accessModalText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  accessModalButton: {
    backgroundColor: "#333",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  accessModalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default React.memo(VideoProgressBar, (prev, next) => {
  return (
    prev.isActive === next.isActive &&
    prev.duration === next.duration &&
    prev.videoId === next.videoId &&
    prev.player === next.player &&
    prev.isVideoOwner === next.isVideoOwner &&
    JSON.stringify(prev.access) === JSON.stringify(next.access)
  );
});