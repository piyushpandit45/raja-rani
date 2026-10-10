import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PLAYER_NAME_KEY = 'rajarani_player_name';
const ACCESS_TOKEN_KEY = 'rajarani_access_token';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('localStorage error:', e);
        throw e;
      }
    } else {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (e) {
        console.error('SecureStore error:', e);
        throw e;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error('localStorage error:', e);
        throw e;
      }
    } else {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (e) {
        console.error('SecureStore error:', e);
        throw e;
      }
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('localStorage error:', e);
        throw e;
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        console.error('SecureStore error:', e);
        throw e;
      }
    }
  },
};

export async function getPlayerName(): Promise<string | null> {
  return storage.getItem(PLAYER_NAME_KEY);
}

export async function setPlayerName(name: string): Promise<void> {
  await storage.setItem(PLAYER_NAME_KEY, name);
}

export async function deletePlayerName(): Promise<void> {
  await storage.deleteItem(PLAYER_NAME_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  return storage.getItem(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  await storage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function deleteAccessToken(): Promise<void> {
  await storage.deleteItem(ACCESS_TOKEN_KEY);
}
