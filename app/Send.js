import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Font from "expo-font";
import {
  useFonts,
  JetBrainsMono_400Regular,
} from "@expo-google-fonts/jetbrains-mono";
import { MaterialIcons } from "@expo/vector-icons";
import { useCavosWallet } from '../atoms/cavosWallet';
import { getWalletBalance } from "../lib/utils";
import axios from "axios";
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from "../lib/constants";
import LoadingModal from "./components/LoadingModal";
import QRScanner from "./QRScanner";
import { formatAmount } from 'cavos-service-sdk';

const { width, height } = Dimensions.get("window");

const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function Send() {
  const navigation = useNavigation();
  const route = useRoute();
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState("address");
  const cavosWallet = useCavosWallet((state) => state.cavosWallet);
  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const hasProcessedQR = useRef(false);

  Font.useFonts({
    "Satoshi-Variable": require("../assets/fonts/Satoshi-Variable.ttf"),
  });

  useFonts({
    JetBrainsMono_400Regular,
  });

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: "Satoshi-Variable" };

  useEffect(() => {
    async function getAccountInfo() {
      try {
        const newBalance = await getWalletBalance(cavosWallet.address);
        setBalance(newBalance.balance);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }

    if (cavosWallet) {
      getAccountInfo();
    }
  }, [cavosWallet]);

  useEffect(() => {
    if (route.params?.recipientAddress) {
      let addr = route.params.recipientAddress;
      const addrFormatted = addr?.startsWith("0x")
        ? "0x" + addr.slice(2).padStart(64, "0")
        : "0x" + addr?.padStart(64, "0") || "";
      setRecipientAddress(addrFormatted);
    }
  }, [route.params?.recipientAddress]);

  useEffect(() => {
    const shouldShow =
      amount && !isNaN(amount) && parseFloat(amount) > 0 && recipientAddress;
    if (shouldShow !== showSummary) {
      setShowSummary(shouldShow);

      if (shouldShow) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [amount, recipientAddress, showSummary]);

  const handleChangeAmount = (text) => {
    const sanitized = text.replace(",", ".");
    setAmount(sanitized);
  };

  const validateStarknetAddress = (address) => {
    return address?.startsWith("0x") && address?.length === 66;
  };

  const calculateFees = (amountValue) => {
    const numAmount = parseFloat(amountValue) || 0;
    const platformFee = numAmount >= 500 ? numAmount * 0.002 : 0;
    const networkFee = 0; // Always 0 as specified
    const totalFees = platformFee + networkFee;
    const totalAmount = numAmount + totalFees;

    return {
      platformFee,
      networkFee,
      totalFees,
      totalAmount,
    };
  };

  const handleSend = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > balance) {
      Alert.alert(
        "Insufficient Balance",
        "You don't have enough funds for this transfer"
      );
      return;
    }

    if (!recipientAddress) {
      Alert.alert("Missing Address", "Please enter a recipient address");
      return;
    }

    if (!validateStarknetAddress(recipientAddress)) {
      Alert.alert(
        "Invalid Address",
        "Please enter a valid Starknet wallet address"
      );
      return;
    }

    Alert.alert(
      "Confirm Transfer",
      `Send $${amount} to ${recipientAddress.substring(
        0,
        6
      )}...${recipientAddress.substring(recipientAddress.length - 4)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setIsLoading(true);
            try {
              const calldata = [recipientAddress, await formatAmount(amount, 6)];
              const txHash = await cavosWallet.execute(
                "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
                "transfer",
                calldata
              );
              
              const responseTransaction = await axios.post(
                CAVOS_CORE_API + 'v1/transaction',
                {
                    user_id: cavosWallet.user_id,
                    type: "Send",
                    amount: Number(amount),
                    tx_hash: txHash,
                },
                {
                  headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                  },
                }
              );
              
              if (responseTransaction.status!==201) {
                console.error("Insert error:");
                Alert.alert("Error saving transaction to database");
                setIsLoading(false);
                return;
              }

              let normalizedAddress = recipientAddress;
              if (normalizedAddress?.startsWith("0x")) {
                normalizedAddress =
                  "0x" + normalizedAddress.slice(2).replace(/^0+/, "");
              }

              const responseGet = await axios.get(
                `${CAVOS_CORE_API}v1/user/wallet`,
                {
                  params: {
                    address: normalizedAddress 
                  },
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${CAVOS_CORE_TOKEN}`
                  }
                }
              );
                
              if (responseGet.data.user_id) {
                const responseTransaction = await axios.post(
                  CAVOS_CORE_API + 'v1/transaction',
                  {
                      user_id: responseGet.data.user_id,
                      type: "Receive",
                      amount: Number(amount),
                      tx_hash: txHash,
                  },
                  {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                    },
                  }
                );
              }

              setIsLoading(false);
              Alert.alert(
                "Success",
                `You've sent $${amount} to ${recipientAddress.substring(
                  0,
                  6
                )}...${recipientAddress.substring(recipientAddress.length - 4)}`
              );
              // Reset fields
              setAmount("");
              setRecipientAddress("");
              navigation.navigate("BottomMenu");
            } catch (error) {
              console.error("Send error:", error);
              setIsLoading(false);
              Alert.alert(
                "Transaction Failed",
                "An error occurred while sending funds. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleQRScan = () => {
    hasProcessedQR.current = false;
    setShowQRScanner(true);
  };

  const handleQRCodeScanned = async (scannedAddress, amount) => {
    if (hasProcessedQR.current) {
      return;
    }

    if (isProcessingQR) {
      return;
    }

    hasProcessedQR.current = true;
    setIsProcessingQR(true);

    setShowQRScanner(false);

    await new Promise((resolve) => setTimeout(resolve, 100));

    let parsedAmount;
    try {
      parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        console.warn("Invalid amount received from QR code:", amount);
        Alert.alert("Invalid Amount", "Invalid amount received from QR code");
        setIsProcessingQR(false);
        return;
      }
    } catch (error) {
      console.error("Error parsing amount from QR code:", error);
      Alert.alert("Invalid Amount", "Error parsing amount from QR code");
      setIsProcessingQR(false);
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Amount must be greater than 0");
      setIsProcessingQR(false);
      return;
    }

    if (parsedAmount > balance) {
      Alert.alert(
        "Insufficient Balance",
        "You don't have enough funds for this transfer"
      );
      setIsProcessingQR(false);
      return;
    }

    if (!scannedAddress) {
      Alert.alert("Missing Address", "No address received from QR code");
      setIsProcessingQR(false);
      return;
    }

    if (!validateStarknetAddress(scannedAddress)) {
      Alert.alert(
        "Invalid Address",
        "Invalid Starknet wallet address received from QR code"
      );
      setIsProcessingQR(false);
      return;
    }

    Alert.alert(
      "Confirm Transfer",
      `Send $${parsedAmount} to ${scannedAddress.substring(
        0,
        6
      )}...${scannedAddress.substring(scannedAddress.length - 4)}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            setIsProcessingQR(false);
          },
        },
        {
          text: "Confirm",
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await axios.post(
                CAVOS_CORE_API + "v1/wallet/usd/send",
                {
                  amount: parsedAmount,
                  address: cavosWallet.address,
                  hashedPk: cavosWallet.private_key,
                  hashedPin: cavosWallet.pin,
                  receiverAddress: scannedAddress,
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                  },
                }
              );

              if (!response.data.result) {
                throw new Error("Transaction failed");
              }

              const txHash = response.data.result;

              const responseTransaction = await axios.post(
                CAVOS_CORE_API + 'v1/transaction',
                {
                    user_id: cavosWallet.user_id,
                    type: "Send",
                    amount: Number(parsedAmount),
                    tx_hash: txHash,
                },
                {
                  headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                  },
                }
              );
              
              if (responseTransaction.status!==201) {
                console.error("Insert error");
                Alert.alert("Error saving transaction to database");
                setIsLoading(false);
                setIsProcessingQR(false);
                return;
              }

              let normalizedAddress = scannedAddress;
              if (normalizedAddress?.startsWith("0x")) {
                normalizedAddress =
                  "0x" + normalizedAddress.slice(2).replace(/^0+/, "");
              }

              const responseGet = await axios.get(
                `${CAVOS_CORE_API}v1/user/wallet`,
                {
                  params: {
                    address: normalizedAddress 
                  },
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${CAVOS_CORE_TOKEN}`
                  }
                }
              );

              if (responseGet.data.user_id) {
                const responseTransaction = await axios.post(
                  CAVOS_CORE_API + 'v1/transaction',
                  {
                      user_id: responseGet.data.user_id,
                      type: "Receive",
                      amount: Number(parsedAmount),
                      tx_hash: txHash,
                  },
                  {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                    },
                  }
                );
              }

              setIsLoading(false);
              setIsProcessingQR(false);
              Alert.alert(
                "Success",
                `You've sent $${parsedAmount} to ${scannedAddress.substring(
                  0,
                  6
                )}...${scannedAddress.substring(scannedAddress.length - 4)}`
              );
              // Reset fields
              setAmount("");
              setRecipientAddress("");
              navigation.navigate("BottomMenu");
            } catch (error) {
              console.error("Send error:", error);
              setIsLoading(false);
              setIsProcessingQR(false);
              Alert.alert(
                "Transaction Failed",
                "An error occurred while sending funds. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleCloseQRScanner = () => {
    setShowQRScanner(false);
  };

  if (showQRScanner) {
    return (
      <QRScanner
        onQRCodeScanned={handleQRCodeScanned}
        onClose={handleCloseQRScanner}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && <LoadingModal />}
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={60}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Send Funds</Text>
          <Text style={styles.subtitle}>
            Choose your preferred sending method
          </Text>
        </View>

        {/* Method Selection */}
        <View style={styles.methodSelectionContainer}>
          <TouchableOpacity
            style={[
              styles.methodOption,
              selectedMethod === "address" && styles.methodOptionSelected,
            ]}
            onPress={() => setSelectedMethod("address")}
          >
            <MaterialIcons
              name="account-balance-wallet"
              size={moderateScale(24)}
              color={selectedMethod === "address" ? "#EAE5DC" : "#666"}
            />
            <Text
              style={[
                styles.methodText,
                selectedMethod === "address" && styles.methodTextSelected,
              ]}
            >
              By Address
            </Text>
            <Text
              style={[
                styles.methodSubtext,
                selectedMethod === "address" && styles.methodSubtextSelected,
              ]}
            >
              Enter address manually
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodOption,
              selectedMethod === "qr" && styles.methodOptionSelected,
            ]}
            onPress={() => setSelectedMethod("qr")}
          >
            <MaterialIcons
              name="qr-code-scanner"
              size={moderateScale(24)}
              color={selectedMethod === "qr" ? "#EAE5DC" : "#666"}
            />
            <Text
              style={[
                styles.methodText,
                selectedMethod === "qr" && styles.methodTextSelected,
              ]}
            >
              QR Code
            </Text>
            <Text
              style={[
                styles.methodSubtext,
                selectedMethod === "qr" && styles.methodSubtextSelected,
              ]}
            >
              Scan QR code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <View style={styles.balanceIndicator} />
          </View>
                      <Text style={styles.balanceAmount}>${(balance || 0).toFixed(2)}</Text>
          <Text style={styles.balanceSubtext}>USD</Text>
        </View>

        {/* Recipient Address Input - Show only when address method is selected */}
        {selectedMethod === "address" && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>RECIPIENT ADDRESS</Text>
            <View
              style={[
                styles.addressInputContainer,
                recipientAddress &&
                !validateStarknetAddress(recipientAddress) &&
                styles.inputError,
              ]}
            >
              <TextInput
                style={styles.addressInput}
                placeholder="Starknet wallet address"
                placeholderTextColor="#666"
                value={recipientAddress}
                onChangeText={(text) => setRecipientAddress(text)}
                selectionColor="#EAE5DC"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {recipientAddress && !validateStarknetAddress(recipientAddress) && (
              <Text style={styles.errorText}>
                Invalid Starknet address format
              </Text>
            )}
          </View>
        )}

        {/* QR Code Scanner - Show only when QR method is selected */}
        {selectedMethod === "qr" && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>SCAN QR CODE</Text>
            <TouchableOpacity
              style={styles.qrScannerButton}
              onPress={handleQRScan}
            >
              <MaterialIcons
                name="qr-code-scanner"
                size={moderateScale(32)}
                color="#EAE5DC"
              />
              <Text style={styles.qrScannerText}>Tap to scan QR code</Text>
            </TouchableOpacity>

            {/* Show scanned address if available */}
            {recipientAddress && (
              <View style={styles.scannedAddressContainer}>
                <Text style={styles.scannedAddressLabel}>Scanned Address:</Text>
                <Text style={styles.scannedAddressText}>
                  {recipientAddress.substring(0, 6)}...
                  {recipientAddress.substring(recipientAddress.length - 4)}
                </Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setRecipientAddress("")}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Amount Input - Show only when address method is selected */}
        {selectedMethod === "address" && (
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>AMOUNT TO SEND</Text>
            <View
              style={[
                styles.amountInputContainer,
                amount && parseFloat(amount) > balance && styles.inputError,
              ]}
            >
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={handleChangeAmount}
                selectionColor="#EAE5DC"
              />
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => setAmount(balance.toString())}
              >
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            {amount && parseFloat(amount) > balance && (
              <Text style={styles.errorText}>
                Insufficient balance. Available: ${(balance || 0).toFixed(2)}
              </Text>
            )}
          </View>
        )}

        {/* Transfer Summary */}
        {showSummary && (
          <Animated.View
            style={[
              styles.summaryCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>TRANSFER SUMMARY</Text>
              <View style={styles.summaryDivider} />
            </View>

            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    parseFloat(amount) > balance && styles.summaryValueError,
                  ]}
                >
                  ${parseFloat(amount || 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Platform Fee</Text>
                <Text style={styles.summaryValue}>
                  ${(calculateFees(amount || 0).platformFee || 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Network Fee</Text>
                <Text style={[styles.summaryValue, styles.freeTag]}>FREE</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text
                  style={[
                    styles.totalValue,
                    calculateFees(amount).totalAmount > balance &&
                    styles.totalValueError,
                  ]}
                >
                  ${(calculateFees(amount || 0).totalAmount || 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.recipientRow}>
                <Text style={styles.summaryLabel}>To</Text>
                <View style={styles.recipientTag}>
                  <Text style={styles.recipientText}>
                    {recipientAddress.substring(0, 6)}...
                    {recipientAddress.substring(recipientAddress.length - 4)}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!amount ||
              isNaN(amount) ||
              parseFloat(amount) <= 0 ||
              !recipientAddress ||
              !validateStarknetAddress(recipientAddress)) &&
            styles.disabledButton,
          ]}
          onPress={handleSend}
          disabled={
            !amount ||
            isNaN(amount) ||
            parseFloat(amount) <= 0 ||
            !recipientAddress ||
            !validateStarknetAddress(recipientAddress)
          }
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimer}>
            Double-check the recipient address before sending. Transactions
            cannot be reversed once confirmed.
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: Platform.OS === "android" ? verticalScale(20) : 0,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: verticalScale(120),
    marginTop: verticalScale(20),
  },
  balanceCard: {
    backgroundColor: "#000",
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    marginBottom: verticalScale(32),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  balanceLabel: {
    color: "#888",
    fontSize: moderateScale(12),
    letterSpacing: 1,
    fontWeight: "500",
  },
  balanceIndicator: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#4CAF50",
    marginLeft: moderateScale(8),
  },
  balanceAmount: {
    color: "#EAE5DC",
    fontSize: moderateScale(42),
    fontWeight: "200",
    fontFamily: "JetBrainsMono_400Regular",
    marginBottom: verticalScale(4),
  },
  balanceSubtext: {
    color: "#666",
    fontSize: moderateScale(14),
    fontFamily: "JetBrainsMono_400Regular",
  },
  inputSection: {
    marginBottom: verticalScale(24),
  },
  inputLabel: {
    color: "#888",
    fontSize: moderateScale(12),
    marginBottom: verticalScale(12),
    letterSpacing: 1,
    fontWeight: "500",
  },
  addressInputContainer: {
    flexDirection: "row",
    backgroundColor: "#111111",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  addressPrefix: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  addressPrefixText: {
    color: "#888",
    fontSize: moderateScale(16),
    fontFamily: "JetBrainsMono_400Regular",
  },
  addressInput: {
    flex: 1,
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    fontFamily: "JetBrainsMono_400Regular",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
  },
  amountInputContainer: {
    flexDirection: "row",
    backgroundColor: "#111111",
    borderRadius: moderateScale(12),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(18),
  },
  currencySymbol: {
    color: "#EAE5DC",
    fontSize: moderateScale(28),
    marginRight: moderateScale(12),
    fontWeight: "300",
  },
  amountInput: {
    flex: 1,
    color: "#EAE5DC",
    fontSize: moderateScale(28),
    fontFamily: "JetBrainsMono_400Regular",
    fontWeight: "300",
  },
  maxButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    marginLeft: moderateScale(12),
  },
  maxButtonText: {
    color: "#EAE5DC",
    fontSize: moderateScale(12),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: "#FF6B6B",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: moderateScale(12),
    marginTop: verticalScale(8),
    fontStyle: "italic",
  },
  summaryCard: {
    backgroundColor: "#000",
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(32),
    borderWidth: 1,
    borderColor: "#1a1a1a",
    overflow: "hidden",
  },
  summaryHeader: {
    backgroundColor: "#000",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
  },
  summaryTitle: {
    color: "#EAE5DC",
    fontSize: moderateScale(14),
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: verticalScale(12),
  },
  summaryContent: {
    padding: moderateScale(20),
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  summaryLabel: {
    color: "#888",
    fontSize: moderateScale(14),
    fontWeight: "400",
  },
  summaryValue: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    fontFamily: "JetBrainsMono_400Regular",
    fontWeight: "400",
  },
  summaryValueError: {
    color: "#FF6B6B",
  },
  freeTag: {
    color: "#4CAF50",
    fontSize: moderateScale(12),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: verticalScale(16),
    marginBottom: verticalScale(16),
  },
  totalLabel: {
    color: "#EAE5DC",
    fontSize: moderateScale(18),
    fontWeight: "600",
  },
  totalValue: {
    color: "#EAE5DC",
    fontSize: moderateScale(20),
    fontFamily: "JetBrainsMono_400Regular",
    fontWeight: "500",
  },
  totalValueError: {
    color: "#FF6B6B",
  },
  recipientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(8),
  },
  recipientTag: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(6),
  },
  recipientText: {
    color: "#EAE5DC",
    fontSize: moderateScale(12),
    fontFamily: "JetBrainsMono_400Regular",
  },
  sendButton: {
    backgroundColor: "#EAE5DC",
    padding: moderateScale(18),
    alignItems: "center",
    marginBottom: verticalScale(24),
    borderRadius: moderateScale(12),
  },
  disabledButton: {
    backgroundColor: "#333",
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: "#11110E",
    fontSize: moderateScale(16),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  disclaimerContainer: {
    backgroundColor: "#111111",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  disclaimer: {
    color: "#666",
    fontSize: moderateScale(12),
    textAlign: "center",
    lineHeight: moderateScale(18),
  },
  methodSelectionContainer: {
    flexDirection: "row",
    marginBottom: verticalScale(24),
    gap: moderateScale(12),
  },
  methodOption: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  methodOptionSelected: {
    backgroundColor: "#000",
    borderColor: "#EAE5DC",
  },
  methodText: {
    color: "#666",
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginTop: verticalScale(8),
    textAlign: "center",
  },
  methodTextSelected: {
    color: "#EAE5DC",
  },
  methodSubtext: {
    color: "#666",
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
    textAlign: "center",
  },
  methodSubtextSelected: {
    color: "#EAE5DC",
  },
  qrScannerButton: {
    backgroundColor: "#111111",
    borderRadius: moderateScale(12),
    padding: moderateScale(40),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "dashed",
  },
  qrScannerText: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    marginTop: verticalScale(12),
    fontWeight: "500",
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
    textAlign: "center",
  },
  subtitle: {
    color: "#666",
    fontSize: moderateScale(16),
    textAlign: "center",
    lineHeight: moderateScale(22),
  },
  scannedAddressContainer: {
    backgroundColor: "#111111",
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginTop: verticalScale(16),
    borderWidth: 1,
    borderColor: "#333",
  },
  scannedAddressLabel: {
    color: "#888",
    fontSize: moderateScale(12),
    marginBottom: verticalScale(8),
    fontWeight: "500",
  },
  scannedAddressText: {
    color: "#EAE5DC",
    fontSize: moderateScale(14),
    fontFamily: "JetBrainsMono_400Regular",
    marginBottom: verticalScale(12),
  },
  clearButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(6),
    alignSelf: "flex-start",
  },
  clearButtonText: {
    color: "#EAE5DC",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },
});
