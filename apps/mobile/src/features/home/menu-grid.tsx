import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Menu = {
  key: string;
  label: string;
  emoji: string;
  /** 아직 만들지 않은 기능은 'Coming Soon' 배지로 표시한다. */
  phase: string;
};

const MENUS: Menu[] = [
  { key: 'homework', label: '숙제', emoji: '📝', phase: 'P2' },
  { key: 'vocabulary', label: '단어시험', emoji: '🔤', phase: 'P3' },
  { key: 'listening', label: '리스닝', emoji: '🎧', phase: 'P4' },
  { key: 'qna', label: 'Q&A', emoji: '💬', phase: 'P5' },
  { key: 'course', label: '인강', emoji: '🎬', phase: 'P6' },
  { key: 'mypage', label: '마이페이지', emoji: '👤', phase: 'P1' },
];

export function MenuGrid() {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {MENUS.map((menu) => (
        <Pressable
          key={menu.key}
          disabled
          style={[styles.tile, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={styles.emoji}>{menu.emoji}</ThemedText>
          <ThemedText type="smallBold">{menu.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {menu.phase} 예정
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 28,
  },
});
