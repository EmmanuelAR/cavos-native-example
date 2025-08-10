import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Font from "expo-font";
import {
  useFonts,
  JetBrainsMono_400Regular,
} from "@expo-google-fonts/jetbrains-mono";
import OTPInputView from "@twotalltotems/react-native-otp-input";
import { twilioService } from "../../../lib/twilioService";
import Header from "../../components/Header";
import * as Haptics from "expo-haptics";
import { T_C } from "../../TermsAndConditions";

const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

function CustomCheckbox({ value, onValueChange }) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={{
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#EAE5DC',
        backgroundColor: value ? '#EAE5DC' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      {value && (
        <View
          style={{
            width: 12,
            height: 12,
            backgroundColor: '#000',
            borderRadius: 3,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

export default function PhoneOTP() {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber, isReset, existingUser } = route.params;
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpInputRef = useRef(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  Font.useFonts({
    "Satoshi-Variable": require("../../../assets/fonts/Satoshi-Variable.ttf"),
  });

  useFonts({
    JetBrainsMono_400Regular,
  });

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: "Satoshi-Variable" };

  useEffect(() => {
    if (isReset) {
      Alert.alert(
        "Reset Password",
        "Please enter the verification code sent to your phone."
      );
      twilioService.sendOTP(phoneNumber);
    }
  }, []);

  useEffect(() => {
    if (timer > 0 && !resendEnabled) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setResendEnabled(true);
    }
  }, [timer, resendEnabled]);


  const handleVerify = async (code) => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      // const result = await twilioService.verifyOTP(phoneNumber, code);

      if (false) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(result.message || "OTP verification failed");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace("Pin", { 
          phoneNumber: phoneNumber,
          isReset: isReset || false 
        });
      }
    } catch (err) {
      setError("Unexpected error, please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!resendEnabled) return;
    setTimer(30);
    setResendEnabled(false);
    setOtp("");
    setError("");
    try {
      await twilioService.sendOTP(phoneNumber);
      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your phone"
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Alert.alert("Error", "Failed to send verification code");
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        <Header />

        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>Sent to {phoneNumber}</Text>
          </View>

          <View style={styles.otpContainer}>
            <OTPInputView
              ref={otpInputRef}
              style={styles.otpInput}
              pinCount={6}
              code={otp}
              onCodeChanged={(code) => {
                setOtp(code);
                setError("");
              }}
              onCodeFilled={(code) => {
                handleVerify(code);
              }}
              autoFocusOnLoad
              codeInputFieldStyle={styles.underlineStyleBase}
              codeInputHighlightStyle={styles.underlineStyleHighLighted}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.resendContainer}>
            {resendEnabled ? (
              <TouchableOpacity
                onPress={handleResend}
                accessibilityRole="button"
                accessibilityLabel="Resend code"
              >
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend code in 0:{timer < 10 ? `0${timer}` : timer}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (otp.length < 6 || loading) && styles.disabledButton,
            ]}
            onPress={() => handleVerify(otp)}
            disabled={otp.length < 6 || loading}
            accessibilityRole="button"
            accessibilityLabel="Verify code"
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>

        <Modal
          visible={showTermsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {}}
        >
          <View style={styles.termsOverlay}>
            <View style={styles.termsModalContainer}>
              <ScrollView style={styles.termsScroll} contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.termsTitle}>TERMS AND CONDITIONS</Text>
                <Text style={styles.termsDate}>Last updated: 2025-07-03</Text>
                <Text style={styles.termsText}>{T_C}</Text>
              </ScrollView>
              <View style={styles.termsFooter}>
                <View style={styles.checkboxRow}>
                  <CustomCheckbox value={termsAccepted} onValueChange={setTermsAccepted} />
                  <Text style={styles.checkboxLabel}>I accept the Terms and Conditions</Text>
                </View>
                <TouchableOpacity
                  style={[styles.acceptButton, !termsAccepted && styles.disabledButton]}
                  disabled={!termsAccepted}
                  onPress={() => {
                    setShowTermsModal(false);
                    navigation.replace("Invitation");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Accept Terms and Continue"
                >
                  <Text style={styles.acceptButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: Platform.OS === "android" ? verticalScale(20) : 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    justifyContent: "center",
  },
  titleContainer: {
    marginBottom: verticalScale(40),
    alignItems: "center",
  },
  title: {
    color: "#EAE5DC",
    fontSize: moderateScale(28),
    fontWeight: "bold",
    marginBottom: verticalScale(5),
  },
  subtitle: {
    color: "#888",
    fontSize: moderateScale(16),
    textAlign: "center",
  },
  otpContainer: {
    height: verticalScale(120),
    marginBottom: verticalScale(30),
    justifyContent: "center",
    backgroundColor: '#000',
  },
  otpInput: {
    width: "100%",
    height: "100%",
  },
  underlineStyleBase: {
    width: moderateScale(45),
    height: moderateScale(55),
    borderWidth: 1,
    borderColor: "#333",
    color: "#EAE5DC",
    fontSize: moderateScale(24),
    fontFamily: "JetBrainsMono_400Regular",
  },
  underlineStyleHighLighted: {
    borderColor: "#EAE5DC",
  },
  errorText: {
    color: "#FF4444",
    fontSize: moderateScale(14),
    marginTop: 10,
    textAlign: "center",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: verticalScale(30),
  },
  resendText: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    textDecorationLine: "underline",
  },
  timerText: {
    color: "#888",
    fontSize: moderateScale(16),
  },
  verifyButton: {
    backgroundColor: "#EAE5DC",
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#333",
  },
  verifyButtonText: {
    color: "#000000",
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  termsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsModalContainer: {
    backgroundColor: '#111',
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
    paddingBottom: 0,
    overflow: 'hidden',
  },
  termsScroll: {
    maxHeight: 400,
  },
  termsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EAE5DC',
    textAlign: 'center',
    marginBottom: 10,
  },
  termsDate: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  termsText: {
    color: '#EAE5DC',
    fontSize: 14,
    marginBottom: 20,
  },
  termsFooter: {
    borderTopWidth: 1,
    borderTopColor: '#222',
    padding: 16,
    backgroundColor: '#111',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    color: '#EAE5DC',
    marginLeft: 8,
    fontSize: 15,
  },
  acceptButton: {
    backgroundColor: '#EAE5DC',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
