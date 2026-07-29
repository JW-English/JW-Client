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
      contentContainerStyle={[styles.row, style]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTextActive: { color: '#ffffff' },
});
