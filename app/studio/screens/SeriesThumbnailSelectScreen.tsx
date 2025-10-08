import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface SeriesThumbnailSelectScreenProps {
  onThumbnailSelected: (thumbnail: any | null) => void;
  onBack: () => void;
  onContinue: () => void;
  seriesTitle?: string;
  isCreating?: boolean;
}

const SeriesThumbnailSelectScreen: React.FC<SeriesThumbnailSelectScreenProps> = ({
  onThumbnailSelected,
  onBack,
  onContinue,
  seriesTitle,
  isCreating = false,
}) => {
  const [selectedThumbnail, setSelectedThumbnail] = useState<any>(null);

  // Handle thumbnail selection from gallery
  const handleSelectFromGallery = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to select a thumbnail."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Recommended aspect ratio for series thumbnails
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const thumbnail = result.assets[0];
        console.log("✅ SeriesThumbnailSelectScreen: Selected thumbnail:", {
          uri: thumbnail.uri,
          width: thumbnail.width,
          height: thumbnail.height,
        });
        
        setSelectedThumbnail(thumbnail);
        onThumbnailSelected(thumbnail);
      }
    } catch (error) {
      console.error("Thumbnail selection error:", error);
      Alert.alert("Error", "Failed to select thumbnail. Please try again.");
    }
  };

  // Handle thumbnail selection from camera
  const handleTakePhoto = async () => {
    try {
      // Request permission to access camera
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your camera to take a thumbnail photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9], // Recommended aspect ratio for series thumbnails
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const thumbnail = result.assets[0];
        console.log("✅ SeriesThumbnailSelectScreen: Captured thumbnail:", {
          uri: thumbnail.uri,
          width: thumbnail.width,
          height: thumbnail.height,
        });
        
        setSelectedThumbnail(thumbnail);
        onThumbnailSelected(thumbnail);
      }
    } catch (error) {
      console.error("Camera capture error:", error);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    }
  };

  // Handle skip thumbnail selection
  const handleSkipThumbnail = () => {
    setSelectedThumbnail(null);
    onThumbnailSelected(null);
    onContinue();
  };

  // Handle continue with selected thumbnail
  const handleContinueWithThumbnail = () => {
    onContinue();
  };

  // Handle remove selected thumbnail
  const handleRemoveThumbnail = () => {
    setSelectedThumbnail(null);
    onThumbnailSelected(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Series Thumbnail</Text>
        <TouchableOpacity onPress={handleSkipThumbnail}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContainer}>
          {/* Info Section */}
          <View style={styles.infoSection}>
       
            <Text style={styles.infoDescription}>
              Choose an attractive poster image for your series. This will be displayed when users browse your content.
            </Text>
          </View>

          {/* Selected Series Info */}
          {seriesTitle && (
            <View style={styles.seriesInfoCard}>
              <Ionicons name="film" size={20} color="#9CA3AF" />
              <Text style={styles.seriesInfoText} numberOfLines={1}>
                {seriesTitle}
              </Text>
            </View>
          )}

          {/* Thumbnail Preview */}
          {selectedThumbnail ? (
            <View style={styles.thumbnailPreviewContainer}>
              <View style={styles.thumbnailPreview}>
                <Image
                  source={{ uri: selectedThumbnail.uri }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeThumbnailButton}
                  onPress={handleRemoveThumbnail}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.thumbnailSelectedText}>
                Series poster selected
              </Text>
            </View>
          ) : (
            /* Thumbnail Selection Options */
            <View style={styles.selectionContainer}>
              <TouchableOpacity
                style={styles.selectionOption}
                onPress={handleSelectFromGallery}
              >
                <View style={styles.selectionIconContainer}>
                  <Ionicons name="images" size={32} color="#E5E7EB" />
                </View>
                <Text style={styles.selectionTitle}>Choose from Gallery</Text>
                <Text style={styles.selectionDescription}>
                  Select an existing image from your photo library
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectionOption}
                onPress={handleTakePhoto}
              >
                <View style={styles.selectionIconContainer}>
                  <Ionicons name="camera" size={32} color="#E5E7EB" />
                </View>
                <Text style={styles.selectionTitle}>Take Photo</Text>
                <Text style={styles.selectionDescription}>
                  Capture a new photo using your camera
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tips Section */}
         
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          onPress={selectedThumbnail ? handleContinueWithThumbnail : handleSkipThumbnail}
          style={[styles.continueButton, isCreating && styles.continueButtonDisabled]}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.continueButtonText}>
              {selectedThumbnail ? "Create Series with Poster" : "Create Series without Poster"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "500",
  },
  skipText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "400",
  },
  content: {
    flex: 1,
  },
  innerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  infoDescription: {
    color: "#9CA3AF",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  seriesInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  seriesInfoText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  thumbnailPreviewContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  thumbnailPreview: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  thumbnailImage: {
    width: 280,
    height: 157, // 16:9 aspect ratio
    backgroundColor: "#1C1C1E",
  },
  removeThumbnailButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
  },
  thumbnailSelectedText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "500",
  },
  selectionContainer: {
    marginBottom: 24,
  },
  selectionOption: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  selectionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  selectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  selectionDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
    marginBottom: 25,
  },
  continueButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
  },
  continueButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "500",
  },
  continueButtonDisabled: {
    backgroundColor: "#6B7280",
  },
});

export default SeriesThumbnailSelectScreen;