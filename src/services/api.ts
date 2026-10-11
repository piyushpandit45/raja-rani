import {
  getAccessToken,
  setAccessToken,
} from '@/utils/storage';
import Constants from 'expo-constants';

function getApiBaseUrl(): string | undefined {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');
  if (!__DEV__) return undefined;

  const metroHost = Constants.expoConfig?.hostUri;
  if (!metroHost) return undefined;

  try {
    const host = new URL(metroHost.includes('://') ? metroHost : `http://${metroHost}`).hostname;
    return `http://${host}:8000`;
  } catch {
    return undefined;
  }
}

const API_BASE_URL = getApiBaseUrl();

export interface ApiUser {
  id: string;
  username: string;
  email: string | null;
  is_guest: boolean;
  age: number | null;
  avatar: string | null;
  coins: number;
  stats: {
    sholo_guti: GameStats;
    dots_boxes: GameStats;
    sos: GameStats;
  };
}

interface GameStats {
  played: number;
  won: number;
  lost: number;
  score: number;
}

interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: ApiUser;
}

export type ApiGameType = 'sholo_guti' | 'dots_boxes' | 'sos';
export type MatchWinner = 1 | 2 | 'draw';

export interface MatchResult {
  match_id: string;
  game_type: ApiGameType;
  winner: MatchWinner;
  final_score: { p1: number; p2: number };
  turns: number;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiNetworkError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      'The API URL is unavailable. Set EXPO_PUBLIC_API_URL and restart Expo.',
      0,
    );
  }

  const token = authenticated ? await getAccessToken() : null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ApiNetworkError('The request timed out.');
      }
      throw new ApiNetworkError(
        error instanceof Error ? error.message : 'Unable to reach the server.',
      );
    }

    if (!response.ok) {
      let message = `API request failed (${response.status})`;
      try {
        const body = await response.json() as { detail?: string | { status?: string } };
        if (typeof body.detail === 'string') message = body.detail;
      } catch (error) {
        if (controller.signal.aborted) {
          throw new ApiNetworkError('The request timed out.');
        }
        console.warn('Unable to parse API error response:', error);
      }
      throw new ApiError(message, response.status);
    }

    try {
      return await response.json() as T;
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ApiNetworkError('The request timed out.');
      }
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function saveAuthResponse(response: AuthResponse): Promise<ApiUser> {
  await setAccessToken(response.access_token);
  return response.user;
}

export async function onboardPlayer(username: string, age: number): Promise<ApiUser> {
  const response = await request<AuthResponse>('/api/auth/onboard', {
    method: 'POST',
    body: JSON.stringify({ username, age }),
  });
  return saveAuthResponse(response);
}

export async function getCurrentProfile(): Promise<ApiUser> {
  return request<ApiUser>('/api/auth/me', {}, true);
}

function createMatchId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function recordMatchSilently(
  result: Omit<MatchResult, 'match_id'>,
): Promise<void> {
  if (!API_BASE_URL) return;
  const token = await getAccessToken();
  if (!token) return;
  await request<{ status: string }>('/api/games/match-end', {
    method: 'POST',
    body: JSON.stringify({
      ...result,
      match_id: createMatchId(),
    } satisfies MatchResult),
  }, true);
}
