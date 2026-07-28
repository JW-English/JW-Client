import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/features/auth/auth-store';
import { ServerStatusCard } from '@/features/health/server-status-card';
import { MenuGrid } from '@/features/home/menu-grid';

/**
 * 메인 화면.
 * 아이콘 그리드만 있는 홈은 학생이 무엇을 해야 할지 모른다 →
 * 그리드 위의 "오늘의 할 일" 카드가 리텐션을 만든다 (P2 이후 실데이터 연결).
 */
export default function HomeScreen() {
  const me = useAuthStore((state) => state.me);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">
            {me ? `${me.name}님, 안녕하세요 👋` : '안녕하세요 👋'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {me?.onboarded
              ? `고${me.grade} · ${me.school ?? '학교 미등록'}`
              : '학년과 반 정보를 아직 등록하지 않았어요'}
          </ThemedText>
        </View>

        <ServerStatusCard />

        <MenuGrid />

        <Pressable onPress={signOut} style={styles.signOut}>
          <ThemedText type="small" themeColor="textSecondary">
            로그아웃
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 4,
  },
  signOut: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
