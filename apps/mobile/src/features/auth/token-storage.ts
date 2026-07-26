import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * 토큰 보관소.
 *
 * 네이티브는 expo-secure-store(Keychain / Keystore)를 쓴다.
 * 웹은 SecureStore 를 지원하지 않아 localStorage 로 대체하는데, 이건 개발 확인용이며
 * 실제 서비스는 앱이다. (웹 관리자는 별도로 httpOnly 쿠키 방식을 쓴다)
 */
const ACCESS_KEY = 'jungwoon.accessToken';
const REFRESH_KEY = 'jungwoon.refreshToken';

const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string | null) {
  if (isWeb) {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (isWeb) return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

export const tokenStorage = {
  async load(): Promise<StoredTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      getItem(ACCESS_KEY),
      getItem(REFRESH_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  async save(tokens: StoredTokens) {
    await Promise.all([
      setItem(ACCESS_KEY, tokens.accessToken),
      setItem(REFRESH_KEY, tokens.refreshToken),
    ]);
  },

  async clear() {
    await Promise.all([setItem(ACCESS_KEY, null), setItem(REFRESH_KEY, null)]);
  },
};
