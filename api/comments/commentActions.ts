import { CONFIG } from '@/Constants/config';
import { Comment, reply } from '@/types/Comments';

// Simple request throttling
const requestQueue = new Map<string, number>();
const THROTTLE_DELAY = 1000; // 1 second between requests for same endpoint

const throttleRequest = async (key: string) => {
  const lastRequest = requestQueue.get(key) || 0;
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequest;

  if (timeSinceLastRequest < THROTTLE_DELAY) {
    const delay = THROTTLE_DELAY - timeSinceLastRequest;
    console.log(`⏳ Throttling request for ${key}, waiting ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  requestQueue.set(key, Date.now());
};

export interface CommentAPIResponse {
  message?: string;
  comment?: Comment | any; // Allow any for backend response mapping
  comments?: Comment[];
  replies?: reply[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VoteResponse {
  success?: boolean;
  message?: string;
  upvoted?: boolean;
  downvoted?: boolean;
  upvotes: number;
  downvotes?: number;
}

export class CommentAPI {
  private static getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get comments for a video
  static async getComments(
    token: string,
    videoId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<CommentAPIResponse> {
    const throttleKey = `comments-${videoId}`;
    await throttleRequest(throttleKey);

    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/videos/${videoId}/comments?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: CommentAPI.getHeaders(token),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status}`);
    }

    return response.json();
  }

  // Post a new comment
  static async postComment(
    token: string,
    videoId: string,
    content: string
  ): Promise<CommentAPIResponse> {
    console.log('Posting comment to:', `${CONFIG.API_BASE_URL}/interactions/comment`);
    console.log('Request body:', { videoId, comment: content });

    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/comment`,
      {
        method: 'POST',
        headers: CommentAPI.getHeaders(token),
        body: JSON.stringify({
          videoId,
          comment: content, // Backend expects 'comment' not 'content'
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Comment post error response:', errorText);
      throw new Error(`Failed to post comment: ${response.status} - ${errorText}`);
    }

    return response.json();
  }


  // Get replies for a comment
  static async getReplies(
    token: string,
    videoId: string,
    commentId: string,
    page: number = 1,
    limit: number = 5
  ): Promise<CommentAPIResponse> {
    console.log('videoId:', videoId);
    console.log('commentId:', commentId);
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/videos/${videoId}/comments/${commentId}/replies?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: CommentAPI.getHeaders(token),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch replies: ${response.status}`);
    }
    return response.json();
  }

  // Post a reply to a comment
  static async postReply(
    token: string,
    commentId: string,
    content: string,
    videoId: string
  ): Promise<CommentAPIResponse> {
    if (!videoId) {
      throw new Error('VideoId is required for posting a reply');
    }

    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/comments/reply`,
      {
        method: 'POST',
        headers: CommentAPI.getHeaders(token),
        body: JSON.stringify({
          commentId,
          videoId,
          reply: content, // Backend expects 'reply' not 'content'
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to post reply: ${response.status}`);
    }

    return response.json();
  }

  // Upvote a comment
  static async upvoteComment(
    token: string,
    commentId: string,
    videoId?: string
  ): Promise<VoteResponse> {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/comments/upvote`,
      {
        method: 'POST',
        headers: CommentAPI.getHeaders(token),
        body: JSON.stringify({
          commentId,
          videoId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upvote comment error response:', errorText);
      throw new Error(`Failed to upvote comment: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Downvote a comment
  static async downvoteComment(
    token: string,
    commentId: string,
    videoId?: string
  ): Promise<VoteResponse> {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/comments/downvote`,
      {
        method: 'POST',
        headers: CommentAPI.getHeaders(token),
        body: JSON.stringify({
          commentId,
          videoId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Downvote comment error response:', errorText);
      throw new Error(`Failed to downvote comment: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Upvote a reply
  static async upvoteReply(
    token: string,
    replyId: string,
    videoId: string
  ): Promise<VoteResponse> {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/replies/upvote`,
      {
        method: 'POST',
        headers: CommentAPI.getHeaders(token),
        body: JSON.stringify({
          replyId,
          videoId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upvote reply error response:', errorText);
      throw new Error(`Failed to upvote reply: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Downvote a reply
  static async downvoteReply(
    token: string,
    replyId: string,
    videoId: string,
    commentId: string
  ): Promise<VoteResponse> {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/replies/downvote`,
      {
        method: 'POST',
        headers: CommentAPI.getHeaders(token),
        body: JSON.stringify({
          replyId,
          videoId,
          commentId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Downvote reply error response:', errorText);
      throw new Error(`Failed to downvote reply: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Delete a comment
  static async deleteComment(
    token: string,
    commentId: string,
    videoId: string
  ): Promise<{ success: boolean; message: string }> {
    console.log('🗑️ Delete comment request:', { commentId, videoId });
    
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/comments/delete`,
      {
        method: 'DELETE',
        headers: CommentAPI.getHeaders(token),
        body: JSON.stringify({
          commentId,
          videoId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Delete comment error response:', errorText);
      throw new Error(`Failed to delete comment: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Delete a reply
  static async deleteReply(
    token: string,
    replyId: string,
    videoId: string
  ): Promise<{ success: boolean; message: string }> {
    console.log('🗑️ Delete reply request:', { replyId, videoId });
    
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/interactions/comments/delete`,
      {
        method: 'DELETE',
        headers: CommentAPI.getHeaders(token),
        body: JSON.stringify({
          commentId: replyId, // API uses commentId for both comments and replies
          videoId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Delete reply error response:', errorText);
      throw new Error(`Failed to delete reply: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

}

// Convenience functions for easier usage
export const commentActions = {
  getComments: CommentAPI.getComments,
  postComment: CommentAPI.postComment,
  getReplies: CommentAPI.getReplies,
  postReply: CommentAPI.postReply,
  upvoteComment: CommentAPI.upvoteComment,
  downvoteComment: CommentAPI.downvoteComment,
  upvoteReply: CommentAPI.upvoteReply,
  downvoteReply: CommentAPI.downvoteReply,
  deleteComment: CommentAPI.deleteComment,
  deleteReply: CommentAPI.deleteReply,
};