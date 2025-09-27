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
      //Alert.alert("Error", validation.error);
      return;
    }

    const numAmount = parseFloat(amount);
    setIsProcessing(true);

    try {
      // const order = await onCreateOrder(numAmount);
      // if (!order) throw new Error("Failed to create wallet load order");

      const billingResult = await initiateGooglePlayBilling({
        amount: numAmount,
        currency: "INR",
      });

      if (billingResult.platform === "android") {
        if (!billingResult.purchaseToken || !billingResult.productId)
          throw new Error("Incomplete Android purchase response");
      } else {
        if (!billingResult.transactionReceipt || !billingResult.productId)
          throw new Error("Incomplete iOS purchase response");
      }

      // 4. call backend verification API with the right fields
      // use purchaseToken for Android, transactionReceipt for iOS
      await onVerifyPayment(
        billingResult.orderIdAndroid ?? billingResult.transactionId ?? "",
        billingResult.productId,
        billingResult.purchaseToken ?? billingResult.transactionReceipt ?? "",
        numAmount
      );

      // await onVerifyPayment(
      //   "TEST_ORDER_ID",
      //   "add_money_to_wallet_10",
      //   "TEST_RECEIPT_OR_TOKEN",
      //   numAmount
      // );

      try {
        await finishTransaction({
          purchase: billingResult.rawPurchase,
          isConsumable: true,
        });
      } catch (finishErr) {
        console.error("finishTransaction failed:", finishErr);
      }

      onSuccess(numAmount);
      Alert.alert(
        "Success",
        `₹${numAmount} added to your wallet successfully!`
      );
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error("AddMoneyModal error:", err);
      Alert.alert("Error", err.message || "Payment failed");
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: "#1F2937",
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        >
          <Text
            style={{
              color: "#F9FAFB",
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Add Money
          </Text>
          <Text
            style={{
              color: "#9CA3AF",
              fontSize: 14,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Recharge your wallet quickly
          </Text>

          <Text
            style={{ color: "#D1D5DB", marginBottom: 10, fontWeight: "500" }}
          >
            Quick Add
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {quickAmounts.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => handleQuickAmount(q)}
                style={{
                  backgroundColor:
                    amount == q.toString() ? "#2563EB" : "#374151",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>₹{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {amount && (
            <TextInput
              value={amount}
              editable={false}
              placeholder="Enter amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              style={{
                backgroundColor: "#111827",
                color: "#F9FAFB",
                padding: 14,
                borderRadius: 12,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "#374151",
                fontSize: 16,
                fontWeight: "500",
                textAlign: "center",
              }}
            />
          )}

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isProcessing}
              style={{
                flex: 1,
                backgroundColor: "#4B5563",
                padding: 14,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddMoney}
              disabled={isProcessing || !amount}
              style={{
                flex: 1,
                backgroundColor:
                  isProcessing || !amount ? "#6B7280" : "#10B981",
                padding: 14,
                borderRadius: 12,
              }}
            >
              {isProcessing ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>
                    Processing...
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    color: "#FFF",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Pay ₹{amount || "0"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddMoneyModal;