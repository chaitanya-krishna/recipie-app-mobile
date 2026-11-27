import React, { useState } from 'react';
import { 
  View, Text, Alert, Platform, KeyboardAvoidingView, 
  ScrollView, TextInput, TouchableOpacity, ActivityIndicator 
} from "react-native";
import { useRouter } from "expo-router";
import { useSignUp } from "@clerk/expo";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = fetchStatus === 'fetching';

  const handleSignUp = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please fill in all fields");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert("Error", "Please enter a valid email address");
    }
    if (password.length < 8) {
      return Alert.alert("Error", "Password must be at least 8 characters");
    }

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) {
      const errorCode = error?.errors?.[0]?.code;
      console.log("❌ SignUp error code:", errorCode);

      if (errorCode === "form_identifier_exists") {
        Alert.alert(
          "Account Already Exists",
          "An account with this email already exists. Please sign in.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign In", onPress: () => router.push("/(auth)/sign-in") }
          ]
        );
      } else if (errorCode === "form_password_pwned") {
        // ✅ FIXED — correct Alert.alert format
        Alert.alert(
          "Weak Password 🔒",
          "Your password is too weak. Try mixing uppercase, lowercase, numbers and special characters (!@#$%) for a stronger and unique password."
        );
      } else if (errorCode === "form_email_address_invalid") {
        // ✅ NEW — handles invalid/non-existing email
        Alert.alert(
          "Invalid Email ✉️",
          "Please enter a valid and working email address."
        );
      } else if (errorCode === "form_param_format_invalid") {
        // ✅ NEW — handles wrong email format
        Alert.alert(
          "Invalid Email Format ✉️",
          "Please check your email address and try again."
        );
      } else {
        Alert.alert(
          "Sign Up Error",
          error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || "Failed to create account"
        );
      }
      return;
    }

    // ✅ Send verification email
    await signUp.verifications.sendEmailCode();
    console.log("📧 Verification email sent to:", email.trim());

    router.push({
      pathname: "/(auth)/verify-email",
      params: { email: email.trim() }
    });
  };

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={authStyles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={authStyles.scrollContent} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.imageContainer}>
            <Image 
              source={require("../../assets/images/i2.png")} 
              style={authStyles.image} 
              contentFit="contain" 
            />
          </View>

          <Text style={authStyles.title}>Create Account</Text>

          <View style={authStyles.formContainer}>
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter valid email"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter password (min 8 chars)"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={authStyles.eyeButton} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={22} 
                  color={COLORS.textLight} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[authStyles.authButton, isLoading && authStyles.buttonDisabled]} 
              onPress={handleSignUp} 
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={authStyles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={authStyles.linkContainer} 
              onPress={() => router.back()}
            >
              <Text style={authStyles.linkText}>
                Already have an account? <Text style={authStyles.link}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}