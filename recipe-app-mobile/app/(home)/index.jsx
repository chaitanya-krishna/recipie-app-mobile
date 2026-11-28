import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { useClerk, useUser } from '@clerk/expo';
import { homeStyles } from "../../assets/styles/home.styles";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

const HomeScreen = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <SafeAreaView style={homeStyles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={homeStyles.scrollContent}
      >
        {/* HEADER */}
        <View style={homeStyles.header}>
          <View>
            <Text style={homeStyles.welcomeText}>Hello,</Text>
            <Text style={homeStyles.userName}>
              {user?.emailAddresses[0]?.emailAddress?.split('@')[0]}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={homeStyles.signOutBtn}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
