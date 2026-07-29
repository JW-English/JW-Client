import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setAudioModeAsync } from 'expo-audio';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

import { useAuthStore } from '@/features/auth/auth-store';
import { useProgressQueueFlush } from '@/features/listening/use-network';

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
  const me = useAuthStore((state) => state.me);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (restoring) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!tokens) {
      if (!inAuthGroup) router.replace('/login');
      return;
    }

    // 학년이 없으면 단어 DAY 가 열리지 않는다. 소셜 로그인도 이 화면을 거친다
    if (me && !me.onboarded) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    if (inAuthGroup || inOnboarding) {
      router.replace('/');
    }
  }, [restoring, tokens, me, segments, router]);

  return restoring;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(createQueryClient);
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  // 듣기 음원을 화면이 꺼져도 계속 재생하려면 오디오 세션을 이렇게 잡아야 한다.
  // app.json 의 UIBackgroundModes 선언만으로는 동작하지 않는다.
  useEffect(() => {
    setAudioModeAsync({
      shouldPlayInBackground: true,
      // 학습 앱이라 무음 스위치가 켜져 있어도 소리가 나야 한다
      playsInSilentMode: true,
      // 듣기는 집중이 목적이므로 다른 앱 오디오는 멈춘다
      interruptionMode: 'doNotMix',
    }).catch(() => {
      // 오디오 세션 설정 실패가 앱 실행을 막을 이유는 없다. 재생 시 다시 시도된다
    });
  }, []);

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

  // 오프라인에서 쌓인 듣기 진도를 온라인 복귀 시 보낸다
  useProgressQueueFlush();

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
      <Stack.Screen name="onboarding" options={{ title: '프로필 설정', headerBackVisible: false }} />
      <Stack.Screen name="mypage" options={{ title: '마이페이지' }} />
      <Stack.Screen name="settings" options={{ title: '설정' }} />
      <Stack.Screen name="settings/password" options={{ title: '비밀번호 변경' }} />
      <Stack.Screen name="homework/index" options={{ title: '숙제' }} />
      <Stack.Screen name="homework/[id]" options={{ title: '숙제 상세' }} />
      <Stack.Screen name="vocabulary/index" options={{ title: '단어시험' }} />
      <Stack.Screen name="vocabulary/[dayId]" options={{ title: '단어장' }} />
      <Stack.Screen name="vocabulary/wrong-notes" options={{ title: '오답노트' }} />
      {/*
        시험 중 실수로 빠져나가지 않도록 헤더 뒤로가기와 스와이프는 막되,
        화면 안의 "중단하기"로는 나갈 수 있게 한다 (확인 후 이탈, 답은 저장됨)
      */}
      <Stack.Screen
        name="quiz/[attemptId]/index"
        options={{ title: '단어시험', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen name="quiz/[attemptId]/result" options={{ title: '시험 결과' }} />
      <Stack.Screen name="listening/index" options={{ title: '리스닝' }} />
      <Stack.Screen name="listening/downloads" options={{ title: '저장한 회차' }} />
      {/* 아래 두 화면은 제목을 시험 이름으로 바꾼다. 데이터를 받은 뒤라 화면 쪽에서 설정한다 */}
      <Stack.Screen name="listening/[examId]/index" options={{ title: '' }} />
      <Stack.Screen name="listening/[examId]/full" options={{ title: '' }} />
      <Stack.Screen name="listening/[examId]/[itemId]" options={{ title: '듣기 학습' }} />
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
