import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Image,
  StatusBar,
  Pressable,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ThemedView from "@/components/ThemedView";
import { User, Community } from "@/api/profile/profileActions";
import { useProfileSections } from "./_components/useProfileSections";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { useAuthStore } from "@/store/useAuthStore";

const { height } = Dimensions.get("window");

// Types are now imported from profileActions

export default function ProfileSections() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();

  const { user } = useAuthStore();

  const userName = params.userName || "User";
  const initialSection = (params.section as any) || "followers";

  const {
    activeSection,
    loading,
    data,
    counts,
    error,
    changeSection,
    searchData,
    getSectionTitle,
    refreshCurrentSection,
    refreshAllCounts,
  } = useProfileSections({ initialSection });

  // Refresh data when returning from create community page
  useEffect(() => {
    // Check if we're coming back to myCommunity section
    if (activeSection === "myCommunity") {
      refreshCurrentSection();
    }
  }, [activeSection, refreshCurrentSection]);

  // Add focus listener to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Refresh all counts and current section data when screen comes into focus
      refreshAllCounts();
      refreshCurrentSection();
    }, [refreshAllCounts, refreshCurrentSection])
  );

  const filteredData = searchData(searchQuery) || [];

  const renderUserItem = (user: User) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(dashboard)/profile/public/[id]",
          params: { id: user._id },
        })
      }
    >
      <View
        key={user._id}
        className="flex-row items-center justify-between py-4 px-4"
      >
        <View className="flex-row items-center flex-1">
          <Image
            source={{ uri: getProfilePhotoUrl(user.profile_photo, "user") }}
            className="w-12 h-12 rounded-full mr-3"
          />
          <View className="flex-1">
            <Text
              className="text-white font-semibold text-base"
              style={{ fontFamily: "Poppins" }}
            >
              {user.username}
            </Text>
            <Text
              className="text-gray-400 text-sm"
              style={{ fontFamily: "Poppins" }}
            >
              @{user.username}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text
            className="text-white font-bold text-lg"
            style={{ fontFamily: "Poppins" }}
          >
            {user.total_followers
              ? user.total_followers >= 1000000
                ? `${(user.total_followers / 1000000).toFixed(1)}M`
                : user.total_followers >= 1000
                  ? `${(user.total_followers / 1000).toFixed(1)}K`
                  : user.total_followers.toString()
              : "0"}
          </Text>
          <Text
            className="text-gray-400 text-sm"
            style={{ fontFamily: "Poppins" }}
          >
            Followers
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const renderCommunityItem = (community: Community) => (
    <TouchableOpacity
      key={community._id}
      className="flex-row items-center justify-between py-4 px-4"
      onPress={() => {
        // console.log(community.founder, user?.id);
        router.push({
          pathname:
            community?.founder._id === user?.id
              ? "/(dashboard)/communities/personal/[id]"
              : "/(dashboard)/communities/public/[id]",
          params: { id: community._id },
        });
      }}
    >
      <View className="flex-row items-center flex-1">
        <Image
          source={{
            uri: getProfilePhotoUrl(community.profile_photo, "community"),
          }}
          className="w-12 h-12 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text
            className="text-white font-semibold text-base"
            style={{ fontFamily: "Poppins" }}
          >
            {community.name}
          </Text>
          {community.founder && (
            <Text
              className="text-gray-400 text-sm"
              style={{ fontFamily: "Poppins" }}
            >
              @{community.founder.username}
            </Text>
          )}
        </View>
      </View>
      <View className="flex-row items-center">
        <View className="items-center mr-4">
          <View className="flex-row gap-2 items-center space-x-4">
            <View className="items-center">
              <Text
                className="text-white font-bold text-sm"
                style={{ fontFamily: "Poppins" }}
              >
                {community.creators?.length
                  ? community.creators.length >= 1000
                    ? `${(community.creators.length / 1000).toFixed(1)}K`
                    : community.creators.length.toString()
                  : "0"}
              </Text>
              <Text
                className="text-gray-400 text-xs"
                style={{ fontFamily: "Poppins" }}
              >
                Creators
              </Text>
            </View>
            <View className="items-center">
              <Text
                className="text-white font-bold text-sm"
                style={{ fontFamily: "Poppins" }}
              >
                {community.followers?.length
                  ? community.followers.length >= 1000000
                    ? `${(community.followers.length / 1000000).toFixed(1)}M`
                    : community.followers.length >= 1000
                      ? `${(community.followers.length / 1000).toFixed(1)}K`
                      : community.followers.length.toString()
                  : "0"}
              </Text>
              <Text
                className="text-gray-400 text-xs"
                style={{ fontFamily: "Poppins" }}
              >
                Followers
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={16} color="gray" />
      </View>
    </TouchableOpacity>
  );

  // getTabTitle is now handled by the hook

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "black" }} edges={[]}
    >
      <ThemedView className="flex-1">
        <StatusBar barStyle="light-content" backgroundColor="black" />

        {/* Header with proper spacing from status bar */}
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ paddingTop: 10 }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text
            className="text-white text-lg font-semibold"
            style={{ fontFamily: "Poppins" }}
          >
            {userName}
          </Text>
          <View className="w-6" />
        </View>

        {/* Horizontally Scrollable Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-grow-0"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <View className="flex-row space-x-20 py-3">
            <TouchableOpacity
              className={`py-2 px-2 ${
                activeSection === "followers" ? "border-b-2 border-white" : ""
              }`}
              onPress={() => changeSection("followers")}
            >
              <Text
                className={`${activeSection === "followers" ? "text-white font-semibold" : "text-gray-400"} whitespace-nowrap text-lg`}
                style={{ fontFamily: "Poppins" }}
              >
                {counts.followers} Followers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`py-2 px-2 ${
                activeSection === "following" ? "border-b-2 border-white" : ""
              }`}
              onPress={() => changeSection("following")}
            >
              <Text
                className={`${activeSection === "following" ? "text-white font-semibold" : "text-gray-400"} whitespace-nowrap text-lg`}
                style={{ fontFamily: "Poppins" }}
              >
                {counts.following} Following
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`py-2 px-2 ${
                activeSection === "myCommunity" ? "border-b-2 border-white" : ""
              }`}
              onPress={() => changeSection("myCommunity")}
            >
              <Text
                className={`${activeSection === "myCommunity" ? "text-white font-semibold" : "text-gray-400"} whitespace-nowrap text-lg`}
                style={{ fontFamily: "Poppins" }}
              >
                {counts.myCommunity} My Community
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`py-2 px-2 ${
                activeSection === "community" ? "border-b-2 border-white" : ""
              }`}
              onPress={() => changeSection("community")}
            >
              <Text
                className={`${activeSection === "community" ? "text-white font-semibold" : "text-gray-400"} whitespace-nowrap text-lg`}
                style={{ fontFamily: "Poppins" }}
              >
                {counts.community} Community
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Search Bar - Black background, smaller size, less border radius, no search icon */}
        <View className="px-6 py-1">
          <View className="bg-black border border-gray-600 rounded-full px-5 py-3">
            <TextInput
              className="text-white text-m"
              placeholder="Search..."
              placeholderTextColor="gray"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ fontFamily: "Poppins" }}
            />
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1">
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#F1C40F" />
              <Text
                className="text-gray-400 mt-2"
                style={{ fontFamily: "Poppins" }}
              >
                Loading {getSectionTitle()}...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text
                className="text-red-400 text-center"
                style={{ fontFamily: "Poppins" }}
              >
                {error}
              </Text>
            </View>
          ) : filteredData.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text
                className="text-gray-400 text-center"
                style={{ fontFamily: "Poppins" }}
              >
                {searchQuery ? "No results found" : `No ${activeSection} yet`}
              </Text>
            </View>
          ) : (
            <View>
              {filteredData.map((item) => {
                if (
                  activeSection === "followers" ||
                  activeSection === "following"
                ) {
                  return renderUserItem(item as User);
                } else {
                  return renderCommunityItem(item as Community);
                }
              })}
            </View>
          )}
        </ScrollView>

        {/* Create Community Button (only for My Community tab) */}
        {activeSection === "myCommunity" && (
          <View className="absolute bottom-10 left-0 right-0 px-4">
            <TouchableOpacity
              className="bg-white rounded-full py-4"
              onPress={() => router.push("/(communities)/CreateCommunityPage")}
            >
              <Text
                className="text-black text-center text-lg font-semibold"
                style={{ fontFamily: "Poppins" }}
              >
                Create new community
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}