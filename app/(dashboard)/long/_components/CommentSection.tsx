import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useComments } from "./useComments";
import { Comment } from "@/types/Comments";
import { useMonetization } from "./useMonetization";
import { router } from "expo-router";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { useCallback } from "react";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";

interface CommentsSectionProps {
  onClose: () => void;
  videoId: string | null;
  onPressUsername?: (userId: string) => void;
  onPressTip?: (commentId: string) => void;
  onCommentAdded?: () => void;
  refreshTrigger?: number; // Add prop to trigger refresh
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.6;
const BOTTOM_NAV_HEIGHT = Platform.OS == 'ios' ? 50 : 70;

// Helper function to format timestamp like Instagram
const formatTimestamp = (timestamp: string | Date): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) {
    return "now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}w`;
  } else {
    // For older posts, show month/day
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  }
};

const CommentsSection = ({
  onClose,
  videoId,
  onPressUsername,
  onPressTip,
  onCommentAdded,
  refreshTrigger,
}: CommentsSectionProps) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string>("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const [repliesData, setRepliesData] = useState<{ [key: string]: any[] }>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [lastGiftedCommentId, setLastGiftedCommentId] = useState<string | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(true);
  const lastGiftedCommentRef = useRef<string | null>(null);

  // Debug logging for lastGiftedCommentId changes
  useEffect(() => {
    console.log("💰 lastGiftedCommentId changed to:", lastGiftedCommentId);
    lastGiftedCommentRef.current = lastGiftedCommentId;
  }, [lastGiftedCommentId]);

  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();
  const { commentMonetizationEnabled, loading: monetizationLoading } =
    useMonetization(false);

  const {
    comments,
    loading: isLoading,
    fetchComments,
    addComment,
    upvoteComment,
    downvoteComment,
    addReply,
    fetchReplies,
    upvoteReply,
    downvoteReply,
  } = useComments({ videoId });

  // Debug logging for focus changes
  useEffect(() => {
    console.log("💰 isFocused changed to:", isFocused);
  }, [isFocused]);

  useEffect(() => {
    if (videoId) fetchComments();
  }, [videoId, fetchComments]);

  // Refresh comments every time the modal is opened
  useEffect(() => {
    if (videoId) {
      console.log(
        "💰 CommentSection opened - refreshing comments to get latest gift counts"
      );
      fetchComments();
    }
  }, [videoId, fetchComments]);

  // Add a more aggressive refresh when the component mounts or becomes visible
  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      if (videoId && isFocused) {
        console.log(
          "💰 Aggressive refresh - ensuring we have latest comment data"
        );
        fetchComments();
      }
    }, 500);

    return () => clearTimeout(refreshTimer);
  }, [videoId, isFocused, fetchComments]);

  // Refresh when refreshTrigger changes (when modal is reopened)
  useEffect(() => {
    if (videoId && refreshTrigger && refreshTrigger > 0) {
      console.log(
        "💰 CommentSection refresh triggered - fetching latest comment data with gift amounts"
      );
      fetchComments();
    }
  }, [refreshTrigger, videoId, fetchComments]);

  // Track modal visibility
  useEffect(() => {
    setIsModalVisible(true);
    return () => setIsModalVisible(false);
  }, []);

  // Define handleGiftSuccess function first
  const handleGiftSuccess = useCallback(async () => {
    try {
      console.log(
        "💰 Gift successful, refreshing all comments to get latest amounts"
      );
      await fetchComments();
    } catch (error) {
      console.error("❌ Error refreshing comments after gift:", error);
    }
  }, [fetchComments]);

  // Listen for when we return from gift screen using app state
  useEffect(() => {
    let intervalId: NodeJS.Timeout | number;

    if (lastGiftedCommentId) {
      console.log("💰 Starting to watch for return from gift screen...");

      // Check every 500ms if we're back and focused
      intervalId = setInterval(() => {
        if (isFocused && lastGiftedCommentId) {
          console.log(
            "💰 Detected return from gift screen, refreshing comments"
          );
          handleGiftSuccess();
          setLastGiftedCommentId(null);
        }
      }, 500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [lastGiftedCommentId, isFocused, handleGiftSuccess]);

  // Listen for navigation state changes to detect return from gift screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log(
        "💰 Navigation focus event triggered. videoId:",
        videoId,
        "lastGiftedCommentId:",
        lastGiftedCommentId
      );
      if (videoId && lastGiftedCommentId) {
        console.log(
          "💰 Returning from gift screen via navigation listener, refreshing all comments to get latest amounts"
        );
        handleGiftSuccess();
        setLastGiftedCommentId(null); // Clear the flag
      }
    });

    return unsubscribe;
  }, [navigation, videoId, lastGiftedCommentId, handleGiftSuccess]);

  // Listen for screen focus to refresh comments after returning from gift screen
  useFocusEffect(
    useCallback(() => {
      console.log(
        "💰 useFocusEffect triggered. videoId:",
        videoId,
        "lastGiftedCommentId:",
        lastGiftedCommentId
      );
      if (videoId && lastGiftedCommentId) {
        console.log(
          "💰 Returning from gift screen, refreshing all comments to get latest amounts"
        );
        handleGiftSuccess();
        setLastGiftedCommentId(null); // Clear the flag
      }
    }, [videoId, lastGiftedCommentId, handleGiftSuccess])
  );

  // Listen for screen focus changes to refresh comments when modal becomes visible
  useEffect(() => {
    if (isFocused && isModalVisible && lastGiftedCommentId) {
      console.log("💰 Modal became visible after gift, refreshing comments");
      handleGiftSuccess();
      setLastGiftedCommentId(null);
    }
  }, [isFocused, isModalVisible, lastGiftedCommentId, handleGiftSuccess]);

  // Debug logging for monetization and gift counts
  useEffect(() => {
    if (comments.length > 0) {
      console.log("💰 Comment Monetization Status:", {
        globalEnabled: commentMonetizationEnabled,
        commentsCount: comments.length,
        monetizedComments: comments.filter((c) => c.is_monetized).length,
      });

      // Debug gift counts
      console.log(
        "💰 Comment Gift Counts:",
        comments.map((c) => ({
          id: c._id,
          content: c.content?.substring(0, 20) + "...",
          donations: c.donations,
          user: c.user?.name,
        }))
      );
    }
  }, [commentMonetizationEnabled, comments]);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        console.log("🎹 Keyboard Show Event:", {
          height: event.endCoordinates.height,
          screenY: event.endCoordinates.screenY,
          platform: Platform.OS,
        });
        // Set both keyboard height and input focused state together
        setKeyboardHeight(event.endCoordinates.height);
        setIsInputFocused(true);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        console.log("🎹 Keyboard Hide Event");
        setKeyboardHeight(0);
        setIsInputFocused(false);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const handleInputFocus = () => {
    console.log("🎹 Input focused");
    setIsInputFocused(true);
    // Scroll to bottom when input is focused
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (replyingTo) {
        await addReply(replyingTo, comment.trim());

        try {
          const updatedReplies = await fetchReplies(replyingTo);
          setRepliesData((prev) => ({
            ...prev,
            [replyingTo]: updatedReplies || [],
          }));
          setExpandedReplies((prev) => new Set([...prev, replyingTo]));
        } catch (error) {
          console.error("Error refreshing replies:", error);
        }

        handleCancelReply();
      } else {
        await addComment(comment.trim());
        setComment("");
        // Notify parent that a comment was added
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
      // Dismiss keyboard after successful submission
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      const errorMessage = error.message || "Failed to post comment";
      Alert.alert("Error", `Failed to post comment: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyToComment = (commentId: string, userName: string) => {
    setReplyingTo(commentId);
    setReplyingToUser(userName);

    // Focus the input to show keyboard
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyingToUser("");
    setComment("");
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleToggleReplies = async (commentId: string) => {
    const isExpanded = expandedReplies.has(commentId);

    if (isExpanded) {
      setExpandedReplies((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      setExpandedReplies((prev) => new Set([...prev, commentId]));

      if (!repliesData[commentId]) {
        try {
          const replies = await fetchReplies(commentId);
          setRepliesData((prev) => ({
            ...prev,
            [commentId]: replies || [],
          }));
        } catch (error) {
          console.error("Error fetching replies:", error);
          setRepliesData((prev) => ({
            ...prev,
            [commentId]: [],
          }));
        }
      }
    }
  };

  const handleUpvote = async (commentId: string) => {
    await upvoteComment(commentId);
  };

  const handleDownvote = async (commentId: string) => {
    await downvoteComment(commentId);
  };

  const handleUpvoteReply = async (replyId: string, commentId: string) => {
    try {
      await upvoteReply(replyId, commentId);
      // Refresh replies to get updated vote counts
      const updatedReplies = await fetchReplies(commentId);
      setRepliesData((prev) => ({
        ...prev,
        [commentId]: updatedReplies || [],
      }));
    } catch (error) {
      console.error("Error upvoting reply:", error);
    }
  };

  const handleDownvoteReply = async (replyId: string, commentId: string) => {
    try {
      await downvoteReply(replyId, commentId);
      // Refresh replies to get updated vote counts
      const updatedReplies = await fetchReplies(commentId);
      setRepliesData((prev) => ({
        ...prev,
        [commentId]: updatedReplies || [],
      }));
    } catch (error) {
      console.error("Error downvoting reply:", error);
    }
  };

  const renderReply = (reply: any, parentCommentId: string) => (
    <View key={reply._id} style={{ marginLeft: 56, marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        {/* Left content */}
        <View
          style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}
        >
          <TouchableOpacity
            onPress={() => onPressUsername?.(reply.user?.id)}
            accessibilityLabel={`View ${reply.user?.name || "user"} profile`}
            style={{ minHeight: 44, minWidth: 44, justifyContent: "center" }}
          >
            <Image
              source={{ uri: getProfilePhotoUrl(reply.user?.avatar, "user") }}
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <TouchableOpacity
                onPress={() => onPressUsername?.(reply.user?.id)}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}
                >
                  {reply.user?.name || "Anonymous User"}
                </Text>
              </TouchableOpacity>
              <Text style={{ color: "#9E9E9E", fontSize: 12 }}>
                {formatTimestamp(reply.timestamp || reply.createdAt)}
              </Text>
            </View>
            <Text style={{ color: "#FFFFFF", fontSize: 16, marginTop: 2 }}>
              {reply.content || "No content"}
            </Text>
          </View>
        </View>

        {/* Right action icons - aligned horizontally (no tip for replies) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            paddingLeft: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => handleUpvoteReply(reply._id, parentCommentId)}
            accessibilityLabel="Upvote reply"
            style={{
              alignItems: "center",
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <MaterialIcons
              name="arrow-upward"
              size={18}
              color={reply.upvoted ? "#4CAF50" : "#FFFFFF"}
            />
            <Text style={{ color: "#9E9E9E", fontSize: 11, marginTop: 1 }}>
              {reply.upvotes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDownvoteReply(reply._id, parentCommentId)}
            accessibilityLabel="Downvote reply"
            style={{
              alignItems: "center",
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <MaterialIcons
              name="arrow-downward"
              size={18}
              color={reply.downvoted ? "#F44336" : "#FFFFFF"}
            />
            <Text style={{ color: "#9E9E9E", fontSize: 11, marginTop: 1 }}>
              {reply.downvotes || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reply button directly below the reply */}
      <View style={{ marginLeft: 44, marginTop: 4 }}>
        <TouchableOpacity
          onPress={() =>
            handleReplyToComment(
              parentCommentId,
              reply.user?.name || "Anonymous User"
            )
          }
          accessibilityLabel="Reply to reply"
          style={{ minHeight: 32, justifyContent: "center" }}
        >
          <Text style={{ color: "#9E9E9E", fontSize: 13 }}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComment = (item: Comment) => {
    if (!item || !item._id) return null;

    const isExpanded = expandedReplies.has(item._id);
    const replies = repliesData[item._id] || [];

    return (
      <View
        key={item._id}
        style={{ paddingHorizontal: 20, paddingVertical: 12 }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {/* Left content */}
          <View
            style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}
          >
            <TouchableOpacity
              onPress={() => onPressUsername?.(item.user?.id)}
              accessibilityLabel={`View ${item.user?.name || "user"} profile`}
              style={{ minHeight: 44, minWidth: 44, justifyContent: "center" }}
            >
              <Image
                source={{ uri: getProfilePhotoUrl(item.user?.avatar, "user") }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <TouchableOpacity
                  onPress={() => onPressUsername?.(item.user?.id)}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {item.user?.name || "Anonymous User"}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: "#9E9E9E", fontSize: 12 }}>
                  {formatTimestamp(item.timestamp || item.createdAt)}
                </Text>
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 16, marginTop: 2 }}>
                {item.content || "No content"}
              </Text>
            </View>
          </View>

          {/* Right action icons - aligned horizontally */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              paddingLeft: 8,
            }}
          >
            {/* Only show rupee icon if both global and comment-specific monetization are enabled */}
            {commentMonetizationEnabled && item.is_monetized && (
              <TouchableOpacity
                onPress={() => {
                  console.log("🎯 GIFT BUTTON PRESSED! CommentId:", item._id);
                  // Store the comment ID for refreshing when we return
                  setLastGiftedCommentId(item._id);
                  console.log(
                    "💰 Navigating to gift screen, will refresh on return. CommentId:",
                    item._id
                  );
                  console.log("💰 lastGiftedCommentId set to:", item._id);

                  // Navigate to VideoContentGifting with comment parameters
                  router.push({
                    pathname: "/(payments)/Video/Video-Gifting",
                    params: {
                      mode: "comment-gift",
                      commentId: item._id,
                      videoId: videoId,
                      creatorName: item.user?.name || "Anonymous User",
                      creatorUsername: item.user?.username || "user",
                      creatorPhoto: item.user?.avatar || "",
                      creatorId: item.user?.id || "",
                    },
                  });
                }}
                accessibilityLabel="Tip creator"
                style={{
                  alignItems: "center",
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <MaterialIcons
                  name="currency-rupee"
                  size={20}
                  color={
                    item.donations && item.donations > 0 ? "#FFD24D" : "#FFFFFF"
                  }
                />
                <Text style={{ color: "#9E9E9E", fontSize: 12, marginTop: 2 }}>
                  {item.donations || 0}
                </Text>
                {/* Debug: Show what we're rendering */}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => handleUpvote(item._id)}
              accessibilityLabel="Upvote comment"
              style={{
                alignItems: "center",
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <MaterialIcons
                name="arrow-upward"
                size={20}
                color={item.upvoted ? "#4CAF50" : "#FFFFFF"}
              />
              <Text style={{ color: "#9E9E9E", fontSize: 12, marginTop: 2 }}>
                {item.upvotes || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDownvote(item._id)}
              accessibilityLabel="Downvote comment"
              style={{
                alignItems: "center",
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <MaterialIcons
                name="arrow-downward"
                size={20}
                color={item.downvoted ? "#F44336" : "#FFFFFF"}
              />
              <Text style={{ color: "#9E9E9E", fontSize: 12, marginTop: 2 }}>
                {item.downvotes || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reply and View replies buttons on the same line */}
        <View
          style={{
            marginLeft: 56,
            marginTop: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 24,
          }}
        >
          <TouchableOpacity
            onPress={() =>
              handleReplyToComment(
                item._id,
                item.user?.name || "Anonymous User"
              )
            }
            accessibilityLabel="Reply to comment"
            style={{ minHeight: 32, justifyContent: "center" }}
          >
            <Text style={{ color: "#9E9E9E", fontSize: 13 }}>Reply</Text>
          </TouchableOpacity>

          {(item.replies > 0 || item.repliesCount > 0) && (
            <TouchableOpacity
              onPress={() => handleToggleReplies(item._id)}
              accessibilityLabel={`${isExpanded ? "Hide" : "View"} replies`}
              style={{ minHeight: 32, justifyContent: "center" }}
            >
              <Text style={{ color: "#9E9E9E", fontSize: 13 }}>
                {isExpanded
                  ? "Hide replies"
                  : `View replies (${item.replies || item.repliesCount || 0})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Replies section */}
        {isExpanded && (
          <View style={{ marginTop: 12 }}>
            {replies.length > 0 ? (
              replies.map((reply) => renderReply(reply, item._id))
            ) : (
              <View style={{ marginLeft: 56 }}>
                <Text style={{ color: "#9E9E9E", fontSize: 13 }}>
                  No replies yet
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 1000,
      }}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onPress={() => {
          if (isInputFocused) {
            if (inputRef.current) {
              inputRef.current.blur();
            }
          } else {
            onClose();
          }
        }}
        activeOpacity={1}
      />

      {/* Bottom Sheet - Fixed positioning */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          ...(isInputFocused && keyboardHeight > 0 ? {
            // When keyboard is open, position so the input sits above keyboard
            bottom: keyboardHeight -260,
            height: Math.min(SCREEN_HEIGHT * 0.5, SCREEN_HEIGHT - keyboardHeight - 50),
          } : {
            // When keyboard is closed, normal positioning
            bottom: BOTTOM_NAV_HEIGHT,
            height: SHEET_MAX_HEIGHT,
          }),
          backgroundColor: "#0E0E0E",
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          maxHeight: SCREEN_HEIGHT * 0.8,
        }}
      >
        {/* Drag handle */}
        <View
          style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}
        >
          <View
            style={{
              width: 56,
              height: 4,
              backgroundColor: "#9E9E9E",
              borderRadius: 2,
            }}
          />
        </View>

        {/* Header */}
        <View style={{ alignItems: "center", paddingBottom: 16 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}>
            Comments
          </Text>
          {/* Debug indicator */}
          {lastGiftedCommentId && (
            <Text style={{ color: "#FFD24D", fontSize: 12, marginTop: 4 }}>
              🎁 Waiting for gift return: {lastGiftedCommentId.substring(0, 8)}
              ...
            </Text>
          )}
        </View>

        {/* Comments List */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {isLoading || monetizationLoading ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 50,
              }}
            >
              <ActivityIndicator size="large" color="#F1C40F" />
              <Text style={{ color: "#9E9E9E", marginTop: 8 }}>
                {isLoading ? "Loading comments..." : "Loading..."}
              </Text>
            </View>
          ) : comments.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 50,
              }}
            >
              <Text style={{ color: "#9E9E9E", textAlign: "center" }}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          ) : (
            <>
              {comments.map((item) => renderComment(item))}
              <View style={{ height: 20 }} />
            </>
          )}
        </ScrollView>

        {/* Input Bar - Always visible at bottom */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom, 16),
            paddingTop: 16,
            backgroundColor: "#0E0E0E",
            borderTopWidth: isInputFocused ? 1 : 0,
            borderTopColor: "#333333",
          }}
        >
          {/* Reply indicator */}
          {replyingTo && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: "rgba(158, 158, 158, 0.1)",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#9E9E9E", fontSize: 14 }}>
                Replying to @{replyingToUser}
              </Text>
              <TouchableOpacity onPress={handleCancelReply}>
                <Text style={{ color: "#FF3B30", fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input field */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isInputFocused ? "#1A1A1A" : "#0E0E0E",
              borderRadius: 28,
              height: 52,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: isInputFocused ? "#444444" : "#333333",
            }}
          >
            <TextInput
              ref={inputRef}
              value={comment}
              onChangeText={setComment}
              placeholder={
                replyingTo ? `Reply to @${replyingToUser}...` : "Add comment..."
              }
              placeholderTextColor="#9E9E9E"
              style={{
                flex: 1,
                color: "#FFFFFF",
                fontSize: 16,
                paddingVertical: 0,
                paddingBottom: Platform.OS == "ios" ? 10 : 0
              }}
              multiline={false}
              maxLength={500}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              blurOnSubmit={false}
              onSubmitEditing={handleSubmitComment}
              returnKeyType="send"
            />

            {/* Send button */}
            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={!comment.trim() || isSubmitting}
              style={{
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 12,
                minHeight: 44,
                minWidth: 44,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#F1C40F" />
              ) : (
                <MaterialIcons
                  name="send"
                  size={20}
                  color={comment.trim() ? "#F1C40F" : "#9E9E9E"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CommentsSection;
