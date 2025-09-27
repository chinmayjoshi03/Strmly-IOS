import { Link } from "expo-router";
import React, { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

type ActionModalProps = {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  specialText?: boolean;
  useButtons: boolean;
  primaryButtonText?: string;
  onPrimaryButtonPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryButtonPress?: () => void;
  info?: string;
  confirmRequest?: string;
};

const ActionModal = ({
  isVisible,
  onClose,
  title,
  specialText,
  useButtons,
  primaryButtonText = "",
  onPrimaryButtonPress,
  secondaryButtonText = "",
  onSecondaryButtonPress,
  info,
  confirmRequest
}: ActionModalProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isConfirmationStage, setIsConfirmationStage] = useState(false);

  const handlePrimaryPress = () => {
    if (info && confirmRequest && !isConfirmationStage) {
      // First press - show confirmation
      setIsConfirmationStage(true);
    } else {
      // Second press (or normal case) - execute the action
      onPrimaryButtonPress?.();
      onClose();
    }
  };

  const handleSecondaryPress = () => {
    if (isConfirmationStage) {
      // Go back to initial state if in confirmation stage
      setIsConfirmationStage(false);
    } else {
      // Normal secondary button behavior
      onSecondaryButtonPress?.();
      onClose();
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContainer}>
          <Text className="text-white text-sm text-center">
            {isConfirmationStage && confirmRequest ? confirmRequest : title}
            {specialText && !confirmRequest && (
              <>
                <Link href={"https://strmly.com/terms"}>
                  <Text className="text-blue-500 text-sm text-center">
                    Term of Use
                  </Text>
                </Link>

                <Text className="text-white text-sm text-center"> and </Text>

                <Link href={"https://strmly.com/policy"}>
                  <Text className="text-blue-500 text-sm text-center">
                    Privacy Policy
                  </Text>
                </Link>
              </>
            )}
          </Text>

          {useButtons && (
            <View className="flex-row items-center gap-1.5 mt-8 justify-between">
              <Pressable
                className="rounded-3xl items-center flex-1 bg-[#B0B0B0] px-6 py-2.5"
                onPress={handleSecondaryPress}
              >
                <Text className="text-black text-[16px]">
                  {isConfirmationStage ? "Back" : secondaryButtonText}
                </Text>
              </Pressable>
              
              <Pressable
                className="rounded-3xl flex-1 items-center px-6 py-2.5"
                style={{
                  backgroundColor: isPressed ? "#34C759" : "#B0B0B0",
                }}
                onPressIn={() => setIsPressed(true)}
                onPressOut={() => setIsPressed(false)}
                onPress={handlePrimaryPress}
              >
                <Text className="text-black text-[16px]">
                  {isConfirmationStage ? "Send request" : primaryButtonText}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#B0B0B0BB",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "black",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default ActionModal;