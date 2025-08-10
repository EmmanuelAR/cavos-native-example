import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Providers({ children }) {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                {children}
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
