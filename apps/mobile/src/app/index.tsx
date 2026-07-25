import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ServerStatusCard } from '@/features/health/server-status-card';
import { MenuGrid } from '@/features/home/menu-grid';

/**
 * 메인 화면.
 * 아이콘 그리드만 있는 홈은 학생이 무엇을 해야 할지 모른다 →
 * 그리드 위의 "오늘의 할 일" 카드가 리텐션을 만든다 (P2 이후 실데이터 연결).
 */
export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">안녕하세요 👋</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            로그인 전 상태입니다 (P1 에서 소셜 로그인 연결)
          </ThemedText>
        </View>

        <ServerStatusCard />

        <MenuGrid />
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
});
