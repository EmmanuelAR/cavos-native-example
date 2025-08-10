import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    Alert,
    Dimensions,
    Platform,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Font from 'expo-font';
import { useFonts, JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { useCavosWallet } from '../atoms/cavosWallet';
import axios from 'axios';
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from '../lib/constants';
import LoadingModal from './components/LoadingModal';
import LoggedHeader from './components/LoggedHeader';

const { width, height } = Dimensions.get('window');
const scale = size => width / 375 * size;
const verticalScale = size => height / 812 * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function Investments() {
    const navigation = useNavigation();
    const cavosWallet = useCavosWallet((state) => state.cavosWallet);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [totalInvested, setTotalInvested] = useState(0);
    const [apy, setApy] = useState(0);
    const [poolId, setPoolId] = useState(0);
    const [showHeader, setShowHeader] = useState(true);

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const scrollViewRef = useRef(null);

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

    const goToInvestment = () => {
        navigation.navigate('Invest');
    };

    const getAccountInfo = async () => {
        try {
            setIsLoading(true);
            const positionResponse = await axios.post(
                CAVOS_CORE_API + 'v1/vesu/positions',
                {
                    address: cavosWallet.address,
                    pool: "Re7 Starknet Ecosystem",
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
                    poolName: "Re7 Starknet Ecosystem",
                    assetSymbol: "USDC"
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                    },
                }
            );
            setApy(apyResponse.data.poolAPY);
            setTotalInvested(positionResponse.data.total_supplied);
            setPoolId(positionResponse.data.poolid);
        } catch (error) {
            console.error('Error fetching user positions', error);
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

    const handleClaimRewards = async () => {
        if (!totalInvested || totalInvested <= 0) {
            Alert.alert("No investments", "You have no investments to claim rewards from.");
            return;
        }
        animateButtonPress(async () => {
            setIsLoading(true);
            try {
        
                const response = await axios.post(
                    CAVOS_CORE_API + 'v1/vesu/position/usd/claim',
                    {
                        address: cavosWallet.address,
                        hashedPk: cavosWallet.private_key,
                        hashedPin: cavosWallet.pin,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                        },
                    }
                );

                if (response.data.result == false) {
                    Alert.alert("No rewards available", "Come back in a few days to claim your rewards");
                } else if (response.data.amount !== null && response.data.result !== null) {

                    const responseTransaction = await axios.post(
                        CAVOS_CORE_API + 'v1/transaction',
                        {
                            user_id: cavosWallet.user_id,
                            type: "Claim",
                            amount: Number(response.data.amount),
                            tx_hash: response.data.result,
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                            },
                        }
                    );
                        
                    if (responseTransaction.status!=201) {
                        console.error('Insert error:', responseTransaction.message);
                        Alert.alert('Error saving transaction to database');
                        return;
                    }
                    Alert.alert("Rewards Claimed!", `Total amount in USDC: ${response.data.amount}`);
                }
            } catch (error) {
                console.error('Error claiming rewards', error);
                Alert.alert("Error", "Failed to claim rewards. Please try again.");
            } finally {
                setIsLoading(false);
            }
        });
    };

    const handleCloseInvestment = async () => {
        if (!totalInvested || totalInvested <= 0) {
            Alert.alert("No investments", "You have no investments to close.");
            return;
        }
        animateButtonPress(async () => {
            setIsLoading(true);
            try {
                const userPositions = (
                    await axios.get(
                        `https://api.vesu.xyz/positions?walletAddress=${cavosWallet.address}&type=earn`
                    )
                ).data.data;

                const position = userPositions.find(
                    (item) =>
                        item.pool.id === poolId
                );

                const tx = await cavosWallet.execute(
                    "0x048f4e75c12ca9d35d6172b1cb5f1f70b094888003f9c94fe19f12a67947fd6d",
                    "redeem",
                    [
                        position.collateralShares.value,
                        '0',
                        cavosWallet.address,
                        cavosWallet.address,
                    ],
                )
                if (tx.error) {
                    Alert.alert("An error occurred", "Please try again later");
                } else if (tx !== null && position.collateral.value !== null) {

                    const responseTransaction = await axios.post(
                        CAVOS_CORE_API + 'v1/transaction',
                        {
                            user_id: cavosWallet.user_id,
                            type: "Close Investment",
                            amount: position.collateral.value / 10 ** 6,
                            tx_hash: tx,
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                            },
                        }
                    );
                            
                    if (responseTransaction.status!=201) {
                        console.error('Insert error:', responseTransaction.message);
                        Alert.alert('Error saving transaction to database');
                        return;
                    }
                    Alert.alert("Investment Closed", `${position.collateral.value / 10 ** 6} USDC has been sent to your account, investment data might take a few minutes to update`);
                }
            } catch (error) {
                Alert.alert("An error occurred", "Please try again later");
                console.error('Error closing investment', error);
            } finally {
                setIsLoading(false);
            }
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

                {/* Main Investment Card */}
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
                    {/* Portfolio Value */}
                    <View style={styles.portfolioSection}>
                        <Text style={styles.portfolioLabel}>TOTAL INVESTED</Text>
                        <Text style={styles.portfolioValue}>
                            ${(totalInvested || 0).toFixed(2)}
                        </Text>
                        <Text style={styles.portfolioCurrency}>USDC</Text>
                    </View>

                    {/* Stats Row - Only APY */}
                    <View style={styles.statsRow}>
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
                        onPress={goToInvestment}
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
                            onPress={handleClaimRewards}
                            activeOpacity={0.7}
                        >
                            <Icon name="gift-outline" size={moderateScale(18)} color="#EAE5DC" />
                            <Text style={styles.secondaryButtonText}>Claim</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleCloseInvestment}
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
                            <Icon name="information-circle" size={moderateScale(20)} color="#EAE5DC" />
                            <Text style={styles.infoTitle}>How it works</Text>
                        </View>
                        <Text style={styles.infoText}>
                            Your USDC is deposited into Vesu, your balance is borrowed by other users, and you earn interest on your deposits.
                        </Text>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <Icon name="shield-checkmark" size={moderateScale(20)} color="#EAE5DC" />
                            <Text style={styles.infoTitle}>Security</Text>
                        </View>
                        <Text style={styles.infoText}>
                            Vesu Protocol is audited and battle-tested. Your funds are secured by smart contracts on Starknet.
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
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(12),
    },
    pageTitle: {
        color: '#EAE5DC',
        fontSize: moderateScale(24),
        fontWeight: '600',
        letterSpacing: 1,
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
    portfolioSection: {
        alignItems: 'center',
        marginBottom: verticalScale(32),
    },
    portfolioLabel: {
        color: '#666',
        fontSize: moderateScale(12),
        letterSpacing: 1.5,
        marginBottom: verticalScale(12),
        fontWeight: '500',
    },
    portfolioValue: {
        color: '#EAE5DC',
        fontSize: moderateScale(52),
        fontWeight: '200',
        fontFamily: 'JetBrainsMono_400Regular',
        marginBottom: verticalScale(6),
    },
    portfolioCurrency: {
        color: '#888',
        fontSize: moderateScale(18),
        fontFamily: 'JetBrainsMono_400Regular',
        fontWeight: '300',
    },
    statsRow: {
        alignItems: 'center',
        paddingHorizontal: moderateScale(16),
    },
    statItem: {
        alignItems: 'center',
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
        fontSize: moderateScale(20),
        fontWeight: '600',
        fontFamily: 'JetBrainsMono_400Regular',
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
        alignItems: 'center',
        justifyContent: 'center',
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
