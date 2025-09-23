import { StyleSheet } from "react-native";

export const CommunitiesStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 40,
        width: '100%'
    },
    searchInput: {
        fontFamily: 'Poppins-Medium',
        backgroundColor: "transparent",
        borderColor: "white",
        borderWidth: 1,
        color: "#fff",
        paddingHorizontal: 10,
        paddingVertical: 2,
        marginHorizontal: 8,
        borderRadius: 15,
        marginBottom: 15,
        fontSize: 15,
    },
    SelectionTab: {
        display: 'flex',
        flexDirection: 'row'
    },
    SelectionButton: {
        marginRight: 25,
        marginLeft: 25,
        marginBottom:15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    SelectedText: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        textDecorationLine: 'underline'
    },
    Tab: {
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
    },
    RightTab: {
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color:'#0088FF'
    },
    grid: {
        width: '100%',
        paddingBottom: 20,
    },
    label: {
        color: "#fff",
        fontSize: 15,
        fontFamily: 'Poppins-Medium',
        paddingHorizontal: 5,
        paddingVertical: 2,
        marginBottom: 5,
    },
    CommunityContainer: {
        width: '100%'
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },

    CommunityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomColor: '#333',
        borderBottomWidth: 1,
    },

    CommunityInfo: {
        flex: 1,
    },

    statsRow: {
        flexDirection: 'row',
        marginTop: 2,
    },
    
    SelectedButton:{
        borderBottomColor:"white",
        borderBottomWidth:1
    },
    statsText: {
        color: '#B0B0B0',
        fontSize: 12,
        fontFamily: 'Poppins-Light',
        marginRight: 10,
    },

    statsHighlight: {
        color:'white'
    },

    arrow: {
        color: '#fff',
        fontSize: 20,
    },

    createButton: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    createButtonText: {
        fontSize: 15,
        fontFamily: 'Poppins-Medium',
        color: '#000',
    },
        followerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: '#333',
    },

    followerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },

    followerInfo: {
        flex: 1,
    },

    followerName: {
        color: '#fff',
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },

    followerHandle: {
        color: '#B0B0B0',
        fontFamily: 'Inter-Light',
        fontSize: 12,
    },

    followerStatsContainer: {
        alignItems: 'flex-end',
    },

    followerCount: {
        color: '#ffffffff',
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },

    followerLabel: {
        color: '#B0B0B0',
        fontFamily: 'Inter-Light',
        fontSize: 12,
    } 
});
