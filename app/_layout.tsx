import { Colors } from "@/Constants/Colors";
import { Stack, usePathname } from "expo-router";
import { useColorScheme } from "react-native";
import "../global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useOrientationStore } from "@/store/useOrientationStore";
import * as ScreenOrientation from "expo-screen-orientation";

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];

  const { setOrientation, isLandscape } = useOrientationStore();
  const pathname = usePathname();

  useEffect(() => {
    console.log("pathname : ", pathname);
    const lockOrientation = async () => {
      if (
        pathname !== "/(dashboard)/long/VideosFeed" ||
        "/(dashboard)/long/GlobalVideoPlayer"
      ) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
        setOrientation(false);
      }
    };

    lockOrientation();
  }, [pathname]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={isLandscape ? [] :['top']}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.navBackground },
              headerTintColor: theme.title,
              headerShown: false,
            }}
          >
            {/* Individual Screens */}
            <Stack.Screen name="index" options={{ title: "Signin" }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
