import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Platform,
    Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Font from 'expo-font';
import { useFonts, JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { MaterialIcons } from '@expo/vector-icons';
import { decryptPin, encryptPin } from '../../lib/utils';
import { useCavosWallet } from '../../atoms/cavosWallet';
import { useUserProfile } from '../../atoms/userProfile';
import { useFaceIdSettings } from '../../atoms/faceIdSettings';
import Header from '../components/Header';
import LoadingModal from '../components/LoadingModal';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from '../../lib/constants';

const { width, height } = Dimensions.get('window');

const scale = size => width / 375 * size;
const verticalScale = size => height / 812 * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function Pin() {
    const navigation = useNavigation();
    const route = useRoute();
    const { isReset, phoneNumber } = route.params;
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { cavosWallet } = useCavosWallet();
    const { userProfile, setUserProfile } = useUserProfile();
    const { faceIdEnabled, setFaceIdEnabled } = useFaceIdSettings();
    const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
    const [biometricEnrolled, setBiometricEnrolled] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const [fontsLoaded] = Font.useFonts({
        'Satoshi-Variable': require('../../assets/fonts/Satoshi-Variable.ttf'),
    });

    const [googleFontsLoaded] = useFonts({
        JetBrainsMono_400Regular,
    });

    Text.defaultProps = Text.defaultProps || {};
    Text.defaultProps.style = { fontFamily: 'Satoshi-Variable' };

    useEffect(() => {
        async function getAccountInfo() {
            try {
                const responseProfile = await axios.get(
                  `${CAVOS_CORE_API}v1/user/profile`,
                  {
                    params: {
                      user_id: cavosWallet.user_id,
                    },
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                    },
                  }
                );

                if (responseProfile.status !== 200) {
                  Alert.alert("Setup a PIN to create your account");
                } else {
                  setUserProfile(responseProfile.data.data);
                }
            } catch (error) {
                console.error('Fail getting user profile');
            }
        }
        if (cavosWallet?.user_id) {
            getAccountInfo()
        }
        if (isReset) {
            Alert.alert('Reset Pin', 'Please enter a new PIN');
        }
    }, [cavosWallet, isReset]);

    // Check biometric hardware and enrollment
    useEffect(() => {
        async function checkBiometrics() {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setHasBiometricHardware(compatible);
            setBiometricEnrolled(enrolled);
        }

        checkBiometrics();
    }, []);

    useEffect(() => {
        if (!userProfile?.hashed_pin || !biometricEnrolled || !hasBiometricHardware || isReset || !faceIdEnabled) {
            setIsAuthenticating(false);
            return;
        }
        setIsAuthenticating(true);
        (async () => {
            try {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate with Face ID',
                    fallbackLabel: 'Enter PIN instead',
                });
                setIsAuthenticating(false);
                if (result.success) {
                    navigation.replace('BottomMenu');
                }
            } catch (error) {
                setIsAuthenticating(false);
                console.error('Face ID authentication error:', error);
            }
        })();
    }, [userProfile?.hashed_pin, biometricEnrolled, hasBiometricHardware, isReset, faceIdEnabled]);

    useEffect(() => {
        if (pin.length === 6) {
            validatePin(pin);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pin]);


    const handleNumberPress = (number) => {
        if (pin.length < 6) {
            setPin(pin + number);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
    };

    const handleForgotPin = async () => {
        if (phoneNumber) {
            Alert.alert(
                'Forgot PIN',
                'Would you like to reset your PIN? This will require OTP verification.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Reset PIN',
                        onPress: () => navigation.replace('PhoneOTP', { phoneNumber: phoneNumber, isReset: true }),
                    }
                ]
            );
        }
    };

    const createOrUpdateUserProfile = async (hashedPin) => {
        try {
            if (cavosWallet?.user_id) {
                const profileData = {
                    id: userProfile.id,
                    auth0_id: cavosWallet.user_id,
                    address: cavosWallet.address,
                    phone_number: phoneNumber,
                    hashed_pin: hashedPin,
                    username: userProfile.username
                };

                const response = await axios.post(
                  `${CAVOS_CORE_API}v1/user/profile`,
                  profileData,
                  {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                    },
                  }
                );

                if (response.status!==201) {
                    console.error('Error creating/updating user profile:');
                    return;
                }
                setUserProfile(response.data.data);
                return response.data.data;
            }
        } catch (error) {
            console.error('Error in createOrUpdateUserProfile:', error);
            throw error;
        }
    };



    const validatePin = async (pinP) => {
        const hashedPin = encryptPin(pinP);
        setIsLoading(true);
        try {
            if (isReset) {
                // Update existing profile with new PIN
                await createOrUpdateUserProfile(hashedPin);
                Alert.alert("PIN reset successful!", "Your PIN has been updated.", [
                    {
                        text: "Continue",
                        onPress: () => navigation.replace('BottomMenu')
                    }
                ]);
            } else if (userProfile) {
                // Verify existing PIN
                if (decryptPin(userProfile.hashed_pin) === pinP) {
                    navigation.replace('BottomMenu');
                } else {
                    setPin('');
                    setError(true);
                    Alert.alert("Wrong PIN!", "Please try again.");
                }
            } else {
                // Create new profile with PIN
                await createOrUpdateUserProfile(hashedPin);

                // Ask if user wants to enable Face ID
                if (hasBiometricHardware && biometricEnrolled) {
                    Alert.alert(
                        "PIN setup successful!",
                        "Would you like to enable Face ID for future logins?",
                        [
                            {
                                text: "No",
                                onPress: () => navigation.replace('BottomMenu')
                            },
                            {
                                text: "Yes",
                                onPress: async () => {
                                    const authResult = await LocalAuthentication.authenticateAsync({
                                        promptMessage: 'Authenticate to enable Face ID',
                                    });
                                    if (authResult.success) {
                                        setFaceIdEnabled(true);
                                    }
                                    navigation.replace('BottomMenu');
                                },
                            },
                        ]
                    );
                } else {
                    Alert.alert("PIN setup successful!", "Your account has been created.", [
                        {
                            text: "Continue",
                            onPress: () => navigation.replace('BottomMenu')
                        }
                    ]);
                }
            }
        } catch (err) {
            console.error('Unexpected error in validatePin:', err);
            Alert.alert("Error", "An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Loading Indicator */}
            {(isLoading || isAuthenticating) && (
                <LoadingModal />
            )}
            {/* Header with Back Button */}
            <Header showBackButton={true} />

            {/* PIN Content */}
            <View style={styles.content} pointerEvents={isAuthenticating ? 'none' : 'auto'}>
                <Text style={styles.title}>
                    {isReset ? 'Reset Your PIN' : userProfile ? 'Enter Your PIN' : 'Create Your PIN'}
                </Text>

                {error && (
                    <Text style={styles.errorText}>Authentication Failed</Text>
                )}

                {/* PIN Dots */}
                <View style={styles.pinContainer}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <View
                            key={i}
                            style={[
                                styles.pinDot,
                                i < pin.length && styles.pinDotFilled,
                                error && styles.pinDotError
                            ]}
                        />
                    ))}
                </View>

                {/* Number Pad */}
                <View style={styles.numberPad} pointerEvents={isAuthenticating ? 'none' : 'auto'}>
                    <View style={styles.numberRow}>
                        {[1, 2, 3].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={styles.numberButton}
                                onPress={() => handleNumberPress(num.toString())}
                                disabled={isAuthenticating}
                            >
                                <Text style={styles.numberText}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.numberRow}>
                        {[4, 5, 6].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={styles.numberButton}
                                onPress={() => handleNumberPress(num.toString())}
                                disabled={isAuthenticating}
                            >
                                <Text style={styles.numberText}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.numberRow}>
                        {[7, 8, 9].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={styles.numberButton}
                                onPress={() => handleNumberPress(num.toString())}
                                disabled={isAuthenticating}
                            >
                                <Text style={styles.numberText}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.numberRow}>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={async () => {
                                if (faceIdEnabled) {
                                    Alert.alert(
                                        "Disable Face ID",
                                        "Are you sure you want to disable Face ID?",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                                text: "Disable",
                                                onPress: () => setFaceIdEnabled(false),
                                            },
                                        ]
                                    );
                                } else {
                                    Alert.alert(
                                        "Enable Face ID",
                                        "Would you like to enable Face ID for future logins?",
                                        [
                                            { text: "No", style: "cancel" },
                                            {
                                                text: "Yes",
                                                onPress: async () => {
                                                    const authResult = await LocalAuthentication.authenticateAsync({
                                                        promptMessage: 'Authenticate to enable Face ID',
                                                    });
                                                    if (authResult.success) {
                                                        setFaceIdEnabled(true);
                                                    }
                                                },
                                            },
                                        ]
                                    );
                                }
                            }}
                            disabled={isAuthenticating || !userProfile}
                        >
                            <MaterialIcons name="fingerprint" size={moderateScale(24)} color="#888" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.numberButton}
                            onPress={() => handleNumberPress('0')}
                            disabled={isAuthenticating}
                        >
                            <Text style={styles.numberText}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={handleDelete}
                            disabled={isAuthenticating}
                        >
                            <MaterialIcons name="backspace" size={moderateScale(24)} color="#EAE5DC" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Forgot PIN */}
                <TouchableOpacity
                    style={styles.forgotPinButton}
                    onPress={handleForgotPin}
                    disabled={isAuthenticating}
                >
                    <Text style={styles.forgotPinText}>Forgot your PIN?</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? verticalScale(20) : 0,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(20),
    },
    title: {
        color: '#EAE5DC',
        fontSize: moderateScale(24),
        fontWeight: 'bold',
        marginBottom: verticalScale(10),
    },
    errorText: {
        color: '#F44336',
        fontSize: moderateScale(16),
        marginBottom: verticalScale(30),
    },
    pinContainer: {
        flexDirection: 'row',
        marginBottom: verticalScale(50),
    },
    pinDot: {
        width: moderateScale(16),
        height: moderateScale(16),
        borderRadius: moderateScale(8),
        borderWidth: 1,
        borderColor: '#888',
        marginHorizontal: moderateScale(10),
    },
    pinDotFilled: {
        backgroundColor: '#EAE5DC',
        borderColor: '#EAE5DC',
    },
    pinDotError: {
        borderColor: '#F44336',
    },
    numberPad: {
        width: '100%',
        maxWidth: moderateScale(300),
        backgroundColor: '#000',
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: verticalScale(20),
    },
    numberButton: {
        width: moderateScale(70),
        height: moderateScale(70),
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: moderateScale(35),
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyButton: {
        width: moderateScale(70),
        height: moderateScale(70),
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        color: '#EAE5DC',
        fontSize: moderateScale(24),
    },
    forgotPinButton: {
        marginTop: verticalScale(30),
    },
    forgotPinText: {
        color: '#888',
        fontSize: moderateScale(14),
    },
    faceIdButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: moderateScale(10),
        marginBottom: verticalScale(20),
    },
    faceIdText: {
        color: '#EAE5DC',
        fontSize: moderateScale(14),
        marginLeft: moderateScale(8),
    },
});
