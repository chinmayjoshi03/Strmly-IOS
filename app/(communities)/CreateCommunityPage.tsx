import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { CommunitiesStyles } from "@/styles/Community";
import { CreateCommunityStyle } from "@/styles/CreateCommunity";
import { useFonts } from "expo-font";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { getProfilePhotoUrl } from "@/utils/profileUtils";
import { communityActions } from "@/api/community/communityActions";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const CreateCommunityPage: React.FC = () => {
  const router = useRouter();
  const { token } = useAuthStore();

  const [fontsLoaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/poppins/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/poppins/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/poppins/Poppins-SemiBold.ttf"),
    "Poppins-Medium": require("../../assets/fonts/poppins/Poppins-Medium.ttf"),
    "Poppins-Light": require("../../assets/fonts/poppins/Poppins-Light.ttf"),
    "Inter-Light": require("../../assets/fonts/inter/Inter-Light.ttf"),
    "Inter-Regular": require("../../assets/fonts/inter/Inter-Regular.ttf"),
    "Inter-SemiBold": require("../../assets/fonts/inter/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../../assets/fonts/inter/Inter-Bold.ttf"),
    "Inter-ExtraBold": require("../../assets/fonts/inter/Inter-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../../assets/fonts/poppins/Poppins-ExtraLight.ttf"),
  });

  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [bio, setBio] = useState("");
  const [amount, setAmount] = useState("");
  const [feeDescription, setFeeDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);

  const options = ["Free", "Paid"];

  const handleSelect = (value: string) => {
    setSelected(value);
    setVisible(false);
  };

  const pickImage = async () => {
    try {
      // Request permissions first
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        console.log("📷 Image selected:", result.assets[0].uri);
      }
    } catch (error) {
      console.error("❌ Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleCreate = async () => {
    if (!communityName || !selected) {
      Alert.alert(
        "Error",
        "Please fill all required fields (name and access type)."
      );
      return;
    }

    if (!token) {
      Alert.alert("Error", "You must be logged in to create a community.");
      return;
    }

    if (selected === "Paid" && (!amount || !feeDescription)) {
      Alert.alert(
        "Error",
        "Please fill amount and fee description for paid community."
      );
      return;
    }

    setIsCreating(true);

    try {
      let imageFile = null;

      if (imageUri) {
        const fileName = imageUri.split("/").pop()!;
        const fileType = fileName.split(".").pop();
        imageFile = {
          uri: imageUri,
          name: fileName,
          type: `image/${fileType}`,
        } as any;

        console.log("📷 Image file prepared:", {
          fileName,
          fileType,
          uri: imageUri,
        });
      }

      const communityData = {
        name: communityName,
        bio: bio || "",
        type: selected.toLowerCase() as "free" | "paid",
        amount: selected === "Paid" ? parseFloat(amount) : undefined,
        fee_description: selected === "Paid" ? feeDescription : undefined,
        imageFile,
      };

      console.log("🏗️ Creating community with data:", communityData);

      const result = await communityActions.createCommunity(
        token,
        communityData
      );

      console.log("✅ Community created successfully:", result);

      Alert.alert("Success", "Community created successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to the newly created community's personal page
            router.replace(
              `/(dashboard)/communities/personal/${result.community._id}`
            );
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Error creating community:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to create community. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-black">
      <SafeAreaView style={{ flex: 1 }} 
  edges={Platform.OS === 'ios' ? ['left', 'right', 'bottom'] : undefined}>
        <ThemedView style={CreateCommunityStyle.container}>
          <View style={CreateCommunityStyle.CreateCommunityTopBar}>
            <TouchableOpacity
              style={CreateCommunityStyle.BackIcon}
              onPress={() => router.back()}
            >
              <Image
                className="size-5"
                source={require("../../assets/images/back.png")}
              />
            </TouchableOpacity>
            <ThemedText style={CommunitiesStyles.Tab}>
              Create Community
            </ThemedText>
            <TouchableOpacity onPress={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={CommunitiesStyles.RightTab}>
                  Create
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Image picker */}
          <TouchableOpacity
            className="items-center w-fit"
            onPress={() => {
              console.log("📷 Image picker button pressed");
              pickImage();
            }}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: getProfilePhotoUrl(imageUri, "community") }}
              style={CreateCommunityStyle.CommunityAvatar}
            />
            <ThemedText style={CommunitiesStyles.RightTab}>
              Add community picture
            </ThemedText>
          </TouchableOpacity>

          {/* Community Fields */}
          <View style={CreateCommunityStyle.InfoContainer}>
            <View
              style={[
                CreateCommunityStyle.InfoFrame,
                { flexDirection: "column", alignItems: "flex-start" },
              ]}
            >
              <ThemedText style={CreateCommunityStyle.InfoLabel}>
                Community name
              </ThemedText>
              <TextInput
                placeholder="Add name"
                placeholderTextColor="#B0B0B0"
                style={[
                  CreateCommunityStyle.TextLabel,
                  { width: "90%", color: "#fff", paddingVertical: 8 },
                ]}
                value={communityName}
                onChangeText={setCommunityName}
              />
            </View>
            <View
              style={[
                CreateCommunityStyle.InfoFrame,
                { flexDirection: "column", alignItems: "flex-start" },
              ]}
            >
              <ThemedText style={CreateCommunityStyle.InfoLabel}>
                Bio
              </ThemedText>
              <TextInput
                placeholder="Add bio"
                placeholderTextColor="#B0B0B0"
                style={[
                  CreateCommunityStyle.TextLabel,
                  { width: "90%", color: "#fff", paddingVertical: 8 },
                ]}
                value={bio}
                onChangeText={setBio}
                multiline
              />
            </View>
            <View
              style={[
                CreateCommunityStyle.InfoFrame,
                { flexDirection: "column", alignItems: "flex-start" },
              ]}
            >
              <ThemedText style={CreateCommunityStyle.InfoLabel}>
                Access
              </ThemedText>
              <TouchableOpacity
                onPress={() => setVisible(true)}
                style={[
                  CreateCommunityStyle.dropdownTrigger,
                  { width: "90%", marginTop: 8 },
                ]}
              >
                <ThemedText
                  style={[
                    CreateCommunityStyle.dropdownText,
                    { color: selected ? "#fff" : "#888" },
                  ]}
                >
                  {selected || "Select"}
                </ThemedText>
                <ThemedText style={CreateCommunityStyle.arrow}>▼</ThemedText>
              </TouchableOpacity>

              <Modal transparent animationType="fade" visible={visible}>
                <TouchableOpacity
                  style={CreateCommunityStyle.overlay}
                  onPress={() => setVisible(false)}
                >
                  <View style={CreateCommunityStyle.dropdownBox}>
                    {options.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={CreateCommunityStyle.dropdownItem}
                        onPress={() => handleSelect(item)}
                      >
                        <ThemedText
                          style={CreateCommunityStyle.dropdownItemText}
                        >
                          {item}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>

            {selected === "Paid" && (
              <>
                <View
                  style={[
                    CreateCommunityStyle.InfoFrame,
                    { flexDirection: "column", alignItems: "flex-start" },
                  ]}
                >
                  <ThemedText style={CreateCommunityStyle.InfoLabel}>
                    Community fee amount
                  </ThemedText>
                  <TextInput
                    placeholder="29"
                    placeholderTextColor="#B0B0B0"
                    style={[
                      CreateCommunityStyle.TextLabel,
                      { width: "90%", color: "#fff", paddingVertical: 8 },
                    ]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                </View>
                <View
                  style={[
                    CreateCommunityStyle.InfoFrame,
                    { flexDirection: "column", alignItems: "flex-start" },
                  ]}
                >
                  <ThemedText style={CreateCommunityStyle.InfoLabel}>
                    Fee description
                  </ThemedText>
                  <TextInput
                    placeholder="Monthly subscription fee"
                    placeholderTextColor="#B0B0B0"
                    style={[
                      CreateCommunityStyle.TextLabel,
                      { width: "90%", color: "#fff", paddingVertical: 8 },
                    ]}
                    value={feeDescription}
                    onChangeText={setFeeDescription}
                  />
                </View>
              </>
            )}
          </View>

          <ThemedView style={CreateCommunityStyle.container}>
            <ThemedText style={CreateCommunityStyle.ExtraInfo}>
              You can create either a free or paid community. In a free
            </ThemedText>
            <ThemedText style={CreateCommunityStyle.ExtraInfo}>
              community, anyone can join, follow, and post content.
            </ThemedText>
            <ThemedText style={CreateCommunityStyle.ExtraInfo}>
              In a paid community, users can join and watch videos for free,
            </ThemedText>
            <ThemedText style={CreateCommunityStyle.ExtraInfo}>
              but only creators who pay can post content.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </ScrollView>
  );
};

export default CreateCommunityPage;
