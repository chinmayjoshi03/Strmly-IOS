import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/useAuthStore";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import ThemedView from "@/components/ThemedView";
import { communityActions } from "@/api/community/communityActions";
import * as ImagePicker from "expo-image-picker";

interface CommunityDetails {
  communityId: string;
  name: string;
  bio: string;
  profilePhoto: string;
  community_fee_type?: "free" | "paid";
  community_fee_amount?: number;
  community_fee_description?: string;
  creator_limit?: number;
}

export default function EditCommunity() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [community, setCommunity] = useState<CommunityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [accessType, setAccessType] = useState<"free" | "paid">("free");
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);
  const [creatorStrength, setCreatorStrength] = useState("");
  const [communityFee, setCommunityFee] = useState("");

  const communityId = params.communityId as string;

  useEffect(() => {
    if (communityId && token) {
      fetchCommunityDetails();
    }
  }, [communityId, token]);

  const fetchCommunityDetails = async () => {
    if (!communityId) {
      Alert.alert("Error", "Community ID is required");
      router.back();
      return;
    }

    if (!token) {
      Alert.alert("Error", "Authentication required");
      router.back();
      return;
    }

    setLoading(true);
    try {
      const result = await communityActions.getCommunityDetails(
        token,
        communityId
      );
      setCommunity(result);
      setName(result.name);
      setBio(result.bio || "");
      setImageUri(result.profilePhoto);
      // Set access type based on community data if available
      setAccessType(result.community_fee_type || "free");
      if (result.community_fee_type === "paid") {
        setCreatorStrength(result.creator_limit?.toString() || "");
        setCommunityFee(result.community_fee_amount?.toString() || "");
      }
      console.log("✅ Community details fetched for editing:", result);
    } catch (error) {
      console.error("❌ Error fetching community details:", error);
      Alert.alert("Error", "Failed to load community details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions first
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        console.log("📷 Image selected:", result.assets[0].uri);
      }
    } catch (error) {
      console.error("❌ Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Community name is required");
      return;
    }

    if (!communityId) {
      Alert.alert("Error", "Community ID is required");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    setSaving(true);
    try {
      // Update name if changed
      if (name !== community?.name) {
        await communityActions.renameCommunity(token, communityId, name);
      }

      // Update bio if changed
      if (bio !== community?.bio) {
        await communityActions.updateCommunityBio(token, communityId, bio);
      }

      // Update profile photo if changed
      if (imageUri && imageUri !== community?.profilePhoto) {
        let imageFile = null;
        if (imageUri.startsWith("file://")) {
          const fileName = imageUri.split("/").pop()!;
          const fileType = fileName.split(".").pop();
          imageFile = {
            uri: imageUri,
            name: fileName,
            type: `image/${fileType}`,
          } as any;
        }

        if (imageFile) {
          await communityActions.updateCommunityPhoto(
            token,
            communityId,
            imageFile
          );
        }
      }

      // Update community settings if changed
      const settingsToUpdate: any = {};
      let hasSettingsChanges = false;

      // Check creator strength
      if (
        creatorStrength &&
        creatorStrength !== (community?.creator_limit?.toString() || "")
      ) {
        const limit = parseInt(creatorStrength);
        if (!isNaN(limit)) {
          settingsToUpdate.creator_limit = limit;
          hasSettingsChanges = true;
        }
      }

      // Check access type and fee
      if (accessType !== (community?.community_fee_type || "free")) {
        settingsToUpdate.community_fee_type = accessType;
        hasSettingsChanges = true;

        if (accessType === "paid" && communityFee) {
          const amount = parseInt(communityFee);
          if (!isNaN(amount)) {
            settingsToUpdate.community_fee_amount = amount;
          }
        }
      } else if (
        accessType === "paid" &&
        communityFee &&
        communityFee !== (community?.community_fee_amount?.toString() || "")
      ) {
        const amount = parseInt(communityFee);
        if (!isNaN(amount)) {
          settingsToUpdate.community_fee_amount = amount;
          hasSettingsChanges = true;
        }
      }

      if (hasSettingsChanges) {
        console.log("📝 Updating community settings:", settingsToUpdate);
        await communityActions.updateCommunitySettings(
          token,
          communityId,
          settingsToUpdate
        );
      }

      Alert.alert("Success", "Community updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("❌ Error updating community:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update community"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F1C40F" />
        <Text className="text-white mt-2" style={{ fontFamily: "Poppins" }}>
          Loading community...
        </Text>
      </ThemedView>
    );
  }

  return (
    <ScrollView className="flex-1 h-full bg-black">
      <View className="flex-1">
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ paddingTop: Platform.OS == "ios" ? insets.top - 54 : insets.top + 10}}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text
            className="text-white text-lg font-semibold"
            style={{ fontFamily: "Poppins" }}
          >
            Edit Community
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                className="text-white font-semibold"
                style={{ fontFamily: "Poppins" }}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Photo */}
        <View className="items-center py-8">
          <TouchableOpacity onPress={pickImage} className="items-center">
            <View className="w-32 h-32 rounded-full bg-gray-600 items-center justify-center mb-4 overflow-hidden">
              <Image
                source={{ uri: getProfilePhotoUrl(imageUri, "community") }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <Text
              className="text-blue-400 text-center"
              style={{ fontFamily: "Poppins" }}
            >
              Edit community picture
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-4">
          {/* Community Name */}
          <View className="mb-8">
            <Text
              className="text-white text-base mb-2"
              style={{ fontFamily: "Poppins" }}
            >
              Community name
            </Text>
            <TextInput
              className="text-gray-400 text-base"
              placeholder="Add name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              style={{ fontFamily: "Poppins" }}
            />
            <View className="h-px bg-gray-600 mt-2" />
          </View>

          {/* Bio */}
          <View className="mb-8">
            <Text
              className="text-white text-base mb-2"
              style={{ fontFamily: "Poppins" }}
            >
              Bio
            </Text>
            <TextInput
              className="text-gray-400 text-base"
              placeholder="Add bio"
              placeholderTextColor="#666"
              value={bio}
              onChangeText={setBio}
              style={{ fontFamily: "Poppins" }}
            />
            <View className="h-px bg-gray-600 mt-2" />
          </View>

          {/* Access */}
          <View className="mb-8 relative">
            <Text
              className="text-white text-base mb-2"
              style={{ fontFamily: "Poppins" }}
            >
              Access
            </Text>
            <TouchableOpacity
              onPress={() => setShowAccessDropdown(!showAccessDropdown)}
              className="flex-row items-center justify-between"
            >
              <Text
                className="text-gray-400 text-base"
                style={{ fontFamily: "Poppins" }}
              >
                {accessType === "free" ? "Free" : "Paid"}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            <View className="h-px bg-gray-600 mt-2" />

            {/* Access Dropdown */}
            {showAccessDropdown && (
              <View className="absolute top-16 left-0 right-0 bg-gray-800 rounded-lg border border-gray-600 z-10">
                <TouchableOpacity
                  onPress={() => {
                    setAccessType("free");
                    setShowAccessDropdown(false);
                  }}
                  className="px-4 py-3 border-b border-gray-700"
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: "Poppins" }}
                  >
                    Free
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setAccessType("paid");
                    setShowAccessDropdown(false);
                  }}
                  className="px-4 py-3"
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: "Poppins" }}
                  >
                    Paid
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Creator Strength and Community Fee */}
          {accessType === "paid" && (
            <View className="flex-row justify-between mb-8">
              <View className="flex-1 mr-4">
                <Text
                  className="text-white text-base"
                  style={{ fontFamily: "Poppins" }}
                >
                  Creator
                </Text>
                <Text
                  className="text-white text-base mb-2"
                  style={{ fontFamily: "Poppins" }}
                >
                  strength
                </Text>
                <TextInput
                  className="text-gray-400 text-2xl"
                  placeholder="500"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={creatorStrength}
                  onChangeText={setCreatorStrength}
                  style={{ fontFamily: "Poppins" }}
                />
                <View className="h-px bg-gray-600 mt-2" />
              </View>
              <View className="flex-1 ml-4">
                <Text
                  className="text-white text-base"
                  style={{ fontFamily: "Poppins" }}
                >
                  Community
                </Text>
                <Text
                  className="text-white text-base mb-2"
                  style={{ fontFamily: "Poppins" }}
                >
                  fee
                </Text>
                <TextInput
                  className="text-gray-400 text-2xl"
                  placeholder="₹29/m"
                  placeholderTextColor="#666"
                  value={communityFee}
                  onChangeText={setCommunityFee}
                  style={{ fontFamily: "Poppins" }}
                />
                <View className="h-px bg-gray-600 mt-2" />
              </View>
            </View>
          )}
        </View>

        {/* Description */}
        <View className="mb-8">
          <Text
            className="text-gray-400 text-sm text-center leading-5"
            style={{ fontFamily: "Poppins" }}
          >
            As the community owner, you can set a limit on how many creators can
            join, while users can follow the community without any limit.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
