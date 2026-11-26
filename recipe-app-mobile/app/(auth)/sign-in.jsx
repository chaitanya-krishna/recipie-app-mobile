import React, { useState } from 'react';
import { 
  View, Text, Alert, KeyboardAvoidingView, Platform, 
  ScrollView, TextInput, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/expo';
import { Image } from "expo-image";
import { Ionicons } from '@expo/vector-icons'; 

import { COLORS } from '../../constants/colors';
import { authStyles } from "../../assets/styles/auth.styles";

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");

  const isLoading = fetchStatus === 'fetching';

  const handleSignIn = async () => {
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

    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) {
      const errorCode = error?.errors?.[0]?.code;
      if (errorCode === "form_password_incorrect") {
        Alert.alert("Incorrect Password", "The password you entered is incorrect.");
      } else if (errorCode === "form_identifier_not_found") {
        Alert.alert(
          "Account Not Found",
          "No account found with this email. Would you like to create one?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Up", onPress: () => router.push("/(auth)/sign-up") }
          ]
        );
      } else if (errorCode === "too_many_requests") {
        Alert.alert("Too Many Attempts", "Please wait a few minutes and try again.");
      } else {
        Alert.alert("Sign In Failed",
          error?.errors?.[0]?.longMessage || "Something went wrong."
        );
      }
      return;
    }

    // ✅ Docs pattern — check status and finalize
    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          const url = decorateUrl('/')
          router.replace("/(home)")
        }
      });
    } else if (signIn.status === 'needs_client_trust') {
      await signIn.mfa.sendEmailCode()
    }
  };

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      return Alert.alert("Error", "Please enter the 6-digit code");
    }

    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          router.replace("/(home)")
        }
      });
    }
  };

  // ✅ Client trust screen
  if (signIn.status === 'needs_client_trust') {
    return (
      <View style={authStyles.container}>
        <KeyboardAvoidingView
          style={authStyles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={authStyles.scrollContent}>
            <View style={authStyles.imageContainer}>
              <Image 
                source={require("../../assets/images/i1.png")} 
                style={authStyles.image} 
                contentFit="contain" 
              />
            </View>
            <Text style={authStyles.title}>Verify your account</Text>
            <Text style={[authStyles.subtitle, { textAlign: 'center', marginBottom: 24 }]}>
              Enter the 6-digit code sent to your email
            </Text>
            <View style={authStyles.inputContainer}>
              <TextInput
                style={[authStyles.textInput, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
                value={code}
                placeholder="000000"
                placeholderTextColor={COLORS.textLight}
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
                autoFocus={true}
              />
            </View>
            <TouchableOpacity
              style={[authStyles.authButton, isLoading && authStyles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={authStyles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => signIn.mfa.sendEmailCode()}
            >
              <Text style={authStyles.linkText}>
                Didn't get a code? <Text style={authStyles.link}>Resend</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => signIn.reset()}
            >
              <Text style={authStyles.linkText}>
                <Text style={authStyles.link}>Start over</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        style={authStyles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={authStyles.scrollContent} 
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.imageContainer}>
            <Image 
              source={require("../../assets/images/i1.png")} 
              style={authStyles.image} 
              contentFit="contain" 
            />
          </View>
          <Text style={authStyles.title}>Welcome Back</Text>
          <View style={authStyles.formContainer}>
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter email"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors?.fields?.identifier && (
              <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>
                {errors.fields.identifier.message}
              </Text>
            )}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter password"
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
            {errors?.fields?.password && (
              <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>
                {errors.fields.password.message}
              </Text>
            )}
            <TouchableOpacity 
              style={[authStyles.authButton, isLoading && authStyles.buttonDisabled]} 
              onPress={handleSignIn} 
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={authStyles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={authStyles.linkContainer} 
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={authStyles.linkText}>
                Forgot password? <Text style={authStyles.link}>Reset it</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={authStyles.linkContainer} 
              onPress={() => router.push("/(auth)/sign-up")}
            >
              <Text style={authStyles.linkText}>
                Don't have an account? <Text style={authStyles.link}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}