import React, { useState, useEffect, useCallback } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { PlayIcon, PauseIcon } from "lucide-react-native";
import { usePlayerStore } from "@/store/usePlayerStore";
import InteractOptions from "./interactOptions";
import VideoDetails from "./VideoDetails";
import { VideoItemType } from "@/types/VideosType";
import { VideoPlayer } from "expo-video";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideosStore } from "@/store/useVideosStore";
import { useOrientationStore } from "@/store/useOrientationStore";


type Props = {
  haveCreator: React.Dispatch<React.SetStateAction<boolean>>;
  haveCreatorPass: boolean;
  haveAccessPass: boolean;
  accessVersion: number;
  handleInitialSeekComplete: () => void;
  showWallet: React.Dispatch<React.SetStateAction<boolean>>;
  showBuyOption: boolean;
  setShowBuyOption: React.Dispatch<React.SetStateAction<boolean>>;
  player: VideoPlayer;
  videoData: VideoItemType;
  isGlobalPlayer: boolean;
  setShowCommentsModal?: (visible: boolean) => void;
  onCommentsModalOpen?: () => void; // Add callback for when comments modal is opened
  onEpisodeChange?: (episodeData: any) => void;

  onStatsUpdate?: (stats: {
    likes?: number;
    gifts?: number;
    shares?: number;
    comments?: number;
  }) => void;

  onToggleFullScreen: () => void;
};

