import { Stack } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useOfflineLibrary } from '@/features/listening/use-offline';
import { useTheme } from '@/hooks/use-theme';

/**
 * 받아둔 회차 관리.
 *
 * 회차당 약 51MB 라 관리 수단이 없으면 학생 폰 용량을 계속 먹는다.
 */
export default function ListeningDownloadsScreen() {
  const theme = useTheme();
  const { exams, loading, totalBytes, removeOne, removeAll } = useOfflineLibrary();

  function confirmRemoveAll() {
    Alert.alert('전체 삭제', '받아둔 회차를 모두 지울까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => removeAll() },
    ]);
  }

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: '저장한 회차' }} />
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '저장한 회차' }} />

      <View style={[styles.summary, { borderBottomColor: theme.backgroundElement }]}>
        <ThemedText type="small" themeColor="textSecondary">
          {exams.length}개 회차 · {formatBytes(totalBytes)}
        </ThemedText>
        {exams.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={confirmRemoveAll} hitSlop={8}>
            <ThemedText type="small" style={styles.danger}>
              전체 삭제
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {exams.length === 0 ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            저장한 회차가 없어요
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            회차 화면에서 저장하면 데이터 없이도 들을 수 있어요
          </ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {exams.map((exam) => (
            <View
              key={exam.examId}
              style={[
                styles.row,
                { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
              ]}>
              <View style={styles.rowBody}>
                <ThemedText type="smallBold">{exam.examLabel}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {exam.items.length}문항 · {formatBytes(exam.bytes)}
                </ThemedText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${exam.examLabel} 삭제`}
                onPress={() => removeOne(exam.examId)}
                hitSlop={8}>
                <ThemedText type="small" style={styles.danger}>
                  삭제
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0MB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${Math.round(mb)}MB`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24 },
  hint: { textAlign: 'center' },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  list: { padding: 20, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  rowBody: { flex: 1, gap: 2 },
  danger: { color: Palette.danger },
});
