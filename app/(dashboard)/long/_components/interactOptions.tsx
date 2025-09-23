import { Image, Pressable, Text, View } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import { useAuthStore } from "@/store/useAuthStore";
import { CONFIG } from "@/Constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useGiftingStore } from "@/store/useGiftingStore";

type InteractOptionsProps = {
  onCommentPress?: () => void;
  videoId: string;
  name: string;
  likes: number;
  gifts: number;
  shares: number;
  comments?: number;
  creator: {
    _id: string;
    username: string;
    profile_photo: string;
  };
  // FIX: Add callback props for real-time updates
  onLikeUpdate?: (newLikeCount: number, isLiked: boolean) => void;
  onShareUpdate?: (newShareCount: number, isShared: boolean) => void;
  onGiftUpdate?: (newGiftCount: number) => void;
  onCommentUpdate?: (newCommentCount: number) => void;
};

const InteractOptions = ({
  onCommentPress,
  videoId,
  name,
  likes,
  gifts,
  shares,
  comments,
  creator,
  onLikeUpdate,
  onShareUpdate, 
  onGiftUpdate,
  onCommentUpdate,
}: InteractOptionsProps) => {
  // FIX: Initialize state with props values
  const [like, setLike] = useState(likes || 0);
  const [reshares, setReshares] = useState(shares || 0);
  const [gift, setGifts] = useState(gifts || 0);
  const [commentCount, setCommentCount] = useState(comments || 0);
  const [isLikedVideo, setIsLikedVideo] = useState(false);
  const [isResharedVideo, setIsResharedVideo] = useState(false);

  const { token, user } = useAuthStore();
  const { initiateGifting } = useGiftingStore();
  const BACKEND_API_URL = CONFIG.API_BASE_URL;

  // FIX: Update local state when props change
  useEffect(() => {
    setLike(likes || 0);
    setReshares(shares || 0);
    setGifts(gifts || 0);
    setCommentCount(comments || 0);
  }, [likes, shares, gifts, comments]);

  const LikeVideo = async () => {
    if (!token || !videoId) {
      return;
    }

    // FIX: Optimistic update with proper state management
    const prevLiked = isLikedVideo;
    const prevLikeCount = like;
    const newLikeCount = prevLiked ? prevLikeCount - 1 : prevLikeCount + 1;
    const newLikedState = !prevLiked;


    // Update local state immediately
    setLike(newLikeCount);
    setIsLikedVideo(newLikedState);



    


    // FIX: Call parent update callback
    if (onLikeUpdate) {
      onLikeUpdate(newLikeCount, newLikedState);
    }

    try {
      const response = await fetch(
        `${BACKEND_API_URL}/interactions/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId: videoId }),
        }
      );
      
      if (!response.ok) {
        // Revert on error
        setLike(prevLikeCount);
        setIsLikedVideo(prevLiked);
        if (onLikeUpdate) {
          onLikeUpdate(prevLikeCount, prevLiked);
        }
        throw new Error("Failed while like video");
      }
      
      const data = await response.json();
      console.log("Like video response:", data);
      
      // FIX: Update with server response
      setLike(data.likes);
      setIsLikedVideo(data.isLiked);
      
      if (onLikeUpdate) {
        onLikeUpdate(data.likes, data.isLiked);
      }
    } catch (err) {
      console.log("Like error:", err);
      // Revert optimistic updates on error
      setLike(prevLikeCount);
      setIsLikedVideo(prevLiked);
      if (onLikeUpdate) {
        onLikeUpdate(prevLikeCount, prevLiked);
      }
    }
  };

  // FIX: Check like status on component mount and video change
  useFocusEffect(
    useCallback(() => {
      const checkIfVideoLike = async () => {
        if (!token || !videoId) {
          return;
        }

        try {
          console.log("checking like status for", videoId);
          const response = await fetch(
            `${BACKEND_API_URL}/interactions/like/status`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ videoId: videoId }),
            }
          );

          if (!response.ok) {
            if (response.status === 401) {
              console.log("Token expired, user needs to re-authenticate");
              // Don't log error for expired tokens to reduce noise
              return;
            }
            throw new Error("Failed while checking video like status");
          }

          const data = await response.json();
          console.log("check like response:", data);
          
          setLike(data.likes);
          setIsLikedVideo(data.isLiked);
        } catch (err: any) {
          if (!err.message?.includes("401") && !err.message?.includes("token")) {
            console.log("Error checking like status:", err);
          }
        }
      };

      if (token && videoId) {
        checkIfVideoLike();
      }
    }, [token, videoId])
  );

  // FIX: Check video gifting with proper error handling
  useFocusEffect(
    useCallback(() => {
      const checkVideoGifting = async () => {
        if (!token || !videoId) {
          return;
        }

        try {
          const response = await fetch(
            `${BACKEND_API_URL}/videos/${videoId}/total-gifting`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          if (!response.ok) {
            if (response.status === 401) {
              console.log("Token expired, user needs to re-authenticate");
              // Don't log error for expired tokens to reduce noise
              return;
            }
            throw new Error("Failed while checking video gifting status");
          }
            
          const data = await response.json();
          console.log("check gifting response:", data);
          
          setGifts(data.data);
          
          if (onGiftUpdate) {
            onGiftUpdate(data.data);
          }
        } catch (err: any) {
          if (!err.message?.includes("401") && !err.message?.includes("token")) {
            console.log("Error checking gift status:", err);
          }
        }
      };

      if (token && videoId) {
        checkVideoGifting();
      }
    }, [token, videoId])
  );

  // Check reshare status
  useEffect(() => {
    const checkIfReshare = async () => {
      if (!token || !videoId) {
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_API_URL}/interactions/reshare/status`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ videoId: videoId }),
          }
        );
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log("Token expired, user needs to re-authenticate");
            // Don't log error for expired tokens to reduce noise
            return;
          }
          throw new Error("Failed while checking reshare status");
        }
          
        const data = await response.json();
        console.log("reshare status:", data.isReshared);
        setIsResharedVideo(data.isReshared);
      } catch (err: any) {
        if (!err.message?.includes("401") && !err.message?.includes("token")) {
          console.log("Error checking reshare status:", err);
        }
      }
    };

    if (token && videoId) {
      checkIfReshare();
    }
  }, [token, videoId]);

  const ReshareVideo = async () => {
    if (!token || !videoId) {
      return;
    }

    const prevReshareCount = reshares;
    const prevIsReshared = isResharedVideo;
    const newReshareCount = prevIsReshared ? prevReshareCount - 1 : prevReshareCount + 1;
    const newReshareState = !prevIsReshared;


    // Optimistic update
    setReshares(newReshareCount);
    setIsResharedVideo(newReshareState);


    if (onShareUpdate) {
      onShareUpdate(newReshareCount, newReshareState);
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/interactions/reshare`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId: videoId }),
      });
      
      if (!response.ok) {
        // Revert on error
        setReshares(prevReshareCount);
        setIsResharedVideo(prevIsReshared);
        if (onShareUpdate) {
          onShareUpdate(prevReshareCount, prevIsReshared);
        }
        throw new Error("Failed to reshare video");
      }
      
      const data = await response.json();
      console.log("Reshare video response:", data);
      
      setReshares(data.totalReshares);
      
      if (onShareUpdate) {
        onShareUpdate(data.totalReshares, newReshareState);
      }
    } catch (err) {
      console.log("Reshare error:", err);
      // Revert on error
      setReshares(prevReshareCount);
      setIsResharedVideo(prevIsReshared);
      if (onShareUpdate) {
        onShareUpdate(prevReshareCount, prevIsReshared);
      }
    }
  };

  const openGifting = async () => {
    initiateGifting(creator, videoId);
    router.push("/(payments)/Video/Video-Gifting");
  };


  // FIX: Add function to handle comment updates from CommentSection
  const handleCommentAdded = useCallback(() => {
    const newCount = commentCount + 1;
    setCommentCount(newCount);
    if (onCommentUpdate) {
      onCommentUpdate(newCount);
    }
  }, [commentCount, onCommentUpdate]);


  // FIX: Enhanced comment press handler
  const handleCommentPress = useCallback(() => {
    if (onCommentPress) {
      onCommentPress();
    } else {
      console.log("Comments not available");
    }
  }, [onCommentPress]);

  return (
    <View className="px-1 py-5">
      <View className="gap-5 py-10">
        <View className="items-center gap-1">
          <Pressable onPress={LikeVideo}>
            <FontAwesome
              name={isLikedVideo ? "heart" : "heart-o"}
              size={27}
              color={isLikedVideo ? "red" : "white"}
            />
          </Pressable>
          <Text className="text-white text-sm">{like}</Text>
        </View>

        <View className="items-center gap-1">
          <Pressable onPress={handleCommentPress}>
            <Image
              className="size-7"
              source={require("../../../../assets/images/comments.png")}
            />
          </Pressable>
          {/* FIX: Use local comment count state */}
          <Text className="text-white text-sm">{commentCount}</Text>
        </View>

        {/* Uncomment if you want reshare functionality */}
        {/* <View className="items-center gap-1">
          <Pressable onPress={ReshareVideo}>
            {isResharedVideo ? (
              <Image
                className="size-7"
                source={require("../../../../assets/images/reshare-green.png")}
              />
            ) : (
              <Image
                className="size-7"
                source={require("../../../../assets/images/repost.png")}
              />
            )}
          </Pressable>
          <Text className="text-white text-sm">{reshares}</Text>
        </View> */}

        <View className="items-center gap-1">
          <Pressable onPress={openGifting}>
            <Image
              className="size-7"
              source={require("../../../../assets/images/rupee.png")}
            />
          </Pressable>
          <Text className="text-white text-sm">{gift}</Text>
        </View>
      </View>
    </View>
  );
};

export default InteractOptions;