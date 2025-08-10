import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    TextInput,
    Dimensions,
    Platform,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { useFonts, JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import Header from './components/Header';
import { useCavosWallet } from '../atoms/cavosWallet';
import { getWalletBalance } from '../lib/utils';
import axios from 'axios';
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from '../lib/constants';
import LoadingModal from './components/LoadingModal';
import { formatAmount } from 'cavos-service-sdk';

const { width, height } = Dimensions.get('window');

const scale = size => width / 375 * size;
const verticalScale = size => height / 812 * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function Invest() {
    const navigation = useNavigation();
    const [investmentAmount, setInvestmentAmount] = useState('');
    const [selectedPool, setSelectedPool] = useState('Vesu Pool');
    const [balance, setBalance] = useState(0);
    const cavosWallet = useCavosWallet((state) => state.cavosWallet);
    const [isLoading, setIsLoading] = useState(false);

    Font.useFonts({
        'Satoshi-Variable': require('../assets/fonts/Satoshi-Variable.ttf'),
    });

    useFonts({
        JetBrainsMono_400Regular,
    });

    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = { fontFamily: 'Satoshi-Variable' };

    useEffect(() => {
        async function getAccountInfo() {
            try {
                const newBalance = await getWalletBalance(cavosWallet.address);
                setBalance(newBalance.balance);
            } catch (error) {
                console.error('Error al obtener el balance:', error);
            }
        }

        if (cavosWallet) {
            getAccountInfo();
        }
    }, [cavosWallet]);

    const handleBack = () => {
        navigation.goBack();
    };

    const handleChangeAmount = (text) => {
        const sanitized = text.replace(',', '.');
        setInvestmentAmount(sanitized);
    };


    const createPosition = async () => {
        try {
            let calls = [
                {
                    contractAddress:
                        '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
                    entrypoint: 'approve',
                    calldata: [
                        '0x048f4e75c12ca9d35d6172b1cb5f1f70b094888003f9c94fe19f12a67947fd6d',
                        await formatAmount(investmentAmount, 6),
                    ],
                },
                {
                    contractAddress:
                        '0x048f4e75c12ca9d35d6172b1cb5f1f70b094888003f9c94fe19f12a67947fd6d',
                    entrypoint: 'deposit',
                    calldata: [await formatAmount(investmentAmount, 6), cavosWallet.address],
                },
            ];
            const tx = await cavosWallet.executeCalls(calls);
            return tx;
        } catch (err) {
            Alert.alert("An error ocurred while creating position, try again.");
            setIsLoading(false);
        }
    }

    const handleInvest = () => {
        if (!investmentAmount || isNaN(investmentAmount) || parseFloat(investmentAmount) <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid investment amount');
            return;
        }

        if (parseFloat(investmentAmount) > balance) {
            Alert.alert('Insufficient Balance', 'You don\'t have enough funds for this investment');
            return;
        }

        Alert.alert(
            'Confirm Investment',
            `Invest $${investmentAmount} in ${selectedPool}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setIsLoading(true);
                        const positionTx = await createPosition();
                        if (positionTx.error) {
                            Alert.alert('Something went wrong', 'An error ocurred while sending your funds, please try again.');
                            setIsLoading(false);
                            return;
                        }
                        
                        const responseTransaction = await axios.post(
                            CAVOS_CORE_API + 'v1/transaction',
                            {
                                user_id: cavosWallet.user_id,
                                type: "Invest",
                                amount: Number(investmentAmount),
                                tx_hash: positionTx,
                            },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                                },
                            }
                        );
                        if (responseTransaction.status!==201) {
                            console.error('Insert error:', responseTransaction.message)
                            Alert.alert('Error saving transaction to database');
                            setIsLoading(false);
                            return;
                        }
                        
                        setIsLoading(false);

                        Alert.alert('Success', `You've invested $${investmentAmount} in Vesu Protocol, the results might take a few minutes to show up in your account.`);
                        navigation.navigate('BottomMenu');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {isLoading && (
                <LoadingModal />
            )}
            {/* Header with Back Button */}
            <Header showBackButton={true} onBackPress={handleBack} />

            {/* Main Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                    <Text style={styles.balanceAmount}>{(balance || 0).toFixed(2)} USD</Text>
                </View>

                {/* Investment Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>AMOUNT TO INVEST (USD)</Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0.00"
                            placeholderTextColor="#555"
                            keyboardType="decimal-pad"
                            value={investmentAmount}
                            onChangeText={handleChangeAmount}
                            selectionColor="#EAE5DC"
                            step="0.01"
                        />
                        <TouchableOpacity
                            style={styles.maxButton}
                            onPress={() => setInvestmentAmount(balance.toString())}
                        >
                            <Text style={styles.maxButtonText}>MAX</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Investment Summary */}
                {investmentAmount && !isNaN(investmentAmount) && parseFloat(investmentAmount) > 0 && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Investment Amount</Text>
                            <Text style={styles.summaryValue}>${parseFloat(investmentAmount || 0).toFixed(2)}</Text>
                        </View>
                    </View>
                )}

                {/* Invest Button */}
                <TouchableOpacity
                    style={[
                        styles.investButton,
                        (!investmentAmount || isNaN(investmentAmount) || parseFloat(investmentAmount) <= 0) &&
                        styles.disabledButton
                    ]}
                    onPress={handleInvest}
                    disabled={!investmentAmount || isNaN(investmentAmount) || parseFloat(investmentAmount) <= 0}
                >
                    <Text style={styles.investButtonText}>Invest</Text>
                </TouchableOpacity>

                {/* Disclaimer */}
                <Text style={styles.disclaimer}>
                    Investments are subject to market risks. Past performance is not indicative of future results.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? verticalScale(20) : 0,
    },
    scrollContent: {
        paddingHorizontal: moderateScale(20),
        paddingBottom: verticalScale(100),
    },
    titleContainer: {
        marginBottom: verticalScale(30),
    },
    title: {
        color: '#EAE5DC',
        fontSize: moderateScale(28),
        fontWeight: 'bold',
        marginBottom: verticalScale(5),
    },
    subtitle: {
        color: '#555',
        fontSize: moderateScale(16),
    },
    balanceCard: {
        backgroundColor: '#000',
        borderRadius: moderateScale(10),
        padding: moderateScale(20),
        marginBottom: verticalScale(30),
        alignItems: 'center',
    },
    balanceLabel: {
        color: '#555',
        fontSize: moderateScale(14),
        marginBottom: verticalScale(8),
    },
    balanceAmount: {
        color: '#EAE5DC',
        fontSize: moderateScale(36),
        fontWeight: '100',
        fontFamily: 'JetBrainsMono_400Regular'
    },
    inputContainer: {
        marginBottom: verticalScale(30),
    },
    inputLabel: {
        color: '#555',
        fontSize: moderateScale(14),
        marginBottom: verticalScale(15),
    },
    amountInputContainer: {
        flexDirection: 'row',
        backgroundColor: '#000',
        borderRadius: moderateScale(10),
        padding: moderateScale(20),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    currencySymbol: {
        color: '#EAE5DC',
        fontSize: moderateScale(24),
        marginRight: moderateScale(10),
    },
    amountInput: {
        flex: 1,
        color: '#EAE5DC',
        fontSize: moderateScale(24),
        fontFamily: 'JetBrainsMono_400Regular',
        padding: 0,
    },
    maxButton: {
        backgroundColor: '#333',
        borderRadius: moderateScale(6),
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        marginLeft: moderateScale(10),
    },
    maxButtonText: {
        color: '#EAE5DC',
        fontSize: moderateScale(14),
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#555',
        fontSize: moderateScale(14),
        marginBottom: verticalScale(15),
    },
    poolsContainer: {
        marginBottom: verticalScale(30),
    },
    poolCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: moderateScale(10),
        padding: moderateScale(20),
        marginBottom: verticalScale(15),
        borderWidth: 1,
        borderColor: '#333',
    },
    selectedPoolCard: {
        borderColor: '#4CAF50',
    },
    poolInfo: {
        flex: 1,
    },
    poolName: {
        color: '#EAE5DC',
        fontSize: moderateScale(18),
        marginBottom: verticalScale(5),
    },
    poolApy: {
        color: '#4CAF50',
        fontSize: moderateScale(14),
        fontFamily: 'JetBrainsMono_400Regular',
    },
    summaryCard: {
        backgroundColor: '#000',
        borderRadius: moderateScale(10),
        padding: moderateScale(20),
        marginBottom: verticalScale(30),
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: verticalScale(15),
    },
    summaryLabel: {
        color: '#555',
        fontSize: moderateScale(14),
    },
    summaryValue: {
        color: '#EAE5DC',
        fontSize: moderateScale(14),
        fontFamily: 'JetBrainsMono_400Regular',
    },
    investButton: {
        backgroundColor: '#EAE5DC',
        padding: moderateScale(16),
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    disabledButton: {
        backgroundColor: '#333',
    },
    investButtonText: {
        color: '#11110E',
        fontSize: moderateScale(16),
    },
    disclaimer: {
        color: '#555',
        fontSize: moderateScale(12),
        textAlign: 'center',
        lineHeight: moderateScale(18),
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 999,
    },
    loadingContainer: {
        backgroundColor: '#11110E',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#EAE5DC',
        marginTop: 10,
        fontSize: 16,
    },
});
