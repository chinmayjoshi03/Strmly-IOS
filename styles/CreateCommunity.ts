import { StyleSheet } from "react-native";

export const CreateCommunityStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 0,
        width: '100%',
        alignItems:'center'
    },
    CreateCommunityTopBar: {
        width: '100%',
        height: 60,
        paddingHorizontal:8,
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
        borderColor:'white',
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10
    },
    InfoContainer: {
        width: '100%',
        textAlign: 'left',
    },
    InfoLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        width: '100%',
        marginTop: 10
    },
    TextLabel: {
        borderBottomWidth: 1,
        color: 'white',
        borderColor: '#FFFFFF33',
        width: '100%',
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        marginTop: 10,
    },
    InfoFrame: {
        alignItems: 'center',
        marginTop: 20,
        marginLeft: 20,
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderColor: "#333",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#000",
    },
    CreatorPassButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderColor: "#333",
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 20,
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
        position: 'absolute',
        top: '51%',
        left: '22%',
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    dropdownBox: {
        backgroundColor: "#111",
        borderRadius: 10,
        paddingVertical: 10,
        width: 150,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    dropdownItemText: {
        color: "#fff",
        fontFamily: "Poppins-Medium",
        fontSize: 16,
    },
    ExtraInfo: {
        fontFamily: 'Poppins-ExtraLight',
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
});