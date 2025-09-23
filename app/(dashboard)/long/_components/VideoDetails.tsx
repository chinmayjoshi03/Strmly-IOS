import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Pressable,
  Alert,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRightFromSquare,
  ChevronDownIcon,
  Hash,
} from "lucide-react-native";
import { useAuthStore } from "@/store/useAuthStore";
import Constants from "expo-constants";
import { router, useFocusEffect } from "expo-router";
import { useGiftingStore } from "@/store/useGiftingStore";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { useVideosStore } from "@/store/useVideosStore";

type VideoDetailsProps = {
  haveCreator: React.Dispatch<React.SetStateAction<boolean>>;
  setWantToBuyVideo: React.Dispatch<React.SetStateAction<boolean>>;

  videoId: string;
  name: string;
  type: string;
  videoAmount: number;

  createdBy: {
    _id: string;
    username: string;
    name?: string;
    profile_photo: string;
  };

  community: {
    _id: string;
    name: string;
  } | null;

  creatorPass: {
    _id: string;
    creator_profile: {
      creator_pass_price: number;
    };
  } | null;

  is_following_creator: boolean;

  series?:
    | {
        _id: string;
        title: string;
        type: string;
        price: number;
        total_episodes: number;
        episodes: [
          {
            _id: string;
            episode_number: number;
          },
        ];
      }
    | null
    | undefined;

  episode_number: number | null;
  onToggleFullScreen?: () => void;
  isFullScreen?: boolean;
};

