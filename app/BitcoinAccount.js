import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    Dimensions,
    Platform,
    Alert,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import { useFonts, JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { useCavosWallet } from '../atoms/cavosWallet';
import axios from 'axios';
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from '../lib/constants';
import Icon from 'react-native-vector-icons/Ionicons';
import LoadingModal from './components/LoadingModal';
import LoggedHeader from './components/LoggedHeader';

const { width, height } = Dimensions.get('window');
const scale = size => width / 375 * size;
const verticalScale = size => height / 812 * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function BitcoinAccount() {
    const [btcBalance, setBtcBalance] = useState(0.000);
    const [investedBtc, setInvestedBtc] = useState(0.000);
    const [apy, setApy] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showHeader, setShowHeader] = useState(true);
    const [poolId, setPoolId] = useState(0);
    const cavosWallet = useCavosWallet((state) => state.cavosWallet);
    const navigation = useNavigation();
    const scrollViewRef = useRef(null);

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    Font.useFonts({
        'Satoshi-Variable': require('../assets/fonts/Satoshi-Variable.ttf'),
    });

    useFonts({
        JetBrainsMono_400Regular,
    });

    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = { fontFamily: 'Satoshi-Variable' };

    // Animación inicial
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const fetchBitcoinData = async () => {
        try {
            setIsLoading(true);
            const balanceResponse = await axios.post(
                CAVOS_CORE_API + "v1/wallet/btc/balance",
                { address: cavosWallet.address },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                    },
                }
            );
            setBtcBalance(balanceResponse.data.balance);

            const investmentResponse = await axios.post(
                CAVOS_CORE_API + 'v1/vesu/positions',
                {
                    address: cavosWallet.address,
                    pool: "Genesis",
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                    },
                }
            );
            const apyResponse = await axios.post(
                CAVOS_CORE_API + 'v1/vesu/pool/apy',
                {
                    poolName: "Genesis",
                    assetSymbol: "WBTC"
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                    },
                }
            );
            setApy(apyResponse.data.poolAPY);
            setInvestedBtc(investmentResponse.data.total_supplied);
            setPoolId(investmentResponse.data.poolid);
        } catch (err) {
            console.error('Error fetching BTC data:', err);
            Alert.alert('Error', 'Failed to fetch BTC data.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (cavosWallet) {
            fetchBitcoinData();
        }
    }, [cavosWallet]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchBitcoinData();
    };

    const animateButtonPress = (callback) => {
        const buttonScale = new Animated.Value(1);

        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(callback, 150);
    };

    const handleCloseInvestment = async () => {
        if (!investedBtc || investedBtc <= 0) {
            Alert.alert("No investments", "You have no investments to close.");
            return;
        }
        animateButtonPress(async () => {
            setIsLoading(true);
            try {
                const response = await axios.post(
                    CAVOS_CORE_API + 'v1/vesu/position/btc/withdraw',
                    {
                        address: cavosWallet.address,
                        hashedPk: cavosWallet.private_key,
                        hashedPin: cavosWallet.pin,
                        poolId: poolId,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                        },
                    }
                );

                if (response.data.result == false) {
                    Alert.alert("An error occurred", "Please try again later");
                } else if (response.data.amount !== null && response.data.result !== null) {

                    const responseTransaction = await axios.post(
                        CAVOS_CORE_API + 'v1/transaction',
                        {
                            user_id: cavosWallet.user_id,
                            type: "Close Investment",
                            amount: response.data.amount,
                            tx_hash: response.data.result,
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                            },
                        }
                    );
                    
                    if (responseTransaction.status!==201) {
                        console.error('Transaction API error:', responseTransaction.status, responseTransaction.data);
                        Alert.alert('Error', 'Failed to save transaction record');
                        return;
                    }
                    Alert.alert("Investment Closed", `${response.data.amount} BTC has been sent to your account, investment data might take a few minutes to update`);
                }
            } catch (error) {
                Alert.alert("An error occurred", "Please try again later");
                console.error('Error closing investment', error);
            } finally {
                setIsLoading(false);
            }
        });
    };

    const goToBuy = () => {
        animateButtonPress(() => {
            navigation.navigate('BuyBTC');
        });
    };

    const goToSell = () => {
        animateButtonPress(() => {
            navigation.navigate('SellBTC');
        });
    };

    const goToInvest = () => {
        animateButtonPress(() => {
            navigation.navigate('InvestBTC');
        });
    };

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: '#000'}]}>
            {isLoading && <LoadingModal />}

            {showHeader && <LoggedHeader />}

            <ScrollView
                ref={scrollViewRef}
                style={[styles.scrollView, {backgroundColor: '#000'}]}
                contentContainerStyle={{paddingBottom: 40}}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor="#EAE5DC"
                        colors={['#EAE5DC']}
                    />
                }
            >
                {/* Header Section */}
                <Animated.View
                    style={[
                        styles.headerSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                </Animated.View>

                {/* Main Balance Card */}
                <Animated.View
                    style={[
                        styles.mainCard,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    {/* Bitcoin Balance */}
                    <View style={styles.balanceSection}>
                        <Text style={styles.balanceLabel}>YOUR BTC BALANCE</Text>
                        <Text style={styles.balanceValue}>
                            {(btcBalance || 0).toFixed(6)}
                        </Text>
                        <Text style={styles.balanceCurrency}>BTC</Text>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Icon name="trending-up" size={moderateScale(20)} color="#EAE5DC" />
                            </View>
                            <Text style={styles.statLabel}>Total Invested</Text>
                            <Text style={styles.statValue}>{(investedBtc || 0).toFixed(6)} BTC</Text>
                        </View>

                        <View style={styles.statItem}>
                            <View style={styles.statIconContainer}>
                                <Icon name="stats-chart" size={moderateScale(20)} color="#EAE5DC" />
                            </View>
                            <Text style={styles.statLabel}>Current APY</Text>
                            <Text style={styles.statValue}>{(apy || 0).toFixed(2)}%</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Action Buttons */}
                <Animated.View
                    style={[
                        styles.actionSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    {/* Primary Action - Invest */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => Alert.alert('This feature is under development')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.buttonContent}>
                            <Icon name="arrow-up-circle" size={moderateScale(22)} color="#11110E" />
                            <Text style={styles.primaryButtonText}>Invest</Text>
                        </View>
                        <View style={styles.buttonGlow}></View>
                    </TouchableOpacity>

                    {/* Secondary Actions */}
                    <View style={styles.secondaryButtons}>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={goToBuy}
                            activeOpacity={0.7}
                        >
                            <Icon name="add-circle-outline" size={moderateScale(18)} color="#EAE5DC" />
                            <Text style={styles.secondaryButtonText}>Buy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={goToSell}
                            activeOpacity={0.7}
                        >
                            <Icon name="remove-circle-outline" size={moderateScale(18)} color="#EAE5DC" />
                            <Text style={styles.secondaryButtonText}>Sell</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => Alert.alert('This feature is under development')}
                            activeOpacity={0.7}
                        >
                            <Icon name="close-circle-outline" size={moderateScale(18)} color="#EAE5DC" />
                            <Text style={styles.secondaryButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Info Cards */}
                <Animated.View
                    style={[
                        styles.infoSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <Icon name="logo-bitcoin" size={moderateScale(20)} color="#F7931A" />
                            <Text style={styles.infoTitle}>About Bitcoin</Text>
                        </View>
                        <Text style={styles.infoText}>
                            Bitcoin is the world's first decentralized digital currency. Store, send, and invest in BTC with complete control over your funds.
                        </Text>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <Icon name="shield-checkmark" size={moderateScale(20)} color="#EAE5DC" />
                            <Text style={styles.infoTitle}>Security</Text>
                        </View>
                        <Text style={styles.infoText}>
                            Your Bitcoin is secured by advanced cryptography and stored in your non-custodial wallet on the Starknet network.
                        </Text>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <Icon name="trending-up" size={moderateScale(20)} color="#EAE5DC" />
                            <Text style={styles.infoTitle}>Investment Options</Text>
                        </View>
                        <Text style={styles.infoText}>
                            Earn yield on your Bitcoin by lending it through Vesu Protocol, or simply hold it as a long-term investment.
                        </Text>
                    </View>
                </Animated.View>

                {/* Bottom spacing */}
                <View style={styles.bottomSpacing}></View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        paddingHorizontal: moderateScale(20),
        paddingTop: Platform.OS === 'android' ? verticalScale(20) : 0,
    },
    scrollView: {
        flex: 1,
        marginHorizontal: moderateScale(10),
    },
    headerSection: {
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(30),
    },
    mainCard: {
        backgroundColor: '#000000',
        borderRadius: moderateScale(20),
        padding: moderateScale(28),
        marginBottom: verticalScale(32),
        marginHorizontal: moderateScale(4),
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#EAE5DC',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 8,
    },
    balanceSection: {
        alignItems: 'center',
        marginBottom: verticalScale(32),
    },
    balanceLabel: {
        color: '#666',
        fontSize: moderateScale(12),
        letterSpacing: 1.5,
        marginBottom: verticalScale(12),
        fontWeight: '500',
    },
    balanceValue: {
        color: '#F7931A', // Bitcoin orange color
        fontSize: moderateScale(48),
        fontWeight: '200',
        fontFamily: 'JetBrainsMono_400Regular',
        marginBottom: verticalScale(6),
    },
    balanceCurrency: {
        color: '#888',
        fontSize: moderateScale(18),
        fontFamily: 'JetBrainsMono_400Regular',
        fontWeight: '300',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: moderateScale(16),
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIconContainer: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        backgroundColor: '#2A2A28',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(12),
        borderWidth: 1,
        borderColor: '#444',
    },
    statLabel: {
        color: '#888',
        fontSize: moderateScale(13),
        marginBottom: verticalScale(6),
        textAlign: 'center',
        fontWeight: '400',
    },
    statValue: {
        color: '#EAE5DC',
        fontSize: moderateScale(16),
        fontWeight: '600',
        fontFamily: 'JetBrainsMono_400Regular',
        textAlign: 'center',
    },
    actionSection: {
        marginBottom: verticalScale(40),
        marginHorizontal: moderateScale(4),
    },
    primaryButton: {
        backgroundColor: '#EAE5DC',
        borderRadius: moderateScale(16),
        paddingVertical: verticalScale(20),
        marginBottom: verticalScale(20),
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#EAE5DC',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(12),
    },
    primaryButtonText: {
        color: '#11110E',
        fontSize: moderateScale(18),
        fontWeight: '400',
    },
    buttonGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(234, 229, 220, 0.1)',
        borderRadius: moderateScale(16),
        opacity: 0.8,
    },
    secondaryButtons: {
        flexDirection: 'row',
        gap: moderateScale(16),
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8),
        paddingVertical: verticalScale(16),
        borderWidth: 1,
        borderColor: '#EAE5DC',
        borderRadius: moderateScale(8),
    },
    secondaryButtonText: {
        color: '#EAE5DC',
        fontSize: moderateScale(16),
        fontWeight: '500',
    },
    infoSection: {
        gap: verticalScale(16),
        marginHorizontal: moderateScale(4),
    },
    infoCard: {
        backgroundColor: '#000000',
        borderRadius: moderateScale(16),
        padding: moderateScale(20),
        borderWidth: 1,
        borderColor: '#333',
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(10),
        marginBottom: verticalScale(12),
    },
    infoTitle: {
        color: '#EAE5DC',
        fontSize: moderateScale(15),
        fontWeight: '600',
    },
    infoText: {
        color: '#888',
        fontSize: moderateScale(14),
        lineHeight: moderateScale(20),
        fontWeight: '400',
    },
    bottomSpacing: {
        height: verticalScale(60),
    },
});
