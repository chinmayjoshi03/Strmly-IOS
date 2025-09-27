import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressIndicator from '../components/ProgressIndicator';
import { UploadProgressProps } from '../types';

/**
 * Upload Progress Screen
 * Shows animated progress indicator while video is uploading
 * 
 * Backend Integration Notes:
 * - Replace mock progress with real upload progress from your API
 * - Consider using multipart upload for large video files
 * - Implement proper error handling for upload failures
 * - Add retry mechanism for failed uploads
 * 
 * API Endpoints needed:
 * - POST /api/videos/upload (multipart form data)
 * - GET /api/videos/upload-progress/:uploadId (for progress tracking)
 */
const UploadProgressScreen: React.FC<UploadProgressProps> = ({
  progress,
  onUploadComplete,
  error,
  onRetry,
  onCancel
}) => {
  // Auto-navigate when upload is complete
  useEffect(() => {
    if (progress >= 100) {
      // Small delay to show 100% completion before navigating
      const timer = setTimeout(() => {
        onUploadComplete();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [progress, onUploadComplete]);

  // Handle retry action
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    Alert.alert(
      'Cancel Upload',
      'Are you sure you want to cancel the upload?',
      [
        { text: 'Continue Upload', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: () => onCancel && onCancel()
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-black">
      
      {/* Header - Show cancel button during upload */}
      {!error && (
        <View className="flex-row items-center justify-between px-4 py-3 mt-3">
          <View className="w-6" />
          <Text className="text-white text-xl font-medium">Uploading</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
      
      <View className="flex-1 items-center justify-center px-8">
        {error ? (
          /* Error State */
          <>
            {/* Error Icon */}
            <View className="w-20 h-20 bg-red-900/20 rounded-full items-center justify-center mb-6">
              <Ionicons name="close-circle" size={48} color="#EF4444" />
            </View>
            
            {/* Error Title */}
            <Text className="text-white text-xl font-medium text-center mb-4">
              Upload Failed
            </Text>
            
            {/* Error Message */}
            <Text className="text-gray-400 text-base text-center leading-6 mb-8">
              {error}
            </Text>
            
            {/* Action Buttons */}
            <View className="w-full max-w-sm gap-5 space-y-3">
              <TouchableOpacity
                onPress={handleRetry}
                className="bg-blue-600 rounded-full py-4 items-center"
              >
                <Text className="text-white text-lg font-medium">Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => onCancel && onCancel()}
                className="bg-gray-700 rounded-full py-4 items-center"
              >
                <Text className="text-gray-300 text-lg font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Upload Progress State */
          <>
            {/* Progress Indicator */}
            <ProgressIndicator progress={progress} />
            
            {/* Upload Status Text */}
            <Text className="text-white text-xl font-medium text-center mt-8 mb-4">
              Your video is uploading
            </Text>
            
            {/* Instruction Text */}
            <Text className="text-gray-400 text-base text-center leading-6">
              Keep the app open and screen on
            </Text>
            
            {/* Progress Percentage (for debugging - remove in production) */}
            {__DEV__ && (
              <Text className="text-gray-500 text-sm mt-4">
                {Math.round(progress)}%
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default UploadProgressScreen;