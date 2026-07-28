import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Menu = {
  key: string;
  label: string;
  emoji: string;
  /** 이동할 경로. 없으면 아직 만들지 않은 기능이라 'Coming Soon' 으로 표시한다. */
  href?: Href;
  phase?: string;
};

const MENUS: Menu[] = [
  { key: 'homework', label: '숙제', emoji: '📝', href: '/homework' },
  { key: 'vocabulary', label: '단어시험', emoji: '🔤', href: '/vocabulary' },
  { key: 'listening', label: '리스닝', emoji: '🎧', phase: 'P4' },
  { key: 'qna', label: 'Q&A', emoji: '💬', phase: 'P5' },
  { key: 'course', label: '인강', emoji: '🎬', phase: 'P6' },
  { key: 'mypage', label: '마이페이지', emoji: '👤', phase: 'P1' },
];

export function MenuGrid() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {MENUS.map((menu) => (
        <Pressable
          key={menu.key}
          disabled={!menu.href}
          onPress={menu.href ? () => router.push(menu.href!) : undefined}
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 },
          ]}>
          <ThemedText style={styles.emoji}>{menu.emoji}</ThemedText>
          <ThemedText type="smallBold">{menu.label}</ThemedText>
          {menu.phase ? (
            <ThemedText type="small" themeColor="textSecondary">
              {menu.phase} 예정
            </ThemedText>
          ) : null}
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
