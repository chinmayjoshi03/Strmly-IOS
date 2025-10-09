import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { EditProfile } from "@/styles/EditProfile";
import { useFonts } from "expo-font";
import React, { useState, useEffect } from "react";

import {
  Image,
  Modal,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
  Text,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";

import { useAuthStore } from "@/store/useAuthStore";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { getUserProfile, updateUserProfile } from "@/api/user/userActions";
import {
  YOUTUBE_CATEGORIES,
  NETFLIX_CATEGORIES,
  ContentType,
} from "@/Constants/contentCategories";
import { SafeAreaView } from "react-native-safe-area-context";

const EditProfilePage: React.FC = () => {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/poppins/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/poppins/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/poppins/Poppins-SemiBold.ttf"),
    "Poppins-Medium": require("../../assets/fonts/poppins/Poppins-Medium.ttf"),
    "Poppins-Light": require("../../assets/fonts/poppins/Poppins-Light.ttf"),
    "Inter-Light": require("../../assets/fonts/inter/Inter-Light.ttf"),
    "Inter-Regular": require("../../assets/fonts/inter/Inter-Regular.ttf"),
    "Inter-SemiBold": require("../../assets/fonts/inter/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../../assets/fonts/inter/Inter-Bold.ttf"),
    "Inter-ExtraBold": require("../../assets/fonts/inter/Inter-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../../assets/fonts/poppins/Poppins-ExtraLight.ttf"),
  });

  // Auth store
  const { token, user, updateUser } = useAuthStore();

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Dropdown states
  const [visible, setVisible] = useState(false);
  const [dropdownType, setDropdownType] = useState<
    "gender" | "interest1" | "interest2" | "contentInterest"
  >("gender");
  const [gender, setGender] = useState("");
  const [contentInterest, setContentInterest] = useState("");
  const [interest1, setInterest1] = useState<string[]>([]); // YouTube interests (up to 3)
  const [interest2, setInterest2] = useState<string[]>([]); // Netflix interests (up to 3)

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Options for dropdowns
  const genderOptions = ["Male", "Female", "Other"];
  const contentInterestOptions = ["YouTube", "Netflix"];
  const youtubeInterestOptions = YOUTUBE_CATEGORIES;
  const netflixInterestOptions = NETFLIX_CATEGORIES;

  // Load user profile data on mount
  // Load user profile data on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 EditProfile screen focused, refreshing profile data");
      loadUserProfile();
    }, [])
  );

  // Sync with auth store when user data changes
  useEffect(() => {
    if (user && user.profile_photo) {
      console.log("🔄 Auth store profile photo changed:", user.profile_photo);
      console.log("📸 Current imageUri:", imageUri);

      // Update imageUri if the auth store has a different profile photo
      // This happens after a successful profile update
      if (user.profile_photo !== imageUri) {
        console.log("📸 Updating imageUri with auth store profile photo");
        setImageUri(user.profile_photo);
      }
    }
  }, [user?.profile_photo]);

  const loadUserProfile = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const profileData = await getUserProfile(token);

      if (profileData.user) {
        console.log("🔄 Loading user profile data:", {
          interest1: profileData.user.interest1,
          interest2: profileData.user.interest2,
          gender: profileData.user.gender,
          content_interests: profileData.user.content_interests,
        });

        setName(profileData.user.username || "");
        setUsername(profileData.user.username || "");
        setBio(profileData.user.bio || "");

        // Always update imageUri with the latest profile photo from API
        setImageUri(profileData.user.profile_photo || null);

        // Set gender and content interests
        setGender(profileData.user.gender || "");
        setContentInterest(profileData.user.content_interests || "");

        // Reset interests first
        setInterest1([]);
        setInterest2([]);

        // Set interests if available - split between YouTube and Netflix
        if (profileData.user.interest1) {
          try {
            // Handle both array and string formats
            const interest1Data =
              typeof profileData.user.interest1 === "string"
                ? JSON.parse(profileData.user.interest1)
                : profileData.user.interest1;

            if (Array.isArray(interest1Data) && interest1Data.length > 0) {
              setInterest1(interest1Data);
              console.log("✅ Loaded Interest 1:", interest1Data);
            }
          } catch (error) {
            console.error("❌ Error parsing interest1:", error);
          }
        }

        if (profileData.user.interest2) {
          try {
            // Handle both array and string formats
            const interest2Data =
              typeof profileData.user.interest2 === "string"
                ? JSON.parse(profileData.user.interest2)
                : profileData.user.interest2;

            if (Array.isArray(interest2Data) && interest2Data.length > 0) {
              setInterest2(interest2Data);
              console.log("✅ Loaded Interest 2:", interest2Data);
            }
          } catch (error) {
            console.error("❌ Error parsing interest2:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (value: string) => {
    switch (dropdownType) {
      case "gender":
        setGender(value);
        setVisible(false);
        break;
      case "contentInterest":
        setContentInterest(value);
        setVisible(false);
        break;
      case "interest1":
        // Handle YouTube interests (up to 3)
        if (interest1.includes(value)) {
          // Remove if already selected
          setInterest1(interest1.filter((item) => item !== value));
        } else if (interest1.length < 3) {
          // Add if less than 3 selected
          setInterest1([...interest1, value]);
        } else {
          Alert.alert(
            "Maximum Reached",
            "You can only select up to 3 YouTube interests."
          );
        }
        break;
      case "interest2":
        // Handle Netflix interests (up to 3)
        if (interest2.includes(value)) {
          // Remove if already selected
          setInterest2(interest2.filter((item) => item !== value));
        } else if (interest2.length < 3) {
          // Add if less than 3 selected
          setInterest2([...interest2, value]);
        } else {
          Alert.alert(
            "Maximum Reached",
            "You can only select up to 3 Netflix interests."
          );
        }
        break;
    }
  };

  const openDropdown = (
    type: "gender" | "interest1" | "interest2" | "contentInterest"
  ) => {
    setDropdownType(type);
    setVisible(true);
  };

  const getDropdownOptions = () => {
    switch (dropdownType) {
      case "gender":
        return genderOptions;
      case "contentInterest":
        return contentInterestOptions;
      case "interest1":
        // Return YouTube categories for Interest 1
        return youtubeInterestOptions;
      case "interest2":
        // Return Netflix categories for Interest 2
        return netflixInterestOptions;
      default:
        return [];
    }
  };

  const getCurrentValue = () => {
    switch (dropdownType) {
      case "gender":
        return gender;
      case "contentInterest":
        return contentInterest;
      case "interest1":
        return interest1.length > 0 ? interest1.join(", ") : "";
      case "interest2":
        return interest2.length > 0 ? interest2.join(", ") : "";
      default:
        return "";
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!token) {
      Alert.alert("Error", "No authentication token found");
      return;
    }

    try {
      setSaving(true);

      const profileData = {
        username: username.trim(),
        bio: bio.trim(),
        ...(gender && { gender }),
        ...(contentInterest && { content_interests: contentInterest }),
        ...(interest1.length > 0 && { interest1: JSON.stringify(interest1) }),
        ...(interest2.length > 0 && { interest2: JSON.stringify(interest2) }),
        ...(imageUri && { profile_photo: imageUri }),
      };

      const response = await updateUserProfile(token, profileData);

      // Update the auth store with new data (use the URL from server response if available)

      // Update the auth store with new data (use the URL from server response if available)
      const updatedProfilePhoto = response.user?.profile_photo || imageUri;
      updateUser({
        ...user,
        username: username.trim(),
        bio: bio.trim(),
        gender: gender,
        content_interests: contentInterest,
        interest1: interest1,
        interest2: interest2,
        ...(updatedProfilePhoto && { profile_photo: updatedProfilePhoto }),
      });

      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);

      if (
        error instanceof Error &&
        error.message.includes("Network request failed") &&
        imageUri
      ) {
        Alert.alert(
          "Profile Updated",
          "Your profile information was updated, but the profile photo could not be uploaded. Please try uploading the photo again.",
          [{ text: "OK" }]
        );
        router.back();
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const renderDropdownField = (
    label: string,
    value: string,
    placeholder: string,
    dropdownKey: "gender" | "interest1" | "interest2" | "contentInterest"
  ) => (
    <TouchableOpacity
      onPress={() => openDropdown(dropdownKey)}
      style={EditProfile.dropdownTrigger}
    >
      <ThemedText
        style={[EditProfile.dropdownText, { color: value ? "#fff" : "#888" }]}
      >
        {value || placeholder}
      </ThemedText>
      <ThemedText style={EditProfile.arrow}>▼</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={EditProfile.container}>
      <SafeAreaView className="h-full" edges={[]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 0 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* Top Bar */}
          <View style={EditProfile.CreateCommunityTopBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={EditProfile.BackIcon}
            >
              <Image
                style={{ width: 14, height: 20 }}
                source={require("../../assets/images/back.png")}
              />
            </TouchableOpacity>
            <ThemedText style={EditProfile.TopBarTitle} className="pl-4">
              {name || user?.username || "Edit Profile"}
            </ThemedText>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <ThemedText style={EditProfile.SaveText}>Save</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Image picker */}
          <TouchableOpacity
            style={{ alignItems: "center", width: "100%" }}
            onPress={pickImage}
          >
            <Image
              source={
                imageUri
                  ? { uri: imageUri }
                  : require("../../assets/images/user.png")
              }
              style={EditProfile.CommunityAvatar}
            />
            <Text style={EditProfile.RightTab}>Edit profile</Text>
          </TouchableOpacity>

          {/* Inputs */}
          <View style={EditProfile.InfoContainer}>
            <View style={EditProfile.InfoFrame}>
              <ThemedText style={EditProfile.InfoLabel}>Name</ThemedText>
              <TextInput
                placeholder="Add name"
                placeholderTextColor="#B0B0B0"
                style={EditProfile.TextLabel}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={EditProfile.InfoFrame}>
              <ThemedText style={EditProfile.InfoLabel}>Username</ThemedText>
              <TextInput
                placeholder="Add username"
                placeholderTextColor="#B0B0B0"
                style={EditProfile.TextLabel}
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={EditProfile.InfoFrame}>
              <ThemedText style={EditProfile.InfoLabel}>Bio</ThemedText>
              <TextInput
                placeholder="Add bio"
                placeholderTextColor="#B0B0B0"
                style={EditProfile.TextLabel}
                value={bio}
                onChangeText={setBio}
              />
            </View>

            {/* Gender & Content Interest */}
            <View style={EditProfile.TwoFieldRow}>
              <View style={EditProfile.HalfField}>
                <ThemedText style={EditProfile.InfoLabel}>Gender</ThemedText>
                {renderDropdownField(
                  "Gender",
                  gender,
                  "Select gender",
                  "gender"
                )}
              </View>

              <View style={EditProfile.HalfField}>
                <ThemedText style={EditProfile.InfoLabel}>Platform</ThemedText>
                {renderDropdownField(
                  "Platform",
                  contentInterest,
                  "Select platform",
                  "contentInterest"
                )}
              </View>
            </View>

            {/* Interest 1 (YouTube) & Interest 2 (Netflix) */}
            <View style={EditProfile.InfoFrame}>
              <ThemedText style={EditProfile.InfoLabel}>Interest 1 </ThemedText>
              {renderDropdownField(
                "Interest 1",
                interest1.length > 0 ? interest1.join(", ") : "",
                "Select YouTube interests",
                "interest1"
              )}
              {interest1.length > 0 && (
                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    flexWrap: "wrap",
                  }}
                >
                  {interest1.map((item, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: "#333",
                        padding: 4,
                        margin: 2,
                        borderRadius: 4,
                      }}
                    >
                      <ThemedText style={{ color: "#fff", fontSize: 12 }}>
                        {item}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={EditProfile.InfoFrame}>
              <ThemedText style={EditProfile.InfoLabel}>Interest 2 </ThemedText>
              {renderDropdownField(
                "Interest 2",
                interest2.length > 0 ? interest2.join(", ") : "",
                "Select Netflix interests",
                "interest2"
              )}
              {interest2.length > 0 && (
                <View
                  style={{
                    marginTop: 8,
                    flexDirection: "row",
                    flexWrap: "wrap",
                  }}
                >
                  {interest2.map((item, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: "#333",
                        padding: 4,
                        margin: 2,
                        borderRadius: 4,
                      }}
                    >
                      <ThemedText style={{ color: "#fff", fontSize: 12 }}>
                        {item}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Dropdown Modal (shared) */}
            <Modal transparent animationType="fade" visible={visible}>
              <TouchableOpacity
                style={EditProfile.overlay}
                onPress={() => setVisible(false)}
                activeOpacity={1}
              >
                <TouchableOpacity
                  style={EditProfile.dropdownBox}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  {dropdownType === "interest1" ||
                    dropdownType === "interest2" ? (
                    // Multi-select for interests
                    <>
                      <View
                        style={{
                          padding: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: "#333",
                        }}
                      >
                        <ThemedText
                          style={{ color: "#fff", fontWeight: "bold" }}
                        >
                          {dropdownType === "interest1"
                            ? "YouTube Interests (Select up to 3)"
                            : "Netflix Interests (Select up to 3)"}
                        </ThemedText>
                        <ThemedText style={{ color: "#888", fontSize: 12 }}>
                          {dropdownType === "interest1"
                            ? `${interest1.length}/3 selected`
                            : `${interest2.length}/3 selected`}
                        </ThemedText>
                      </View>
                      <ScrollView
                        style={{ maxHeight: 300 }}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                      >
                        {getDropdownOptions().map((item) => {
                          const isSelected =
                            dropdownType === "interest1"
                              ? interest1.includes(item)
                              : interest2.includes(item);
                          return (
                            <TouchableOpacity
                              key={item}
                              style={[
                                EditProfile.dropdownItem,
                                { flexDirection: "row", alignItems: "center" },
                              ]}
                              onPress={() => handleSelect(item)}
                            >
                              <View
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderWidth: 2,
                                  borderColor: isSelected ? "#007AFF" : "#666",
                                  backgroundColor: isSelected
                                    ? "#007AFF"
                                    : "transparent",
                                  marginRight: 10,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {isSelected && (
                                  <ThemedText
                                    style={{ color: "#fff", fontSize: 12 }}
                                  >
                                    ✓
                                  </ThemedText>
                                )}
                              </View>
                              <ThemedText style={EditProfile.dropdownItemText}>
                                {item}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <TouchableOpacity
                        style={[
                          EditProfile.dropdownItem,
                          { backgroundColor: "#007AFF", marginTop: 10 },
                        ]}
                        onPress={() => setVisible(false)}
                      >
                        <ThemedText
                          style={[
                            EditProfile.dropdownItemText,
                            { textAlign: "center", fontWeight: "bold" },
                          ]}
                        >
                          Done
                        </ThemedText>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Single select for other dropdowns
                    <ScrollView
                      style={{ maxHeight: 300 }}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {getDropdownOptions().map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={EditProfile.dropdownItem}
                          onPress={() => handleSelect(item)}
                        >
                          <ThemedText style={EditProfile.dropdownItemText}>
                            {item}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

            {/* Social Media Links Button */}
            {/* <TouchableOpacity
              style={EditProfile.CreatorPassButton}
              onPress={() => router.push("/Profile/SocialMediaLinks")}
            >
              <ThemedText style={EditProfile.CreatorPassText}>
                Add Social Media Links
              </ThemedText>
            </TouchableOpacity> */}

            {/* Creator Pass Button */}
            {/* <TouchableOpacity
              style={EditProfile.CreatorPassButton}
              onPress={() => router.push("/Profile/CreatorPass")}
            >
              <ThemedText style={EditProfile.CreatorPassText}>
                Add "CREATOR PASS"
              </ThemedText>
            </TouchableOpacity> */}

            {/* Extra Info */}
            <View style={{ marginTop: 10, paddingHorizontal: 20 }}>
              {/* <ThemedText style={EditProfile.ExtraInfo}>
                Unlock Creator pass for your fans. All your paid content will be
                freely available to users who purchase your Creator Pass.
              </ThemedText> */}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
};

export default EditProfilePage;