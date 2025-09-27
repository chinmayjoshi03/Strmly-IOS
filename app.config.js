import 'dotenv/config';

export default {
  expo: {
    name: "strmly",
    slug: "strmly",
    scheme: "strmly",
    owner: "strmly-technologies",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/images/logo3.jpg",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "com.anonymous.strmly",
      buildNumber: "4", 
      supportsTablet: true
    },
    android: {
      versionCode: 3,
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo3.jpg",
        backgroundColor: "#000"
      },
      package: "com.anonymous.strmly",
      softwareKeyboardLayoutMode: "pan",
      edgeToEdgeEnabled: true
    },
    ios: {
        bundleIdentifier: "com.anonymous.strmly",
        infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo3.jpg"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo3.jpg",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#000"
        }
      ],
      [
        "expo-video",
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true
        }
      ],
      [
        "react-native-iap",
        {
          "googlePlayPackageName": "com.anonymous.strmly"
        }
      ],
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      BACKEND_API_URL: process.env.BACKEND_API_URL,
      EXPO_PUBLIC_BACKEND_API_URL: process.env.EXPO_PUBLIC_BACKEND_API_URL,
      googleClientIdAndroid: process.env.GOOGLE_CLIENT_ID_ANDROID,
      googleClientIdIOS: process.env.GOOGLE_CLIENT_ID_IOS,
      googleClientIdWeb: process.env.GOOGLE_CLIENT_ID_WEB,
      eas: {
        projectId: "d455cc31-c9ac-409d-92de-b847919939d4"
      }
    }
  }
};