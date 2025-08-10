import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
// Screens
import Login from "./auth/Login";
import Pin from "./auth/Pin";
import Dashboard from "./Dashboard";
import Investments from "./Investments";
import BitcoinAccount from "./BitcoinAccount";
import PhoneLogin from "./auth/phone/PhoneLogin";
import PhoneOTP from "./auth/phone/PhoneOTP";
import BuyBTC from "./btc/BuyBTC";
import SellBTC from "./btc/SellBTC";
import InvestBTC from "./btc/InvestBTC";
import Providers from "./Providers";
import BottomMenu from "./components/BottomMenu";
import Receive from "./Receive";
import Send from "./Send";
import Invest from "./Invest";
import Invitation from "./auth/Invitation";
import Profile from "./Profile";
import Referral from "./Referral";
import CardWaitlist from "./CardWaitlist";
import Search from "./contacts/Search";
import { useCavosWallet } from "../atoms/cavosWallet";
import { useUserProfile } from "../atoms/userProfile";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const {cavosWallet} = useCavosWallet();
  const {userProfile} = useUserProfile()

  const hasWallet = () => {
    return cavosWallet !== null
  };

  useEffect(() => {
    const checkSession = async () => {
      if (cavosWallet !== null) {
        if (userProfile !== null) {
          setInitialRoute("Pin");
        } else {
          setInitialRoute("Invitation");
        }
      } else {
        setInitialRoute("Login");
      }
    };

    checkSession();
  }, []);

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: '#000',
        }}
      >
        <ActivityIndicator size="large" color="#EAE5DC" />
      </View>
    );
  }

  return (
    <Providers>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Investments" component={Investments} />
        <Stack.Screen name="BitcoinAccount" component={BitcoinAccount} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Pin" component={Pin} initialParams={false} />
        <Stack.Screen name="BottomMenu" component={BottomMenu} />
        <Stack.Screen name="BuyBTC" component={BuyBTC} />
        <Stack.Screen name="SellBTC" component={SellBTC} />
        <Stack.Screen name="InvestBTC" component={InvestBTC} />
        <Stack.Screen name="PhoneLogin" component={PhoneLogin} />
        <Stack.Screen name="PhoneOTP" component={PhoneOTP} />
        <Stack.Screen name="Receive" component={Receive} />
        <Stack.Screen name="Send" component={Send} />
        <Stack.Screen name="Invest" component={Invest} />
        <Stack.Screen name="Invitation" component={Invitation} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Referral" component={Referral} />
        <Stack.Screen name="CardWaitlist" component={CardWaitlist} />
        <Stack.Screen name="Search" component={Search} />
      </Stack.Navigator>
    </Providers>
  );
}
