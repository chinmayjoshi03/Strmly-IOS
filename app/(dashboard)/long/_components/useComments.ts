import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Comment, reply } from '@/types/Comments';
// Simple mock comments for fallback
const mockComments: Comment[] = [];
// import { useCommentWebSocket } from '@/services/commentWebSocket'; // Temporarily disabled
import { commentActions } from '@/api/comments/commentActions';
import { CONFIG } from '@/Constants/config';

interface UseCommentsProps {
  videoId: string | null;
}

export const useComments = ({ videoId }: UseCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  // WebSocket for real-time updates (temporarily disabled)
  // const { ws, isConnected } = useCommentWebSocket(videoId);
  const isConnected = false; // Temporarily set to false until WebSocket server is implemented

  // Set up WebSocket event listeners (temporarily disabled)
  // useEffect(() => {
  //   if (!ws) return;

  //   ws.on('onNewComment', (newComment: Comment) => {
  //     console.log('📨 New comment received via WebSocket:', newComment);
  //     setComments(prev => [newComment, ...prev]);
  //   });

  //   ws.on('onCommentUpdate', (updatedComment: Comment) => {
  //     console.log('📨 Comment updated via WebSocket:', updatedComment);
  //     setComments(prev => prev.map(comment => 
  //       comment._id === updatedComment._id ? updatedComment : comment
  //     ));
  //   });

  //   ws.on('onCommentDelete', (commentId: string) => {
  //     console.log('📨 Comment deleted via WebSocket:', commentId);
  //     setComments(prev => prev.filter(comment => comment._id !== commentId));
  //   });

  //   ws.on('onError', (error: string) => {
  //     console.log('❌ WebSocket error:', error);
  //     setError(error);
  //   });

  //   return () => {
  //     ws.off('onNewComment');
  //     ws.off('onCommentUpdate');
  //     ws.off('onCommentDelete');
  //     ws.off('onError');
  //   };
  // }, [ws]);

  const fetchComments = useCallback(async (page = 1, limit = 10, retryCount = 0) => {
    if (!token || !videoId) {
      console.log('📝 Using mock comments - no token or videoId', { token: !!token, videoId });
      setComments(mockComments.slice(0, 10));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 Fetching real comments for video:', videoId);

      const data = await commentActions.getComments(token, videoId, page, limit);

      console.log('✅ Real comments fetched:', data?.comments?.length || 0);
      
      // Debug: Log gift counts from API response
      if (data?.comments?.length > 0) {
        console.log('💰 API Response Gift Counts:', data.comments.map((c: any) => ({
          id: c._id,
          content: c.content?.substring(0, 20) + "...",
          gifts: c.gifts,
          donations: c.donations,
          user: c.user?.name || c.user?.username
        })));
      }

      // Validate and filter out malformed comments
      const validComments = (data?.comments || []).filter((comment: any) => {
        if (!comment || !comment._id) {
          console.log('⚠️ Skipping malformed comment:', comment);
          return false;
        }
        return true;
      }).map((comment: any) => ({
        ...comment,
        // Ensure is_monetized field exists - if not provided by backend, default to true for now
        is_monetized: comment.is_monetized !== undefined ? comment.is_monetized : true
      }));

      console.log('✅ Valid comments after filtering:', validComments.length);
      
      // Debug: Log what we're about to set in state
      console.log('💰 Setting comments state with gift amounts:', validComments.map((c: any) => ({
        id: c._id,
        content: c.content?.substring(0, 20) + "...",
        donations: c.donations,
        user: c.user?.name || c.user?.username
      })));
      
      setComments(validComments);
    } catch (err: any) {
      console.log('❌ Error fetching real comments:', err.message);

      // Handle rate limiting with exponential backoff
      if (err.message.includes('429') && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        
        setTimeout(() => {
          fetchComments(page, limit, retryCount + 1);
        }, delay);
        return;
      }

      // Check if it's a specific backend error
      if (err.message.includes('Cannot read properties of undefined')) {
        console.log('🔧 Backend issue: Comment data structure problem');
        setError('Comments temporarily unavailable due to data issue');
      } else if (err.message.includes('429')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.message);
      }

      // Use mock comments as fallback
      setComments(mockComments.slice(0, 10));
    } finally {
      setLoading(false);
    }
  }, [token, videoId]);

  const addComment = useCallback(async (content: string) => {
    if (!token || !videoId || !content.trim()) {
      throw new Error('Missing required data');
    }

    // Create a mock comment for immediate display
    const tempId = `temp_${Date.now()}`;
    const mockNewComment: Comment = {
      _id: tempId,
      content,
      videoId: videoId!,
      repliesCount: 0,
      timestamp: new Date().toISOString(),
      donations: 0,
      upvotes: 0,
      downvotes: 0,
      user: {
        id: 'current_user',
        username: 'you',
        name: 'You',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=you'
      },
      upvoted: false,
      downvoted: false,
      replies: 0,
      is_monetized: true // New comments should be monetized if global setting is enabled
    };

    // Immediately add the mock comment to the UI for better UX
    setComments(prev => [mockNewComment, ...prev]);

    try {
      console.log('📝 Posting comment:', { videoId, content });
      const result = await commentActions.postComment(token, videoId, content);

      console.log('✅ Comment posted successfully:', result);

      // Replace the temporary comment with the real one from the server
      if (result.comment) {
        setComments(prev => prev.map(comment =>
          comment._id === tempId ? result.comment! : comment
        ));
      } else {
        // If no comment returned, refresh the comments list
        setTimeout(() => {
          fetchComments();
        }, 1000);
      }

      return result;
    } catch (err: any) {
      console.log('❌ Error posting comment:', err.message);
      // Keep the mock comment in place since the API call failed
      return { comment: mockNewComment };
    }
  }, [token, videoId]);

  const addReply = useCallback(async (commentId: string, content: string) => {
    if (!token || !commentId || !content.trim() || !videoId) {
      throw new Error('Missing required data');
    }

    // Optimistically update the UI immediately
    setComments(prev => prev.map(comment =>
      comment._id === commentId
        ? { ...comment, replies: comment.replies + 1 }
        : comment
    ));

    try {
      console.log('📝 Posting reply:', { commentId, content, videoId });
      const result = await commentActions.postReply(token, commentId, content, videoId);

      console.log('✅ Reply posted successfully:', result);
      return result;
    } catch (err: any) {
      console.log('❌ Error posting reply:', err.message);

      // Revert the optimistic update on error
      setComments(prev => prev.map(comment =>
        comment._id === commentId
          ? { ...comment, replies: comment.replies - 1 }
          : comment
      ));

      throw err;
    }
  }, [token, videoId]);

  const upvoteComment = useCallback(async (commentId: string) => {
    if (!token || !commentId) return;

    // Store original state for potential rollback
    const originalComment = comments.find(c => c._id === commentId);

    // Optimistically update UI
    setComments(prev => prev.map(comment =>
      comment._id === commentId
        ? {
          ...comment,
          upvoted: !comment.upvoted,
          downvoted: false,
          upvotes: comment.upvoted ? comment.upvotes - 1 : comment.upvotes + 1,
          downvotes: comment.downvoted ? comment.downvotes - 1 : comment.downvotes
        }
        : comment
    ));

    try {
      console.log('👍 Upvoting comment:', { commentId, videoId });
      const result = await commentActions.upvoteComment(token, commentId, videoId || undefined);

      console.log('✅ Comment upvoted:', result);

      // Update with server response
      setComments(prev => prev.map(comment =>
        comment._id === commentId
          ? {
            ...comment,
            upvoted: result.upvoted,
            upvotes: result.upvotes
          }
          : comment
      ));
    } catch (err) {
      console.log('❌ Error upvoting comment:', err);
      // Revert optimistic update on error
      if (originalComment) {
        setComments(prev => prev.map(comment =>
          comment._id === commentId ? originalComment : comment
        ));
      }
    }
  }, [token, comments]);

  const downvoteComment = useCallback(async (commentId: string) => {
    if (!token || !commentId) return;

    // Store original state for potential rollback
    const originalComment = comments.find(c => c._id === commentId);

    // Optimistically update UI
    setComments(prev => prev.map(comment =>
      comment._id === commentId
        ? {
          ...comment,
          downvoted: !comment.downvoted,
          upvoted: false,
          downvotes: comment.downvoted ? comment.downvotes - 1 : comment.downvotes + 1,
          upvotes: comment.upvoted ? comment.upvotes - 1 : comment.upvotes
        }
        : comment
    ));

    try {
      console.log('👎 Downvoting comment:', { commentId, videoId });
      const result = await commentActions.downvoteComment(token, commentId, videoId || undefined);

      console.log('✅ Comment downvoted:', result);

      // Update with server response
      setComments(prev => prev.map(comment =>
        comment._id === commentId
          ? {
            ...comment,
            downvoted: result.downvoted,
            downvotes: result.downvotes || comment.downvotes
          }
          : comment
      ));
    } catch (err) {
      console.log('❌ Error downvoting comment:', err);
      // Revert optimistic update on error
      if (originalComment) {
        setComments(prev => prev.map(comment =>
          comment._id === commentId ? originalComment : comment
        ));
      }
    }
  }, [token, comments]);

  const fetchReplies = useCallback(async (commentId: string, page = 1, limit = 5) => {
    if (!token || !videoId || !commentId) {
      console.log('❌ Cannot fetch replies: missing token, videoId, or commentId');
      return [];
    }

    try {
      console.log('📝 Fetching replies for comment:', commentId);
      const data = await commentActions.getReplies(token, videoId, commentId, page, limit);

      console.log('✅ Replies fetched:', data?.replies?.length || 0);
      console.log('📄 Pagination:', data?.pagination);
      console.log('💬 Replies data:', data?.replies);

      return data?.replies || [];
    } catch (err: any) {
      console.log('❌ Error fetching replies:', err.message);
      return [];
    }
  }, [token, videoId]);

  const upvoteReply = useCallback(async (replyId: string, commentId: string) => {
    if (!token || !replyId || !videoId) return;

    try {
      console.log('👍 Upvoting reply:', replyId);
      const result = await commentActions.upvoteReply(token, replyId, videoId);
      console.log('✅ Reply upvoted:', result);
      return result;
    } catch (err) {
      console.log('❌ Error upvoting reply:', err);
      throw err;
    }
  }, [token, videoId]);

  const downvoteReply = useCallback(async (replyId: string, commentId: string) => {
    if (!token || !replyId || !videoId) return;

    try {
      console.log('👎 Downvoting reply:', replyId);
      const result = await commentActions.downvoteReply(token, replyId, videoId, commentId);
      console.log('✅ Reply downvoted:', result);
      return result;
    } catch (err) {
      console.log('❌ Error downvoting reply:', err);
      throw err;
    }
  }, [token, videoId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!token || !commentId || !videoId) {
      console.log('❌ Delete comment validation failed:', { token: !!token, commentId, videoId });
      return;
    }

    try {
      console.log('🗑️ Deleting comment:', { commentId, videoId });
      const result = await commentActions.deleteComment(token, commentId, videoId);
      console.log('✅ Comment deleted:', result);

      // Remove the comment from the local state
      setComments(prev => prev.filter(comment => comment._id !== commentId));
      
      return result;
    } catch (err) {
      console.log('❌ Error deleting comment:', err);
      throw err;
    }
  }, [token, videoId]);

  const deleteReply = useCallback(async (replyId: string, commentId: string) => {
    if (!token || !replyId || !videoId) {
      console.log('❌ Delete reply validation failed:', { token: !!token, replyId, videoId });
      return;
    }

    try {
      console.log('🗑️ Deleting reply:', { replyId, videoId });
      const result = await commentActions.deleteReply(token, replyId, videoId);
      console.log('✅ Reply deleted:', result);

      // Update the comment's reply count
      setComments(prev => prev.map(comment =>
        comment._id === commentId
          ? { ...comment, replies: Math.max(0, comment.replies - 1) }
          : comment
      ));
      
      return result;
    } catch (err) {
      console.log('❌ Error deleting reply:', err);
      throw err;
    }
  }, [token, videoId]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    addReply,
    upvoteComment,
    downvoteComment,
    fetchReplies,
    upvoteReply,
    downvoteReply,
    deleteComment,
    deleteReply,
    isConnected, // WebSocket connection status
  };
};