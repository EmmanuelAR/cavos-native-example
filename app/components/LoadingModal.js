import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    Modal,
    ActivityIndicator,
} from 'react-native';
import * as Font from 'expo-font';
import { useFonts, JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
export default function LoadingModal() {

    Font.useFonts({
        'Satoshi-Variable': require('../../assets/fonts/Satoshi-Variable.ttf'),
    });

    useFonts({
        JetBrainsMono_400Regular,
    });


    return (
        <SafeAreaView style={styles.container}>
            <Modal
                transparent={true}
                animationType="fade"
                onRequestClose={() => { }}
            >
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#EAE5DC" />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
        backgroundColor: '#000',
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
