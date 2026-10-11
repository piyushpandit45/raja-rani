import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const PLAYER_NAME_KEY = 'rajarani_player_name';
const ACCESS_TOKEN_KEY = 'rajarani_access_token';
const USER_SESSION_KEY = 'rajarani_user_session';

export interface UserSession {
  user_id: string;
  name: string;
  token: string;
  onboarded: true;
}

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

export async function setUserSession(session: UserSession): Promise<void> {
  await storage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

export async function getUserSession(): Promise<UserSession | null> {
  const savedSession = await storage.getItem(USER_SESSION_KEY);
  const [name, token] = await Promise.all([getPlayerName(), getAccessToken()]);
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession) as Partial<UserSession>;
      if (
        session.onboarded === true
        && typeof session.user_id === 'string'
        && typeof session.name === 'string'
        && session.name.length > 0
        && typeof session.token === 'string'
        && session.token.length > 0
        && session.name === name
        && session.token === token
      ) {
        return {
          user_id: session.user_id,
          name: session.name,
          token: session.token,
          onboarded: true,
        };
      }
    } catch (error) {
      console.warn('Unable to parse saved user session:', error);
    }
  }
  // Preserve sessions created by earlier versions, which stored name and token separately.
  // Preserve sessions created by earlier versions, which stored name and token separately.
  if (name && token) {
    return { user_id: '', name, token, onboarded: true };
  }
  return null;
}

export async function deleteUserSession(): Promise<void> {
  await storage.deleteItem(USER_SESSION_KEY);
}
