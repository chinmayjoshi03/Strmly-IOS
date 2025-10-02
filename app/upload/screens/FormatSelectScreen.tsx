import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import if you have this package

interface FormatSelectScreenProps {
  onFormatSelected: (format: 'episode' | 'single') => void;
  onBack: () => void;
}

/**
 * Video Format Selection Screen
 * Allows users to choose between Episode and Single video formats
 * 
 * Backend Integration Notes:
 * - Format selection affects how video is processed and displayed
 * - Episode format may require series association
 * - Single format is for standalone content
 * - This choice affects the subsequent form fields and validation
 */
const FormatSelectScreen: React.FC<FormatSelectScreenProps> = ({
  onFormatSelected,
  onBack
}) => {
  // Get safe area insets if available (requires react-native-safe-area-context)
  // const insets = useSafeAreaInsets(); // Uncomment if you have the package
  
  // Handle format selection and navigate directly
  const handleFormatSelect = (format: 'episode' | 'single') => {
    onFormatSelected(format);
  };

  // Calculate header margin based on platform
  const getHeaderMarginTop = () => {
    if (Platform.OS === 'ios') {
      // For iOS, use a smaller margin to account for the status bar
      return 8; // Reduced from 48 to bring header closer to status bar
    }
    return 48; // Keep original Android margin
  };

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={[styles.header, { marginTop: getHeaderMarginTop() }]}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>
          Select Video Format
        </Text>

        {/* Format Options */}
        <View style={styles.optionsContainer}>
          {/* Episode Option */}
          <TouchableOpacity
            onPress={() => handleFormatSelect('episode')}
            style={styles.optionButton}
          >
                      <View style={[styles.gradientCard, styles.optionCard]}>
              <View style={styles.iconContainer}>
                <Image
                  source={require('../../../assets/episode.png')}
                  style={styles.formatIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.optionText}>Episode</Text>
            </View>
          </TouchableOpacity>

          {/* Single Option */}
          <TouchableOpacity
            onPress={() => handleFormatSelect('single')}
            style={styles.optionButton}
          >
                        <View style={[styles.gradientCard, styles.optionCard]}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require('../../../assets/single.png')}
                    style={styles.formatIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.optionText}>Single</Text>
              </View>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Select "Episode" for series or "Single" for one-time content.
        </Text>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    // Add platform-specific padding top if needed
    paddingTop: Platform.OS === 'ios' ? 10 : 0, // iOS status bar height
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // marginTop is now handled dynamically in the component
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 48,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
   optionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  optionCard: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#555555',
  },
  iconContainer: {
    width: 64,
    height: 64,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatIcon: {
    width: 48,
    height: 48,
  },
  optionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 32,
  },
});

export default FormatSelectScreen;