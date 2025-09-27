import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { createSeries } from '../../../api/series/seriesActions';
import Dropdown from '../../upload/components/Dropdown';
import { communityOptions, formatOptions } from '../../upload/data/dropdownOptions';

interface SeriesCreationScreenProps {
  onBack: () => void;
  onSeriesCreated: (series: any) => void;
}

/**
 * Series Creation Screen
 * Two-step process: Series creation followed by video details
 */
const SeriesCreationScreen: React.FC<SeriesCreationScreenProps> = ({
  onBack,
  onSeriesCreated
}) => {
  // Series creation form state
  const [seriesForm, setSeriesForm] = useState({
    title: '',
    type: null as 'free' | 'paid' | null,
    price: undefined as number | undefined
  });

  // Video detail form state
  const [videoDetails, setVideoDetails] = useState({
    title: '',
    community: null as string | null,
    format: null as string | null
  });

  const [currentStep, setCurrentStep] = useState<'creation' | 'details'>('creation');
  const [createdSeries, setCreatedSeries] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

  const handleClose = () => {
    onBack();
  };

  const validateSeriesForm = () => {
    const newErrors: Record<string, string> = {};

    if (!seriesForm.title.trim()) {
      newErrors.title = 'Series title is required';
    }

    if (!seriesForm.type) {
      newErrors.type = 'Series type is required';
    }

    if (seriesForm.type === 'paid' && (!seriesForm.price || seriesForm.price <= 0)) {
      newErrors.price = 'Price must be greater than 0 for paid series';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    console.log('Creating series...');
    console.log('Series form:', seriesForm);

    if (!validateSeriesForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);

    try {
      const { createSeries } = await import('../../../api/series/seriesActions');
      
      const seriesData = {
        title: seriesForm.title.trim(),
        description: seriesForm.title.trim(), // Use title as description for now
        genre: 'Action', // Default genre, you may want to add genre selection
        language: 'english',
        type: seriesForm.type === 'paid' ? 'Paid' : 'Free' as 'Free' | 'Paid',
        price: seriesForm.type === 'paid' ? seriesForm.price : undefined,
        promisedEpisodesCount: 2, // Minimum required episodes
      };

      const response = await createSeries(seriesData);
      
      // Transform API response to match expected format
      const newSeries = {
        id: response.data._id,
        title: response.data.title,
        description: response.data.description,
        totalEpisodes: response.data.total_episodes,
        accessType: response.data.type.toLowerCase() as 'paid' | 'free',
        price: response.data.price,
        launchDate: response.data.release_date,
        totalViews: 0,
        totalEarnings: 0,
        episodes: response.data.episodes,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };

      console.log('Series created successfully:', newSeries);
      setCreatedSeries(newSeries);
      setLoading(false);

      // Move to video details step
      console.log('Moving to details step');
      setCurrentStep('details');

    } catch (error) {
      console.log('Error creating series:', error);
      setLoading(false);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to create series' });
    }
  };

  const handleContinue = () => {
    console.log('Continuing with series:', createdSeries);
    // Navigate back to studio with the created series
    onSeriesCreated(createdSeries);
  };

  const handleBackFromDetails = () => {
    setCurrentStep('creation');
  };

  const handleTypeSelect = (type: 'free' | 'paid') => {
    setSeriesForm(prev => ({
      ...prev,
      type,
      price: type === 'free' ? undefined : prev.price
    }));
    setShowTypeDropdown(false);
  };

  const getTypeDisplayText = () => {
    if (!seriesForm.type) return 'Select';
    return seriesForm.type === 'free' ? 'Free' : 'Paid';
  };

  // Handle video detail form changes
  const handleVideoDetailChange = (field: string, value: string) => {
    setVideoDetails(prev => ({ ...prev, [field]: value }));
  };

  // Check if video details form is valid
  const isVideoDetailsValid = () => {
    return videoDetails.title.trim() !== '' &&
      videoDetails.community !== null &&
      videoDetails.format !== null;
  };

  // Render video details step
  const renderVideoDetailsStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 mt-12">
          <TouchableOpacity onPress={handleBackFromDetails}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-medium">Video detail</Text>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-4 pt-6">
          {/* Title Field */}
          <View className="mb-8">
            <Text className="text-white text-lg font-medium mb-3">Title</Text>
            <TextInput
              value={videoDetails.title}
              onChangeText={(title) => handleVideoDetailChange('title', title)}
              placeholder="Bank name"
              placeholderTextColor="#9CA3AF"
              className="bg-black border border-gray-600 text-white px-4 py-4 rounded-xl text-base"
            />
          </View>

          {/* Community Dropdown */}
          <View className="mb-8">
            <Text className="text-white text-lg font-medium mb-3">Community</Text>
            <Dropdown
              value={videoDetails.community}
              placeholder="Select"
              options={communityOptions}
              onSelect={(community) => {
                handleVideoDetailChange('community', community);
                setCommunityDropdownOpen(false);
              }}
              isOpen={communityDropdownOpen}
              onToggle={() => setCommunityDropdownOpen(!communityDropdownOpen)}
            />
          </View>

          {/* Format Dropdown */}
          <View className="mb-8">
            <Text className="text-white text-lg font-medium mb-3">Format That Fits Your Content</Text>
            <Dropdown
              value={videoDetails.format}
              placeholder="Select"
              options={formatOptions}
              onSelect={(format) => {
                handleVideoDetailChange('format', format);
                setFormatDropdownOpen(false);
              }}
              isOpen={formatDropdownOpen}
              onToggle={() => setFormatDropdownOpen(!formatDropdownOpen)}
            />
          </View>

          {/* Add some bottom padding for better scrolling */}
          <View className="h-20" />
        </ScrollView>

        {/* Continue Button */}
        <View className="px-4 pb-8 pt-4">
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isVideoDetailsValid()}
            className="bg-gray-200 rounded-full py-4 items-center"
            style={{
              backgroundColor: !isVideoDetailsValid() ? '#6B7280' : '#E5E7EB'
            }}
          >
            <Text className="text-black text-lg font-medium">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  // Render series creation step
  const renderSeriesCreationStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 mt-12">
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-4 pt-16" showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View className="items-center mb-12">
            <Text className="text-white text-xl font-medium mb-8">Give your series name</Text>

            {/* Series Name Input */}
            <View className="w-full max-w-xs">
              <TextInput
                value={seriesForm.title}
                onChangeText={(title) => setSeriesForm(prev => ({ ...prev, title }))}
                placeholder="Series 1"
                placeholderTextColor="#9CA3AF"
                className="text-white text-2xl font-medium text-center border-b border-gray-600 pb-2 mb-2"
                maxLength={100}
                autoFocus
              />
              {errors.title && (
                <Text className="text-red-400 text-sm text-center mt-2">{errors.title}</Text>
              )}
            </View>
          </View>

          {/* Type Selection */}
          <View className="mb-8">
            <Text className="text-white text-base font-medium mb-4">Type</Text>

            {/* Type Dropdown */}
            <TouchableOpacity
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-4 flex-row items-center justify-between"
            >
              <Text className={`text-base ${seriesForm.type ? 'text-white' : 'text-gray-400'}`}>
                {getTypeDisplayText()}
              </Text>
              <Ionicons
                name={showTypeDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {/* Dropdown Options */}
            {showTypeDropdown && (
              <View className="bg-gray-800 border border-gray-600 rounded-xl mt-2 overflow-hidden">
                <TouchableOpacity
                  onPress={() => handleTypeSelect('free')}
                  className="px-4 py-4 border-b border-gray-600"
                >
                  <Text className="text-white text-base">Free</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleTypeSelect('paid')}
                  className="px-4 py-4"
                >
                  <Text className="text-white text-base">Paid</Text>
                </TouchableOpacity>
              </View>
            )}

            {errors.type && (
              <Text className="text-red-400 text-sm mt-2">{errors.type}</Text>
            )}
          </View>

          {/* Price Input - Only show for paid series */}
          {seriesForm.type === 'paid' && (
            <View className="mb-8">
              <Text className="text-white text-base font-medium mb-4">Price</Text>
              <TextInput
                value={seriesForm.price?.toString() || ''}
                onChangeText={(price) => setSeriesForm(prev => ({
                  ...prev,
                  price: price ? parseInt(price) : undefined
                }))}
                placeholder="₹30"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-800 border border-gray-600 text-white px-4 py-4 rounded-xl text-base"
                keyboardType="numeric"
              />
              {errors.price && (
                <Text className="text-red-400 text-sm mt-2">{errors.price}</Text>
              )}
            </View>
          )}

          {/* General Error */}
          {errors.general && (
            <View className="mb-6">
              <Text className="text-red-400 text-sm text-center">{errors.general}</Text>
            </View>
          )}
        </ScrollView>

        {/* Create Button */}
        <View className="px-4 pb-8 pt-4">
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading}
            className="bg-gray-200 rounded-full py-4 items-center"
            style={{
              backgroundColor: loading ? '#6B7280' : '#E5E7EB'
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="black" />
            ) : (
              <Text className="text-black text-lg font-medium">Create</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  // Main render - show appropriate step
  console.log('Rendering step:', currentStep);
  return currentStep === 'creation' ? renderSeriesCreationStep() : renderVideoDetailsStep();
};

export default SeriesCreationScreen;