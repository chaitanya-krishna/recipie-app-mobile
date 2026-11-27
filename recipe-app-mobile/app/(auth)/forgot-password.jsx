import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Image } from "expo-image";
import { Ionicons } from '@expo/vector-icons';

import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";

export default function ForgotPasswordScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  // 3 steps: 1 = enter email, 2 = enter code, 3 = enter new password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isLoading = fetchStatus === 'fetching';

  // ✅ Step 1 — Send reset code
  const handleSendCode = async () => {
    if (!email) {
      return Alert.alert("Error", "Please enter your email address");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return Alert.alert("Error", "Please enter a valid email address");
    }

    const { error: createError } = await signIn.create({
      identifier: email.trim(),
    });

    if (createError) {
      const errorCode = createError?.errors?.[0]?.code;
      if (errorCode === "form_identifier_not_found") {
        Alert.alert(
          "Account Not Found",
          "No account found with this email.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Up", onPress: () => router.push("/(auth)/sign-up") }
          ]
        );
      } else {
        Alert.alert("Error",
          createError?.errors?.[0]?.longMessage || "Failed to find account"
        );
      }
      return;
    }

    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      Alert.alert("Error",
        sendError?.errors?.[0]?.longMessage || "Failed to send reset code"
      );
      return;
    }

    console.log("📧 Reset code sent to:", email.trim());
    setStep(2);
  };

  // ✅ Step 2 — Verify code
  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      return Alert.alert("Error", "Please enter the 6-digit code");
    }

    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });

    if (error) {
      const errorCode = error?.errors?.[0]?.code;
      if (errorCode === "form_code_incorrect") {
        Alert.alert("Wrong Code", "The code you entered is incorrect. Please try again.");
        setCode('');
      } else if (errorCode === "verification_expired") {
        Alert.alert("Code Expired", "Please request a new code.",
          [{ text: "Resend", onPress: () => { setStep(1); setCode(''); } }]
        );
      } else {
        Alert.alert("Error",
          error?.errors?.[0]?.longMessage || "Failed to verify code"
        );
      }
      return;
    }

    console.log("✅ Code verified, status:", signIn.status);
    // After verifying, status becomes 'needs_new_password'
    setStep(3);
  };

  // ✅ Step 3 — Submit new password
  const handleSubmitPassword = async () => {
    if (!newPassword) {
      return Alert.alert("Error", "Please enter a new password");
    }
    if (newPassword.length < 8) {
      return Alert.alert("Error", "Password must be at least 8 characters");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
    });

    if (error) {
      const errorCode = error?.errors?.[0]?.code;
      if (errorCode === "form_password_pwned") {
        Alert.alert("Weak Password", "This password was found in a data breach. Please use a stronger password.");
      } else {
        Alert.alert("Error",
          error?.errors?.[0]?.longMessage || "Failed to reset password"
        );
      }
      return;
    }

    console.log("✅ Password submitted, status:", signIn.status);

    if (signIn.status === 'complete') {
      const { error: finalError } = await signIn.finalize({
        navigate: ({ session }) => {
          console.log("🏠 Password reset complete:", session?.id);
          Alert.alert(
            "Success! 🎉",
            "Your password has been reset successfully!",
            [{ text: "OK", onPress: () => router.replace("/(tabs)/index") }]
          );
        }
      });
      if (finalError) {
        Alert.alert("Error", finalError?.errors?.[0]?.longMessage || "Failed to sign in");
      }
    }
  };

  // ✅ Step 1 UI — Enter email
  if (step === 1) {
    return (
      <View style={authStyles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={authStyles.keyboardView}
        >
          <ScrollView contentContainerStyle={authStyles.scrollContent}>
            <View style={authStyles.imageContainer}>
              <Image
                source={require("../../assets/images/i1.png")}
                style={authStyles.image}
                contentFit="contain"
              />
            </View>

            <Text style={authStyles.title}>Forgot Password</Text>
            <Text style={[authStyles.subtitle, { textAlign: 'center', marginBottom: 24 }]}>
              Enter your email and we'll send you a reset code
            </Text>

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
              />
            </View>

            {errors?.fields?.identifier && (
              <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>
                {errors.fields.identifier.message}
              </Text>
            )}

            <TouchableOpacity
              style={[authStyles.authButton, isLoading && authStyles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={authStyles.buttonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.back()}
            >
              <Text style={authStyles.linkText}>
                Remember your password? <Text style={authStyles.link}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ✅ Step 2 UI — Enter code
  if (step === 2) {
    return (
      <View style={authStyles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={authStyles.keyboardView}
        >
          <ScrollView contentContainerStyle={authStyles.scrollContent}>
            <View style={authStyles.imageContainer}>
              <Image
                source={require("../../assets/images/i1.png")}
                style={authStyles.image}
                contentFit="contain"
              />
            </View>

            <Text style={authStyles.title}>Enter Reset Code</Text>
            <Text style={[authStyles.subtitle, { textAlign: 'center', marginBottom: 24 }]}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={{ fontWeight: 'bold' }}>{email}</Text>
            </Text>

            <View style={authStyles.inputContainer}>
              <TextInput
                style={[authStyles.textInput, {
                  textAlign: 'center', fontSize: 24, letterSpacing: 8
                }]}
                value={code}
                placeholder="000000"
                placeholderTextColor={COLORS.textLight}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
              />
            </View>

            {errors?.fields?.code && (
              <Text style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>
                {errors.fields.code.message}
              </Text>
            )}

            <TouchableOpacity
              style={[authStyles.authButton, isLoading && authStyles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={authStyles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => { setStep(1); setCode(''); }}
            >
              <Text style={authStyles.linkText}>
                Didn't get a code? <Text style={authStyles.link}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ✅ Step 3 UI — Enter new password
  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={authStyles.keyboardView}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent}>
          <View style={authStyles.imageContainer}>
            <Image
              source={require("../../assets/images/i1.png")}
              style={authStyles.image}
              contentFit="contain"
            />
          </View>

          <Text style={authStyles.title}>Set New Password</Text>
          <Text style={[authStyles.subtitle, { textAlign: 'center', marginBottom: 24 }]}>
            Enter your new password below
          </Text>

          <View style={authStyles.inputContainer}>
            <TextInput
              style={authStyles.textInput}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.textLight}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoFocus={true}
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

          <View style={authStyles.inputContainer}>
            <TextInput
              style={authStyles.textInput}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.textLight}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              style={authStyles.eyeButton}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Ionicons
                name={showConfirm ? "eye-outline" : "eye-off-outline"}
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
            onPress={handleSubmitPassword}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={authStyles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}