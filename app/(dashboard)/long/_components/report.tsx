import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { CONFIG } from "@/Constants/config";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";

type ReportCategory = {
  id: string;
  label: string;
  value: string;
};

const REPORT_CATEGORIES: ReportCategory[] = [
  { id: "1", label: "Nudity / Sexual Content", value: "nudity_sexual" },
  { id: "2", label: "Copyright / Rights Violation", value: "copyright" },
  { id: "3", label: "Harmful / Violent Content", value: "harmful_violent" },
  { id: "4", label: "Hate Speech / Harassment", value: "hate_speech" },
  { id: "5", label: "Spam / Misleading", value: "spam" },
  { id: "6", label: "Other", value: "other" },
];

const Report = () => {
  const params = useLocalSearchParams<{
    videoId: string;
    videoName: string;
  }>();
  const { videoId, videoName } = params;

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token } = useAuthStore();
  const BACKEND_API_URL = CONFIG.API_BASE_URL;

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProofImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removeImage = () => {
    setProofImage(null);
  };

const handleSubmitReport = async () => {
  if (!selectedCategory) {
    Alert.alert("Error", "Please select a report category");
    return;
  }

  if (!description.trim()) {
    Alert.alert("Error", "Please provide a description for your report");
    return;
  }

  if (description.trim().length < 10) {
    Alert.alert("Error", "Description must be at least 10 characters long");
    return;
  }

  setIsSubmitting(true);

  try {
    const formData = new FormData();
    
    // CRITICAL: Append text fields as strings explicitly
    formData.append("contentId", String(videoId));
    formData.append("contentype", "video");
    formData.append("reason", String(selectedCategory));
    formData.append("description", String(description.trim()));

    // Add proof image if available
    if (proofImage) {
      const filename = proofImage.split("/").pop() || "proof.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // React Native FormData requires this specific format
      formData.append("evidenceImages", {
        uri: proofImage,
        name: filename,
        type: type,
      } as any);
    }

    console.log("Submitting report for video:", videoId);
    console.log("Report data:", {
      contentId: videoId,
      contentype: "video",
      reason: selectedCategory,
      hasImage: !!proofImage
    });

    const response = await fetch(`${BACKEND_API_URL}/caution/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type - FormData will set it automatically with boundary
        // 'Accept': 'application/json', // Optional but good practice
      },
      body: formData,
    });

    console.log("Response status:", response.status);
    
    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log("Non-JSON response:", text);
      throw new Error("Server returned invalid response format");
    }
    
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || data.error || "Failed to submit report");
    }

    console.log("Report submitted successfully:", data);

    Alert.alert(
      "Report Submitted",
      "Thank you for your report. We will review this content and take appropriate action if necessary.",
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]
    );
  } catch (error: any) {
    console.error("Report submission error:", error);
    Alert.alert(
      "Submission Failed",
      error.message || "Unable to submit report. Please try again later."
    );
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000", paddingTop: 5 }} edges={["bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-1 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold flex-1">
          Report Video
        </Text>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Video Info */}
        <View className="py-4 border-b border-gray-800">
          <Text className="text-gray-400 text-sm mb-1">Reporting</Text>
          <Text className="text-white text-base" numberOfLines={2}>
            {videoName || "Video"}
          </Text>
        </View>

        {/* Category Selection */}
        <View className="py-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Select Category
          </Text>
          {REPORT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.value)}
              className={`flex-row items-center p-4 mb-3 rounded-lg border ${
                selectedCategory === category.value
                  ? "bg-gray-800 border-white"
                  : "bg-black border-gray-700"
              }`}
              activeOpacity={0.7}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  selectedCategory === category.value
                    ? "border-white bg-white"
                    : "border-gray-500"
                }`}
              >
                {selectedCategory === category.value && (
                  <View className="w-2.5 h-2.5 rounded-full bg-black" />
                )}
              </View>
              <Text className="text-white text-base flex-1">
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View className="py-6 border-t border-gray-800">
          <Text className="text-white text-lg font-semibold mb-2">
            Description
          </Text>
          <Text className="text-gray-400 text-sm mb-4">
            Please provide details about why you're reporting this content
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter your report description..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
            className="bg-gray-900 text-white p-4 rounded-lg border border-gray-700"
            style={{ minHeight: 120 }}
          />
          <Text className="text-gray-500 text-xs mt-2 text-right">
            {description.length}/500
          </Text>
        </View>

        {/* Proof Image */}
        <View className="py-6 border-t border-gray-800">
          <Text className="text-white text-lg font-semibold mb-2">
            Proof (Optional)
          </Text>
          <Text className="text-gray-400 text-sm mb-4">
            Attach a screenshot or image as evidence
          </Text>

          {proofImage ? (
            <View className="relative">
              <Image
                source={{ uri: proofImage }}
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={removeImage}
                className="absolute top-2 right-2 bg-red-600 rounded-full p-2"
                activeOpacity={0.7}
              >
                <FontAwesome name="times" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 items-center justify-center"
              activeOpacity={0.7}
            >
              <FontAwesome name="camera" size={32} color="#666" />
              <Text className="text-gray-400 text-sm mt-3">
                Tap to attach image
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <View className="py-6 pb-8">
          <TouchableOpacity
            onPress={handleSubmitReport}
            disabled={isSubmitting || !selectedCategory || !description.trim()}
            className={`rounded-lg py-4 items-center justify-center ${
              isSubmitting || !selectedCategory || !description.trim()
                ? "bg-gray-800"
                : "bg-red-600"
            }`}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                Submit Report
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Report;