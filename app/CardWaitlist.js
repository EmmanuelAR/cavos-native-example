import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    Image,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Platform,
    Alert,
    KeyboardAvoidingView,
    Animated,
    ActivityIndicator
} from 'react-native';
const { width, height } = Dimensions.get('window');
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from '../lib/constants';
import axios from 'axios';


const scale = size => width / 375 * size;
const verticalScale = size => height / 812 * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function CardWaitlist() {
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('');
    const [countryQuery, setCountryQuery] = useState('');
    const [countrySuggestions, setCountrySuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingCountries, setIsLoadingCountries] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Refs
    const countryInputRef = useRef();
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const cardRotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance animations
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
        ]).start();

        // Card floating animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(cardRotateAnim, {
                    toValue: 1,
                    duration: 6000,
                    useNativeDriver: true,
                }),
                Animated.timing(cardRotateAnim, {
                    toValue: 0,
                    duration: 6000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Subtle pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Fetch countries from API
    useEffect(() => {
        const fetchCountries = async () => {
            if (countryQuery.length < 2) {
                setCountrySuggestions([]);
                return;
            }
            
            setIsLoadingCountries(true);
            try {
                const response = await fetch(`https://restcountries.com/v3.1/name/${countryQuery}`);
                const data = await response.json();
                
                if (data.status === 404) {
                    setCountrySuggestions([]);
                    return;
                }
                
                // Map to country names and remove duplicates
                const countries = data.map(country => country.name.common);
                const uniqueCountries = [...new Set(countries)].sort();
                setCountrySuggestions(uniqueCountries.slice(0, 5));
            } catch (error) {
                console.error('Error fetching countries:', error);
                setCountrySuggestions([]);
            } finally {
                setIsLoadingCountries(false);
            }
        };
        
        const debounceTimer = setTimeout(() => {
            fetchCountries();
        }, 300);
        
        return () => clearTimeout(debounceTimer);
    }, [countryQuery]);

    const handleSelectCountry = (selectedCountry) => {
        setCountry(selectedCountry);
        setCountryQuery(selectedCountry);
        setShowSuggestions(false);
        countryInputRef.current.blur();
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleJoinWaitlist = async () => {
        if (!email || !country) {
            Alert.alert('Missing Info', 'Please enter your country and email.');
            return;
        }
        
        if (!validateEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await axios.post(
                CAVOS_CORE_API + 'v1/card/waitlist',
                {
                    email: email.toLowerCase(),
                    country: country,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                    },
                }
            );
            
            if (response.status!==201) {
                console.error('Error joining waitlist:', response.message);
                Alert.alert('Error', 'Could not join the waitlist. Please try again.');
                return;
            }
            Alert.alert('Success', 'You have joined the waitlist!');
            setEmail('');
            setCountry('');
            setCountryQuery('');
        } catch (error) {
            Alert.alert('Error', 'Could not join the waitlist. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const cardRotate = cardRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-2deg', '2deg'],
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View 
                    style={[
                        styles.cardShowcase,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    {/* Floating card with glow effect */}
                    <View style={styles.cardContainer}>
                        <View style={styles.cardGlow} />
                        <Animated.View
                            style={[
                                styles.cardWrapper,
                                {
                                    transform: [
                                        { rotate: cardRotate },
                                        { scale: pulseAnim }
                                    ]
                                }
                            ]}
                        >
                            <Image
                                source={require('../assets/cavos-card.png')}
                                style={styles.visaCard}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </View>

                    <View style={styles.titleSection}>
                        <View style={styles.titleUnderline} />
                        <Text style={styles.cardSubtitle}>
                            Spend your crypto anywhere, anytime.{'\n'}
                            <Text style={styles.highlightText}>Join the exclusive waitlist</Text> to be among the first to experience the future of payments.
                        </Text>
                    </View>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.formSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.formContainer}
                    >
                        <View style={styles.formHeader}>
                            <Text style={styles.formTitle}>Join the Waitlist</Text>
                            <Text style={styles.formSubtitle}>
                                Be the first to know when Cavos Card launches
                            </Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Country</Text>
                                <View style={styles.countryInputContainer}>
                                    <TextInput
                                        ref={countryInputRef}
                                        style={styles.input}
                                        placeholder="Enter your country"
                                        placeholderTextColor="#666"
                                        value={countryQuery}
                                        onChangeText={(text) => {
                                            setCountryQuery(text);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        autoCapitalize="words"
                                    />
                                    {isLoadingCountries && (
                                        <ActivityIndicator 
                                            size="small" 
                                            color="#666" 
                                            style={styles.countryLoadingIndicator}
                                        />
                                    )}
                                </View>
                                {showSuggestions && countrySuggestions.length > 0 && (
                                    <View style={styles.suggestionsContainer}>
                                        {countrySuggestions.map((item) => (
                                            <TouchableOpacity
                                                key={item}
                                                style={styles.suggestionItem}
                                                onPress={() => handleSelectCountry(item)}
                                            >
                                                <Text style={styles.suggestionText}>{item}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor="#666"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    textContentType="emailAddress"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isSubmitting && styles.buttonDisabled]}
                            onPress={handleJoinWaitlist}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            <View style={styles.buttonContent}>
                                {isSubmitting ? (
                                    <>
                                        <ActivityIndicator color="#11110E" style={styles.loadingSpinner} />
                                        <Text style={styles.buttonText}>Joining...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Join Waitlist</Text>
                                        <Text style={styles.buttonArrow}>→</Text>
                                    </>
                                )}
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.disclaimer}>
                            By joining, you agree to receive updates about Cavos Card launch.
                        </Text>
                    </KeyboardAvoidingView>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingHorizontal: moderateScale(20),
        paddingTop: Platform.OS === 'android' ? verticalScale(20) : 0,
    },
    scrollView: {
        flex: 1,
        paddingTop: verticalScale(20),
    },
    scrollContent: {
        paddingBottom: verticalScale(100),
        alignItems: 'center',
    },
    cardShowcase: {
        alignItems: 'center',
        marginTop: verticalScale(20),
        marginBottom: verticalScale(40),
        width: '100%',
    },
    cardContainer: {
        position: 'relative',
        alignItems: 'center',
        marginBottom: verticalScale(30),
    },
    cardGlow: {
        position: 'absolute',
        width: width * 0.9,
        height: verticalScale(220),
        borderRadius: moderateScale(16),
        backgroundColor: '#EAE5DC',
        opacity: 0.1,
        blur: 20,
    },
    cardWrapper: {
        shadowColor: '#EAE5DC',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    visaCard: {
        width: width * 0.85,
        height: verticalScale(200),
        borderRadius: moderateScale(16),
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: verticalScale(30),
    },
    titleUnderline: {
        width: moderateScale(60),
        height: 3,
        backgroundColor: '#EAE5DC',
        borderRadius: 2,
        marginBottom: verticalScale(16),
    },
    cardSubtitle: {
        color: '#999',
        fontSize: moderateScale(16),
        textAlign: 'center',
        lineHeight: moderateScale(24),
        paddingHorizontal: moderateScale(20),
    },
    highlightText: {
        color: '#EAE5DC',
        fontWeight: '600',
    },
    formSection: {
        width: '100%',
        alignItems: 'center',
        marginHorizontal: moderateScale(20),
        paddingHorizontal: moderateScale(20),
    },
    formContainer: {
        backgroundColor: 'rgba(17, 17, 14, 0.8)',
        borderRadius: moderateScale(24),
        padding: moderateScale(32),
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
    },
    formHeader: {
        alignItems: 'center',
        marginBottom: verticalScale(28),
    },
    formTitle: {
        color: '#EAE5DC',
        fontSize: moderateScale(24),
        fontWeight: '700',
        marginBottom: verticalScale(8),
        textAlign: 'center',
    },
    formSubtitle: {
        color: '#666',
        fontSize: moderateScale(14),
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: verticalScale(24),
    },
    inputWrapper: {
        marginBottom: verticalScale(20),
        position: 'relative',
    },
    countryInputContainer: {
        position: 'relative',
    },
    countryLoadingIndicator: {
        position: 'absolute',
        right: moderateScale(15),
        top: moderateScale(15),
    },
    inputLabel: {
        color: '#EAE5DC',
        fontSize: moderateScale(14),
        fontWeight: '600',
        marginBottom: verticalScale(8),
        marginLeft: moderateScale(4),
    },
    input: {
        width: '100%',
        backgroundColor: '#000',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#333',
        color: '#EAE5DC',
        fontSize: moderateScale(16),
        paddingVertical: verticalScale(16),
        paddingHorizontal: moderateScale(20),
        fontFamily: 'JetBrainsMono_400Regular',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    suggestionsContainer: {
        position: 'absolute',
        top: verticalScale(80),
        left: 0,
        right: 0,
        backgroundColor: '#1A1A17',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#333',
        maxHeight: verticalScale(200),
        zIndex: 100,
        elevation: 5,
    },
    suggestionItem: {
        paddingVertical: verticalScale(12),
        paddingHorizontal: moderateScale(20),
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    suggestionText: {
        color: '#EAE5DC',
        fontSize: moderateScale(14),
    },
    button: {
        backgroundColor: '#EAE5DC',
        paddingVertical: verticalScale(18),
        paddingHorizontal: moderateScale(32),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        width: '100%',
        marginBottom: verticalScale(16),
        shadowColor: '#EAE5DC',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#333',
        shadowOpacity: 0,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#11110E',
        fontSize: moderateScale(16),
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    buttonArrow: {
        color: '#11110E',
        fontSize: moderateScale(18),
        fontWeight: '600',
        marginLeft: moderateScale(8),
    },
    loadingSpinner: {
        marginRight: moderateScale(8),
    },
    disclaimer: {
        color: '#555',
        fontSize: moderateScale(12),
        textAlign: 'center',
        lineHeight: moderateScale(16),
        paddingHorizontal: moderateScale(10),
    },
});