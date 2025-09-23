import {
  View,
  Text,
  Pressable,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import ThemedView from "@/components/ThemedView";
import ProfileTopbar from "@/components/profileTopbar";
import ActionModal from "./_component/customModal";
import { useAuthStore } from "@/store/useAuthStore";
// Make sure this import matches your store export
import { useMonetizationStore } from "@/store/useMonetizationStore";
import { router, useNavigation } from "expo-router";
import Constants from "expo-constants";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

const Setting = () => {
  const { logout, token } = useAuthStore();

  // Add error boundary for store usage
  let monetizationHook;
  try {
    monetizationHook = useMonetizationStore();
  } catch (error) {
    console.error("Error accessing monetization store:", error);
    // Provide fallback values
    monetizationHook = {
      monetizationStatus: null,
      toggleCommentMonetization: async () => { },
      fetchMonetizationStatus: async () => { },
      loading: false,
    };
  }

  const {
    monetizationStatus,
    toggleCommentMonetization,
    fetchMonetizationStatus,
    loading: isMonetizationLoading,
  } = monetizationHook;

  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  const [modalConfig, setModalConfig] = useState({
    isVisible: false,
    title: "",
    specialText: false,
    useButtons: false,
    primaryButtonText: "",
    onPrimaryButtonPress: () => { },
    secondaryButtonText: "",
    info: "",
    confirmRequest: "",
  });

  const openModal = (config) => {
    setModalConfig({ ...config, isVisible: true });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isVisible: false }));
  };

  const handleMonetization = async () => {
    if (!token) return;

    console.log("💰 Settings: Toggling comment monetization...");
    console.log(
      "💰 Current status:",
      monetizationStatus?.comment_monetization_status
    );

    try {
      await toggleCommentMonetization(token);
      console.log("✅ Settings: Comment monetization toggled successfully");

      // Refresh the status to ensure UI is updated
      setTimeout(() => {
        fetchMonetizationStatus(token, true);
      }, 1000);
    } catch (error) {
      console.error("❌ Settings: Failed to toggle monetization:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update monetization settings"
      );
    } finally {
      closeModal();
    }
  };

  useEffect(() => {
    if (token && fetchMonetizationStatus) {
      fetchMonetizationStatus(token);
    }
  }, [token, fetchMonetizationStatus]);

  const handleLogout = () => {
    logout();
    navigation.reset({
      routes: [{ name: "(auth)/Sign-up" }],
    });
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/caution/request-account-deletion`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit deletion request.");
      }

      Alert.alert(
        "Account Deletion Initiated",
        "Your account deletion request has been submitted successfully.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert(
        "Deletion Error",
        error.message || "An unexpected error occurred."
      );
      closeModal();
    }
  };

  const openURL = async (url: any) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Could not open the link");
    }
  };

  const modalTypes = {
    support: {
      title: "Contact and Support",
      info: "For any assistance or inquiries, please contact us at support@strmly.com",
    },
    monetization: {
      title: !monetizationStatus?.comment_monetization_status
        ? "By enabling Comment Monetization, your new comments will be monetized and can't be edited or deleted. To edit or delete future comments, you must first turn off monetization. Strmly may revoke access in case of abuse or policy violations. By continuing, you agree to our"
        : "By turning off Comment Monetization, your future comments will no longer be monetized and can be edited or deleted as usual. Previously monetized comments will remain locked and cannot be changed. By continuing, you agree to our",
      useButtons: true,
      specialText: true,
      primaryButtonText: "Agree",
      onPrimaryButtonPress: handleMonetization,
      secondaryButtonText: "Cancel",
    },
    logout: {
      title: "Are you sure you want to log out?",
      useButtons: true,
      primaryButtonText: "Logout",
      onPrimaryButtonPress: handleLogout,
      secondaryButtonText: "Cancel",
    },
    delete: {
      title: `Before sending this request, ensure that your Creator Pass has been deactivated for at least one month, and you have transferred ownership of all your communities. After submitting the request, you must not monetize new content, series, comments, or create new communities. If you do, your request will be denied.

The review process takes 2–4 days. During this time, you can still access your account, but certain actions like monetization creation will be restricted.

Once approved, the "Delete Account" button will be activated in your settings. After deletion, all your personal data will be permanently removed. Your monetized content will remain accessible only to users who have already paid, but it will be unpublished and hidden from others.

By submitting this request, you confirm that you understand and agree to our`,
      confirmRequest:
        "Are you sure you want to send request to activate  ? This action is irreversible and cannot be undone.",
      useButtons: true,
      specialText: true,
      primaryButtonText: "Agree",
      onPrimaryButtonPress: handleDeleteAccount,
      secondaryButtonText: "Cancel",
      info: "Delete",
    },
  };

  return (
    <ThemedView style={{ height, flex: 1 }}>
      <SafeAreaView edges={[]}>
        <View>
          <ProfileTopbar name="Setting" isMore={false} hashtag={false} />
        </View>

        <View className="mt-14 items-start mx-5 gap-5 w-full">
          {/* Monetization Toggle */}
         <View className="flex-row items-center justify-between w-full">
            {/* <Text className="text-white text-lg">
              Activate comment monetization
            </Text> */}
            {/* {isMonetizationLoading ? (
              <ActivityIndicator className="size-6 mr-6" />
            ) : (
              // <Pressable
              //   onPress={() => openModal(modalTypes.monetization)}
              //   className="mr-6"
              // >
              //   <Image
              //     source={
              //       monetizationStatus?.comment_monetization_status
              //         ? require("../../assets/images/switch-green.png")
              //         : require("../../assets/images/switch.png")
              //     }
              //     className="size-6"
              //   />
              // </Pressable>
            )} */}
          </View>*/

          {/* Action Buttons */}
          <Pressable
            onPress={() => openModal(modalTypes.support)}
            className="w-full"
          >
            <Text className="text-white text-lg">Contact and Support</Text>
          </Pressable>

          <Pressable
            onPress={() => openURL("https://www.strmly.com/legal/privacy")}
            className="w-full"
          >
            <Text className="text-white text-lg">Privacy Policy</Text>
          </Pressable>

          <Pressable
            onPress={() => openURL("https://www.strmly.com/legal/terms")}
            className="w-full"
          >
            <Text className="text-white text-lg">Term of Use</Text>
          </Pressable>

          <Pressable
            onPress={() => openModal(modalTypes.logout)}
            className="w-full"
          >
            <Text className="text-white text-lg">Logout</Text>
          </Pressable>

          <Pressable
            onPress={() => openModal(modalTypes.delete)}
            className="w-full"
          >
            <Text className="text-red-500 text-lg">Delete Account</Text>
          </Pressable>
        </View>

        <ActionModal
          isVisible={modalConfig.isVisible}
          onClose={closeModal}
          title={modalConfig.title}
          specialText={modalConfig.specialText}
          useButtons={modalConfig.useButtons}
          primaryButtonText={modalConfig.primaryButtonText}
          onPrimaryButtonPress={modalConfig.onPrimaryButtonPress}
          secondaryButtonText={modalConfig.secondaryButtonText}
          onSecondaryButtonPress={closeModal}
          info={modalConfig.info}
          confirmRequest={modalConfig.confirmRequest}
        />
      </SafeAreaView>
    </ThemedView>
  );
};

export default Setting;
