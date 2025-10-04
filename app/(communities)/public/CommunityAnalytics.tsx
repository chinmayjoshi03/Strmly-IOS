import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Image,
    Alert
} from 'react-native';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

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
        avatar: string;
    };
    action: string;
    timestamp: string;
}

const CommunityAnalytics = () => {
    const [activeTab, setActiveTab] = useState<'non-revenue' | 'revenue'>('revenue');
    const [timeFilter, setTimeFilter] = useState('Last 30 Days');
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const [stats, setStats] = useState<CommunityStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    
    const router = useRouter();
    const { token } = useAuthStore();

    const timeFilterOptions = [
        'Last 7 Days',
        'Last 30 Days',
        'Last 90 Days',
        'Last Year'
    ];

    useEffect(() => {
        fetchCommunityData();
    }, [activeTab, timeFilter]);

    const fetchCommunityData = async () => {
        setLoading(true);
        try {
            // Mock data for development
            setStats({
                communityFee: 345.5,
                totalCreators: 120,
                totalVideos: 23000,
                totalFollowers: 23000
            });

            if (activeTab === 'revenue') {
                setRecentActivity([
                    {
                        id: '1',
                        user: { name: 'Rishab raj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rishab' },
                        action: 'Join your community',
                        timestamp: '13 June 2025'
                    },
                    {
                        id: '2',
                        user: { name: 'Rishab raj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rishab2' },
                        action: 'Join your community',
                        timestamp: '13 June 2025'
                    },
                    {
                        id: '3',
                        user: { name: 'Rishab raj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rishab3' },
                        action: 'Join your community',
                        timestamp: '13 June 2025'
                    },
                    {
                        id: '4',
                        user: { name: 'Rishab raj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rishab4' },
                        action: 'Join your community',
                        timestamp: '13 June 2025'
                    },
                    {
                        id: '5',
                        user: { name: 'Rishab raj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rishab5' },
                        action: 'Join your community',
                        timestamp: '13 June 2025'
                    }
                ]);
            } else {
                setRecentActivity([
                    {
                        id: '1',
                        user: { name: 'Rishab raj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rishab' },
                        action: 'follow your community',
                        timestamp: '13 June 2025'
                    },
                    {
                        id: '2',
                        user: { name: 'Rishab raj', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rishab2' },
                        action: 'post a video on your community',
                        timestamp: '13 June 2025'
                    }
                ]);
            }
        } catch (error) {
            console.error('Error fetching community data:', error);
            Alert.alert('Error', 'Failed to load community data');
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

    return (
        <View className="flex-1 bg-black">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 mt-12">
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
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-white text-lg font-medium" style={{ fontFamily: 'Inter' }}>
                                    {activeTab === 'revenue' ? 'Community fee' : 'Total creators'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowTimeDropdown(!showTimeDropdown)}
                                    className="flex-row items-center border border-gray-600 rounded-lg px-3 py-2"
                                >
                                    <Text className="text-white text-sm mr-2" style={{ fontFamily: 'Inter' }}>{timeFilter}</Text>
                                    <ChevronDown size={16} color="white" />
                                </TouchableOpacity>
                            </View>

                            {/* Time Filter Dropdown */}
                            {showTimeDropdown && (
                                <View className="absolute right-6 top-20 rounded-lg border border-gray-600 z-10" style={{ backgroundColor: '#0a0a0a' }}>
                                    {timeFilterOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            onPress={() => {
                                                setTimeFilter(option);
                                                setShowTimeDropdown(false);
                                            }}
                                            className="px-4 py-3 border-b border-gray-700 last:border-b-0"
                                        >
                                            <Text className="text-white text-base" style={{ fontFamily: 'Inter' }}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Main Stat */}
                            <Text className="text-white text-3xl font-bold mb-4" style={{ fontFamily: 'Inter' }}>
                                {activeTab === 'revenue' 
                                    ? `₹ ${stats?.communityFee || '0'}` 
                                    : `${stats?.totalCreators || '0'}`
                                }
                            </Text>

                            {/* Stats Content */}
                            {activeTab === 'non-revenue' && (
                                <View className="space-y-2 -mx-50">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 text-base" style={{ fontFamily: 'Inter' }}>Total Videos</Text>
                                        <Text className="text-white text-base" style={{ fontFamily: 'Inter' }}>{stats ? formatNumber(stats.totalVideos || 0) : '0'}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 text-base" style={{ fontFamily: 'Inter' }}>Total followers</Text>
                                        <Text className="text-white text-base" style={{ fontFamily: 'Inter' }}>{stats ? formatNumber(stats.totalFollowers || 0) : '0'}</Text>
                                    </View>
                                </View>
                            )}
                        </LinearGradient>

                        {/* Recent Activity */}
                        {/* <View className="mb-6">
                            <Text className="text-white text-2xl font-semibold mb-4">Recent</Text>
                            <View className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <View key={activity.id} className="flex-row items-center">
                                        <Image
                                            source={{ uri: activity.user.avatar }}
                                            className="w-10 h-10 rounded-full mr-3"
                                        />
                                        <View className="flex-1">
                                            <Text className="text-white text-lg">
                                                <Text className="font-semibold">{activity.user.name}</Text>
                                                <Text className="text-gray-400"> {activity.action}</Text>
                                            </Text>
                                            <Text className="text-gray-500 text-base">{activity.timestamp}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View> */}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default CommunityAnalytics;