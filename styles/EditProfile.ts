import { StyleSheet } from "react-native";

export const EditProfile = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 0,
        width: '100%',
    },
    CreateCommunityTopBar: {
        width: '100%',
        height: 60,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
    },
    BackIcon: {
        width: 24,
        height: 24,
    },
    CommunityAvatar: {
        borderWidth: 1,
        borderColor: 'white',
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10
    },
    RightTab: {
        // textAlign: 'right',
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color:'#0088FF',
        textAlign: 'center'
    },
    InfoContainer: {
        width: '100%',
        textAlign: 'left',
    },
    InfoLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#fff',
        width: 80,
        textAlign: 'left',
    },
    TextLabel: {
        flex: 1,
        borderBottomWidth: 0.5,
        borderColor: '#FFFFFF33',
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#FFFFFF',
        paddingVertical: 8,
    },
    InfoFrame: {
        alignItems: 'flex-start',
        marginTop: 20,
        paddingHorizontal: 20,
        display: 'flex',
        flexDirection: 'row',
        gap: 20
    },
    wrapper: {
        width: "90%",
        marginTop: 20,
    },
    label: {
        color: "#fff",
        fontFamily: "Poppins-Medium",
        fontSize: 14,
        marginBottom: 5,
    },
    dropdownTrigger: {
        width: '80%',
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderColor: "#333",
        borderBottomWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#000",
    },
    CreatorPassButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        borderColor: "white",
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 20,
        marginHorizontal: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#000",
    },
    dropdownText: {
        fontFamily: "Poppins-Medium",
        fontSize: 14,
    },
    arrow: {
        marginLeft: 10,
        fontSize: 14,
        color: "#fff",
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    dropdownBox: {
        backgroundColor: "#111",
        borderRadius: 10,
        paddingVertical: 10,
        width: '85%',
        maxWidth: 350,
        maxHeight: '70%',
        borderWidth: 1,
        borderColor: "#333",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    dropdownItemText: {
        color: "#B0B0B0",
        fontFamily: "Poppins-Medium",
        fontSize: 14,
    },
    ExtraInfo: {
        fontFamily: 'Poppins-ExtraLight',
        textAlign: 'center',
        fontSize: 12,
        opacity: 0.6
    },
    GenderInterestGroup: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 30,
        gap: 20,
    },

    FieldWrapper: {
        width: '100%',
    },

    FieldLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#fff',
        marginBottom: 8,
    },
    TopBarTitle: {
        fontFamily: "Poppins-SemiBold",
        fontSize: 16,
        color: "#fff",
        textAlign: "center",
        flex: 1,
        marginHorizontal: 10,
    },
    SaveText: {
        fontFamily: "Poppins-Medium",
        fontSize: 14,
        color: "#2196F3",
        minWidth: 40,
        textAlign: "right",
    },
    EditProfilePicText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#2196F3',
        marginBottom: 10,
    },
    TwoFieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    HalfField: {
        flex: 1,
    },
    CreatorPassText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        width: '100%',
    },

});