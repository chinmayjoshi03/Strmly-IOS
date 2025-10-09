import { DropdownOption } from '../types';
import { YOUTUBE_CATEGORIES, NETFLIX_CATEGORIES } from '@/Constants/contentCategories';

/**
 * Dropdown Options Data
 * Static data for dropdown components - replace with API calls in production
 * 
 * Backend Integration Notes:
 * - Replace these static arrays with API calls
 * - Consider implementing caching for frequently accessed data
 * - Add pagination for large datasets
 * - Implement search/filter functionality
 */

// Community options are now fetched dynamically via useCommunities hook
// This static array is kept as fallback only
// Community options are now fetched dynamically via useCommunities hook
// This static array is kept as fallback only
export const communityOptions: DropdownOption[] = [
  {
    label: 'No Community',
    value: 'none',
  },
];

// Format options for content type
// Backend: GET /api/formats
export const formatOptions: DropdownOption[] = [
  {
    label: 'Netflix',
    value: 'Netflix',
  },
  {
    label: 'YouTube',
    value: 'YouTube',
  },
];

// Video type options for monetization
// Backend: GET /api/video-types
export const videoTypeOptions: DropdownOption[] = [
  {
    label: 'Free',
    value: 'free',
  },
  // {
  //   label: 'Paid',
  //   value: 'paid',
  // },
];

// Genre options for video classification - dynamic based on format selection
// Backend: GET /api/genres
export const getGenreOptions = (format: 'Netflix' | 'YouTube' | null): DropdownOption[] => {
  if (format === 'YouTube') {
    return YOUTUBE_CATEGORIES.map(category => ({
      label: category,
      value: category,
    }));
  } else if (format === 'Netflix') {
    return NETFLIX_CATEGORIES.map(category => ({
      label: category,
      value: category,
    }));
  }
  return [];
};

// Legacy genre options for backward compatibility
export const genreOptions: DropdownOption[] = [
  {
    label: 'Action',
    value: 'Action',
  },
  {
    label: 'Comedy',
    value: 'Comedy',
  },
  {
    label: 'Drama',
    value: 'Drama',
  },
  {
    label: 'Horror',
    value: 'Horror',
  },
  {
    label: 'Sci-Fi',
    value: 'Sci-Fi',
  },
  {
    label: 'Romance',
    value: 'Romance',
  },
  {
    label: 'Documentary',
    value: 'Documentary',
  },
  {
    label: 'Thriller',
    value: 'Thriller',
  },
  {
    label: 'Fantasy',
    value: 'Fantasy',
  },
  {
    label: 'Animation',
    value: 'Animation',
  },
];

/**
 * Helper function to get options by type
 * Useful for dynamic option loading
 * Note: Community options are now fetched dynamically via useCommunities hook
 * Note: Genre options are now dynamic based on format - use getGenreOptions instead
 */
export const getDropdownOptions = (type: 'community' | 'format' | 'genre' | 'videoType', format?: 'Netflix' | 'YouTube' | null): DropdownOption[] => {
  switch (type) {
    case 'community':
      return communityOptions; // Fallback only - use useCommunities hook instead
      return communityOptions; // Fallback only - use useCommunities hook instead
    case 'format':
      return formatOptions;
    case 'genre':
      return format ? getGenreOptions(format) : genreOptions; // Use dynamic options if format provided
    case 'videoType':
      return videoTypeOptions;
    default:
      return [];
  }
};

/**
 * Helper function to find option label by value
 * Useful for displaying selected values
 */
export const getOptionLabel = (type: 'community' | 'format' | 'genre' | 'videoType', value: string): string => {
  const options = getDropdownOptions(type);
  const option = options.find(opt => opt.value === value);
  return option?.label || value;
};