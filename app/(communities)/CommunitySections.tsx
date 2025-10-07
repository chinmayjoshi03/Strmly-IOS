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
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/useAuthStore";
import ThemedView from "@/components/ThemedView";
import { communityActions } from "@/api/community/communityActions";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { getDeviceInfo, getResponsiveStyles } from "@/utils/deviceUtils";

interface User {
  _id: string;
  username: string;
  profile_photo: string;
}

type SectionType = 'followers' | 'creators';

export default function CommunitySections() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuthStore();
  const insets = useSafeAreaInsets();

  // Get device info and responsive styles
  const deviceInfo = getDeviceInfo();
  const responsiveStyles = getResponsiveStyles();

  const [activeSection, setActiveSection] = useState<SectionType>((params.section as SectionType) || 'followers');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    followers: 0,
    creators: 0,
  });

  const communityId = params.communityId as string;
  const communityName = params.communityName as string;

  // Remove video thumbnails generation since we're removing videos section

  useEffect(() => {
    if (communityId && token) {
      fetchAllCounts();
      fetchData();
    }
  }, [activeSection, communityId, token]);

  // Fetch all counts initially
  useEffect(() => {
    if (communityId && token) {
      fetchAllCounts();
    }
  }, [communityId, token]);

  // Refresh counts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (communityId && token) {
        fetchAllCounts();
      }
    }, [communityId, token])
  );

  const fetchAllCounts = async () => {
    if (!token) {
      console.error('❌ No token available');
      return;
    }

    try {
      // Fetch both followers and creators counts
      const [followersResult, creatorsResult] = await Promise.all([
        communityActions.getCommunityFollowers(token, communityId),
        communityActions.getCommunityCreators(token, communityId)
      ]);

      setCounts({
        followers: followersResult.followers?.length || 0,
        creators: creatorsResult.creators?.length || 0,
      });

      console.log('✅ Fetched all counts:', {
        followers: followersResult.followers?.length || 0,
        creators: creatorsResult.creators?.length || 0,
      });

    } catch (error) {
      console.error('❌ Error fetching counts:', error);
    }
  };

  const fetchData = async () => {
    if (!token) {
      console.error('❌ No token available');
      return;
    }

    setLoading(true);
    try {
      let result: any;

      switch (activeSection) {
        case 'followers':
          result = await communityActions.getCommunityFollowers(token, communityId);
          setData(result.followers || []);
          console.log(data)
          // Update count for this section
          setCounts(prev => ({ ...prev, followers: result.followers?.length || 0 }));
          break;

        case 'creators':
          result = await communityActions.getCommunityCreators(token, communityId);
          setData(result.creators || []);
          // Update count for this section
          setCounts(prev => ({ ...prev, creators: result.creators?.length || 0 }));
          break;
      }

      console.log(`✅ Fetched ${activeSection} data:`, result);

    } catch (error) {
      console.error(`❌ Error fetching ${activeSection} data:`, error);
      Alert.alert('Error', `Failed to fetch ${activeSection}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item) => {
    const searchTerm = searchQuery.toLowerCase();
    return item.username?.toLowerCase().includes(searchTerm);
  });

  const renderUserItem = (user: User) => (
    <TouchableOpacity 
      key={user._id} 
      className="flex-row items-center justify-between py-4 px-4"
      onPress={() => {
        console.log("🔄 Navigating to user profile:", user._id);
        router.push(`/(dashboard)/profile/public/${user._id}` as any);
      }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-1">
        <Image
          source={{ uri: getProfilePhotoUrl(user.profile_photo, 'user') }}
          className="w-12 h-12 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="text-white font-semibold text-base" style={{ fontFamily: 'Poppins' }}>
            {user.username}
          </Text>
          <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins' }}>
            @{user.username}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Removed video rendering function since we're removing videos section

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'followers':
        return `${counts.followers} Followers`;
      case 'creators':
        return `${counts.creators} Creators`;
      default:
        return 'Community';
    }
  };

  return (
    <ThemedView className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="black" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{ paddingTop: insets.top + 10 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold" style={{ fontFamily: 'Poppins' }}>
          #{communityName}
        </Text>
        <View className="w-6" />
      </View>

      {/* Two Tabs - Followers and Creators */}
      <View className="flex-row justify-around py-3 px-4">
        <TouchableOpacity
          className={`flex-1 py-2 items-center ${activeSection === "followers" ? "border-b-2 border-white" : ""
            }`}
          onPress={() => setActiveSection("followers")}
        >
          <Text
            className={`${activeSection === "followers" ? "text-white font-semibold" : "text-gray-400"} text-lg`}
            style={{ fontFamily: 'Poppins' }}
          >
            {counts.followers} Followers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-2 items-center ${activeSection === "creators" ? "border-b-2 border-white" : ""
            }`}
          onPress={() => setActiveSection("creators")}
        >
          <Text
            className={`${activeSection === "creators" ? "text-white font-semibold" : "text-gray-400"} text-lg`}
            style={{ fontFamily: 'Poppins' }}
          >
            {counts.creators} Creators
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="py-2" style={responsiveStyles.containerPadding}>
        <View className="bg-black border border-gray-600 rounded-lg" style={responsiveStyles.searchInput}>
          <TextInput
            className="text-white"
            placeholder="Search..."
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ fontFamily: 'Poppins', fontSize: deviceInfo.isTabletDevice ? 18 : 14 }}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" style={{ marginBottom: 80 }}>
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#F1C40F" />
            <Text className="text-gray-400 mt-2" style={{ fontFamily: 'Poppins' }}>
              Loading {getSectionTitle()}...
            </Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-center" style={{ fontFamily: 'Poppins' }}>
              {searchQuery ? "No results found" : `No ${activeSection} yet`}
            </Text>
          </View>
        ) : (
          <View>
            {filteredData.map((item) => renderUserItem(item as User))}
          </View>
        )}
      </ScrollView>



    </ThemedView>
  );
}