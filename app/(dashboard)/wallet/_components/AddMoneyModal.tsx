// components/AddMoneyModal.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  validateAmount,
  initiateGooglePlayBilling,
} from "@/utils/paymentUtils";
import { finishTransaction } from "react-native-iap";

interface AddMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  onCreateOrder: (amount: number) => Promise<any>;
  // change onVerifyPayment to accept platform-agnostic payload
  onVerifyPayment: (
    orderIdOrTransactionId: string, // either purchaseToken/transactionId depending on platform
    productId: string,
    receiptOrToken: string, // purchaseToken (android) or transactionReceipt (ios)
    amount: number
  ) => Promise<any>;
  onError?: (error: Error) => void;
}

const quickAmounts = [10, 50, 100, 200, 500];

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onCreateOrder,
  onVerifyPayment,
  onError,
}) => {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setAmount("");
      setIsProcessing(false);
    }
  }, [visible]);

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleAddMoney = async () => {
    const validation = validateAmount(amount);
    if (!validation.isValid) {
      Alert.alert("Error", validation.error);
      return;
    }

    const numAmount = parseFloat(amount);
    setIsProcessing(true);

    try {
      // 1. create order on backend (if you use it)
      const order = await onCreateOrder(numAmount);
      if (!order) throw new Error("Failed to create wallet load order");

      // 2. initiate native billing flow (service handles requestPurchase and listener)
      const billingResult = await initiateGooglePlayBilling({
        amount: numAmount,
        currency: "INR",
      });

      // 3. validate required platform-specific fields
      if (billingResult.platform === "android") {
        if (!billingResult.purchaseToken || !billingResult.productId) {
          throw new Error("Incomplete Android purchase response");
        }
      } else {
        // iOS
        if (!billingResult.transactionReceipt || !billingResult.productId) {
          throw new Error("Incomplete iOS purchase response");
        }
      }

      // 4. call backend verification API with the right fields
      // use purchaseToken for Android, transactionReceipt for iOS
      await onVerifyPayment(
        billingResult.purchaseToken ?? billingResult.transactionId ?? "",
        billingResult.productId,
        billingResult.purchaseToken ?? billingResult.transactionReceipt ?? "",
        numAmount
      );

      // 5. backend verified successfully -> finish/acknowledge transaction
      try {
        await finishTransaction({
          purchase: billingResult.rawPurchase,
          isConsumable: true,
        });
      } catch (finishErr) {
        // not fatal for the user, but log it
        console.error("finishTransaction failed:", finishErr);
      }

      // 6. UI / success
      onSuccess(numAmount);
      Alert.alert("Success", `₹${numAmount} added to your wallet successfully!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("AddMoneyModal error:", err);
      Alert.alert("Error", err.message || "Payment failed");
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: "#111827", padding: 20 }}>
          <Text style={{ color: "white", fontSize: 18, textAlign: "center", marginBottom: 6 }}>Add Money to Wallet</Text>
          <Text style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center", marginBottom: 12 }}>Payment via store billing</Text>

          <Text style={{ color: "#D1D5DB", marginBottom: 8 }}>Quick Add</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {quickAmounts.map((q) => (
              <TouchableOpacity key={q} onPress={() => handleQuickAmount(q)} style={{ backgroundColor: "#374151", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8 }}>
                <Text style={{ color: "white" }}>₹{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {amount ? (
            <TextInput value={amount} editable={false} placeholderTextColor="#666" keyboardType="numeric" style={{ backgroundColor: "#111827", color: "white", padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: "#374151" }} />
          ) : null}

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={onClose} disabled={isProcessing} style={{ flex: 1, backgroundColor: "#4B5563", padding: 12, borderRadius: 12 }}>
              <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAddMoney} disabled={isProcessing || !amount} style={{ flex: 1, backgroundColor: isProcessing || !amount ? "#6B7280" : "#FFFFFF", padding: 12, borderRadius: 12 }}>
              {isProcessing ? (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={{ color: "#000", fontWeight: "600" }}>Processing...</Text>
                </View>
              ) : (
                <Text style={{ color: "#000", textAlign: "center", fontWeight: "600" }}>Pay ₹{amount || "0"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddMoneyModal;
