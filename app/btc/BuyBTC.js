import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCavosWallet } from '../../atoms/cavosWallet';
import { getBTCPrice, getUsdcPrice, getWalletBalance } from '../../lib/utils';
import LoadingModal from '../components/LoadingModal';
import axios from "axios";
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from "../../lib/constants";


export default function BuyBTC() {
    const [usdAmount, setUsdAmount] = useState('');
    const [balance, setBalance] = useState(0);
    const [btcRate, setBtcRate] = useState(0);
    const [usdcRate, setUsdcRate] = useState(0);
    const cavosWallet = useCavosWallet((state) => state.cavosWallet);
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchBalance() {
            try {
                setIsLoading(true);
                const walletBalance = await getWalletBalance(cavosWallet.address);
                setBalance(walletBalance.balance);
                await fetchBtcRate();
                await fetchUsdcRate()
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching wallet balance:', error);
                Alert.alert('Error', 'Failed to fetch wallet balance.');
            }
        }

        async function fetchBtcRate() {
            try {
                const usdcPrice = await getUsdcPrice();
                const btcPrice = await getBTCPrice();
                const rate = btcPrice.data / usdcPrice.data;
                setBtcRate(rate);
            } catch (error) {
                console.error('Error fetching BTC rate:', error);
                Alert.alert('Error', 'Failed to fetch BTC rate.');
            }
        }

        async function fetchUsdcRate() {
            try {
                const usdcPrice = await getUsdcPrice();
                setUsdcRate(usdcPrice.data);
            } catch (error) {
                console.error('Error fetching USDC rate:', error);
                Alert.alert('Error', 'Failed to fetch USDC rate.');
            }
        }
        if (cavosWallet) {
            fetchBalance();
        }
    }, [cavosWallet]);

    const handleChangeAmount = (text) => {
        const sanitized = text.replace(',', '.');
        setUsdAmount(sanitized);
    };

    const handleBuyBTC = async () => {
        const amount = parseFloat(usdAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount in USD.');
            return;
        }

        if (amount > balance) {
            Alert.alert('Insufficient Balance', 'You do not have enough funds to buy BTC.');
            return;
        }
        try {
            setIsLoading(true);
            const txHash = await cavosWallet.swap(
                amount * 10 ** 6,
                "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
                "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac"
            )
            
            if (txHash.error) {
                Alert.alert("Error", "Failed to buy BTC, please try again.");
                setIsLoading(false);
                return;
            }

            const responseTransaction = await axios.post(
                CAVOS_CORE_API + 'v1/transaction',
                {
                    user_id: cavosWallet.user_id,
                    type: "Buy BTC",
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
                console.error('Insert error');
                Alert.alert('Error saving transaction to database');
                setIsLoading(false);
                return;
            }

            setIsLoading(false);
            Alert.alert('Success', `You've bought ${(calculateBtcAmount() || 0).toFixed(6)} BTC worth $${amount}.`);
            setUsdAmount('');
            navigation.navigate('BottomMenu');
        } catch (error) {
            console.error('Send error:', error);
            setIsLoading(false);
            Alert.alert('Transaction Failed', 'An error occurred while sending funds. Please try again.');
        }
    };

    const calculateBtcAmount = () => {
        const amount = parseFloat(usdAmount);
        if (isNaN(amount) || amount <= 0) return 0;
        return amount / btcRate;
    };

    return (
        <SafeAreaView style={styles.container}>
            {isLoading && (
                <LoadingModal />
            )}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Balance Section */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                    <Text style={styles.balanceAmount}>{(balance || 0).toFixed(2)} USD</Text>
                </View>

                {/* Current BTC Price Section */}
                <View style={styles.btcPriceSection}>
                    <Text style={styles.btcPriceLabel}>CURRENT BTC PRICE</Text>
                    <Text style={styles.btcPriceAmount}>${(btcRate || 0).toFixed(2)} USD</Text>
                </View>

                {/* Input Section */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>AMOUNT TO BUY (USD)</Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0.00"
                            placeholderTextColor="#555"
                            keyboardType="decimal-pad"
                            value={usdAmount}
                            onChangeText={handleChangeAmount}
                            selectionColor="#EAE5DC"
                            step="0.01"
                        />
                        <TouchableOpacity
                            style={styles.maxButton}
                            onPress={() => setUsdAmount(balance.toString())}
                        >
                            <Text style={styles.maxButtonText}>MAX</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Expected BTC Section */}
                <View style={styles.expectedBtcSection}>
                    <Text style={styles.expectedBtcLabel}>EXPECTED BTC TO RECEIVE</Text>
                    <Text style={styles.expectedBtcAmount}>
                        {(calculateBtcAmount() || 0).toFixed(7)} BTC
                    </Text>
                </View>

                {/* Buy Button */}
                <TouchableOpacity
                    style={[
                        styles.buyButton,
                        (!usdAmount || isNaN(usdAmount) || parseFloat(usdAmount) <= 0) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleBuyBTC}
                    disabled={!usdAmount || isNaN(usdAmount) || parseFloat(usdAmount) <= 0}
                >
                    <Text style={styles.buyButtonText}>Buy BTC</Text>
                </TouchableOpacity>

                {/* Disclaimer */}
                <Text style={styles.disclaimer}>
                    Cryptocurrency purchases are subject to market risks. Please invest responsibly.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
        marginTop: 20,
    },
    balanceCard: {
        backgroundColor: '#000',
        borderRadius: 10,
        padding: 20,
        marginBottom: 30,
        alignItems: 'center',
    },
    balanceLabel: {
        color: '#555',
        fontSize: 14,
        marginBottom: 8,
    },
    balanceAmount: {
        color: '#EAE5DC',
        fontSize: 36,
        fontWeight: '100',
        fontFamily: 'JetBrainsMono_400Regular',
    },
    btcPriceSection: {
        marginBottom: 30,
        alignItems: 'center',
    },
    btcPriceLabel: {
        color: '#555',
        fontSize: 14,
        marginBottom: 8,
    },
    btcPriceAmount: {
        color: '#EAE5DC',
        fontSize: 24,
        fontWeight: '100',
        fontFamily: 'JetBrainsMono_400Regular',
    },
    inputContainer: {
        marginBottom: 30,
    },
    inputLabel: {
        color: '#555',
        fontSize: 14,
        marginBottom: 15,
    },
    amountInputContainer: {
        flexDirection: 'row',
        backgroundColor: '#000',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    currencySymbol: {
        color: '#EAE5DC',
        fontSize: 24,
        marginRight: 10,
    },
    amountInput: {
        flex: 1,
        color: '#EAE5DC',
        fontSize: 24,
        fontFamily: 'JetBrainsMono_400Regular',
        padding: 0,
    },
    maxButton: {
        backgroundColor: '#333',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginLeft: 10,
    },
    maxButtonText: {
        color: '#EAE5DC',
        fontSize: 14,
        fontWeight: 'bold',
    },
    expectedBtcSection: {
        marginBottom: 30,
        alignItems: 'center',
    },
    expectedBtcLabel: {
        color: '#555',
        fontSize: 14,
        marginBottom: 8,
    },
    expectedBtcAmount: {
        color: '#EAE5DC',
        fontSize: 24,
        fontWeight: '100',
        fontFamily: 'JetBrainsMono_400Regular',
    },
    buyButton: {
        backgroundColor: '#EAE5DC',
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
        borderRadius: 8,
    },
    disabledButton: {
        backgroundColor: '#333',
    },
    buyButtonText: {
        color: '#11110E',
        fontSize: 16,
    },
    disclaimer: {
        color: '#555',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
});