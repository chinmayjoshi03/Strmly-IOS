import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import React, { useState } from "react";
import { useFonts } from "expo-font";
import { CreateProfileStyles } from "@/styles/createprofile";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useAuthStore } from "@/store/useAuthStore";
import Constants from "expo-constants";
import { router, useNavigation } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { set } from "lodash";
import ModalMessage from "@/components/AuthModalMessage";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";

const Interests = () => {
  const [Step, setStep] = useState(1);
  const [Type, setType] = useState("Netflix");
  const [Interests, setInterests] = useState<string[]>([]);
  const [Interests2, setInterests2] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, updateUser } = useAuthStore();
  const BACKEND_API_URL = Constants.expoConfig?.extra?.BACKEND_API_URL;

  const [needButton, setNeedButton] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState("");

  // New state for validation alerts
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/poppins/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/poppins/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/poppins/Poppins-SemiBold.ttf"),
    "Poppins-Medium": require("../../assets/fonts/poppins/Poppins-Medium.ttf"),
    "Poppins-Light": require("../../assets/fonts/poppins/Poppins-Light.ttf"),
    "Inter-Light": require("../../assets/fonts/inter/Inter-Light.ttf"),
    "Inter-SemiBold": require("../../assets/fonts/inter/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../../assets/fonts/inter/Inter-Bold.ttf"),
    "Inter-ExtraBold": require("../../assets/fonts/inter/Inter-ExtraBold.ttf"),
  });

  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const showValidationPopup = (message: string) => {
    console.log("Showing validation popup:", message);
    setValidationMessage(message);
    setShowValidationAlert(true);
    setTimeout(() => setShowValidationAlert(false), 3000);
  };

  const submitInterests = async () => {
    if (!token) return;

    // Check if exactly 3 interests are selected for both categories
    if (Interests.length !== 3 || Interests2.length !== 3) {
      showValidationPopup("Please select exactly 3 interests from each category");
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting interests:", Interests, Interests2);
    try {
      const response = await fetch(`${BACKEND_API_URL}/user/interests`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interest1: Interests,
          interest2: Interests2,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update interests");
      }

      // Success - navigate to next screen or show success message
      updateUser({ is_onboarded: true });

      setAlert("Your interests have been updated successfully!");
      setNeedButton(true);
      setShowAlert(true);
      setTimeout(
        () =>
          navigation.reset({
            routes: [{ name: "(tabs)" }],
          }),
        1000
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update interests";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const HandleStep = (val: boolean) => {
    if (Step > 1 && !val) {
      setStep((prev) => prev - 1);
    }

    if (val) {
      if (Step === 3) {
        submitInterests();
      } else {
        // Check if exactly 3 interests are selected before proceeding
        // Step 2 should check Interests, Step 3 should check Interests2
        const currentInterests = Step === 2 ? Interests : Interests2;
        console.log(`Step: ${Step}, Current interests count: ${currentInterests.length}`, currentInterests);
        if (currentInterests.length !== 3) {
          showValidationPopup("Please select exactly 3 interests to continue");
          return;
        }
        setStep((prev) => prev + 1);
      }
    }
  };

  const handleInterestToggle = (item: string) => {
    const currentInterests = Step === 2 ? Interests : Interests2;
    const setCurrentInterests = Step === 2 ? setInterests : setInterests2;

    if (currentInterests.includes(item)) {
      setCurrentInterests(currentInterests.filter((i) => i !== item));
    } else {
      if (currentInterests.length >= 3) {
        // Show popup when trying to select 4th interest
        showValidationPopup("You can only select up to 3 interests");
        return;
      }
      setCurrentInterests([...currentInterests, item]);
    }
  };

  const renderGrid = (items: string[]) => {
    const rows = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push(
        <View key={i} className="flex-row justify-between w-full py-3 px-2">
          {[0, 1].map((j) => {
            const item = items[i + j];
            const currentInterests = Step === 2 ? Interests : Interests2;
            const isSelected = currentInterests.includes(item);

            if (!item) {
              return <View key={j} className="w-1/2 px-2" />;
            }

            return (
              <View key={j} className="w-1/2 px-2">
                <TouchableOpacity
                  onPress={() => handleInterestToggle(item)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: isSelected ? "#333333" : "#000000",
                    borderRadius: 12,
                    height: 64,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: isSelected ? "#555555" : "#FFFFFF20",
                  }}
                >
                  <Text
                    className="text-white text-center font-medium"
                    style={{
                      fontSize: 14,
                      lineHeight: 18,
                    }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      );
    }
    return rows;
  };

  if (!fontsLoaded) return null;

  if (Step === 1) {
    return (
      <ThemedView style={CreateProfileStyles.Container}>
        <StatusBar backgroundColor={"black"} />
        <ThemedView style={CreateProfileStyles.TopBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            className="items-start w-full absolute top-5 z-10 left-5"
          >
            <Image
              source={require("../../assets/images/back.png")}
              className="h-7 w-4"
            />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={CreateProfileStyles.Centered}>
          <ThemedText style={CreateProfileStyles.Heading}>
            Pick your kind of content
          </ThemedText>
          <ThemedView style={CreateProfileStyles.CardGrid}>
            <TouchableOpacity
              onPress={() => {
                setType("Netflix");
                setStep((prev) => prev + 1);
              }}
              style={[CreateProfileStyles.InterestCard, {
                backgroundColor: "#000000",
                borderWidth: 1,
                borderColor: "#1e1e1eff",
              }]}
            >
              <ThemedText style={CreateProfileStyles.InterestCardText}>
                Netflix
              </ThemedText>
              <ThemedText style={CreateProfileStyles.CardContent}>
                Short films, web series, dramas & movies.
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setType("Youtube");
                setStep((prev) => prev + 1);
              }}
              style={[CreateProfileStyles.InterestCard, {
                backgroundColor: "#000000",
                borderWidth: 1,
                borderColor: "#1e1e1eff",
              }]}
            >
              <ThemedText style={CreateProfileStyles.InterestCardText}>
                Youtube
              </ThemedText>
              <ThemedText style={CreateProfileStyles.CardContent}>
                Vlogs, comedy, food, beauty & Tech.
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    );
  }

  if (Step === 2 || Step === 3) {
    const isCinema = (Step === 2 && Type === "Netflix") || (Step === 3 && Type === "Youtube");
    const items = isCinema
      ? Type === "Netflix"
        ? [
          "Drama",
          "Comedy",
          "Action & Adventure",
          "Thriller & Suspense",
          "Horror",
          "Romance",
          "Sci-Fi & Fantasy",
          "Crime & Mystery",
          "Documentary",
          "Biography & True Story",
          "Family & Kids",
          "Teen & Young Adult",
          "Animation & Anime",
          "Reality & Unscripted",
          "Talk Shows & Stand-up Comedy",
          "Historical & Period Pieces",
          "Musical & Music-Based",
          "International & World Cinema",
          "Sports & Fitness",
          "Short Films & Anthologies",
        ]
        : [
          "Entertainment",
          "Education",
          "Gaming",
          "Commentary & Opinion",
          "Music & Audio",
          "Film & TV",
          "Vlogs & Lifestyle",
          "Health & Fitness",
          "Food & Cooking",
          "Beauty & Fashion",
          "Science & Technology",
          "Travel & Adventure",
          "DIY & Crafts",
          "Home & Family",
          "Business & Finance",
          "Motivation & Self-Improvement",
          "Career & Skill Development",
          "Spirituality & Philosophy",
          "Reviews & Unboxings",
          "Live Streams & Podcasts",
        ]
      : Type === "Netflix"
        ? [
          "Entertainment",
          "Education",
          "Gaming",
          "Commentary & Opinion",
          "Music & Audio",
          "Film & TV",
          "Vlogs & Lifestyle",
          "Health & Fitness",
          "Food & Cooking",
          "Beauty & Fashion",
          "Science & Technology",
          "Travel & Adventure",
          "DIY & Crafts",
          "Home & Family",
          "Business & Finance",
          "Motivation & Self-Improvement",
          "Career & Skill Development",
          "Spirituality & Philosophy",
          "Reviews & Unboxings",
          "Live Streams & Podcasts",
        ]
        : [
          "Drama",
          "Comedy",
          "Action & Adventure",
          "Thriller & Suspense",
          "Horror",
          "Romance",
          "Sci-Fi & Fantasy",
          "Crime & Mystery",
          "Documentary",
          "Biography & True Story",
          "Family & Kids",
          "Teen & Young Adult",
          "Animation & Anime",
          "Reality & Unscripted",
          "Talk Shows & Stand-up Comedy",
          "Historical & Period Pieces",
          "Musical & Music-Based",
          "International & World Cinema",
          "Sports & Fitness",
          "Short Films & Anthologies",
        ];
    return (
      <ThemedView style={CreateProfileStyles.Container}>
        <StatusBar backgroundColor={"black"} />
        <View style={CreateProfileStyles.TopBar}>
          <View className="flex-row items-center w-full absolute top-4 z-10 px-5">
            <TouchableOpacity
              onPress={() => {
                HandleStep(false);
                Step === 2 ? setInterests([]) : setInterests2([]);
              }}
              className="mr-4"
            >
              <Image
                source={require("../../assets/images/back.png")}
                className="h-5 w-4"
              />
            </TouchableOpacity>
            <View className="flex-1 items-center justify-center">
              <Text
                className="text-white text-xl font-bold"
                style={{
                  textAlign: 'center',
                  marginLeft: -40,
                  fontSize: 25,
                  marginTop: 20
                }}
              >
                Your Interests
              </Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, marginTop: 0, alignItems: 'center' }}>

          <Text style={CreateProfileStyles.OptionsCardText}>
            Select only 3 of your interest from

            {isCinema ? " \"Cinema content\"" : " \"Non-cinema content\""}

        {isCinema ? " \"Cinema content\"" : " \"Non-cinema content\""}
          </Text>

          <View style={{ marginBottom: 30, marginTop: 10 }}>
            {renderGrid(items)}
          </View>
        </ScrollView>
        <View className="px-4 w-full pb-10">
          <TouchableOpacity
            disabled={
              (Step === 2 ? Interests.length !== 3 : Interests2.length !== 3) ||
              (Step === 3 &&
                (Interests.length !== 3 || Interests2.length !== 3)) ||
              isSubmitting
            }
            onPress={() => HandleStep(true)}
            className="rounded-3xl z-10 bg-white items-center justify-center h-[55px]"
          >
            {isSubmitting ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text className="text-black text-xl">
                {Step === 3 ? "Submit" : "Continue"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modals with absolute positioning */}
        {showAlert && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <ModalMessage
              visible={showAlert}
              text={alert}
              needCloseButton={needButton}
              onClose={() => setShowAlert(false)}
            />
          </View>
        )}

        {showValidationAlert && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}>
            <ModalMessage
              visible={showValidationAlert}
              text={validationMessage}
              needCloseButton={false}
              onClose={() => setShowValidationAlert(false)}
            />
          </View>
        )}
      </ThemedView>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Internal Error, Try restarting the app.</Text>
    </View>
  );
};

export default Interests;