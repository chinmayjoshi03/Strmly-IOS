// Core types and interfaces for series management

export interface Series {
  id: string;
  title: string;
  description?: string;
  totalEpisodes: number;
  accessType: 'free' | 'paid';
  price?: number; // In currency units
  launchDate: string; // ISO date string
  totalViews: number;
  totalEarnings: number; // In currency units
  episodes: Episode[];
  createdAt: string;
  updatedAt: string;
  posterUrl?: string; // URL for series poster/thumbnail
}

export interface Episode {
  id: string;
  seriesId: string;
  title: string;
  description?: string;
  thumbnail: string; // URL or local path
  videoUrl: string;
  uploadDate: string; // ISO date string
  views: number;
  conversions: number;
  duration: number; // In seconds
  status: 'processing' | 'ready' | 'error';
}

export interface SeriesFormData {
  title: string;
  type: 'free' | 'paid' | null;
  price?: number;
}

export interface SeriesManagementState {
  series: Series[];
  selectedSeriesId: string | null;
  isCreating: boolean;
  formData: SeriesFormData;
  loading: boolean;
  errors: Record<string, string>;
}

// Component prop types

export interface SeriesListItemProps {
  series: Series;
  isSelected: boolean;
  onSelect: (seriesId: string) => void;
}

export interface SeriesCreationFormProps {
  formData: SeriesFormData;
  onFormChange: (data: SeriesFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  errors: Record<string, string>;
}

export interface EpisodeListItemProps {
  episode: Episode;
  onMenuPress: (episodeId: string) => void;
}

export interface SeriesSelectionScreenProps {
  series: Series[];
  selectedSeriesId: string | null;
  onSeriesSelect: (seriesId: string) => void;
  onAddNewSeries: () => void;
  onSelectSeries: () => void;
  loading: boolean;
}



export interface SeriesAnalyticsScreenProps {
  series: Series;
  onEditAccess: () => void;
  onAddNewEpisode: () => void;
  onEpisodeMenuPress: (episodeId: string) => void;
  onBack: () => void;
}

// API response types

export interface CreateSeriesRequest {
  title: string;
  type: 'free' | 'paid';
  price?: number;
}

export interface CreateSeriesResponse {
  success: boolean;
  series?: Series;
  error?: string;
}

export interface GetSeriesListResponse {
  success: boolean;
  series?: Series[];
  error?: string;
}

export interface GetSeriesDetailsResponse {
  success: boolean;
  series?: Series;
  error?: string;
}

export interface UpdateSeriesRequest {
  id: string;
  title?: string;
  type?: 'free' | 'paid';
  price?: number;
}

export interface UpdateSeriesResponse {
  success: boolean;
  series?: Series;
  error?: string;
}

// Navigation types

export type SeriesManagementScreen = 
  | 'selection'
  | 'creation'
  | 'analytics';

export interface SeriesManagementNavigationState {
  currentScreen: SeriesManagementScreen;
  selectedSeriesId: string | null;
  previousScreen?: SeriesManagementScreen;
}

// Utility types

export type SeriesAccessType = 'free' | 'paid';
export type EpisodeStatus = 'processing' | 'ready' | 'error';

export interface SeriesMetrics {
  totalViews: number;
  totalEarnings: number;
  averageViewsPerEpisode: number;
  conversionRate: number;
}

export interface EpisodeMetrics {
  views: number;
  conversions: number;
  conversionRate: number;
  earnings: number;
}