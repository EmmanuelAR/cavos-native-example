import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useFaceIdSettings = create(
  persist(
    (set, get) => ({
      faceIdEnabled: false,
      setFaceIdEnabled: (enabled) => set({ faceIdEnabled: enabled }),
      clearFaceIdSettings: () => set({ faceIdEnabled: false }),
      getFaceIdEnabled: () => get().faceIdEnabled,
    }),
    {
      name: 'face-id-settings-store',
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