import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Alert,
    Dimensions,
    ScrollView,
    Animated
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCavosWallet } from '../atoms/cavosWallet';
import { useFaceIdSettings } from '../atoms/faceIdSettings';
import { useUserProfile } from '../atoms/userProfile';
import axios from 'axios';
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from '../lib/constants';

const { width, height } = Dimensions.get('window');
const scale = size => width / 375 * size;
const verticalScale = size => height / 812 * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function Profile() {
    const navigation = useNavigation();
    const { cavosWallet, setCavosWallet } = useCavosWallet();
    const { setFaceIdEnabled } = useFaceIdSettings();
    const { userProfile, setUserProfile } = useUserProfile();
    const [username, setUsername] = useState('');
    const [savedUsername, setSavedUsername] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [copiedAnimation] = useState(new Animated.Value(0));

    useEffect(() => {
        const fetchUsername = async () => {
            if (!cavosWallet) return;
            
            const responseProfile = await axios.get(
                `${CAVOS_CORE_API}v1/user/profile`,
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

            if (responseProfile.status!=200) {
                console.error('Error fetching username');
                return;
            }
            if (responseProfile.data.data && responseProfile.data.data.username) {
                setUsername(responseProfile.data.data.username);
                setSavedUsername(responseProfile.data.data.username);
            }
        };
        fetchUsername();
    }, [cavosWallet]);

    const handleSaveUsername = async () => {
        if (!username || username.trim().length < 3) {
            Alert.alert('Username too short', 'Please enter at least 3 characters.');
            return;
        }
        setIsSaving(true);

        const responseProfile = await axios.put(
            `${CAVOS_CORE_API}v1/user/profile`,
            {
                user_id: cavosWallet.user_id,
                username: username.trim()
            },
            {
                headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${CAVOS_CORE_TOKEN}`
                }
            }
        );
    
        setIsSaving(false);
        if (responseProfile.status!==200) {
            console.error('Error getting user profile');
            Alert.alert('Error', 'Could not save username.');
            return;
        }
        setSavedUsername(username.trim());
        Alert.alert('Saved', 'Username updated!');
    };

    const handleSignOut = async () => {
        setCavosWallet(null);
        setFaceIdEnabled(null);
        setUserProfile(null);
        setCavosWallet(null);
        navigation.navigate('Login');
    };

    const walletAddress = cavosWallet?.address?.startsWith('0x')
        ? '0x' + cavosWallet?.address.slice(2).padStart(64, '0')
        : '0x' + cavosWallet?.address?.padStart(64, '0') || '';

    const copyToClipboard = (text) => {
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

        Alert.alert('✓ Copied!', 'Wallet address copied to clipboard.');
    };

    // Eliminar usuario
    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? If you do this, you may lose access to your funds forever.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const response = await axios.delete(
                            `${CAVOS_CORE_API}v1/transaction`,
                            {
                                data: {
                                    user_id: cavosWallet.user_id
                                },
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${CAVOS_CORE_TOKEN}`
                                }
                            }
                        );
                              
                        if (response.status!==200) {
                            Alert.alert('Error', 'Could not delete transactions.');
                            return;
                        }

                        const responseDeleteUser = await axios.delete(
                            `${CAVOS_CORE_API}v1/user/profile`,
                            {
                                data: {
                                    user_id: cavosWallet.user_id
                                },
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${CAVOS_CORE_TOKEN}`
                                }
                            }
                        );
                        
                        if (responseDeleteUser.status!==200) {
                            Alert.alert('Error', 'Could not delete wallet data.');
                            return;
                        }
                        handleSignOut();
                        navigation.navigate('Login');
                        Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.pfpContainer}>
                        <View style={styles.pfpBackground}>
                            <Icon name="person" size={50} color="#EAE5DC" />
                        </View>
                        <TouchableOpacity style={styles.editPfpButton}>
                            <Icon name="camera" size={18} color="#11110E" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.welcomeText}>
                        {savedUsername ? `Welcome, ${savedUsername}` : 'Complete your profile'}
                    </Text>
                </View>

                {/* Profile Form */}
                <View style={styles.formContainer}>
                    {/* Username Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="person-outline" size={20} color="#666" />
                            <Text style={styles.sectionTitle}>Username</Text>
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter your username"
                                placeholderTextColor="#666"
                                autoCapitalize="none"
                                editable={!isSaving}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (isSaving || username === savedUsername) && styles.saveButtonDisabled
                                ]}
                                onPress={handleSaveUsername}
                                disabled={isSaving || username === savedUsername}
                            >
                                <Text style={[
                                    styles.saveButtonText,
                                    (isSaving || username === savedUsername) && styles.saveButtonTextDisabled
                                ]}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Contact Information */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="call-outline" size={20} color="#666" />
                            <Text style={styles.sectionTitle}>Contact Information</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Phone Number</Text>
                                <Text style={styles.infoValue}>
                                    {userProfile?.phone_number || 'Not set'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Wallet Information */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="wallet-outline" size={20} color="#666" />
                            <Text style={styles.sectionTitle}>Wallet Information</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <View style={styles.addressHeader}>
                                    <Text style={styles.infoLabel}>Starknet Address</Text>
                                    {cavosWallet?.address && (
                                        <TouchableOpacity
                                            style={styles.copyButton}
                                            onPress={() => copyToClipboard(cavosWallet.address)}
                                        >
                                            <Icon name="copy-outline" size={16} color="#666" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <Text style={styles.addressValue}>
                                    {cavosWallet?.address
                                        ? `${cavosWallet.address.slice(0, 8)}...${cavosWallet.address.slice(-8)}`
                                        : 'Not connected'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Account Actions */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="settings-outline" size={20} color="#666" />
                            <Text style={styles.sectionTitle}>Account Settings</Text>
                        </View>
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.dangerButton]}
                                onPress={handleSignOut}
                            >
                                <Icon name="log-out-outline" size={20} color="#FF6B6B" />
                                <Text style={[styles.actionText, styles.dangerText]}>Sign Out</Text>
                                <Icon name="chevron-forward" size={16} color="#FF6B6B" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.dangerButton]}
                                onPress={handleDeleteAccount}
                            >
                                <Icon name="trash-outline" size={20} color="#FF6B6B" />
                                <Text style={[styles.actionText, styles.dangerText]}>Delete Account</Text>
                                <Icon name="chevron-forward" size={16} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: moderateScale(20),
        marginTop: verticalScale(20),
    },
    scrollContent: {
        paddingBottom: verticalScale(100),
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: verticalScale(30),
        marginBottom: verticalScale(40),
    },
    pfpContainer: {
        position: 'relative',
        marginBottom: verticalScale(20),
    },
    pfpBackground: {
        width: 100,
        height: 100,
        borderRadius: 10,
        backgroundColor: '#000',
        borderWidth: 3,
        borderColor: '#2A2A27',
        alignItems: 'center',
        justifyContent: 'center',
    },
    editPfpButton: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#000000',
    },
    welcomeText: {
        color: '#EAE5DC',
        fontSize: moderateScale(20),
        fontWeight: '600',
        textAlign: 'center',
    },
    formContainer: {
        flex: 1,
    },
    section: {
        marginBottom: verticalScale(30),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    sectionTitle: {
        color: '#666',
        fontSize: moderateScale(16),
        fontWeight: '600',
        marginLeft: moderateScale(8),
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#2A2A27',
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        color: '#EAE5DC',
        paddingVertical: verticalScale(16),
        paddingHorizontal: moderateScale(16),
        fontSize: moderateScale(16),
        fontFamily: 'JetBrainsMono_400Regular',
    },
    saveButton: {
        backgroundColor: '#EAE5DC',
        paddingVertical: verticalScale(12),
        paddingHorizontal: moderateScale(20),
        marginRight: moderateScale(4),
        marginVertical: verticalScale(4),
        borderRadius: moderateScale(8),
    },
    saveButtonDisabled: {
        backgroundColor: '#2A2A27',
    },
    saveButtonText: {
        color: '#11110E',
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    saveButtonTextDisabled: {
        color: '#666',
    },
    infoCard: {
        backgroundColor: '#000',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#2A2A27',
        padding: moderateScale(16),
    },
    infoRow: {
        marginBottom: verticalScale(8),
    },
    infoLabel: {
        color: '#666',
        fontSize: moderateScale(12),
        fontWeight: '500',
        marginBottom: verticalScale(4),
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoValue: {
        color: '#EAE5DC',
        fontSize: moderateScale(16),
        fontFamily: 'JetBrainsMono_400Regular',
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(4),
    },
    copyButton: {
        padding: moderateScale(4),
    },
    addressValue: {
        color: '#EAE5DC',
        fontSize: moderateScale(14),
        fontFamily: 'JetBrainsMono_400Regular',
    },
    actionsContainer: {
        backgroundColor: '#000',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#2A2A27',
        overflow: 'hidden',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(16),
        paddingHorizontal: moderateScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A27',
    },
    actionText: {
        flex: 1,
        color: '#EAE5DC',
        fontSize: moderateScale(16),
        fontWeight: '500',
        marginLeft: moderateScale(12),
    },
    dangerButton: {
        borderBottomWidth: 0,
    },
    dangerText: {
        color: '#FF6B6B',
    },
});
