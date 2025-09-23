import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";

import { View, Image } from "react-native";
import { PaperclipIcon, Search } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";

import { useAuthStore } from "@/store/useAuthStore";
import { CONFIG } from "@/Constants/config";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import * as ScreenOrientation from "expo-screen-orientation";
import { useOrientationStore } from "@/store/useOrientationStore";

export default function TabLayout() {
  const { token, user } = useAuthStore();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const {isLandscape} = useOrientationStore();

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/user/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.user && data.user.profile_photo) {
            setProfilePhoto(data.user.profile_photo);
          }
        } else {
          console.log("Profile fetch failed with status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error);
      }
    };

    fetchProfilePhoto();
  }, [token]);

  // Update profile photo when user data changes
  useEffect(() => {
    if (user?.profile_photo) {
      setProfilePhoto(user.profile_photo);
    }
  }, [user?.profile_photo]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#666666",
        tabBarStyle: isLandscape
          ? { display: "none" } // hide in landscape
          : {
              backgroundColor: "#000000",
              borderTopWidth: 0,
              height: 50,
              paddingBottom: 0,
              paddingTop: 0,
              paddingHorizontal: 0,
              marginBottom: 0,
              elevation: 8, // Android shadow
              shadowColor: "#000", // iOS shadow
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`w-6 h-6 items-center justify-center ${focused ? "opacity-100" : "opacity-60"}`}
            >
              <PaperclipIcon size={22} color="white" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="studio"
        options={{
          title: "Studio",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`w-8 h-8 items-center justify-center ${focused ? "opacity-100" : "opacity-60"}`}
            >
              <Svg width="24" height="24" viewBox="0 0 29 28" fill="none">
                <Path
                  d="M13.9667 10.5H23.3C22.775 9.15831 21.9731 8.00604 20.8943 7.04315C19.8156 6.08026 18.5758 5.40476 17.175 5.01665L13.9667 10.5ZM11.2833 12.8333L15.95 4.78331C15.7361 4.74442 15.5222 4.71526 15.3083 4.69581C15.0944 4.67637 14.8806 4.66665 14.6667 4.66665C13.3833 4.66665 12.1875 4.9097 11.0792 5.39581C9.97083 5.88192 8.98889 6.53331 8.13333 7.34998L11.2833 12.8333ZM5.625 16.3333H11.9833L7.31667 8.28331C6.69444 9.08054 6.20833 9.96059 5.85833 10.9235C5.50833 11.8864 5.33333 12.9119 5.33333 14C5.33333 14.4083 5.35783 14.8023 5.40683 15.1818C5.45583 15.5614 5.52856 15.9452 5.625 16.3333ZM12.1583 22.9833L15.3083 17.5H6.03333C6.55833 18.8416 7.36061 19.9939 8.44017 20.9568C9.51972 21.9197 10.7591 22.5952 12.1583 22.9833ZM14.6667 23.3333C15.95 23.3333 17.1458 23.0903 18.2542 22.6041C19.3625 22.118 20.3444 21.4666 21.2 20.65L18.05 15.1666L13.3833 23.2166C13.5972 23.2555 13.8064 23.2847 14.011 23.3041C14.2156 23.3236 14.4341 23.3333 14.6667 23.3333ZM22.0167 19.7166C22.6389 18.9194 23.125 18.0398 23.475 17.0776C23.825 16.1155 24 15.0896 24 14C24 13.5916 23.9759 13.1981 23.9277 12.8193C23.8794 12.4405 23.8063 12.0563 23.7083 11.6666H17.35L22.0167 19.7166ZM14.6667 25.6666C13.0722 25.6666 11.5653 25.3602 10.1458 24.7473C8.72639 24.1344 7.487 23.2983 6.42767 22.239C5.36833 21.1796 4.53222 19.9403 3.91933 18.5208C3.30644 17.1014 3 15.5944 3 14C3 12.3861 3.30644 10.8745 3.91933 9.46515C4.53222 8.05581 5.36833 6.82109 6.42767 5.76098C7.487 4.70087 8.72639 3.86476 10.1458 3.25265C11.5653 2.64054 13.0722 2.33409 14.6667 2.33331C16.2806 2.33331 17.7926 2.63976 19.2027 3.25265C20.6128 3.86554 21.8471 4.70165 22.9057 5.76098C23.9642 6.82031 24.8003 8.05504 25.414 9.46515C26.0277 10.8753 26.3341 12.3869 26.3333 14C26.3333 15.5944 26.0269 17.1014 25.414 18.5208C24.8011 19.9403 23.965 21.18 22.9057 22.2401C21.8463 23.3003 20.6116 24.1364 19.2015 24.7485C17.7914 25.3606 16.2798 25.6666 14.6667 25.6666Z"
                  fill="white"
                />
              </Svg>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`w-8 h-8 items-center justify-center ${focused ? "opacity-100" : "opacity-60"}`}
            >
              <Search size={24} color="white" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`w-8 h-8 items-center justify-center ${focused ? "opacity-100" : "opacity-60"}`}
            >
              <View className="w-7 h-7 bg-gray-600 rounded-full overflow-hidden items-center justify-center">
                {profilePhoto ? (
                  <Image
                    source={{ uri: getProfilePhotoUrl(profilePhoto, "user") }}
                    className="w-full h-full"
                    style={{ width: 28, height: 28, resizeMode: "cover" }}
                  />
                ) : (
                  <View className="w-full h-full bg-gradient-to-b from-gray-500 to-gray-700 items-center justify-center">
                    <View className="w-3 h-3 bg-white rounded-full mb-1" />
                    <View className="w-5 h-2 bg-white rounded-t-full" />
                  </View>
                )}
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
