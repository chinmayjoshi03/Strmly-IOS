import { Comment } from "./Comments";

export type VideoItemType = {
  _id: string;
  video: string; // or `videoUrl` if your backend returns it that way
  title?: string;
  videoUrl: string;
  duration?: number;
  start_time: number;
  display_till_time: number;
  visibility: string;
  hidden_at: null;
  name: string;
  description: string;
  thumbnailUrl: string;
  likes: number;
  gifts: number;
  shares: number;
  views: number;
  amount: number;
  hasCreatorPassOfVideoOwner: boolean;
  access: {
    isPlayable: boolean;
    freeRange: {
      start_time: number;
      display_till_time: number;
    };
    isPurchased: boolean;
    accessType: string;
    price: number;
  };

  genre: string;
  type: string;
  is_monetized: boolean;
  language: string;
  age_restriction: boolean;
  season_number: number;
  is_standalone: boolean;

  comments?: Comment[];

  created_by: {
    _id: string;
    username: string;
    profile_photo: string;
  };

  community: {
    _id: string;
    name: string;
  } | null;

  is_following_creator: boolean;
  
  creatorPassDetails: {
    _id: string;
    creator_profile: {
      creator_pass_price: number;
    };
  } | null;
  
  series: {
    _id: string;
    title: string;
    type: string;
    price: number;
    total_episodes: number;
    episodes: VideoItemType[]; // Episodes are video objects
  } | null;
  episode_number: number | null;
};
