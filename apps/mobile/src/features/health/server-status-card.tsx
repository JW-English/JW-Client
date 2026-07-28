import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_BASE_URL } from '@/lib/api';

import { useHealth } from './use-health';

/**
 * P0 종료 조건: 앱에서 서버 헬스체크를 호출해 화면에 찍는다.
 * (클라이언트–서버 관통 확인용. P2 에서 "오늘의 할 일" 카드로 교체된다.)
 */
export function ServerStatusCard() {
  const theme = useTheme();
  const { data, error, isPending, isFetching, refetch } = useHealth();

  const statusText = isPending ? '확인 중…' : error ? '연결 실패' : '정상';
  const statusColor = isPending ? theme.textSecondary : error ? Palette.danger : Palette.success;

  return (
    <Pressable
      onPress={() => refetch()}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      <View style={styles.row}>
        <View style={styles.titleRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <ThemedText type="smallBold">서버 상태</ThemedText>
        </View>
        {isFetching ? (
          <ActivityIndicator size="small" />
        ) : (
          <ThemedText type="smallBold" style={{ color: statusColor }}>
            {statusText}
          </ThemedText>
        )}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {API_BASE_URL}
      </ThemedText>

      {data ? (
        <ThemedText type="small" themeColor="textSecondary">
          {data.service} · v{data.version} · {new Date(data.serverTime).toLocaleTimeString('ko-KR')}
        </ThemedText>
      ) : null}

      {error ? (
        <ThemedText type="small" themeColor="textSecondary">
          {error.message} — 탭하면 다시 시도합니다
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 17,
    gap: 7,
    borderWidth: 1,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
