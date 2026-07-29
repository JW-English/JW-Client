import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { ItemListItem } from '@/features/listening/api';
import type { DownloadState } from '@/features/listening/use-offline';
import { useExams, useItems } from '@/features/listening/use-listening';
import { useIsOnline } from '@/features/listening/use-network';
import { useExamDownload } from '@/features/listening/use-offline';
import { useTheme } from '@/hooks/use-theme';

/** 문항 선택 (1~17번). */
export default function ListeningItemsScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();

  const { data, isPending, error } = useItems(examId);

  // 제목에 쓸 시험 이름. 목록 화면이 이미 받아둔 캐시를 그대로 쓰므로 대개 요청이 늘지 않는다
  const { data: exams } = useExams();
  const exam = exams?.find((e) => e.id === examId);
  const title = exam ? `${exam.year}학년도 ${exam.examTypeLabel}` : '';

  const online = useIsOnline();
  const { offline, state, download, remove } = useExamDownload(examId);

  if (isPending) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title }} />
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error || !data) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title }} />
        <ThemedText type="small" themeColor="textSecondary">
          문항을 불러오지 못했습니다
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title }} />

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="전체 듣기"
          onPress={() => router.push(`/listening/${examId}/full`)}
          style={({ pressed }) => [styles.fullPlayButton, { opacity: pressed ? 0.82 : 1 }]}>
          <SymbolView
            name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
            size={16}
            tintColor="#ffffff"
            weight={{ ios: 'semibold', android: { name: 'outlined', font: 500 } }}
          />
          <ThemedText type="small" style={styles.fullPlayText}>
            전체 듣기
          </ThemedText>
        </Pressable>

        <DownloadButton
          offline={Boolean(offline?.complete)}
          state={state}
          online={online}
          onDownload={download}
          onRemove={remove}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {data.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onPress={() => router.push(`/listening/${examId}/${item.id}`)}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

/** 회차 단위 다운로드 버튼. 한 회차가 약 51MB 라 전체 일괄 다운로드는 두지 않는다 */
function DownloadButton({
  offline,
  state,
  online,
  onDownload,
  onRemove,
}: {
  offline: boolean;
  state: DownloadState;
  online: boolean;
  onDownload: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();

  if (state.status === 'downloading') {
    return (
      <View style={[styles.downloadButton, { backgroundColor: theme.backgroundElement }]}>
        <ActivityIndicator size="small" />
        <ThemedText type="small" themeColor="textSecondary">
          {state.done}/{state.total}
        </ThemedText>
      </View>
    );
  }

  if (offline) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다운로드 삭제"
        onPress={onRemove}
        style={({ pressed }) => [
          styles.downloadButton,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.82 : 1 },
        ]}>
        <SymbolView
          name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
          size={16}
          tintColor={Palette.success}
          weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
        />
        <ThemedText type="small" themeColor="textSecondary">
          저장됨
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="오프라인 저장"
      accessibilityState={{ disabled: !online }}
      disabled={!online}
      onPress={onDownload}
      style={({ pressed }) => [
        styles.downloadButton,
        {
          backgroundColor: theme.backgroundElement,
          opacity: !online ? 0.4 : pressed ? 0.82 : 1,
        },
      ]}>
      <SymbolView
        name={{ ios: 'arrow.down.circle', android: 'download', web: 'download' }}
        size={16}
        tintColor={theme.text}
        weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
      />
      <ThemedText type="small">{state.status === 'error' ? '다시 시도' : '저장'}</ThemedText>
    </Pressable>
  );
}

function ItemRow({ item, onPress }: { item: ItemListItem; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: pressed ? 0.82 : 1,
        },
      ]}>
      <View style={[styles.no, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">{item.itemNo}</ThemedText>
      </View>

      <View style={styles.rowBody}>
        <ThemedText type="small" numberOfLines={2}>
          {item.questionText ?? `${item.itemNo}번 문항`}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.durationMs ? formatDuration(item.durationMs) : '—'}
        </ThemedText>
      </View>

      {item.completed ? (
        <ThemedText type="small" style={styles.done}>
          완료
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

function formatDuration(ms: number) {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = `${total % 60}`.padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 14 },
  // 필터 칩과 같은 높이·모서리로 맞춘다
  fullPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary,
  },
  fullPlayText: { color: '#ffffff' },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
  },
  list: { padding: 20, paddingTop: 6, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  no: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  done: { color: Palette.success },
});
