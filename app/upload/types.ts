// Types for the video upload flow
// These interfaces define the data structures used throughout the upload process

import { ImagePickerAsset } from "expo-image-picker";

export interface VideoFormData {
  title: string;
  community: string | null;
  format: 'Netflix' | 'YouTube' | null;
  videoType: 'free' | 'paid' | null;
  amount?: number; // Price for paid videos
  thumbnail: ImagePickerAsset | null;
}

export interface FinalStageData {
  genre: string | null;
  autoplayStartMinutes: number;
  autoplayStartSeconds: number;
  unlockFromMinutes: number;
  unlockFromSeconds: number;
}

export interface UploadFlowState {
  currentStep: 'file-select' | 'format-select' | 'episode-selection' | 'series-selection' | 'series-creation' | 'details-1' | 'details-2' | 'details-3' | 'final' | 'thumbnail-select' | 'progress';
  uploadProgress: number;
  videoDetails: VideoFormData;
  finalStageData: FinalStageData;
  selectedFile: any; // Video file object
  selectedThumbnail: any | null; // Thumbnail image object
  videoFormat: 'episode' | 'single' | null;
  selectedSeries: any | null; // Series object for episodes
  isUploading: boolean;
  errors: Record<string, string>;
  draftId?: string | null; // For editing existing drafts
  isEditingDraft?: boolean; // Flag to indicate if we're editing a draft
}

export interface DropdownOption {
  label: string;
  value: string;
  isSelected?: boolean;
}

// Props interfaces for components
export interface UploadProgressProps {
  progress: number; // 0-100
  onUploadComplete: () => void;
  error?: string | null; // Error message if upload failed
  onRetry?: () => void; // Callback to retry upload
  onCancel?: () => void; // Callback to cancel upload
}

export interface VideoDetailProps {
  step: 1 | 2 | 3;
  formData: VideoFormData;
  onFormChange: (data: VideoFormData) => void;
  onContinue: () => void;
  onBack: () => void;
  selectedSeries?: any | null;
  videoFormat?: 'episode' | 'single' | null;
  isEditingDraft?: boolean;
}

export interface FinalStageProps {
  formData: FinalStageData;
  videoDetails: VideoFormData;
  onFormChange: (data: FinalStageData) => void;
  onUpload: () => void;
  onBack: () => void;
  selectedSeries?: any | null;
  videoFormat?: 'episode' | 'single' | null;
  isEditingDraft?: boolean;
}

export interface DropdownProps {
  value: string | null;
  placeholder: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export interface TimePickerProps {
  minutes: number;
  seconds: number;
  onMinutesChange: (minutes: number) => void;
  onSecondsChange: (seconds: number) => void;
}