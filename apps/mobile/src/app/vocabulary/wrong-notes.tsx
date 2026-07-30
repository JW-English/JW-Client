import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { WrongNoteItem } from '@/features/me/api';
import { useWrongNotes } from '@/features/me/use-me';
import { useTheme } from '@/hooks/use-theme';

/**
 * 오답노트.
 *
 * 마이페이지가 아니라 단어 탭에 두는 이유는, 이게 "보는 기록"이 아니라
 * "다시 푸는 학습"에 가깝기 때문이다.
 */
export default function WrongNotesScreen() {
  const { data, isPending, error } = useWrongNotes();

  if (isPending) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          오답노트를 불러오지 못했습니다
        </ThemedText>
      </ThemedView>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          아직 틀린 단어가 없어요
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          단어시험에서 틀리면 여기에 모입니다
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.count}>
          {data.length}개 단어
        </ThemedText>
        {data.map((note) => (
          <NoteRow key={note.wordId} note={note} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

function NoteRow({ note }: { note: WrongNoteItem }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      <View style={styles.rowBody}>
        <ThemedText type="smallBold">{note.headword}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {note.meaningKo}
        </ThemedText>
      </View>

      <View style={styles.meta}>
        <ThemedText type="small" style={styles.wrongCount}>
          {note.wrongCount}회
        </ThemedText>
        {note.streakCount > 0 ? (
          <ThemedText type="small" style={styles.streak}>
            연속 {note.streakCount}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24 },
  hint: { textAlign: 'center' },
  list: { padding: 20, gap: 10 },
  count: { paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  rowBody: { flex: 1, gap: 2 },
  meta: { alignItems: 'flex-end', gap: 2 },
  wrongCount: { color: Palette.danger },
  streak: { color: Palette.success },
});