const VideoDetails = ({
  haveCreator,
  setWantToBuyVideo,
  videoId,
  type,
  name,
  videoAmount,
  series,
  episode_number,
  createdBy,
  community,
  creatorPass,
  is_following_creator,
  onToggleFullScreen,
  isFullScreen,
}: VideoDetailsProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showBuyOption, setShowBuyOption] = useState(false);
  const [isFollowCreator, setIsFollowCreator] = useState<boolean>(false);
  const [hasCreatorPass, setHasCreatorPass] = useState<boolean>(false);
  const [hasAccessPass, setHasAccessPass] = useState<string | null>(null);

  const [isOpenedEpisodes, setIsOpenedEpisodes] = useState<boolean>(false);
  const [isLoadingSeriesVideos, setIsLoadingSeriesVideos] =
    useState<boolean>(false);

  const { token } = useAuthStore();
  const { initiateGifting } = useGiftingStore();

  const { setVideosInZustand, videoType } = useVideosStore();
  const [seriesVideos, setSeriesVideos] = useState<any>(null);

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  useEffect(() => {
    setIsFollowCreator(is_following_creator);
  }, [is_following_creator]);

  useEffect(() => {
    if (episode_number) setSelectedEpisodeIndex(episode_number);
  }, [episode_number]);

  useFocusEffect(
    useCallback(() => {
      const hasAccessPass = async () => {
        const accessId =
          series && series.price != 0
            ? series._id + "?type=series"
            : videoId + "?type=video";
        console.log(series, videoId);
        console.log("accessId", accessId);
        try {
          const response = await fetch(
            `${BACKEND_API_URL}/user/has-user-access/${accessId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to fetch video access");
          }

          console.log(
            "has access pass",
            data.data?.accessData && data.data?.accessData.content_type
          );
          setHasAccessPass(
            data.data?.accessData ? data.data.accessData.content_type : null
          );
          // if(data.data?.accessData && data.data.accessData.content_type != null){
          // }
          console.log(
            "have Access",
            data.data?.accessData?.content_type != undefined
          );
        } catch (error) {
          console.log(error);
          // Alert.alert(
          //   "Error",
          //   error instanceof Error
          //     ? error.message
          //     : "An unknown error occurred while checking video access."
          // );
        }
      };

      if ((series?._id || videoId) && token) {
        console.log(series);
        hasAccessPass();
      }
    }, [])
  );





  useFocusEffect(
    useCallback(() => {
      const hasCreatorPass = async () => {
        try {
          const response = await fetch(
            `${BACKEND_API_URL}/user/has-creator-pass/${createdBy._id}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || "Failed to fetch user creator pass"
            );
          }

          console.log("has creator pass", data.hasCreatorPass);
          setHasCreatorPass(data.hasCreatorPass);
          haveCreator(data.hasCreatorPass);
        } catch (error) {
          console.log(error);
          Alert.alert(
            "Error",
            error instanceof Error
              ? error.message
              : "An unknown error occurred while following user."
          );
        }
      };

      if (
        createdBy._id &&
        token &&
        creatorPass?.creator_profile.creator_pass_price !== 0
      ) {
        hasCreatorPass();
      }
    }, [createdBy._id, token])
  );

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
      comments: ep.comments.map((c: any) => c._id ?? c), // normalize comment IDs
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
    if (!token || !series?._id) {
      return;
    }

    setIsLoadingSeriesVideos(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/series/${series._id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch series data");
      const data = await response.json();
      console.log("series data: ", data.data);

      setSeriesVideos(transformEpisodes(data.data.episodes));
      setIsOpenedEpisodes(true);
    } catch (err) {
      console.log("err", err);
    } finally {
      setIsLoadingSeriesVideos(false);
    }
  };

  return (
    <View className="w-full gap-3.5">
      {/* Top tags */}
      <View className="flex-row items-center justify-start gap-2">
        {community && (
          <>
            <Pressable
              onPress={() =>
                router.push(`/(dashboard)/communities/public/${community._id}`)
              }
            >
              <View className="items-center flex-row gap-0.5">
                <Hash color={"white"} size={14} fontWeight={800} />
                <Text className="text-white font-semibold">
                  {community.name}
                </Text>
              </View>
            </Pressable>
            {/* <Pressable onPress={() => followCommunity()}>
              {isFollowCommunityLoading ? (
                <ActivityIndicator className="size-5" color="white" />
              ) : isFollowCommunity ? (
                <SquareCheck size={14} color={"white"} />
              ) : (
                <Image
                  source={require("../../../../assets/images/plus.png")}
                  className="size-5"
                />
              )}
            </Pressable> */}
          </>
        )}
      </View>

      {/* Username + Paid */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            className="flex-row items-center gap-2"
            onPress={() => router.push(`/profile/public/${createdBy?._id}`)}
          >
            <Image
              source={{
                uri: getProfilePhotoUrl(createdBy?.profile_photo, "user"),
              }}
              className="size-8 rounded-full"
            />
            <Text className="text-white font-semibold">
              {createdBy ? createdBy.username : ""}
            </Text>
          </Pressable>
          {/* Need API for isFollowing */}

          {/* <TouchableOpacity
            disabled={isFollowCreatorLoading}
            onPress={() => followCreator()}
            className="border border-white items-center justify-center rounded-md px-2"
          >
            {isFollowCreatorLoading ? (
              <ActivityIndicator className="size-5" color="white" />
            ) : (
              <Text className="font-semibold text-sm text-white">
                {isFollowCreator ? "Following" : "Follow"}
              </Text>
            )}
          </TouchableOpacity> */}
        </View>

        {(type !== "Free" ||
          videoAmount != 0 ||
          (series != null &&
            (!videoType
              ? series?.type != "Free" || series?.price != 0
              : videoAmount != 0))) && (
          <View>
            <TouchableOpacity
              onPress={() => {
                console.log("videoId", videoId);
                console.log("series id", series?._id);
                setShowPriceDropdown((prev) => !prev);
                setShowDropdown(false);
                setShowBuyOption(false);
              }}
              className="border border-white rounded-md px-2"
            >
              <Text className="font-semibold text-sm text-white">Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Episode + Fullscreen */}
      <View className="flex-row items-center justify-between relative">
        <View className="flex-row items-center gap-1">
          <Text className="text-white uppercase">{name}</Text>
          {series !== null && videoType != "series" && (
            <TouchableOpacity
              className="border border-white rounded-xl px-2 py-0.5"
              disabled={isLoadingSeriesVideos}
              onPress={() => {
                setShowDropdown((prev) => !prev);
                setShowPriceDropdown(false);
                !isOpenedEpisodes && seriesVideos == null
                  ? fetchSeriesData()
                  : setIsOpenedEpisodes(false);
              }}
            >
              <View className="flex-row items-center">
                <Text className="font-semibold text-xs text-white mr-1">
                  Ep: 0{selectedEpisodeIndex}
                </Text>
                <ChevronDownIcon color={"white"} size={12} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Full Screen */}
        <Pressable onPress={onToggleFullScreen}>
          <Image
            source={require("../../../../assets/images/fullscreen.png")}
            className={`size-5 ${isFullScreen ? "scale-110" : "scale-100"} ease-in`}
          />
        </Pressable>

        {/* Paid Dropdown */}
        {(showPriceDropdown || showBuyOption) && (
          <View className="absolute bottom-14 -right-2 rounded-xl p-2 w-80">
            {(series != null &&
              series.type != "Free" &&
              creatorPass?.creator_profile.creator_pass_price !== 0) ||
            (videoAmount != 0 &&
              creatorPass?.creator_profile.creator_pass_price !== 0) ? (
              <TouchableOpacity
                className="mb-0.5"
                onPress={() => {
                  setShowPriceDropdown(false);
                  setShowDropdown(false);
                }}
              >
                <Pressable
                  onPress={() => {
                    setWantToBuyVideo(true);
                    initiateGifting(createdBy, videoId);
                    !hasCreatorPass &&
                      router.push({
                        pathname:
                          "/(dashboard)/PurchasePass/PurchaseCreatorPass/[id]",
                        params: { id: createdBy?._id },
                      });
                  }}
                >
                  <View
                    className={`bg-black h-11 px-2 py-1 flex-row items-center justify-between rounded-t-xl`}
                  >
                    <Text className="text-white text-[16px] flex-row items-center">
                      Creator Pass
                    </Text>
                    <Text className="text-white text-[16px]">
                      {!hasCreatorPass ? (
                        `₹${creatorPass?.creator_profile?.creator_pass_price}`
                      ) : (
                        <Text className="text-[16px] text-green-600">
                          Active
                        </Text>
                      )}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setWantToBuyVideo(true);
                    series &&
                    series?.type !== "Free" &&
                    !hasCreatorPass &&
                    !hasAccessPass
                      ? router.push({
                          pathname:
                            "/(dashboard)/PurchasePass/PurchaseSeries/[id]",
                          params: { id: series?._id },
                        })
                      : !hasCreatorPass && !hasAccessPass
                        ? router.push({
                            pathname:
                              "/(dashboard)/PurchasePass/PurchaseVideo/[id]",
                            params: { id: videoId },
                          })
                        : router.push({
                            pathname: "/(dashboard)/profile/access",
                            params: {
                              routeTab:
                                hasAccessPass === "series"
                                  ? "series"
                                  : "content",
                            },
                          });
                  }}
                >
                  <View
                    className={`bg-black h-11 px-2 py-1 flex-row items-center justify-between rounded-b-xl`}
                  >
                    <Text className="text-white text-[16px] flex-row items-center">
                      Content access
                    </Text>
                    {hasCreatorPass || hasAccessPass ? (
                      <Text className="text-[16px] text-green-600">
                        Active
                        <ArrowUpRightFromSquare color={"green"} size={8} />
                      </Text>
                    ) : (
                      <Text className="text-white text-[16px]">
                        ₹
                        {series && series?.type !== "Free"
                          ? series?.price
                          : videoAmount}
                      </Text>
                    )}
                  </View>
                </Pressable>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="mb-0.5"
                onPress={() => {
                  setShowPriceDropdown(false);
                  setShowDropdown(false);
                }}
              >
                <Pressable
                  onPress={() => {
                    setWantToBuyVideo(true);
                    (series === null || series?.type === "Free") &&
                    !hasCreatorPass &&
                    creatorPass?.creator_profile.creator_pass_price !== 0
                      ? router.push({
                          pathname:
                            "/(dashboard)/PurchasePass/PurchaseCreatorPass/[id]",
                          params: { id: createdBy?._id },
                        })
                      : series && series?.type !== "Free" && !hasAccessPass
                        ? router.push({
                            pathname:
                              "/(dashboard)/PurchasePass/PurchaseSeries/[id]",
                            params: { id: series?._id },
                          })
                        : hasAccessPass
                          ? router.push({
                              pathname: "/(dashboard)/profile/access",
                              params: {
                                routeTab:
                                  hasAccessPass === "series"
                                    ? "series"
                                    : "content",
                              },
                            })
                          : hasCreatorPass
                            ? ""
                            : router.push({
                                pathname:
                                  "/(dashboard)/PurchasePass/PurchaseVideo/[id]",
                                params: { id: videoId },
                              });
                  }}
                >
                  <View
                    className={`bg-black h-11 px-2 py-1 flex-row items-center justify-between rounded-t-xl`}
                  >
                    {(series === undefined ||
                      series === null ||
                      series?.type === "Free") &&
                    creatorPass &&
                    creatorPass?.creator_profile.creator_pass_price !== 0 ? (
                      <>
                        <Text className="text-white text-[16px] flex-row items-center">
                          Creator Pass
                        </Text>
                        <Text className="text-white text-[16px]">
                          {!hasCreatorPass &&
                          creatorPass?.creator_profile?.creator_pass_price !==
                            0 ? (
                            `₹${creatorPass?.creator_profile?.creator_pass_price}`
                          ) : (
                            <Text className="text-[16px] text-green-600">
                              Active
                            </Text>
                          )}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text className="text-white text-[16px] flex-row items-center">
                          Content access
                        </Text>
                        <Text className="text-white text-[16px]">
                          {series && series?.type !== "Free" ? (
                            hasAccessPass || hasCreatorPass ? (
                              <Text className="text-[16px] text-green-600 items-center justify-center">
                                Active
                                <ArrowUpRightFromSquare
                                  color={"green"}
                                  size={8}
                                />
                              </Text>
                            ) : (
                              `₹${series?.price}`
                            )
                          ) : hasAccessPass || hasCreatorPass ? (
                            <Text className="text-[16px] text-green-600">
                              Active
                              <ArrowUpRightFromSquare
                                color={"green"}
                                size={8}
                              />
                            </Text>
                          ) : (
                            `₹${videoAmount}`
                          )}
                        </Text>
                      </>
                    )}
                  </View>
                </Pressable>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Episode Dropdown */}
        {showDropdown && (
          <View className="absolute bottom-3.5 left-11 rounded-xl p-2 w-56">
            {series?.episodes.map((ep, idx) => (
              <TouchableOpacity
                key={ep._id || idx}
                className="mb-[0.5px]"
                disabled={isLoadingSeriesVideos}
                onPress={() => {
                  setSelectedEpisodeIndex(selectedEpisodeIndex);
                  setShowDropdown(false);
                  console.log("selectedEpisodeIndex", idx);
                  setVideosInZustand(seriesVideos);
                  router.push({
                    pathname: "/(dashboard)/long/GlobalVideoPlayer",
                    params: { startIndex: idx, videoType: "series" },
                  });

                  // Call the episode change callback if provided
                  // if (onEpisodeChange && ep) {
                  //   console.log("🎬 Calling onEpisodeChange with episode:", ep);
                  //   onEpisodeChange(ep);
                  // }
                }}
              >
                <View
                  className={`bg-black px-2 py-2 flex-row items-center ${
                    idx == 0 && "rounded-t-xl"
                  } ${ep.episode_number == series.total_episodes && "rounded-b-xl"} ${selectedEpisodeIndex === ep.episode_number && "gap-2"}`}
                >
                  <Text className="text-white text-[18px] flex-row items-center">
                    Episode: {ep.episode_number}
                  </Text>
                  {selectedEpisodeIndex === ep.episode_number && (
                    <Text className="text-white pl-5">✔</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default VideoDetails;
