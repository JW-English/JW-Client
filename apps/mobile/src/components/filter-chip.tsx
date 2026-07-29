import { Pressable, ScrollView, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * 목록 상단 필터 칩.
 *
 * 듣기 시험 목록의 연도 칩에서 쓰던 모양을 그대로 뽑아냈다.
 * 문항 목록·시험 종류 필터가 같은 모양을 써야 해서 화면마다 복사하지 않는다.
 */
export function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? Palette.primary : theme.backgroundElement,
          borderColor: active ? Palette.primary : theme.backgroundSelected,
        },
      ]}>
      <ThemedText type="small" style={active ? styles.chipTextActive : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** 칩을 가로로 늘어놓는 줄. 개수가 많아지면 가로 스크롤된다. */
export function FilterChipRow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // flexGrow 를 막지 않으면 가로 스크롤뷰가 세로 공간을 차지하고,
      // contentContainer 기본값(stretch)이 칩을 그 높이만큼 늘려버린다
      style={styles.scroll}
      contentContainerStyle={[styles.row, style]}>
      {children}
    </ScrollView>
  );
}

const CHIP_HEIGHT = 38;

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  row: { gap: 8, paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center' },
  chip: {
    height: CHIP_HEIGHT,
    paddingHorizontal: 18,
    borderRadius: CHIP_HEIGHT / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTextActive: { color: '#ffffff' },
});
