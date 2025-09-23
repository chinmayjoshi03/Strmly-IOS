import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { ChevronLeft, ChevronDown } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useDashboard } from "./_components/useDashboard";

import { useTransactionHistory } from "../wallet/_components/useTransactionHistory";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { SafeAreaView } from "react-native-safe-area-context";

const {height} = Dimensions.get("screen");

interface DashboardStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalReposts: number;
  totalWatchTime: number;
  totalFollowers: number;
  revenue?: number;
}

interface RevenueBreakdown {
  estimateRevenue: number;
  contentSubscription: number;
  creatorPass: number;
  giftingEarning: number;
  communityFee: number;
  strmlyAds: number;
}

interface RecentActivity {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action:
    | "comment"
    | "like"
    | "follow"
    | "repost"
    | "gift"
    | "creator_pass"
    | "community_join";
  content?: string;
  timestamp: string;
  amount?: number;
}

const Dashboard = () => {
  const params = useLocalSearchParams();
  const initialTab = params.tab === "revenue" ? "revenue" : "non-revenue";

  const [activeTab, setActiveTab] = useState<"non-revenue" | "revenue">(
    initialTab
  );
  const [timeFilter, setTimeFilter] = useState("Last 30 Days");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const router = useRouter();
  const { token } = useAuthStore();

  // Use the custom dashboard hook
  const { stats, revenueBreakdown, loading, error } = useDashboard(
    token || "",
    activeTab
  );

  // Use transaction history hook to get recent revenue activities
  const { transactions, gifts, fetchTransactionHistory, fetchGiftHistory } =
    useTransactionHistory(token || "");

  const timeFilterOptions = [
    "Last 7 Days",
    "Last 30 Days",
    "Last 90 Days",
    "Last Year",
  ];

  // Fetch recent revenue activities when in revenue tab
  useEffect(() => {
    if (activeTab === "revenue" && token) {
      console.log("🔍 Fetching recent revenue activities...");
      fetchTransactionHistory();
      fetchGiftHistory();
    }
  }, [activeTab, token]);

  // Generate recent activity from transactions and gifts
  useEffect(() => {
    if (activeTab === "revenue") {
      const recentRevenue: RecentActivity[] = [];

      // Add recent credit transactions (revenue)
      const revenueTransactions = transactions
        .filter((tx) => tx.type === "credit")
        .slice(0, 5)
        .map((tx) => ({
          id: tx.id,
          user: {
            name: tx.from || "User",
            avatar: "https://via.placeholder.com/40",
          },
          action: "gift" as const,
          content: tx.description,
          timestamp: new Date(tx.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          amount: tx.amount,
        }));

      // Add recent gifts
      const recentGifts = gifts.slice(0, 5).map((gift) => ({
        id: gift.id,
        user: {
          name: gift.from.username,
          avatar: gift.from.profile_photo || "https://via.placeholder.com/40",
        },
        action: "gift" as const,
        content: `sent you a gift${gift.video ? ` on "${gift.video.title}"` : ""}`,
        timestamp: new Date(gift.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
        amount: gift.amount,
      }));

      // Combine and sort by date
      const combined = [...revenueTransactions, ...recentGifts]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 5);

      console.log("🔍 Generated recent revenue activities:", combined);
      setRecentActivity(combined);
    } else {
      setRecentActivity([]);
    }
  }, [activeTab, transactions, gifts]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return num.toString();
  };

  const getActionText = (activity: RecentActivity): string => {
    return activity.content || "";
  };

  return (
    <SafeAreaView style={{ flex:1 , backgroundColor: 'black' }} edges={[]}>
    <View className="flex-1">

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text
          className="text-white text-2xl font-semibold"
          style={{ fontFamily: "Poppins" }}
        >
          Dashboard
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Tab Switcher */}
        <View className="flex-row mt-6 mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab("non-revenue")}
            className={`flex-1 pb-3 ${activeTab === "non-revenue" ? "border-b-2 border-white" : ""}`}
          >
            <Text
              className={`text-center text-xl ${activeTab === "non-revenue" ? "text-white font-semibold" : "text-gray-400"}`}
              style={{ fontFamily: "Poppins" }}
            >
              Non-revenue
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("revenue")}
            className={`flex-1 pb-3 ${activeTab === "revenue" ? "border-b-2 border-white" : ""}`}
          >
            <Text
              className={`text-center text-xl ${activeTab === "revenue" ? "text-white font-semibold" : "text-gray-400"}`}
              style={{ fontFamily: "Poppins" }}
            >
              Revenue
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#F1C40F" />
          </View>
        ) : (
          <>
            {/* Stats Card */}
            <LinearGradient
              colors={["#000000", "#0a0a0a", "#1a1a1a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl px-8 py-6 mb-6"
              style={{ width: 380, height: 273, alignSelf: "center" }}
            >
              {/* Time Filter */}
              <View className="flex-row justify-between items-center mb-4"
              style={{paddingRight: Platform.OS == "ios" ? 2 : 0}}
              >
                <Text
                  className="text-white text-lg font-medium"
                  style={{ fontFamily: "Inter" }}
                >
                  {activeTab === "revenue" ? "Estimate Revenue" : "Total Views"}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTimeDropdown(!showTimeDropdown)}
                  className="flex-row items-center border border-gray-600 rounded-lg px-3 py-2"
                >
                  <Text
                    className="text-white text-sm mr-2"
                    style={{ fontFamily: "Inter" }}
                  >
                    {timeFilter}
                  </Text>
                  <ChevronDown size={16} color="white" />
                </TouchableOpacity>

                {/* Time Filter Dropdown */}
                {showTimeDropdown && (
                  <View
                    className="absolute right-0 top-10 rounded-lg border border-gray-600 z-10"
                    style={{ backgroundColor: "#0a0a0a" }}
                  >
                    {timeFilterOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          setTimeFilter(option);
                          setShowTimeDropdown(false);
                        }}
                        className="px-5 py-3 border-b border-gray-700 last:border-b-0"
                      >
                        <Text
                          className="text-white text-base"
                          style={{ fontFamily: "Inter" }}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Main Stat */}
              <Text
                className="text-white text-3xl font-bold mb-4"
                style={{ fontFamily: "Inter" }}
              >
                {activeTab === "revenue"
                  ? `₹ ${revenueBreakdown?.estimateRevenue || "0"}`
                  : formatNumber(stats?.totalViews || 0)}
              </Text>

              {/* Stats Content */}
              {activeTab === "revenue" ? (
                /* Revenue Breakdown */
                <View className="space-y-2 px-2">
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Content subscription
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      ₹{revenueBreakdown?.contentSubscription || "0"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Creator pass
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      ₹{revenueBreakdown?.creatorPass || "0"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Gifting earning
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      ₹{revenueBreakdown?.giftingEarning || "0"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Community fee
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      ₹{revenueBreakdown?.communityFee || "0"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Strmly ads
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      ₹{revenueBreakdown?.strmlyAds || "0"}
                    </Text>
                  </View>
                </View>
              ) : (
                /* Non-Revenue Stats */
                <View className="space-y-2 px-2">
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Total likes
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      {stats ? formatNumber(stats.totalLikes) : "0"}
                    </Text>
                  </View>
                  {/* <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Total comments
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      {stats ? formatNumber(stats.totalComments) : "0"}
                    </Text>
                  </View> */}
                  {/* <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Total repost
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      {stats ? formatNumber(stats.totalReposts) : "0"}
                    </Text>
                  </View> */}
                  {/* <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Total watch time
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      {stats ? formatNumber(stats.totalWatchTime) : "0"}
                    </Text>
                  </View> */}
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Total followers
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      {stats ? formatNumber(stats.totalFollowers) : "0"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="text-gray-400 text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      Total videos
                    </Text>
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "Inter" }}
                    >
                      {stats
                        ? formatNumber((stats as any).totalVideos || 0)
                        : "0"}
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>

            {/* Recent Revenue History - Only show in revenue tab */}
            {/* {activeTab === "revenue" && (
              <View className="mb-6">
                <Text className="text-white text-2xl font-semibold mb-4">
                  Recent
                </Text>
                <ScrollView
                  className="max-h-96"
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <View className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <View
                          key={activity.id}
                          className="flex-row items-center mb-4"
                        >
                          <Image
                            source={{
                              uri: getProfilePhotoUrl(
                                activity.user.avatar,
                                "user"
                              ),
                            }}
                            className="w-12 h-12 rounded-full mr-3"
                          />
                          <View className="flex-1">
                            <Text className="text-white text-lg">
                              <Text className="font-semibold">
                                {activity.user.name}
                              </Text>
                              <Text className="text-gray-400">
                                {" "}
                                {getActionText(activity)}
                              </Text>
                            </Text>
                            <Text className="text-gray-500 text-base">
                              {activity.timestamp}
                            </Text>
                          </View>
                          {activity.amount && (
                            <Text className="text-white text-lg font-medium">
                              +₹{activity.amount.toFixed(1)}
                            </Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text className="text-gray-400 text-base">
                        No recent revenue activity
                      </Text>
                    )}
                  </View>
                </ScrollView>
              </View>
            )} */}
          </>
        )}
      </ScrollView>
    </View>
    </SafeAreaView>
  );
};

export default Dashboard;