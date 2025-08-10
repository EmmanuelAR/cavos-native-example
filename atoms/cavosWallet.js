import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CavosWallet } from 'cavos-service-native';
import * as SecureStore from 'expo-secure-store';

export const useCavosWallet = create(
  persist(
    (set, get) => ({
      cavosWallet: null,
      setCavosWallet: (wallet) => {
        if (wallet instanceof CavosWallet) {
          set({ cavosWallet: wallet });
        } else if (wallet && typeof wallet === 'object') {
          // Si address es un objeto, desanidar
          let w = wallet;
          if (w.address && typeof w.address === 'object') {
            w = { ...w.address, orgSecret: w.orgSecret, authData: w.authData };
          }
          const { address, network, email, user_id, org_id, orgSecret, authData } = w;
          set({ cavosWallet: new CavosWallet(address, network, email, user_id, org_id, orgSecret, authData) });
        } else {
          set({ cavosWallet: null });
        }
      },
      clearCavosWallet: () => set({ cavosWallet: null }),
      getCavosWallet: () => get().cavosWallet,
    }),
    {
      name: 'cavos-wallet-store',
      storage: {
        getItem: async (key) => {
          const value = await AsyncStorage.getItem(key);
          if (!value) return null;
          const parsed = JSON.parse(value);
          if (parsed.state?.cavosWallet) {
            let w = parsed.state.cavosWallet;
            // Si address es un objeto, desanidar
            if (w.address && typeof w.address === 'object') {
              w = { ...w.address, orgSecret: w.orgSecret };
            }
            parsed.state.cavosWallet = new CavosWallet(
              w.address,
              w.network,
              w.email,
              w.user_id,
              w.org_id,
              w.orgSecret,
              w.accessToken,
              w.refreshToken,
              w.tokenExpiry
            );
          }
          return parsed;
        },
        setItem: async (key, value) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: async (key) => {
          await AsyncStorage.removeItem(key);
        },
      },
    }
  )
); 