const VideoControls = ({
  haveCreator,
  haveCreatorPass,
  haveAccessPass,
  accessVersion,
  handleInitialSeekComplete,
  showBuyOption,
  setShowBuyOption,
  showWallet,
  player,
  videoData,
  isGlobalPlayer,
  setShowCommentsModal,
  onCommentsModalOpen,
  onEpisodeChange,
  onStatsUpdate,
  onToggleFullScreen,
}: Props) => {
  const [playing, setPlaying] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [wantToBuyVideo, setWantToBuyVideo] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const insets = useSafeAreaInsets();
  const { setVideosInZustand } = useVideosStore();
  const { isLandscape } = useOrientationStore();
  let hideTimer = React.useRef<NodeJS.Timeout | number | null>(null);

  // const scaledOffset = PixelRatio.getPixelSizeForLayoutSize(12);
  const screenHeight = Dimensions.get("window").height;
  const bottomOffset =
    screenHeight < 700
      ? insets.bottom != 0
        ? insets.bottom - 16
        : 45
      : insets.bottom != 0
        ? insets.bottom - 16
        : 28;
  console.log("bottom insets:", insets.bottom, screenHeight);

  useEffect(() => {
    if (wantToBuyVideo) {
      setVideosInZustand([videoData]);
    }
  }, [wantToBuyVideo]);

  useFocusEffect(
    useCallback(() => {
      // Reset states when the component is focused
      setPlaying(true);
      setBuffering(false);
    }, [])
  );

  // auto-hide logic for landscape
  useEffect(() => {
    if (isLandscape) {
      resetHideTimer();
    } else {
      clearHideTimer();
      setShowControls(true); // portrait → always visible
      showWallet(true);
    }
    return () => clearHideTimer();
  }, [isLandscape]);

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const resetHideTimer = () => {
    clearHideTimer();
    setShowControls(true);
    showWallet(true);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
      showWallet(false);
    }, 5000); // auto-hide after 5s
  };

  // const isPlaying = usePlayerStore((state) => state.isPlaying);
  // const isBuffering = usePlayerStore((state) => state.isBuffering);
  // const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);

  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);

  // Subscribe to player events to keep UI in sync
  useEffect(() => {
    if (!player) return;

    const onStatus = (status: any) => {
      if (typeof status?.isPlaying === "boolean") setPlaying(status.isPlaying);
      if (typeof status?.isBuffering === "boolean")
        setBuffering(status.isBuffering);
    };

    const subStatus = player.addListener("statusChange", onStatus);
    const subTime = player.addListener("timeUpdate", onStatus); // extra safety: some platforms only fire this

    // Also try to prime initial state (in case status fired before mount)
    try {
      // These fields are present on the player in your codebase
      if (typeof (player as any).currentTime === "number") {
        // no-op, but ensures player object is ready
      }
    } catch { }

    return () => {
      subStatus?.remove?.();
      subTime?.remove?.();
    };
  }, [player]);

  useEffect(() => {
    let timer: NodeJS.Timeout | number;
    if (showPlayPauseIcon) {
      timer = setTimeout(() => setShowPlayPauseIcon(false), 800);
    }
    return () => clearTimeout(timer);
  }, [showPlayPauseIcon]);

  const handleTogglePlayPause = async () => {
    try {
      if (playing) {
        await player.pause();
        setPlaying(false);
      } else {
        await player.play();
        setPlaying(true);
      }
      setShowPlayPauseIcon(true);
    } catch (e) {
      console.error("play/pause error:", e);
    }
  };

  const handleScreenTap = () => {
    if (isLandscape) {
      if (showControls) {
        // If controls are visible, toggle play/pause and reset timer
        handleTogglePlayPause();
      } else {
        // If controls are hidden, just show them
        resetHideTimer();
      }
    } else {
      // In portrait mode, always toggle play/pause
      if (haveCreatorPass || haveAccessPass || videoData.amount === 0) {
        handleTogglePlayPause();
      }
    }
  };

  return (
    <>
      {(
        <Pressable
          style={styles.fullScreenPressable}
          onPress={handleTogglePlayPause}
        />
      )}
      <View style={styles.iconContainer} pointerEvents="none">
        {showPlayPauseIcon &&
          (!playing ? (
            <PlayIcon size={40} color="white" />
          ) : (
            <PauseIcon size={40} color="white" />
          ))}
        {buffering && !showPlayPauseIcon && (
          <ActivityIndicator size="large" color="white" />
        )}
      </View>
      {showControls && (
        <View
          style={[
            isGlobalPlayer
              ? isLandscape
                ? styles.interactFullScreen
                : styles.interactGlobal
              : isLandscape
                ? styles.interactFullScreen
                : styles.interact,
            { paddingBottom: insets.bottom },
          ]}
        >
          <InteractOptions
            videoId={videoData._id}
            name={videoData.name}
            creator={videoData.created_by}
            likes={videoData.likes}
            gifts={videoData.gifts}
            shares={videoData.shares}
            comments={videoData.comments?.length}
            onCommentPress={
              setShowCommentsModal
                ? () => {
                  setShowCommentsModal(true);
                  onCommentsModalOpen?.(); // Trigger refresh when modal opens
                }
                : undefined
            }
            onCommentUpdate={(newCount) => {
              if (onStatsUpdate) {
                onStatsUpdate({ comments: newCount });
              }
            }}
          // onShareUpdate={(newShares, isShared) =>
          //   onStatsUpdate?.({ shares: newShares })
          // }
          // onGiftUpdate={(newGifts) => onStatsUpdate?.({ gifts: newGifts })}
          />
        </View>
      )}

      {showControls && (
        <View
          style={[
            isGlobalPlayer
              ? isLandscape
                ? styles.detailsFullScreen
                : { ...styles.detailsGlobal, bottom: bottomOffset - 10 }
              : isLandscape
                ? styles.detailsFullScreen
                : styles.details,
            { paddingBottom: insets.bottom },
          ]}
        >
          <VideoDetails
            haveCreator={haveCreator}
            setWantToBuyVideo={setWantToBuyVideo}
            videoId={videoData._id}
            type={videoData.type}
            videoAmount={videoData.amount}
            is_monetized={videoData.is_monetized}
            name={videoData.name}
            series={videoData?.series}
            is_following_creator={videoData.is_following_creator}
            creatorPass={videoData?.creatorPassDetails}
            episode_number={videoData?.episode_number}
            createdBy={videoData?.created_by}
            community={videoData?.community}
            onToggleFullScreen={onToggleFullScreen}
            onEpisodeChange={onEpisodeChange}
            showBuyOption={showBuyOption}
            setShowBuyOption={setShowBuyOption}
          />
        </View>
      )}

      {/* {showControls && (
        <View
          className={`absolute left-0 right-0 z-10`}
          style={[
            !isGlobalPlayer
              ? isLandscape
                ? { bottom: "20%" }
                : { bottom: bottomOffset }
              : isLandscape
                ? { bottom: "20%" }
                : { bottom: screenHeight > 700 ? -5 : 5 },
          ]}
        >
          <VideoProgressBar
            player={player}
            isActive={isActive}
            videoId={videoData._id}
            duration={videoData.duration || 0}
            access={videoData.access}
            onInitialSeekComplete={handleInitialSeekComplete}
            isVideoOwner={videoData.hasCreatorPassOfVideoOwner}
            hasAccess={
              haveAccessPass || haveCreatorPass || videoData.access.isPurchased
            }
            accessVersion={accessVersion}
          />
        </View>
      )} */}
    </>
  );
};

const styles = StyleSheet.create({
  fullScreenPressable: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  iconContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  interact: { position: "absolute", bottom: "20%", right: 10, zIndex: 5 },
  interactFullScreen: {
    position: "absolute",
    bottom: "18%",
    right: 15,
    zIndex: 5,
  },
  interactGlobal: { position: "absolute", bottom: "20%", right: 10, zIndex: 5 },
  details: {
    position: "absolute",
    bottom: "7%",
    width: "100%",
    paddingHorizontal: 16,
    marginBottom: 10,
    zIndex: 5,
  },
  detailsFullScreen: {
    position: "absolute",
    bottom: "0%",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 5,
  },
  detailsGlobal: {
    position: "absolute",
    bottom: "2%",
    width: "100%",
    paddingHorizontal: 16,
    marginBottom: 40,
    zIndex: 5,
  },
  progressContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 10,
  },
});

export default React.memo(VideoControls);
