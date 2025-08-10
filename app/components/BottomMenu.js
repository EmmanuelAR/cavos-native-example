import { useAssets } from 'expo-asset';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ZocialIcon from 'react-native-vector-icons/Zocial';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

const investmentImage = require('../../assets/static button.png'); 

export default function StyledBottomMenu() {
  const [assets] = useAssets([
    require('../../assets/static button.png'),
  ]);

  if (!assets) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  const CustomTabBarButton = ({ children, onPress }) => (
    <View
      onStartShouldSetResponder={() => true}
      onResponderRelease={onPress}
      style={styles.tabButton}
    >
      {children}
    </View>
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#888888',
        tabBarShowLabel: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconComponent;
          const iconSize = focused ? 26 : 24;

          switch (route.name) {
            case 'Dashboard':
              iconComponent = (
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                  <Icon name="grid-outline" size={iconSize} color={color} />
                </View>
              );
              break;
            case 'Bitcoin':
              iconComponent = (
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                  <ZocialIcon name="bitcoin" size={iconSize} color={color} />
                </View>
              );
              break;
            case 'Investments':
              iconComponent = (
                <View style={styles.investmentContainer}>
                  <View style={styles.imageContainer}>
                    <Image
                      source={investmentImage}
                      style={styles.investmentImage}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              );
              break;
            case 'Search':
              iconComponent = (
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                  <Icon name="search-outline" size={iconSize} color={color} />
                </View>
              );
              break;
            case 'Referral':
              iconComponent = (
                <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                  <MaterialCommunityIcons name="handshake-outline" size={iconSize} color={color} />
                </View>
              );
              break;
            default:
              break;
          }
          return iconComponent;
        },
        tabBarButton: (props) => <CustomTabBarButton {...props} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={require('../Dashboard').default} />
      <Tab.Screen name="Bitcoin" component={require('../BitcoinAccount').default} />
      <Tab.Screen name="Investments" component={require('../Investments').default} />
      <Tab.Screen name="Search" component={require('../contacts/Search').default} />
      <Tab.Screen name="Referral" component={require('../Referral').default} />
    </Tab.Navigator>
  );
}

// Tus estilos permanecen igual
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#171717',
    borderTopWidth: 0,
    borderRadius: 35,
    marginHorizontal: 15,
    marginBottom: 35,
    height: 80,
    paddingBottom: 15,
    paddingTop: 20,
    paddingHorizontal: 10,
    position: 'absolute',
    elevation: 20,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ scale: 1.05 }],
  },
  investmentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  investmentImage: {
    width: '100%',
    height: '100%',
  },
});
