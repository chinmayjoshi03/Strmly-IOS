import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
    Platform,
    Modal,
    Pressable,
    Dimensions
} from 'react-native';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { CONFIG } from '@/Constants/config';

interface CommunityStats {
    communityFee?: number;
    totalCreators?: number;
    totalVideos?: number;
    totalFollowers?: number;
}

interface RecentActivity {
    id: string;
    user: {
        name: string;
        username: string;
        avatar: string;
    };
    action: string;
    actionType: 'follow' | 'join' | 'video_upload' | 'series_upload';
    timestamp: string;
}

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string;
    status?: string;
    from?: string;
    to?: string;
    category?: string;
}

const CommunityAnalytics = () => {
    const [activeTab, setActiveTab] = useState<'non-revenue' | 'revenue'>('revenue');
    const [timeFilter, setTimeFilter] = useState('Last 30 Days');
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const [stats, setStats] = useState<CommunityStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    
    const dropdownButtonRef = useRef<TouchableOpacity>(null);

    const router = useRouter();
    const params = useLocalSearchParams();
    const { token } = useAuthStore();

    // Get the community ID from route parameters
    const communityId = params.communityId as string;

    const timeFilterOptions = [
        'Last 7 Days',
        'Last 30 Days',
        'Last 90 Days',
        'Last Year'
    ];

    useEffect(() => {
        if (communityId) {
            fetchCommunityData();
        } else {
            console.error('❌ No community ID provided');
            setLoading(false);
        }
    }, [activeTab, timeFilter, communityId]);

    const fetchTransactionHistory = async (communityId: string) => {
        // Transaction history will be implemented later
        // For now, just set empty array
        setTransactions([]);
    };

    const fetchRecentActivity = async (communityId: string) => {
        try {
            console.log(`🔍 Fetching recent activity for community: ${communityId}`);
            
            // Fetch community data using the specific API endpoint
            const communityResponse = await fetch(
                `${CONFIG.API_BASE_URL}/community/${communityId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            const recentActivities: RecentActivity[] = [];

            if (communityResponse.ok) {
                const communityData = await communityResponse.json();
                console.log(`✅ Community data fetched for ${communityId}:`, {
                    name: communityData.name,
                    totalVideos: communityData.long_videos?.length || 0,
                    totalCreators: communityData.creators?.length || 0
                });

                // Add recent video uploads from long_videos array
                if (communityData.long_videos && Array.isArray(communityData.long_videos)) {
                    // Take the last 3 videos as recent uploads
                    const recentVideos = communityData.long_videos.slice(-3).reverse();

                    recentVideos.forEach((video: any, index: number) => {
                        recentActivities.push({
                            id: `video_${video._id}_${index}`,
                            user: {
                                name: 'Adithya_new', // Using founder as default since video doesn't have created_by in this structure
                                username: 'Adithya_new',
                                avatar: communityData.founder?.profile_photo || 'https://strmly-videos-dev-mumbai.s3.ap-south-1.amazonaws.com/defaut_user_profile_photo.jpg'
                            },
                            action: 'post a video on your community',
                            actionType: 'video_upload',
                            timestamp: new Date().toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })
                        });
                    });
                }

                // Add recent followers based on creator_join_order (most recent joins)
                if (communityData.creator_join_order && Array.isArray(communityData.creator_join_order)) {
                    // Take the last 3 joins as recent activity
                    const recentJoins = communityData.creator_join_order.slice(-3).reverse();

                    recentJoins.forEach((joinData: any, index: number) => {
                        // Find the corresponding user in creators array
                        const creator = communityData.creators?.find((c: any) => c._id === joinData.user);

                        if (creator) {
                            recentActivities.push({
                                id: `join_${creator._id}_${index}`,
                                user: {
                                    name: creator.username || 'Unknown User',
                                    username: creator.username || 'unknown',
                                    avatar: creator.profile_photo || 'https://strmly-videos-dev-mumbai.s3.ap-south-1.amazonaws.com/defaut_user_profile_photo.jpg'
                                },
                                action: creator._id === communityData.founder._id ? 'follow your community' : 'Join your community',
                                actionType: creator._id === communityData.founder._id ? 'follow' : 'join',
                                timestamp: new Date(joinData.joined_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })
                            });
                        }
                    });
                }
            }

            // Sort by most recent and limit to 5 items
            setRecentActivity(recentActivities.slice(0, 5));
            console.log(`📊 Recent activity set for ${communityId}:`, recentActivities.length, 'items');

        } catch (error) {
            console.error(`❌ Error fetching recent activity for ${communityId}:`, error);
            // Set empty array on error to prevent undefined access
            setRecentActivity([]);
        }
    };

    const fetchCommunityData = async () => {
        if (!token) {
            console.error('❌ No token available');
            return;
        }

        if (!communityId) {
            console.error('❌ No community ID provided');
            return;
        }

        setLoading(true);
        console.log(`🔄 Fetching data for community: ${communityId}`);
        
        try {
            // Fetch data for the specific community ID provided in params
            const communityResponse = await fetch(
                `${CONFIG.API_BASE_URL}/community/${communityId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (communityResponse.ok) {
                const communityData = await communityResponse.json();
                console.log(`✅ Community data fetched for ${communityId}:`, {
                    name: communityData.name,
                    totalCreators: communityData.creators?.length || 0,
                    totalVideos: (communityData.long_videos?.length || 0) + (communityData.series?.length || 0),
                    totalFollowers: communityData.followers?.length || 0
                });

                // Extract data from the API response structure
                setStats({
                    communityFee: communityData.analytics?.total_revenue || 0,
                    totalCreators: communityData.creators?.length || 0,
                    totalVideos: (communityData.long_videos?.length || 0) + (communityData.series?.length || 0),
                    totalFollowers: communityData.followers?.length || 0
                });

                // Fetch appropriate data based on active tab
                if (activeTab === 'revenue') {
                    await fetchTransactionHistory(communityId);
                } else {
                    await fetchRecentActivity(communityId);
                }
            } else {
                throw new Error(`Failed to fetch community data: ${communityResponse.status}`);
            }

        } catch (error) {
            console.error(`❌ Error fetching community data for ${communityId}:`, error);
            // Set empty stats on error
            setStats({
                communityFee: 0,
                totalCreators: 0,
                totalVideos: 0,
                totalFollowers: 0
            });
            setRecentActivity([]);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(0)}k`;
        }
        return num.toString();
    };

    const handleDropdownPress = () => {
        if (dropdownButtonRef.current) {
            dropdownButtonRef.current.measure((fx, fy, width, height, px, py) => {
                setDropdownPosition({
                    top: py + height + 5, // Position below the button with small gap
                    right: Dimensions.get('window').width - px - width, // Align right edge
                });
                setShowTimeDropdown(true);
            });
        }
    };

    // Show error if no community ID
    if (!communityId) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <Text className="text-white text-lg" style={{ fontFamily: 'Poppins' }}>
                    No community selected
                </Text>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    className="mt-4 px-6 py-3 bg-blue-600 rounded-lg"
                >
                    <Text className="text-white" style={{ fontFamily: 'Poppins' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3"
            style={{paddingTop : -10}}
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-2xl font-semibold" style={{ fontFamily: 'Poppins' }}>Analytics</Text>
                <View className="w-6" />
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Tab Switcher */}
                <View className="flex-row mt-6 mb-6">
                    <TouchableOpacity
                        onPress={() => setActiveTab('non-revenue')}
                        className={`flex-1 pb-3 ${activeTab === 'non-revenue' ? 'border-b-2 border-white' : ''}`}
                    >
                        <Text className={`text-center text-xl ${activeTab === 'non-revenue' ? 'text-white font-semibold' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins' }}>
                            Non-revenue
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('revenue')}
                        className={`flex-1 pb-3 ${activeTab === 'revenue' ? 'border-b-2 border-white' : ''}`}
                    >
                        <Text className={`text-center text-xl ${activeTab === 'revenue' ? 'text-white font-semibold' : 'text-gray-400'}`} style={{ fontFamily: 'Poppins' }}>
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
                            colors={['#000000', '#0a0a0a', '#1a1a1a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="rounded-2xl p-6 mb-6"
                            style={{
                                width: 360,
                                height: activeTab === 'revenue' ? 110 : 166,
                                alignSelf: 'center',
                                borderRadius: 10
                            }}
                        >
                            {/* Time Filter */}
                            <View className="flex-row justify-between items-center mb-4"
                            style={{paddingRight: Platform.OS == "ios" ? 2 : 0}}
                            >
                                <Text className="text-white text-lg font-medium" style={{ fontFamily: 'Inter' }}>
                                    {activeTab === 'revenue' ? 'Community fee' : 'Total creators'}
                                </Text>
                                <TouchableOpacity
                                    ref={dropdownButtonRef}
                                    onPress={handleDropdownPress}
                                    className="flex-row items-center border border-gray-600 rounded-lg px-3 py-2"
                                >
                                    <Text className="text-white text-sm mr-2" style={{ fontFamily: 'Inter' }}>{timeFilter}</Text>
                                    <ChevronDown size={16} color="white" />
                                </TouchableOpacity>
                            </View>

                            {/* Main Stat */}
                            <Text className="text-white text-3xl font-bold mb-4" style={{ fontFamily: 'Inter' }}>
                                {activeTab === 'revenue'
                                    ? `₹ ${stats?.communityFee || '0'}`
                                    : `${stats?.totalCreators || '0'}`
                                }
                            </Text>

                            {/* Stats Content */}
                            {activeTab === 'non-revenue' ? (
                                <View className="space-y-2 px-2">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 text-base" style={{ fontFamily: 'Inter' }}>Total Videos</Text>
                                        <Text className="text-white text-base" style={{ fontFamily: 'Inter' }}>{stats ? formatNumber(stats.totalVideos || 0) : '0'}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 text-base" style={{ fontFamily: 'Inter' }}>Total followers</Text>
                                        <Text className="text-white text-base" style={{ fontFamily: 'Inter' }}>{stats ? formatNumber(stats.totalFollowers || 0) : '0'}</Text>
                                    </View>
                                </View>
                            ) : null}
                        </LinearGradient>
                    </>
                )}
            </ScrollView>

            {/* Time Filter Modal Dropdown */}
            <Modal
                visible={showTimeDropdown}
                transparent
                animationType="none"
                onRequestClose={() => setShowTimeDropdown(false)}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    }}
                    onPress={() => setShowTimeDropdown(false)}
                >
                    <View
                        style={{
                            position: 'absolute',
                            top: dropdownPosition.top,
                            right: dropdownPosition.right,
                            backgroundColor: "#000000",
                            borderRadius: 12,
                            minWidth: 150,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,
                            elevation: 5,
                            borderWidth: 1,
                            borderColor: "#333333",
                        }}
                    >
                        {timeFilterOptions.map((option, index) => (
                            <TouchableOpacity
                                key={option}
                                onPress={() => {
                                    setTimeFilter(option);
                                    setShowTimeDropdown(false);
                                }}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderBottomWidth: index === timeFilterOptions.length - 1 ? 0 : 1,
                                    borderBottomColor: "#333333",
                                }}
                            >
                                <Text
                                    style={{
                                        color: timeFilter === option ? "#F1C40F" : "white",
                                        fontSize: 14,
                                        fontFamily: "Inter",
                                    }}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

export default CommunityAnalytics;

