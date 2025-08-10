import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Font from "expo-font";
import { SignInWithApple, SignInWithGoogle } from "cavos-service-native";
import { useCavosWallet } from "../../atoms/cavosWallet";
import { T_C } from "../TermsAndConditions";
import axios from 'axios';
import { CAVOS_CORE_API, CAVOS_CORE_TOKEN } from '../../lib/constants';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const navigation = useNavigation();
  const { setCavosWallet } = useCavosWallet();
  const [showTerms, setShowTerms] = React.useState(false);

  Font.useFonts({
    "Satoshi-Variable": require("../../assets/fonts/Satoshi-Variable.ttf"),
  });

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: "Satoshi-Variable" };

  const handleNavigate = async (auth0_id) => { 
    const responseProfile = await axios.get(
      `${CAVOS_CORE_API}v1/user/profile`,
      {
        params: {
          user_id: auth0_id
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CAVOS_CORE_TOKEN}`
        }
      }
    );

    if (responseProfile.status!=200) {
      console.error('Error reading from user profile');
      Alert.alert('Error reading from user profile');
      return;
    }

    if (!responseProfile.data.data.username) {
      navigation.replace("Invitation");
    }
    else {
      navigation.replace("PhoneLogin");
    }
  }

  const handleLogin = async (userWallet) => {
    const cavosWallet = userWallet;
    setCavosWallet(cavosWallet);
    handleNavigate(cavosWallet.user_id);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/light-vertical-cavos-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.taglineText}>Banking without a bank</Text>
        </View>

        <SignInWithApple
          appId="app-pwoeZT2RJ5SbVrz9yMdzp8sRXYkLrL6Z"
          network="mainnet"
          finalRedirectUri="exp://192.168.1.10:8081"
          style={styles.button}
          textStyle={styles.buttonText}
          onSuccess={handleLogin}
        >
          Continue With Apple
        </SignInWithApple>
        <SignInWithGoogle
          appId="app-pwoeZT2RJ5SbVrz9yMdzp8sRXYkLrL6Z"
          network="mainnet"
          finalRedirectUri="exp://192.168.1.10:8081"
          style={styles.button}
          textStyle={styles.buttonText}
          onSuccess={handleLogin}
        >
          Continue with Google
        </SignInWithGoogle>

        <Text style={styles.termsText}>
          By logging in you accept our{' '}
          <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>
            Terms and Conditions
          </Text>
        </Text>
      </View>
      
      <Modal
        visible={showTerms}
        animationType="slide"
        onRequestClose={() => setShowTerms(false)}
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" />
          <View style={styles.modalContainer}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms and Conditions</Text>
              <TouchableOpacity 
                style={styles.closeIconButton} 
                onPress={() => setShowTerms(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>
            
            {/* Indicador de scroll */}
            <View style={styles.scrollIndicator} />
            
            {/* Contenido scrolleable */}
            <ScrollView 
              style={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              indicatorStyle="white"
              contentContainerStyle={styles.scrollContentContainer}
            >
              <Text style={styles.termsModalText}>{T_C}</Text>
            </ScrollView>
            
            {/* Footer con botón */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.acceptButton} 
                onPress={() => setShowTerms(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptButtonText}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 300,
    height: 100,
    marginBottom: 20,
  },
  taglineText: {
    color: "#EAE5DC",
    fontSize: 18,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "300",
  },
  button: {
    backgroundColor: "#FFFFFF",
    width: "80%",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
  termsText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  termsLink: {
    color: '#EAE5DC',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.92,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#EAE5DC',
    fontSize: 20,
    fontWeight: '600',
  },
  closeIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#EAE5DC',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 24,
  },
  scrollIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingTop: 25,
    paddingBottom: 20,
  },
  termsModalText: {
    color: '#EAE5DC',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  acceptButton: {
    backgroundColor: '#EAE5DC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#EAE5DC',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
});
