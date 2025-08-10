import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Alert,
  Linking,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Font from "expo-font";
import {
  useFonts,
  JetBrainsMono_400Regular,
} from "@expo-google-fonts/jetbrains-mono";
import { getWalletBalance } from "../lib/utils";
import { useCavosWallet } from "../atoms/cavosWallet";
import LoggedHeader from "./components/LoggedHeader"; // Usando el nuevo header
import LoadingModal from "./components/LoadingModal";
import { TransactionInvoiceModal } from "./components/TransactionInvoiceModal";
import axios from 'axios';
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from '../lib/constants';

const { width, height } = Dimensions.get("window");

const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function UpdatedDashboard() {
  const [balance, setBalance] = useState(0.0);
  const [transaction, setTransactions] = useState([]);
  const cavosWallet = useCavosWallet((state) => state.cavosWallet);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollViewRef = useRef(null);
  const [showHeader, setShowHeader] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedTxDetails, setSelectedTxDetails] = useState(null);

  Font.useFonts({
    "Satoshi-Variable": require("../assets/fonts/Satoshi-Variable.ttf"),
  });

  useFonts({
    JetBrainsMono_400Regular,
  });

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: "Satoshi-Variable" };

  const getAccountInfo = async () => {
    try {
      setIsLoading(true);
      const newBalance = await getWalletBalance(cavosWallet.address, cavosWallet.network);
      setBalance(newBalance.balance);
        const response = await axios.get(
          `${CAVOS_CORE_API}v1/transaction`,
          {
            params: {
              user_id: cavosWallet.user_id
            },
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${CAVOS_CORE_TOKEN}`
            }
          }
        );
        if (response.status!==200) {
        console.error("Read error:", response.message);
        Alert.alert("Error reading from database");
        return;
      }

      setTransactions(response.data.data);
    } catch (error) {
      console.error("Error fetching balance and transactions:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (cavosWallet) {
      getAccountInfo();
    }
  }, [cavosWallet]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    getAccountInfo();
  };

  const goToReceive = () => {
    navigation.navigate("Receive");
  };

  const goToSell = () => {
    navigation.navigate("Send");
  };

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y >= height * 0.5 && showHeader) {
      setShowHeader(false);
    } else if (y < height * 0.5 && !showHeader) {
      setShowHeader(true);
    }
  };

  async function fetchTransactionDetails(txHash) {
    try {
      const response = await fetch(
        `https://services.cavos.xyz/api/v1/external/tx?txHash=${txHash}&network=mainnet`
      );
      if (!response.ok) {
        throw new Error("Error fetching transaction details");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("fetchTransactionDetails error:", error);
      return null;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && <LoadingModal />}

      {showHeader && <LoggedHeader />}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#EAE5DC"
            colors={["#EAE5DC"]}
          />
        }
      >
        <View style={[styles.section]}>
          <TouchableOpacity
            style={styles.cardContainer}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("CardWaitlist")}
          >
            <Image
              source={require("../assets/cavos-card.png")}
              style={styles.visaCard}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Balance Section */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>YOUR BALANCE</Text>
            <Text style={styles.balanceAmount}>{(balance || 0).toFixed(2)} USD</Text>
          </View>

          {/* Action Buttons - Solo Buy y Sell */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.buyButton} onPress={goToReceive}>
              <Text style={styles.buyButtonText}>Receive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sellButton} onPress={goToSell}>
              <Text style={styles.sellButtonText}>Send</Text>
            </TouchableOpacity>
          </View>

          {/* Texto para invitar a scrollear */}
          <View style={styles.scrollHintContainer}>
            <Text style={styles.scrollHintText}>
              Scroll down to see your transaction history ↓
            </Text>
          </View>
        </View>

        {/* Sección de transacciones */}
        <View style={[styles.section, { height }]}>
          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            <Text style={styles.transactionsTitle}>TRANSACTIONS</Text>

            <ScrollView
              style={styles.transactionsList}
              contentContainerStyle={styles.transactionsContent}
              showsVerticalScrollIndicator={false}
            >
              {transaction.map((tx, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <TouchableOpacity
                      onPress={async () => {
                        const details = await fetchTransactionDetails(
                          tx.tx_hash
                        );
                        if (details) {
                          setSelectedTxDetails(details);
                          setShowInvoice(true);
                        } else {
                          Alert.alert(
                            "Error",
                            "Could not fetch transaction details."
                          );
                        }
                      }}
                    >
                      <Text style={styles.transactionType}>{tx.type}</Text>
                      <Text style={styles.transactionDetail}>
                        {tx.type === "Account Creation"
                          ? tx.uid.slice(0, 4) + "..." + tx.uid.slice(-4)
                          : tx.tx_hash.slice(0, 4) +
                            "..." +
                            tx.tx_hash.slice(-4)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={
                        tx.type === "Deposit" ||
                        tx.type === "Sell BTC" ||
                        tx.type === "Close Investment" ||
                        tx.type === "Receive"
                          ? styles.transactionAmountPositive
                          : styles.transactionAmountNegative
                      }
                    >
                      {tx.type === "Deposit" ||
                      tx.type === "Sell BTC" ||
                      tx.type === "Close Investment" ||
                      tx.type === "Receive"
                        ? "+"
                        : "-"}
                      {(tx.amount || 0).toFixed(2)} USDC
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(tx.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
      {showInvoice && selectedTxDetails && (
        <TransactionInvoiceModal
          visible={showInvoice}
          onClose={() => setShowInvoice(false)}
          txDetails={selectedTxDetails}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: moderateScale(20),
    paddingTop: Platform.OS === "android" ? verticalScale(20) : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(120), // Más espacio para el bottom tab
  },
  cardContainer: {
    alignItems: "center",
    marginBottom: verticalScale(40),
    marginTop: verticalScale(20),
  },
  visaCard: {
    width: width * 0.85, // 85% del ancho de pantalla
    height: verticalScale(200), // Altura ajustada
  },
  balanceSection: {
    marginBottom: verticalScale(40),
    alignItems: "center",
  },
  balanceLabel: {
    color: "#666",
    fontSize: moderateScale(12),
    marginBottom: verticalScale(8),
    letterSpacing: 1,
  },
  balanceAmount: {
    color: "#EAE5DC",
    fontSize: moderateScale(42),
    fontWeight: "300",
    fontFamily: "JetBrainsMono_400Regular",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: verticalScale(50),
    paddingHorizontal: width * 0.1,
    gap: moderateScale(20),
  },
  buyButton: {
    flex: 1,
    paddingVertical: verticalScale(16),
    borderWidth: 1,
    borderColor: "#EAE5DC",
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  buyButtonText: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    fontWeight: "500",
  },
  sellButton: {
    flex: 1,
    paddingVertical: verticalScale(16),
    borderWidth: 1,
    borderColor: "#EAE5DC",
    borderRadius: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  sellButtonText: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    fontWeight: "500",
  },
  transactionsSection: {
    flex: 1,
    paddingHorizontal: moderateScale(0),
    paddingTop: verticalScale(80),
  },
  transactionsTitle: {
    color: "#666",
    fontSize: moderateScale(12),
    marginBottom: verticalScale(20),
    letterSpacing: 1,
    paddingLeft: moderateScale(30),
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: moderateScale(30),
  },
  transactionsContent: {
    paddingBottom: verticalScale(100),
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  transactionLeft: {
    flex: 1,
  },
  transactionRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  transactionType: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    fontWeight: "500",
    marginBottom: verticalScale(4),
  },
  transactionDetail: {
    color: "#666",
    fontSize: moderateScale(12),
    fontFamily: "JetBrainsMono_400Regular",
  },
  transactionAmountPositive: {
    color: "#00C851",
    fontSize: moderateScale(16),
    fontWeight: "500",
    marginBottom: verticalScale(4),
    fontFamily: "JetBrainsMono_400Regular",
  },
  transactionAmountNegative: {
    color: "#FF4444",
    fontSize: moderateScale(16),
    fontWeight: "500",
    marginBottom: verticalScale(4),
    fontFamily: "JetBrainsMono_400Regular",
  },
  transactionDate: {
    color: "#666",
    fontSize: moderateScale(12),
    fontFamily: "JetBrainsMono_400Regular",
  },
  section: {
    width: "100%",
    justifyContent: "center",
  },
  scrollHintContainer: {
    alignItems: "center",
    marginBottom: verticalScale(90),
  },
  scrollHintText: {
    color: "#666",
    fontSize: moderateScale(14),
    fontStyle: "italic",
  },
});
