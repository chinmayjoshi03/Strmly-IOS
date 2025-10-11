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
import { useMonetizationStore } from "@/store/useMonetizationStore";
import { useNavigation, router } from "expo-router";
import Constants from "expo-constants";
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

  const navigation = useNavigation<any>();

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

  const openModal = (config: any) => {
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
    } catch (error: any) {
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

  const [deleteStep, setDeleteStep] = useState(0); // 0: initial, 1: first warning, 2: second warning, 3: delete

  // Start the delete process - show first warning
  const startDeleteProcess = () => {
    setDeleteStep(1);
    openModal(modalTypes.deleteWarning1);
  };

  // Handle first warning confirmation - show second warning
  const handleFirstWarningConfirm = () => {
    setDeleteStep(2);
    closeModal();
    setTimeout(() => {
      openModal(modalTypes.deleteWarning2);
    }, 100);
  };

  // Actually delete the account
  const handleFinalDelete = async () => {
    try {
      console.log("🗑️ Starting account deletion...");

      const response = await fetch(`${BACKEND_API_URL}/caution/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account.");
      }

      console.log("✅ Account deleted successfully");

      // Clear auth data and navigate to sign up/sign in
      logout();

      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.reset({
                routes: [{ name: "(auth)/Sign-up" }],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ Account deletion failed:", error);
      Alert.alert(
        "Deletion Error",
        error.message || "An unexpected error occurred while deleting your account."
      );
    } finally {
      setDeleteStep(0);
      closeModal();
    }
  };

  const handleDeleteCancel = () => {
    setDeleteStep(0);
    closeModal();
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
    deleteWarning1: {
      title: "⚠️ FIRST WARNING ⚠️\n\nYou are about to permanently delete your account. This action will:\n\n• Remove all your personal data permanently\n• Delete all your content and videos\n• Cancel all active subscriptions\n• Remove access to all purchased content\n\nThis action CANNOT be undone.",
      useButtons: true,
      primaryButtonText: "Continue",
      onPrimaryButtonPress: handleFirstWarningConfirm,
      secondaryButtonText: "Cancel",
      onSecondaryButtonPress: handleDeleteCancel,
    },
    deleteWarning2: {
      title: "🚨 FINAL WARNING 🚨\n\nThis is your LAST CHANCE to cancel!\n\nOnce you proceed:\n• Your account will be PERMANENTLY deleted\n• All data will be IRREVERSIBLY lost\n• You will be logged out immediately\n• You cannot recover your account\n\nAre you absolutely sure you want to delete your account?",
      useButtons: true,
      primaryButtonText: "Delete",
      onPrimaryButtonPress: handleFinalDelete,
      secondaryButtonText: "Cancel",
      onSecondaryButtonPress: handleDeleteCancel,
    },
  };

  return (
    <ThemedView style={{ height, flex: 1 }}>
      <SafeAreaView edges={[]}>
        <View>
          <ProfileTopbar name="Setting" isMore={false} hashtag={false} />
        </View>

        <View className="mt-4 items-start mx-5 gap-5 w-full">
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
          {/* <Pressable
            onPress={() => router.push("/(dashboard)/wallet")}
            className="w-full"
          >
            <Text className="text-white text-lg">Wallet</Text>
          </Pressable> */}

          <Pressable
            onPress={() => router.push("/(dashboard)/wallet")}
            className="w-full"
          >
            <Text className="text-white text-lg">Wallet</Text>
          </Pressable>

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
            onPress={() => {
              setDeleteStep(0);
              startDeleteProcess();
            }}
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
