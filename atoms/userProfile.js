import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserProfile = create(
  persist(
    (set, get) => ({
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      clearUserProfile: () => set({ userProfile: null }),
      getUserProfile: () => get().userProfile,
    }),
    {
      name: 'user-profile-store',
      storage: {
        getItem: async (key) => {
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
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