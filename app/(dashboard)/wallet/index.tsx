import {
  View,
  Text,
  Dimensions,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";

import React, { useState, useEffect } from "react";
import ThemedView from "@/components/ThemedView";
import CommonTopBar from "@/components/CommonTopBar";
import { router } from "expo-router";
import WalletButtons from "./_components/WalletButtons";
import TotalBalanceHistory from "./_components/TotalBalanceHistory";
import TotalWalletHistory from "./_components/TotalWalletHistory";
import RevenueHistory from "./_components/RevenueHistory";
import { useWallet } from "./_components/useWallet";
import { useAuthStore } from "@/store/useAuthStore";
import { useDashboard } from "../profile/_components/useDashboard";
import BottomNavBar from "@/components/BottomNavBar";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

const WalletPage = () => {
  // Get token from auth store
  const { token } = useAuthStore();

  const {
    walletData,
    withdrawals,
    isLoading,
    error,
    fetchWalletDetails,
    createLoadOrder,
    verifyPayment,
    requestWithdrawal,
    clearError,
  } = useWallet(token || "");

  // Get revenue data from dashboard to ensure consistency
  const { revenueBreakdown, loading: dashboardLoading } = useDashboard(
    token || "",
    "revenue"
  );

  const [isOpenTBalance, setIsOpenTotalBalance] = useState<boolean>(false);
  const [isOpenWBalance, setIsOpenWalletBalance] = useState<boolean>(false);
  const [isOpenRevenue, setIsOpenRevenue] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Handle withdrawal request
  const handleWithdrawalRequest = () => {
    router.push("/(payments)/Video/Video-Gifting?mode=withdraw");
  };

  // Show error alert when error occurs
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearError }]);
    }
  }, [error]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={[]}>
      
      <ThemedView
        style={{
          backgroundColor: showSuccessModal ? "#B0B0B0BB" : "black",
        }}
        className="flex-1 relative gap-8 py-4 px-4"
      >
        {showSuccessModal && (
          <Modal transparent visible={showSuccessModal} animationType="fade">
            <TouchableWithoutFeedback
              onPress={() => setShowSuccessModal(false)}
            >
              <View className="flex-1 bg-transparent bg-opacity-80 bottom-60 items-center justify-end px-5 right-0">
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View className="bg-[#1E1E1E] p-6 rounded-xl">
                    <Text className="text-white text-base text-center mb-2 font-semibold">
                      Your withdrawal request of ₹500 has been successfully
                      placed.
                    </Text>
                    <Text className="text-gray-300 text-sm text-center">
                      Processing Time: It may take 3 to 7 working days.
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
        {isOpenTBalance || isOpenWBalance || isOpenRevenue ? (
          <View>
            {isOpenTBalance ? (
              <TotalBalanceHistory closeTBalance={setIsOpenTotalBalance} />
            ) : isOpenWBalance ? (
              <TotalWalletHistory closeTBalance={setIsOpenWalletBalance} />
            ) : (
              <RevenueHistory closeTBalance={setIsOpenRevenue} />
            )}
          </View>
        ) : (
          <>
            <CommonTopBar />
            <View className="gap-5 mt-5">
              {/* Card 1 */}
              <View className="bg-[#B0B0B033] p-4 rounded-xl h-[91px]">
                <Pressable
                  onPress={() => setIsOpenTotalBalance(!isOpenTBalance)}
                >
                  <View className="justify-center gap-3">
                    <Text className="text-[14px] text-white">
                      Total balance
                    </Text>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-[28px] text-white">
                        ₹ {walletData?.balance?.toFixed(2) || "0.00"}
                      </Text>
                    )}
                  </View>
                </Pressable>
              </View>

              {/* Additional Cards */}
              <View className="flex-row items-center h-[91px] justify-between gap-4">
                {/* Card 2 */}
                <Pressable
                  onPress={() => setIsOpenWalletBalance(!isOpenWBalance)}
                  className="flex-1"
                >
                  <View className="bg-[#B0B0B033] justify-center gap-2 rounded-xl h-full items-center p-4">
                    <Text className="text-[14px] text-white">
                      Total Spending
                    </Text>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-[28px] text-white">
                        ₹ {walletData?.totalSpent?.toFixed(2) || "0.00"}
                      </Text>
                    )}
                  </View>
                </Pressable>

                {/* Card 3 */}
                <Pressable
                  onPress={() =>
                    router.push("/(dashboard)/profile/Dashboard?tab=revenue")
                  }
                  className="flex-1"
                >
                  <View className="bg-[#B0B0B033] flex-1 justify-center gap-2 items-center h-full rounded-xl p-4">
                    <Text className="text-[14px] text-white">Revenue</Text>
                    {isLoading || dashboardLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-[28px] text-white">
                        ₹{" "}
                        {revenueBreakdown?.estimateRevenue?.toFixed(2) ||
                          "0.00"}
                      </Text>
                    )}
                  </View>
                </Pressable>
              </View>

              {/* <Text className="text-white text-lg">Withdrawals request</Text> */}
              {withdrawals.length > 0 ? (
                withdrawals.slice(0, 3).map((withdrawal) => (
                  <View
                    key={withdrawal.id}
                    className="relative flex-row w-full items-center gap-3"
                  >
                    {/* Profile Picture */}
                    {/* <Image
                    source={require("../../../assets/images/bank-icon.png")}
                    className="w-12 h-12 rounded-full bg-gray-500"
                  /> */}

                    {/* User Info */}
                    {/* <View className="justify-center gap-1 items-start">
                    <Text className="text-sm text-white">
                      Withdraw request from wallet
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Status: {withdrawal.status}
                    </Text>
                  </View> */}

                    {/* <Text className="text-[#FF8D28] absolute right-0">
                    -₹{withdrawal.amount}
                  </Text> */}
                  </View>
                ))
              ) : (
                <Text className="text-gray-400 text-center">
                  {/* No withdrawal requests */}
                </Text>
              )}
            </View>

            <View className="absolute w-full top-[80%] right-0 left-4">
              <WalletButtons
                onWithdraw={handleWithdrawalRequest}
                onCreateOrder={createLoadOrder}
                onVerifyPayment={verifyPayment}
                onRefreshWallet={fetchWalletDetails}
                walletBalance={walletData?.balance || 0}
              />
            </View>

            {/* Bottom Navigation Bar */}
           
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
};

export default WalletPage;