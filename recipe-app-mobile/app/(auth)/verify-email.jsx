import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useSignUp } from '@clerk/expo';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from "expo-image";

import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";

const MAX_ATTEMPTS = 3;

export default function VerifyEmailScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const { email } = useLocalSearchParams(); 
  
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [resending, setResending] = useState(false);

  const isLoading = fetchStatus === 'fetching';

  const onVerifyPress = async () => {
    if (code.length < 6) {
      return Alert.alert("Error", "Please enter the complete 6-digit code");
    }
    if (attempts >= MAX_ATTEMPTS) {
      return Alert.alert(
        "Too Many Attempts",
        "Please request a new code.",
        [{ text: "Resend Code", onPress: onResendCode }]
      );
    }

    await signUp.verifications.verifyEmailCode({ code });

    console.log("✅ signUp.status:", signUp.status);

    if (signUp.status === 'complete') {
      console.log("🎉 Verification complete! Finalizing...");
      await signUp.finalize({
        navigate: ({ session }) => {
          console.log("🏠 Session created:", session?.id);
          router.replace("/(home)"); // ✅ changed from /(tabs)/index
        }
      });

    } else if (
      signUp.status === 'missing_requirements' &&
      signUp.unverifiedFields.includes('email_address')
    ) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const remaining = MAX_ATTEMPTS - newAttempts;

      if (remaining <= 0) {
        Alert.alert(
          "Too Many Attempts",
          "Please request a new verification code.",
          [{ text: "Resend Code", onPress: onResendCode }]
        );
        setCode('');
        setAttempts(0);
      } else {
        Alert.alert(
          "Wrong Code",
          `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        );
        setCode('');
      }
    } else {
      Alert.alert("Error", "Verification failed. Please try again.");
    }
  };

  const onResendCode = async () => {
    if (resending) return;
    setResending(true);
    setAttempts(0);
    setCode('');
    try {
      await signUp.verifications.sendEmailCode();
      Alert.alert("Code Sent", `A new code has been sent to ${email}`);
    } catch (err) {
      Alert.alert("Error", err?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={authStyles.keyboardView}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent}>
          <View style={authStyles.imageContainer}>
            <Image 
              source={require("../../assets/images/i3.png")} 
              style={authStyles.image} 
              contentFit="contain" 
            />
          </View>

          <Text style={authStyles.title}>Verify Email</Text>
          
          <Text style={[authStyles.subtitle, { marginBottom: 30, textAlign: 'center' }]}>
            Enter the 6-digit code sent to {"\n"}
            <Text style={{ fontWeight: 'bold' }}>{email}</Text>
          </Text>

          {attempts > 0 && (
            <Text style={{ 
              textAlign: 'center', color: 'orange', 
              fontSize: 13, marginBottom: 12 
            }}>
              {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? '' : 's'} remaining
            </Text>
          )}

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

          <TouchableOpacity 
            style={[authStyles.authButton, isLoading && authStyles.buttonDisabled]} 
            onPress={onVerifyPress} 
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={authStyles.buttonText}>Verify Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={authStyles.linkContainer} 
            onPress={onResendCode}
            disabled={resending}
          >
            <Text style={authStyles.linkText}>
              {resending 
                ? "Sending new code..." 
                : <Text>Didn't get a code? <Text style={authStyles.link}>Resend</Text></Text>
              }
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}