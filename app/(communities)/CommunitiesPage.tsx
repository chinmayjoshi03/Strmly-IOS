import React, { useState } from "react";
import { CommunitiesStyles } from "@/styles/Community";
import { View, Text, TextInput, FlatList, StatusBar, TouchableOpacity, Image, ScrollView, } from "react-native";
import { useFonts } from "expo-font";
import ThemedText from "@/components/ThemedText";
import { CreateProfileStyles } from "@/styles/createprofile";
import { getDeviceInfo, getResponsiveStyles } from "@/utils/deviceUtils";

const data = [
    { id: "1", Name: "Startup india", pageURL: '', Avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
    { id: "2", Name: "Startup india", pageURL: '', Avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
    { id: "3", Name: "Startup india", pageURL: '', Avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
    { id: "4", Name: "Startup india", pageURL: '', Avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
    { id: "5", Name: "Startup india", pageURL: '', Avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
    { id: "6", Name: "Startup india", pageURL: '', Avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
    { id: "7", Name: "Startup india", pageURL: '', Avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
    { id: "8", Name: "Startup india", pageURL: '', Avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
    { id: "9", Name: "Startup india", pageURL: '', Avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
];


const CommunitiesPage: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<number>(0);
    const tabs = ["Followers", "my community", "Communities", "Following"];

    // Get device info and responsive styles
    const deviceInfo = getDeviceInfo();
    const responsiveStyles = getResponsiveStyles();
    const [fontsLoaded] = useFonts({
        'Poppins-Regular': require('../../assets/fonts/poppins/Poppins-Regular.ttf'),
        'Poppins-Bold': require('../../assets/fonts/poppins/Poppins-Bold.ttf'),
        'Poppins-SemiBold': require('../../assets/fonts/poppins/Poppins-SemiBold.ttf'),
        'Poppins-Medium': require('../../assets/fonts/poppins/Poppins-Medium.ttf'),
        'Poppins-Light': require('../../assets/fonts/poppins/Poppins-Light.ttf'),
        'Inter-Light': require('../../assets/fonts/inter/Inter-Light.ttf'),
        'Inter-Regular': require('../../assets/fonts/inter/Inter-Regular.ttf'),
        'Inter-SemiBold': require('../../assets/fonts/inter/Inter-SemiBold.ttf'),
        'Inter-Bold': require('../../assets/fonts/inter/Inter-Bold.ttf'),
        'Inter-ExtraBold': require('../../assets/fonts/inter/Inter-ExtraBold.ttf'),
    });

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>LOADING...</Text>
            </View>);
    }

    return (
        <View style={CommunitiesStyles.container}>
            <View style={CreateProfileStyles.TopBar}>
                <ThemedText style={CommunitiesStyles.Tab}>Samarth Gupta</ThemedText>
                <TouchableOpacity
                    style={CreateProfileStyles.BackIcon}>
                    <Image
                        source={require('../../assets/icons/back.svg')}
                    />
                </TouchableOpacity>
            </View>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            {/*
            <View style={CommunitiesStyles.SelectionTab}>
                {tabs.map((label, index) => (
                    <TouchableOpacity style={[CommunitiesStyles.SelectionButton]} key={index} onPress={() => setSelectedTab(index)}>
                        <ThemedText style={[CommunitiesStyles.Tab, ...(selectedTab === index ? [CommunitiesStyles.SelectedText] : [])]}>
                            {label}
                        </ThemedText></TouchableOpacity>))}
            </View>*/}<View style={CommunitiesStyles.SelectionTab}>
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 8 }}
                >
                    {tabs.map((label, index) => (
                        <TouchableOpacity
                            style={[CommunitiesStyles.SelectionButton]}
                            key={index}
                            onPress={() => setSelectedTab(index)}
                        >
                            <ThemedText
                                style={[
                                    CommunitiesStyles.Tab,
                                    ...(selectedTab === index ? [CommunitiesStyles.SelectedText] : [])
                                ]}
                            >
                                {label}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            <TextInput
                placeholder="Search"
                placeholderTextColor="#ccc"
                style={[CommunitiesStyles.searchInput, responsiveStyles.searchInput]}
            />
            {(selectedTab === 0) && (
                <View>
                    <FlatList
                        data={data}
                        numColumns={1}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={CommunitiesStyles.followerRow}>
                                <Image
                                    source={{ uri: item.Avatar }}
                                    style={CommunitiesStyles.followerAvatar}
                                />

                                <View style={CommunitiesStyles.followerInfo}>
                                    <Text style={CommunitiesStyles.followerName}>{item.Name}</Text>
                                    <Text style={CommunitiesStyles.followerHandle}>@rahulsingh09</Text>
                                </View>

                                <View style={CommunitiesStyles.followerStatsContainer}>
                                    <Text style={CommunitiesStyles.followerCount}>3.4M</Text>
                                    <Text style={CommunitiesStyles.followerLabel}>Followers</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {(selectedTab === 1) && (
                <View>
                    <FlatList
                        data={data}
                        numColumns={1}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={CommunitiesStyles.CommunityContainer}>
                                <View style={CommunitiesStyles.CommunityRow}>
                                    <Image
                                        source={{ uri: item.Avatar }}
                                        style={CommunitiesStyles.avatar}
                                    />
                                    <View style={CommunitiesStyles.CommunityInfo}>
                                        <Text style={CommunitiesStyles.label}>{item.Name}</Text>
                                        <View style={CommunitiesStyles.statsRow}>
                                        </View>
                                    </View>
                                    <View style={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}>
                                        <Text style={CommunitiesStyles.statsHighlight}>5K</Text>
                                        <Text style={CommunitiesStyles.statsText}>Creators</Text>
                                    </View>
                                    <View style={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}>
                                        <Text style={CommunitiesStyles.statsHighlight}>3.4M</Text>
                                        <Text style={CommunitiesStyles.statsText}>Followers</Text>
                                    </View>
                                    <Text style={CommunitiesStyles.arrow}>&#x276F;</Text> {/* Unicode for ➤ */}
                                </View>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={CommunitiesStyles.grid}
                    />
                    <TouchableOpacity style={CommunitiesStyles.createButton}>
                        <Text style={CommunitiesStyles.createButtonText}>Create new community</Text>
                    </TouchableOpacity>
                </View>
            )}
            {(selectedTab === 2) && (
                <View>
                    <FlatList
                        data={data}
                        numColumns={1}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={CommunitiesStyles.CommunityContainer}>
                                <View style={CommunitiesStyles.CommunityRow}>
                                    <Image
                                        source={{ uri: item.Avatar }}
                                        style={CommunitiesStyles.avatar}
                                    />
                                    <View style={CommunitiesStyles.CommunityInfo}>
                                        <Text style={CommunitiesStyles.label}>{item.Name}</Text>
                                        <View style={CommunitiesStyles.statsRow}>
                                        </View>
                                    </View>
                                    <View style={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}>
                                        <Text style={CommunitiesStyles.statsHighlight}>5K</Text>
                                        <Text style={CommunitiesStyles.statsText}>Creators</Text>
                                    </View>
                                    <View style={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}>
                                        <Text style={CommunitiesStyles.statsHighlight}>3.4M</Text>
                                        <Text style={CommunitiesStyles.statsText}>Followers</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={CommunitiesStyles.grid}
                    />
                    <TouchableOpacity style={CommunitiesStyles.createButton}>
                        <Text style={CommunitiesStyles.createButtonText}>Create new community</Text>
                    </TouchableOpacity>
                </View>
            )}
            {(selectedTab === 3) && (
                <View>
                    <FlatList
                        data={data}
                        numColumns={1}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={CommunitiesStyles.followerRow}>
                                <Image
                                    source={{ uri: item.Avatar }}
                                    style={CommunitiesStyles.followerAvatar}
                                />

                                <View style={CommunitiesStyles.followerInfo}>
                                    <Text style={CommunitiesStyles.followerName}>{item.Name}</Text>
                                    <Text style={CommunitiesStyles.followerHandle}>@rahulsingh09</Text>
                                </View>

                                <View style={CommunitiesStyles.followerStatsContainer}>
                                    <Text style={CommunitiesStyles.followerCount}>3.4M</Text>
                                    <Text style={CommunitiesStyles.followerLabel}>Followers</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

        </View>
    );
};


export default CommunitiesPage;
