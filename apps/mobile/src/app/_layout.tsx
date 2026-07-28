import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

import { useAuthStore } from '@/features/auth/auth-store';

/** 서버 상태는 TanStack Query, UI 상태는 Zustand 로 분리한다. */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * 인증 게이트. 로그인 여부에 따라 (auth) 그룹과 앱 화면 사이를 오간다.
 * 세션 복구가 끝나기 전에 판단하면 이미 로그인한 사용자가 로그인 화면을 스쳐 보게 된다.
 */
function useAuthRedirect() {
  const restoring = useAuthStore((state) => state.restoring);
  const tokens = useAuthStore((state) => state.tokens);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (restoring) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!tokens && !inAuthGroup) {
      router.replace('/login');
    } else if (tokens && inAuthGroup) {
      router.replace('/');
    }
  }, [restoring, tokens, segments, router]);

  return restoring;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(createQueryClient);
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <RootNavigator />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const restoring = useAuthRedirect();

  if (restoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '정운영어' }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/signup" options={{ title: '회원가입' }} />
      <Stack.Screen name="homework/index" options={{ title: '숙제' }} />
      <Stack.Screen name="homework/[id]" options={{ title: '숙제 상세' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
