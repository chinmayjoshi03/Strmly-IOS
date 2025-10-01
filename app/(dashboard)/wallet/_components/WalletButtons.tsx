import { View, Text, Pressable, Alert, TextInput, Modal } from "react-native";
import React, { useState } from "react";
import AddMoneyModal from "./AddMoneyModal";
import { SafeAreaView } from "react-native-safe-area-context";

interface WalletButtonsProps {
  onWithdraw: () => void;
  onCreateOrder: (amount: number) => Promise<any>;
  onVerifyPayment: (
    // orderIdOrTransactionId: string,
    productId: string,
    receiptOrToken: string,
    amount: number,
    platform: string
  ) => Promise<any>;
  onRefreshWallet: () => void;
  walletBalance: number;
}

const WalletButtons: React.FC<WalletButtonsProps> = ({
  onWithdraw,
  onCreateOrder,
  onVerifyPayment,
  onRefreshWallet,
  walletBalance,
}) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const handleAddToWallet = () => {
    setShowAddMoneyModal(true);
  };

  const handleAddMoneySuccess = (amount: number) => {
    onRefreshWallet();
  };

  const handleWithdrawPress = () => {
    onWithdraw();
  };

  const handleWithdrawConfirm = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (amount > walletBalance) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }

    try {
      await onWithdraw();
      setShowWithdrawModal(false);
      setWithdrawAmount("");
    } catch (error) {
      Alert.alert("Error", "Failed to process withdrawal");
    }
  };

  return (
    <SafeAreaView style={{flex:1}} edges={[]}>
      <View className="gap-3 mb-36">
        <Pressable
          onPress={handleAddToWallet}
          className="bg-white rounded-3xl h-[45px] justify-center items-center"
        >
          <Text className="text-black text-base font-semibold">
            Add to wallet
          </Text>
        </Pressable>

        <Pressable
          onPress={handleWithdrawPress}
          className="bg-white rounded-3xl h-[45px] justify-center items-center"
        >
          <Text className="text-black text-base font-semibold">Withdraw</Text>
        </Pressable>
      </View>

      {/* Add Money Modal */}
      <AddMoneyModal
        visible={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
        onSuccess={handleAddMoneySuccess}
        onCreateOrder={onCreateOrder}
        onVerifyPayment={onVerifyPayment}
      />

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-center items-center px-5">
          <View className="bg-[#1E1E1E] p-6 rounded-xl w-full max-w-sm">
            <Text className="text-white text-lg font-semibold mb-4 text-center">
              Withdraw Money
            </Text>

            <Text className="text-gray-300 text-sm mb-2">
              Available Balance: ₹{walletBalance.toFixed(2)}
            </Text>

            <TextInput
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="Enter amount"
              placeholderTextColor="#666"
              keyboardType="numeric"
              className="bg-gray-800 text-white p-3 rounded-lg mb-4"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowWithdrawModal(false)}
                className="flex-1 bg-gray-600 p-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleWithdrawConfirm}
                className="flex-1 bg-white p-3 rounded-lg"
              >
                <Text className="text-black text-center font-semibold">
                  Withdraw
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WalletButtons;