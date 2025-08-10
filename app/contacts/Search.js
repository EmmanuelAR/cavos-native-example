import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Keyboard,
    Platform,
    Dimensions,
    Alert,
    TouchableWithoutFeedback,
    Animated,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LoggedHeader from '../components/LoggedHeader';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCavosWallet } from '../../atoms/cavosWallet';
import axios from 'axios';
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from '../../lib/constants';

const { width, height } = Dimensions.get('window');
const scale = size => width / 375 * size;
const verticalScale = size => height / 812 * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const { cavosWallet } = useCavosWallet();
    const navigation = useNavigation();

    // Animaciones
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnims = useRef({}).current;

    // Animación inicial
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Fetch all users on mount
    useEffect(() => {
        if (query.trim().length === 0) {
            const fetchAllUsers = async () => {
                setLoading(true);
                try {

                    const response = await axios.get(
                        CAVOS_CORE_API + 'v1/user/profile?list=1',
                        {
                            headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                            },
                        }
                    );                 

                    if (response.status === 200) {
                        const resultsWithWallet = response.data.profiles.filter(user => user.address !== cavosWallet?.address);
                        setResults(resultsWithWallet || []);
                        setHasSearched(true);
                    }
                } catch (e) {
                    console.error('Error fetching users:', e);
                }
                setLoading(false);
            };
            fetchAllUsers();
        }
    }, [query]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const fetchFilteredUsers = async () => {
                if (query.trim().length === 0) return;
                setLoading(true);
                setHasSearched(true);
                try {

                    const response = await axios.get(
                        CAVOS_CORE_API + 'v1/user/profile',
                        {
                            params: { query }, 
                            headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${CAVOS_CORE_TOKEN}`,
                            },
                        }
                    );

                    if (response.status === 200) {
                        setResults(response.data.wallets || []);
                    }
                } catch (e) {
                    console.error('Error searching users:', e);
                }
                setLoading(false);
            };

            if (query.trim().length > 0) {
                fetchFilteredUsers();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelectUser = (user) => {
        const userScale = scaleAnims[user.address] || new Animated.Value(1);
        scaleAnims[user.address] = userScale;

        Animated.sequence([
            Animated.timing(userScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(userScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => {
            navigation.navigate('Send', { recipientAddress: user.address });
        }, 150);
    };

    const clearSearch = () => {
        setQuery('');
        setHasSearched(false);
    };

    const renderUserItem = ({ item, index }) => {
        const userScale = scaleAnims[item.address] || new Animated.Value(1);
        scaleAnims[item.address] = userScale;

        return (
            <Animated.View
                style={[
                    styles.resultItemContainer,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: userScale }
                        ],
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelectUser(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.userIconContainer}>
                        <Icon name="person" size={moderateScale(20)} color="#EAE5DC" />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.resultUsername}>{item.user_name}</Text>
                        <Text style={styles.resultAddress}>
                            {item.address
                                ? item.address.slice(0, 8) + '...' + item.address.slice(-8)
                                : 'No address'}
                        </Text>
                    </View>
                    <Icon name="chevron-forward" size={moderateScale(18)} color="#666" />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmptyState = () => {
        if (loading) return null;

        return (
            <Animated.View
                style={[
                    styles.emptyStateContainer,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}
            >
                <Icon name="search" size={moderateScale(48)} color="#333" />
                <Text style={styles.emptyStateTitle}>
                    {hasSearched ? 'No users found' : 'Search for users'}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                    {hasSearched
                        ? 'Try adjusting your search terms'
                        : 'Start typing to find users by username'
                    }
                </Text>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: '#000'}]}>
            <LoggedHeader />
            <FlatList
                data={results}
                keyExtractor={item => item.address}
                renderItem={renderUserItem}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.listContainer, {paddingBottom: 120, backgroundColor: '#000', flexGrow: 1}]}
                ListHeaderComponent={
                    <>
                        <Animated.View
                            style={[
                                styles.searchContainer,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                            ]}
                        >
                            <View style={styles.inputContainer}>
                                <Icon name="search" size={moderateScale(18)} color="#666" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Search username..."
                                    placeholderTextColor="#666"
                                    value={query}
                                    onChangeText={setQuery}
                                    autoCapitalize="none"
                                    returnKeyType="search"
                                    clearButtonMode="while-editing"
                                />
                                {query.length > 0 && (
                                    <TouchableOpacity
                                        onPress={clearSearch}
                                        style={styles.clearButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Icon name="close-circle" size={moderateScale(18)} color="#666" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {query.length > 0 && (
                                <View style={styles.searchInfo}>
                                    <Text style={styles.searchInfoText}>
                                        {loading ? 'Searching...' : `${results.length} users found`}
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    </>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#EAE5DC" />
                            <Text style={styles.loadingText}>Searching users...</Text>
                        </View>
                    ) : (
                        renderEmptyState()
                    )
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
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
    inner: {
        flex: 1,
        paddingTop: verticalScale(20),
        paddingHorizontal: verticalScale(10),
    },
    searchContainer: {
        marginBottom: verticalScale(20),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: moderateScale(16),
        height: verticalScale(50),
    },
    searchIcon: {
        marginRight: moderateScale(12),
    },
    input: {
        flex: 1,
        color: '#EAE5DC',
        fontSize: moderateScale(16),
        paddingVertical: 0,
    },
    clearButton: {
        marginLeft: moderateScale(8),
        padding: moderateScale(4),
    },
    searchInfo: {
        marginTop: verticalScale(8),
        paddingHorizontal: moderateScale(4),
    },
    searchInfoText: {
        color: '#666',
        fontSize: moderateScale(12),
        fontWeight: '500',
    },
    resultsContainer: {
        flex: 1,
    },
    listContainer: {
        paddingBottom: verticalScale(20),
        paddingHorizontal: verticalScale(20)
    },
    resultItemContainer: {
        marginBottom: verticalScale(1),
    },
    resultItem: {
        backgroundColor: '#000000',
        borderRadius: moderateScale(12),
        paddingVertical: verticalScale(16),
        paddingHorizontal: moderateScale(16),
        borderWidth: 1,
        borderColor: '#222',
        flexDirection: 'row',
        alignItems: 'center',
    },
    userIconContainer: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(12),
    },
    userInfo: {
        flex: 1,
    },
    resultUsername: {
        color: '#EAE5DC',
        fontSize: moderateScale(16),
        fontWeight: '600',
        marginBottom: verticalScale(2),
    },
    resultAddress: {
        color: '#888',
        fontSize: moderateScale(13),
        fontFamily: 'JetBrainsMono_400Regular',
    },
    separator: {
        height: verticalScale(8),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: verticalScale(60),
    },
    loadingText: {
        color: '#666',
        fontSize: moderateScale(14),
        marginTop: verticalScale(12),
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: verticalScale(60),
        paddingHorizontal: moderateScale(40),
    },
    emptyStateTitle: {
        color: '#EAE5DC',
        fontSize: moderateScale(18),
        fontWeight: '600',
        marginTop: verticalScale(16),
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        color: '#666',
        fontSize: moderateScale(14),
        marginTop: verticalScale(8),
        textAlign: 'center',
        lineHeight: moderateScale(20),
    },
});
