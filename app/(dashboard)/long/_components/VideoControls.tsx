import React, { useState, useEffect, useCallback } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator, Dimensions, Text, Image, TouchableOpacity } from "react-native";
import { PlayIcon, PauseIcon, ChevronDownIcon } from "lucide-react-native";
import { usePlayerStore } from "@/store/usePlayerStore";
import InteractOptions from "./interactOptions";
import VideoDetails from "./VideoDetails";
import { VideoItemType } from "@/types/VideosType";
import { VideoPlayer } from "expo-video";
import { useFocusEffect, router } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import Constants from "expo-constants";
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
  checkAccess: React.Dispatch<React.SetStateAction<boolean>>;
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
  checkAccess
}: Props) => {
  const [playing, setPlaying] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [wantToBuyVideo, setWantToBuyVideo] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEpisodeDropdown, setShowEpisodeDropdown] = useState(false);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  const [seriesVideos, setSeriesVideos] = useState<any>(null);
  const [isLoadingSeriesVideos, setIsLoadingSeriesVideos] = useState(false);
  const insets = useSafeAreaInsets();
  const { setVideosInZustand, videoType } = useVideosStore();
  const { isLandscape } = useOrientationStore();
  const { token } = useAuthStore();
  let hideTimer = React.useRef<NodeJS.Timeout | number | null>(null);

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

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

  useEffect(() => {
    if (videoData?.episode_number) {
      setSelectedEpisodeIndex(videoData.episode_number);
      console.log("Updated selected episode index to:", videoData.episode_number);
    }
  }, [videoData?.episode_number]);

  const transformEpisodes = (episodes: any[]): any[] => {
    return episodes.map((ep) => ({
      _id: ep._id,
      name: ep.name,
      description: ep.description,
      likes: ep.likes,
      shares: ep.shares,
      views: ep.views,
      fingerprint: ep.fingerprint,
      audio_fingerprint: ep.audio_fingerprint,
      duration: ep.duration,
      duration_formatted: ep.duration_formatted,
      comments: ep.comments.map((c: any) => c._id ?? c),
      videoUrl: ep.videoUrl,
      videoResolutions: ep.videoResolutions,
      thumbnailUrl: ep.thumbnailUrl,
      series: { _id: ep.series, price: ep.amount, type: ep.type },
      episode_number: ep.episode_number ?? null,
      season_number: ep.season_number ?? 1,
      is_standalone: ep.is_standalone ?? false,
      age_restriction: ep.age_restriction,
      genre: ep.genre,
      type: ep.type,
      amount: ep.amount,
      Videolanguage: ep.Videolanguage,
      earned_till_date: ep.earned_till_date,
      created_by: ep.created_by,
      updated_by: ep.updated_by,
      start_time: ep.start_time,
      display_till_time: ep.display_till_time,
      visibility: ep.visibility,
      hidden_reason: ep.hidden_reason,
      hidden_at: ep.hidden_at,
      gifts: ep.gifts,
      gifted_by: ep.gifted_by,
      liked_by: Array.isArray(ep.liked_by)
        ? ep.liked_by.map((l: any) => ({
          user: l.user ?? l,
          likedAt: l.likedAt,
          _id: l._id,
        }))
        : [],
      createdAt: ep.createdAt,
      updatedAt: ep.updatedAt,
      __v: ep.__v,
      is_following_creator: ep.is_following_creator,
      hasCreatorPassOfVideoOwner: ep.hasCreatorPassOfVideoOwner,
      access: {
        isPlayable: ep.access?.isPlayable ?? false,
        freeRange: {
          start_time: ep.access?.freeRange?.start_time ?? ep.start_time,
          display_till_time:
            ep.access?.freeRange?.display_till_time ?? ep.display_till_time,
        },
        isPurchased: ep.access?.isPurchased ?? false,
        accessType: ep.access?.accessType ?? "free",
        price: ep.access?.price,
      },
      creatorPassDetails: ep.creatorPassDetails,
      is_liked_video: ep.is_liked_video ?? false,
    }));
  };

  const fetchSeriesData = async () => {
    if (!token || !videoData?.series?._id) {
      return;
    }

    setIsLoadingSeriesVideos(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/series/${videoData.series._id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch series data");
      const data = await response.json();
      console.log("Fetched series data:", data.data);
      console.log("Episodes count:", data.data.episodes?.length);

      const transformedEpisodes = transformEpisodes(data.data.episodes);
      console.log("Transformed episodes:", transformedEpisodes);
      setSeriesVideos(transformedEpisodes);
    } catch (err) {
      console.log("Error fetching series data:", err);
    } finally {
      setIsLoadingSeriesVideos(false);
    }
  };

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
      // In landscape mode, show controls initially
      setShowControls(true);
      showWallet(true);
      // Only start auto-hide timer if video is playing
      if (playing) {
        resetHideTimer();
      } else {
        // If paused, keep controls visible and clear any existing timer
        clearHideTimer();
      }
    } else {
      clearHideTimer();
      setShowControls(true); // portrait → always visible
      showWallet(true);
      setShowEpisodeDropdown(false); // Close episode dropdown when switching to portrait
    }
    return () => clearHideTimer();
  }, [isLandscape, playing]);

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
        // When paused in landscape, keep controls visible
        if (isLandscape) {
          clearHideTimer();
          setShowControls(true);
          showWallet(true);
        }
      } else {
        await player.play();
        setPlaying(true);
        // When playing in landscape, start auto-hide timer
        if (isLandscape) {
          resetHideTimer();
        }
      }
      setShowPlayPauseIcon(true);
    } catch (e) {
      console.error("play/pause error:", e);
    }
  };



  return (
    <>
      <Pressable
        style={styles.fullScreenPressable}
        onPress={() => {
          if (isLandscape) {
            if (showControls) {
              // If controls are visible, toggle play/pause
              handleTogglePlayPause();
            } else {
              // If controls are hidden, just show them
              setShowControls(true);
              showWallet(true);
              // Only start auto-hide timer if video is playing
              if (playing) {
                resetHideTimer();
              }
            }
          } else {
            // In portrait mode, always toggle play/pause
            if (haveCreatorPass || haveAccessPass || videoData.amount === 0) {
              handleTogglePlayPause();
            }
          }
        }}
      />
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
      {showControls && !isLandscape && (
        <View
          style={[
            isGlobalPlayer
              ? styles.interactGlobal
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
                : { ...styles.detailsGlobal, bottom: bottomOffset + 45 }
              : isLandscape
                ? styles.detailsFullScreen
                : styles.details,
            { paddingBottom: insets.bottom },
          ]}
        >
          {isLandscape ? (
            // Minimal fullscreen controls - only title and exit fullscreen
            <View className="w-full">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1 flex-1">
                  <Text className="text-white text-lg font-semibold uppercase" numberOfLines={1}>
                    {videoData.name}
                  </Text>
                </View>

                {/* Exit Fullscreen Button */}
                <Pressable onPress={onToggleFullScreen} className="bg-black/50 rounded-full px-3 py-2">
                  <View className="flex-row items-center gap-1">
                    <Image
                      source={require("../../../../assets/images/fullscreen.png")}
                      style={{
                        width: 16,
                        height: 16,
                        tintColor: 'white'
                      }}
                    />
                    <Text className="text-white text-xs">Exit</Text>
                  </View>
                </Pressable>
              </View>

              {/* Episode Dropdown for Fullscreen - Opens upward - only for non-global players */}
              {!isGlobalPlayer && showEpisodeDropdown && videoData?.series && (
                <View className="absolute bottom-12 left-0 rounded-xl p-2 w-56 bg-black/90 z-50">
                  {videoData.series.episodes.map((ep, idx) => (
                    <TouchableOpacity
                      key={ep._id || idx}
                      className="mb-[0.5px]"
                      disabled={isLoadingSeriesVideos}
                      onPress={() => {
                        setSelectedEpisodeIndex(ep.episode_number || 0);
                        setShowEpisodeDropdown(false);

                        // Use onEpisodeChange callback to switch episode within current player
                        // This maintains fullscreen mode and doesn't navigate to a new screen
                        if (onEpisodeChange) {
                          console.log("Switching to episode:", ep.episode_number, "in fullscreen mode");
                          console.log("Episode data:", ep);
                          console.log("Series videos available:", !!seriesVideos);
                          console.log("Current video data:", videoData.name, videoData.episode_number);

                          // Keep controls visible for longer after episode switch
                          if (isLandscape) {
                            setShowControls(true);
                            showWallet(true);
                            clearHideTimer();
                            // Start a longer timer to keep controls visible
                            hideTimer.current = setTimeout(() => {
                              setShowControls(false);
                              showWallet(false);
                            }, 8000); // 8 seconds instead of 5
                          }

                          if (seriesVideos && seriesVideos[idx]) {
                            // Use the transformed episode data if available
                            console.log("Using transformed episode data:", seriesVideos[idx]);
                            console.log("Episode video URL:", seriesVideos[idx].videoUrl);
                            onEpisodeChange(seriesVideos[idx]);
                          } else {
                            // Fallback: create episode data from the basic episode info
                            // For fallback, we need to fetch the full episode data
                            // The basic episode info from series.episodes doesn't have video URL
                            console.log("Warning: Using fallback - episode may not have video URL");
                            console.log("Basic episode info:", ep);

                            // Try to fetch the full episode data
                            if (token && ep._id) {
                              console.log("Attempting to fetch full episode data for:", ep._id);
                              // This would require an API call to get the full episode data
                              // For now, use the fallback but it might not work without videoUrl
                            }

                            const episodeData = {
                              ...videoData,
                              _id: ep._id,
                              episode_number: ep.episode_number,
                              name: `Episode ${ep.episode_number}`,
                            };
                            console.log("Using fallback episode data:", episodeData);
                            onEpisodeChange(episodeData);
                          }
                        }
                      }}
                    >
                      <View
                        className={`bg-black/70 px-2 py-2 flex-row items-center ${idx === 0 && "rounded-t-xl"
                          } ${ep.episode_number === videoData.series?.total_episodes && "rounded-b-xl"} ${selectedEpisodeIndex === ep.episode_number && "gap-2"}`}
                      >
                        <Text className="text-white text-sm flex-row items-center">
                          Episode: {ep.episode_number}
                        </Text>
                        {selectedEpisodeIndex === ep.episode_number && (
                          <Text className="text-white pl-3">✔</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            // Full controls for portrait mode
            <VideoDetails
              haveCreator={haveCreator}
              checkAccess={checkAccess}
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
          )}
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
    bottom: "4%",
    width: "100%",
    paddingHorizontal: 16,
    marginBottom: 10,
    zIndex: 5,
  },
  detailsFullScreen: {
    position: "absolute",
    bottom: "8%",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 5,
  },
  detailsGlobal: {
    position: "absolute",
    bottom: "8%",
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
