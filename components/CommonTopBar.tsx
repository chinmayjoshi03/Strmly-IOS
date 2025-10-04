import { Image, Text, View, Pressable } from "react-native";
import React from "react";
import { router } from "expo-router";

const CommonTopBar = () => {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable 
        onPress={() => router.back()}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        style={{ padding: 12, marginLeft: -12 }}
      >
        <Image 
          source={require('../assets/images/back.png')} 
          alt='back-button' 
          style={{ width: 12, height: 22.67 }} 
        />
      </Pressable>

      <Text className="text-[20px] text-center font-medium text-white">
        My wallet
      </Text>

      <View style={{ width: 36 }} />
    </View>
  );
};

export default CommonTopBar;