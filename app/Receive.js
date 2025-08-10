import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  Animated,
  TextInput,
} from "react-native";
import * as Font from "expo-font";
import {
  useFonts,
  JetBrainsMono_400Regular,
} from "@expo-google-fonts/jetbrains-mono";
import { MaterialIcons } from "@expo/vector-icons";
import { useCavosWallet } from '../atoms/cavosWallet';
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";

const { width, height } = Dimensions.get("window");

const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function Receive() {
  const cavosWallet = useCavosWallet((state) => state.cavosWallet);
  const [copiedAnimation] = useState(new Animated.Value(0));
  const [selectedMethod, setSelectedMethod] = useState("crypto"); // 'crypto' or 'bank' or 'qr'
  const [amount, setAmount] = useState("");
  const [showQR, setShowQR] = useState(false);

  const [fontsLoaded] = Font.useFonts({
    "Satoshi-Variable": require("../assets/fonts/Satoshi-Variable.ttf"),
  });

  const [googleFontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
  });

  if (!fontsLoaded || !googleFontsLoaded) {
    return null;
  }

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: "Satoshi-Variable" };

  const walletAddress = cavosWallet?.address?.startsWith("0x")
    ? "0x" + cavosWallet?.address.slice(2).padStart(64, "0")
    : "0x" + cavosWallet?.address?.padStart(64, "0") || "";

  const supportedNetworks = ["Starknet"];

  const handleCopyAddress = () => {
    Clipboard.setStringAsync(walletAddress);

    // Animación de feedback visual
    Animated.sequence([
      Animated.timing(copiedAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(copiedAnimation, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    Alert.alert("✓ Copied!", "Wallet address copied to clipboard.");
  };

  const handleBankTransfer = () => {
    Alert.alert(
      "🏦 Coming Soon",
      "Bank transfer functionality is currently in development. We'll notify you when it's available!"
    );
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Construye el valor del QR (puedes personalizar el formato según tu necesidad)
  const qrValue = JSON.stringify({
    address: walletAddress,
    amount: amount,
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Add Funds</Text>
          <Text style={styles.subtitle}>
            Choose your preferred deposit method
          </Text>
        </View>

        {/* Method Selection */}
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[
              styles.methodOption,
              selectedMethod === "crypto" && styles.methodOptionSelected,
            ]}
            onPress={() => setSelectedMethod("crypto")}
          >
            <MaterialIcons
              name="currency-bitcoin"
              size={moderateScale(24)}
              color={selectedMethod === "crypto" ? "#EAE5DC" : "#666"}
            />
            <Text
              style={[
                styles.methodText,
                selectedMethod === "crypto" && styles.methodTextSelected,
              ]}
            >
              Crypto Deposit
            </Text>
            <Text
              style={[
                styles.methodSubtext,
                selectedMethod === "crypto" && styles.methodSubtextSelected,
              ]}
            >
              Instant • No fees
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodOption,
              selectedMethod === "bank" && styles.methodOptionSelected,
            ]}
            onPress={() => setSelectedMethod("bank")}
          >
            <MaterialIcons
              name="account-balance"
              size={moderateScale(24)}
              color={selectedMethod === "bank" ? "#EAE5DC" : "#666"}
            />
            <Text
              style={[
                styles.methodText,
                selectedMethod === "bank" && styles.methodTextSelected,
              ]}
            >
              Bank Transfer
            </Text>
            <Text
              style={[
                styles.methodSubtext,
                selectedMethod === "bank" && styles.methodSubtextSelected,
              ]}
            >
              Coming soon
            </Text>
          </TouchableOpacity>

          {/* QR CODE Button */}
          <TouchableOpacity
            style={[
              styles.methodOption,
              selectedMethod === "qr" && styles.methodOptionSelected,
            ]}
            onPress={() => setSelectedMethod("qr")}
          >
            <MaterialIcons
              name="qr-code"
              size={moderateScale(24)}
              color={selectedMethod === "qr" ? "#EAE5DC" : "#666"}
            />
            <Text
              style={[
                styles.methodText,
                selectedMethod === "qr" && styles.methodTextSelected,
              ]}
            >
              QR CODE
            </Text>
            <Text
              style={[
                styles.methodSubtext,
                selectedMethod === "qr" && styles.methodSubtextSelected,
              ]}
            >
              Scan your address
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on selected method */}
        {selectedMethod === "crypto" ? (
          <>
            {/* Wallet Address Card */}
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={moderateScale(20)}
                    color="#666"
                  />
                  <Text style={styles.cardTitle}>YOUR DEPOSIT ADDRESS</Text>
                </View>

                <View style={styles.addressContainer}>
                  <View style={styles.addressSection}>
                    <Text style={styles.addressLabel}>Full Address</Text>
                    <Text
                      style={styles.addressText}
                      numberOfLines={2}
                      ellipsizeMode="middle"
                    >
                      {walletAddress}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.copyButton,
                      copiedAnimation._value > 0 && styles.copyButtonActive,
                    ]}
                    onPress={handleCopyAddress}
                  >
                    <Animated.View
                      style={{
                        opacity: copiedAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0],
                        }),
                      }}
                    >
                      <MaterialIcons
                        name="content-copy"
                        size={moderateScale(20)}
                        color="#EAE5DC"
                      />
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.checkIcon,
                        {
                          opacity: copiedAnimation,
                          transform: [
                            {
                              scale: copiedAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="check"
                        size={moderateScale(20)}
                        color="#666"
                      />
                    </Animated.View>
                  </TouchableOpacity>
                </View>

                <View style={styles.addressSummary}>
                  <Text style={styles.summaryLabel}>Quick Reference</Text>
                  <Text style={styles.summaryAddress}>
                    {formatAddress(walletAddress)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Info */}
            <View style={styles.quickInfoContainer}>
              <View style={styles.quickInfoItem}>
                <MaterialIcons
                  name="flash-on"
                  size={moderateScale(18)}
                  color="#666"
                />
                <Text style={styles.quickInfoText}>Instant deposits</Text>
              </View>
              <View style={styles.quickInfoItem}>
                <MaterialIcons
                  name="security"
                  size={moderateScale(18)}
                  color="#666"
                />
                <Text style={styles.quickInfoText}>Secure & encrypted</Text>
              </View>
            </View>

            {/* Supported Assets */}
            <View style={styles.assetsContainer}>
              <Text style={styles.sectionTitle}>SUPPORTED ASSETS</Text>
              <View style={styles.assetsList}>
                <View style={styles.assetItem}>
                  <View style={styles.assetIcon}>
                    <Text style={styles.assetIconText}>₵</Text>
                  </View>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>USDC</Text>
                    <Text style={styles.assetNetwork}>Starknet</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Important Notes */}
            <View style={styles.notesContainer}>
              <Text style={styles.sectionTitle}>IMPORTANT NOTES</Text>

              <View style={styles.noteItem}>
                <View style={styles.noteIconContainer}>
                  <MaterialIcons
                    name="info"
                    size={moderateScale(18)}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.noteContent}>
                  <Text style={styles.noteTitle}>Network Compatibility</Text>
                  <Text style={styles.noteText}>
                    Only send from supported networks:{" "}
                    {supportedNetworks.join(", ")}
                  </Text>
                </View>
              </View>

              <View style={styles.noteItem}>
                <View style={styles.noteIconContainer}>
                  <MaterialIcons
                    name="warning"
                    size={moderateScale(18)}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.noteContent}>
                  <Text style={styles.noteTitle}>Exchange Restrictions</Text>
                  <Text style={styles.noteText}>
                    Do not send from exchanges that don't allow withdrawals to
                    smart contracts.
                  </Text>
                </View>
              </View>

              <View style={styles.noteItem}>
                <View style={styles.noteIconContainer}>
                  <MaterialIcons
                    name="access-time"
                    size={moderateScale(18)}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.noteContent}>
                  <Text style={styles.noteTitle}>Processing Time</Text>
                  <Text style={styles.noteText}>
                    Deposits typically arrive within 2-5 minutes after network
                    confirmation.
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : selectedMethod === "bank" ? (
          // Bank Transfer Content
          <View style={styles.comingSoonContainer}>
            <MaterialIcons
              name="account-balance"
              size={moderateScale(60)}
              color="#666"
            />
            <Text style={styles.comingSoonTitle}>Bank Transfer</Text>
            <Text style={styles.comingSoonText}>
              We're working on adding bank transfer support. You'll be able to
              deposit funds directly from your bank account with low fees.
            </Text>
            <TouchableOpacity
              style={styles.notifyButton}
              onPress={handleBankTransfer}
            >
              <MaterialIcons
                name="notifications"
                size={moderateScale(20)}
                color="#EAE5DC"
              />
              <Text style={styles.notifyButtonText}>Notify me when ready</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // QR CODE content
          <View style={styles.qrContainer}>
            <View style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <MaterialIcons
                  name="qr-code"
                  size={moderateScale(20)}
                  color="#666"
                />
                <Text style={styles.qrTitle}>GENERATE QR CODE</Text>
              </View>

              <Text style={styles.qrDescription}>
                Create a payment request QR code with a specific amount
              </Text>

              <View style={styles.amountInputContainer}>
                <Text style={styles.inputLabel}>Amount to Request</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={(text) => {
                    // Replace commas with periods and ensure only one decimal point
                    const cleanedText = text.replace(/,/g, ".");
                    const parts = cleanedText.split(".");
                    if (parts.length <= 2) {
                      setAmount(cleanedText);
                    }
                  }}
                />
                <Text style={styles.currencyLabel}>USDC</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.generateButton,
                  !amount && styles.generateButtonDisabled,
                ]}
                onPress={() => setShowQR(true)}
                disabled={!amount}
              >
                <MaterialIcons
                  name="qr-code-scanner"
                  size={moderateScale(20)}
                  color={!amount ? "#666" : "#000"}
                />
                <Text
                  style={[
                    styles.generateButtonText,
                    !amount && styles.generateButtonTextDisabled,
                  ]}
                >
                  Generate QR Code
                </Text>
              </TouchableOpacity>

              {showQR && amount && (
                <View style={styles.qrResultContainer}>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode
                      value={qrValue}
                      size={moderateScale(180)}
                      backgroundColor="#FFFFFF"
                      color="#000000"
                    />
                  </View>

                  <View style={styles.qrInfo}>
                    <Text style={styles.qrAmountLabel}>Requesting</Text>
                    <Text style={styles.qrAmount}>{amount} USDC</Text>
                    <Text style={styles.qrAddressLabel}>
                      To: {formatAddress(walletAddress)}
                    </Text>
                  </View>

                  <View style={styles.qrActions}>
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={() => {
                        setShowQR(false);
                        setAmount("");
                      }}
                    >
                      <MaterialIcons
                        name="refresh"
                        size={moderateScale(18)}
                        color="#666"
                      />
                      <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* QR Instructions */}
            <View style={styles.qrInstructions}>
              <Text style={styles.instructionsTitle}>HOW IT WORKS</Text>

              <View style={styles.instructionItem}>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Enter the amount you want to request
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Generate and share your QR code
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Sender scans and completes the payment
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: moderateScale(24),
    paddingTop: Platform.OS === "android" ? verticalScale(20) : 0,
  },
  scrollContent: {
    paddingBottom: verticalScale(120),
    paddingTop: verticalScale(10),
    marginTop: verticalScale(60),
    marginHorizontal: moderateScale(15),
  },
  headerSection: {
    marginBottom: verticalScale(32),
    alignItems: "center",
  },
  mainTitle: {
    color: "#EAE5DC",
    fontSize: moderateScale(28),
    fontWeight: "600",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    color: "#666",
    fontSize: moderateScale(16),
    textAlign: "center",
  },
  methodSelector: {
    flexDirection: "row",
    marginBottom: verticalScale(32),
    gap: moderateScale(12),
  },
  methodOption: {
    flex: 1,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    aspectRatio: 1,
    justifyContent: "center",
  },
  methodOptionSelected: {
    borderColor: "#EAE5DC",
  },
  methodText: {
    color: "#666",
    fontSize: moderateScale(16),
    fontWeight: "600",
    marginTop: verticalScale(8),
    textAlign: "center",
  },
  methodTextSelected: {
    color: "#EAE5DC",
  },
  methodSubtext: {
    color: "#444",
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
    textAlign: "center",
  },
  methodSubtextSelected: {
    color: "#888",
  },
  cardContainer: {
    alignItems: "center",
    marginBottom: verticalScale(24),
  },
  card: {
    backgroundColor: "#11110E",
    borderRadius: moderateScale(12),
    padding: moderateScale(24),
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  cardTitle: {
    color: "#666",
    fontSize: moderateScale(12),
    marginLeft: moderateScale(8),
    letterSpacing: 1,
    fontWeight: "600",
  },
  addressContainer: {
    backgroundColor: "#000",
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: "#333",
  },
  addressSection: {
    marginBottom: verticalScale(12),
  },
  addressLabel: {
    color: "#666",
    fontSize: moderateScale(11),
    marginBottom: verticalScale(4),
    letterSpacing: 0.5,
  },
  addressText: {
    color: "#EAE5DC",
    fontSize: moderateScale(13),
    fontFamily: "JetBrainsMono_400Regular",
    lineHeight: moderateScale(20),
  },
  copyButton: {
    alignSelf: "flex-end",
    padding: moderateScale(8),
    borderRadius: moderateScale(6),
    backgroundColor: "#222",
    position: "relative",
  },
  copyButtonActive: {
    backgroundColor: "#333",
  },
  checkIcon: {
    position: "absolute",
    top: moderateScale(8),
    left: moderateScale(8),
  },
  addressSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  summaryLabel: {
    color: "#666",
    fontSize: moderateScale(12),
  },
  summaryAddress: {
    color: "#EAE5DC",
    fontSize: moderateScale(12),
    fontFamily: "JetBrainsMono_400Regular",
  },
  quickInfoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(24),
    marginBottom: verticalScale(32),
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  quickInfoText: {
    color: "#888",
    fontSize: moderateScale(14),
  },
  assetsContainer: {
    marginBottom: verticalScale(32),
  },
  sectionTitle: {
    color: "#EAE5DC",
    marginBottom: verticalScale(16),
    fontWeight: "600",
    fontSize: moderateScale(14),
    letterSpacing: 1,
  },
  assetsList: {
    gap: moderateScale(12),
  },
  assetItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#11110E",
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "#222",
  },
  assetIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
  },
  assetIconText: {
    color: "#EAE5DC",
    fontSize: moderateScale(18),
    fontWeight: "bold",
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  assetNetwork: {
    color: "#666",
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  notesContainer: {
    marginBottom: verticalScale(32),
  },
  noteItem: {
    flexDirection: "row",
    marginBottom: verticalScale(16),
    backgroundColor: "#11110E",
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "#222",
  },
  noteIconContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
    marginTop: moderateScale(2),
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    color: "#EAE5DC",
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginBottom: verticalScale(4),
  },
  noteText: {
    color: "#888",
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
  comingSoonContainer: {
    alignItems: "center",
    paddingVertical: verticalScale(60),
    paddingHorizontal: moderateScale(20),
  },
  comingSoonTitle: {
    color: "#EAE5DC",
    fontSize: moderateScale(24),
    fontWeight: "600",
    marginTop: verticalScale(16),
    marginBottom: verticalScale(12),
  },
  comingSoonText: {
    color: "#666",
    fontSize: moderateScale(16),
    textAlign: "center",
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(32),
  },
  notifyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#11110E",
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "#333",
    gap: moderateScale(8),
  },
  notifyButtonText: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    fontWeight: "500",
  },
  qrContainer: {
    marginTop: verticalScale(20),
    marginBottom: verticalScale(32),
  },
  qrCard: {
    backgroundColor: "#11110E",
    borderRadius: moderateScale(12),
    padding: moderateScale(24),
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: verticalScale(24),
  },
  qrHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  qrTitle: {
    color: "#666",
    fontSize: moderateScale(12),
    marginLeft: moderateScale(8),
    letterSpacing: 1,
    fontWeight: "600",
  },
  qrDescription: {
    color: "#888",
    fontSize: moderateScale(14),
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(20),
  },
  amountInputContainer: {
    position: "relative",
    marginBottom: verticalScale(24),
  },
  inputLabel: {
    color: "#666",
    fontSize: moderateScale(12),
    marginBottom: verticalScale(8),
    letterSpacing: 0.5,
  },
  amountInput: {
    backgroundColor: "#000",
    color: "#EAE5DC",
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingRight: moderateScale(60),
    fontSize: moderateScale(18),
    fontFamily: "JetBrainsMono_400Regular",
  },
  currencyLabel: {
    position: "absolute",
    right: moderateScale(16),
    top: moderateScale(40),
    color: "#666",
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAE5DC",
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(16),
    gap: moderateScale(8),
    marginBottom: verticalScale(24),
  },
  generateButtonDisabled: {
    backgroundColor: "#222",
  },
  generateButtonText: {
    color: "#000",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  generateButtonTextDisabled: {
    color: "#666",
  },
  qrResultContainer: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: verticalScale(24),
  },
  qrCodeWrapper: {
    backgroundColor: "#FFFFFF",
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qrInfo: {
    alignItems: "center",
    marginBottom: verticalScale(20),
  },
  qrAmountLabel: {
    color: "#666",
    fontSize: moderateScale(12),
    marginBottom: verticalScale(4),
  },
  qrAmount: {
    color: "#EAE5DC",
    fontSize: moderateScale(24),
    fontWeight: "600",
    marginBottom: verticalScale(8),
  },
  qrAddressLabel: {
    color: "#888",
    fontSize: moderateScale(12),
    fontFamily: "JetBrainsMono_400Regular",
  },
  qrActions: {
    flexDirection: "row",
    gap: moderateScale(12),
    width: "100%",
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: "#333",
    gap: moderateScale(6),
  },
  shareButtonText: {
    color: "#EAE5DC",
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
  resetButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: "#333",
    gap: moderateScale(6),
  },
  resetButtonText: {
    color: "#666",
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
  qrInstructions: {
    backgroundColor: "#11110E",
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    borderWidth: 1,
    borderColor: "#222",
  },
  instructionsTitle: {
    color: "#EAE5DC",
    fontSize: moderateScale(12),
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: verticalScale(16),
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  instructionStep: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
    borderWidth: 1,
    borderColor: "#333",
  },
  stepNumber: {
    color: "#EAE5DC",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
  instructionText: {
    color: "#888",
    fontSize: moderateScale(14),
    flex: 1,
    lineHeight: moderateScale(18),
  },
});
