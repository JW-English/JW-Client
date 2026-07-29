import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { MenuGrid } from '@/features/home/menu-grid';
import { useTheme } from '@/hooks/use-theme';

/**
 * 메인 화면.
 * 아이콘 그리드만 있는 홈은 학생이 무엇을 해야 할지 모른다 →
 * 그리드 위의 "오늘의 할 일" 카드가 리텐션을 만든다 (P2 이후 실데이터 연결).
 */
export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const me = useAuthStore((state) => state.me);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <ThemedText type="smallBold" style={styles.appName}>
            정운영어
          </ThemedText>
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="마이페이지"
              onPress={() => router.push('/mypage')}
              hitSlop={10}
              style={styles.topIconButton}>
              <SymbolView
                name={{ ios: 'person.circle', android: 'person', web: 'person' }}
                size={20}
                tintColor={Palette.primary}
                weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="설정"
              onPress={() => router.push('/settings')}
              hitSlop={10}
              style={styles.topIconButton}>
              <SymbolView
                name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
                size={19}
                tintColor={Palette.primary}
                weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
              />
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.header,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}>
          <View style={styles.cloudOne} />
          <View style={styles.cloudTwo} />
          <View style={styles.cloudThree} />
          <SymbolView
            name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
            size={24}
            tintColor={Palette.secondaryBlue}
            style={styles.paperPlane}
          />
          <View style={styles.headerCopy}>
            <ThemedText type="smallBold" style={styles.eyebrow}>
              JW ENGLISH
            </ThemedText>
            <ThemedText type="title">
              {me ? `${me.name}님, 안녕하세요 👋` : '안녕하세요 👋'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {me?.onboarded
                ? `고${me.grade} · ${me.school ?? '학교 미등록'}`
                : '학년과 반 정보를 아직 등록하지 않았어요'}
            </ThemedText>
          </View>
          <View style={styles.badge}>
            <ThemedText type="smallBold" style={styles.badgeText}>
              오늘
            </ThemedText>
          </View>
        </View>

        <MenuGrid />

        <View style={styles.cheerCard}>
          <View style={styles.cheerIcon}>
            <ThemedText type="smallBold">🏆</ThemedText>
          </View>
          <View style={styles.cheerCopy}>
            <ThemedText type="smallBold">오늘도 화이팅!</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              꾸준함이 실력을 만듭니다.
            </ThemedText>
          </View>
          <ThemedText style={styles.sparkle}>✦</ThemedText>
          <SymbolView
            name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
            size={17}
            tintColor={Palette.primary}
            style={styles.cheerPlane}
          />
        </View>

        <Pressable accessibilityRole="button" style={styles.calendarButton}>
          <SymbolView
            name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
            size={17}
            tintColor={Palette.primary}
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
          <ThemedText type="smallBold" style={styles.calendarText}>
            캘린더
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
    paddingTop: 16,
    paddingBottom: 28,
    gap: 16,
  },
  topBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    color: Palette.ink,
    fontSize: 18,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Palette.line,
  },
  header: {
    minHeight: 188,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  headerCopy: {
    width: '72%',
    gap: 8,
  },
  eyebrow: {
    color: Palette.primary,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#ffffff',
  },
  cloudOne: {
    position: 'absolute',
    right: 22,
    bottom: 30,
    width: 96,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.primarySoft,
  },
  cloudTwo: {
    position: 'absolute',
    right: 56,
    bottom: 55,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EDF7FF',
  },
  cloudThree: {
    position: 'absolute',
    right: -20,
    bottom: -24,
    width: 148,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5FBFF',
  },
  paperPlane: {
    position: 'absolute',
    right: 34,
    bottom: 88,
    color: Palette.secondaryBlue,
    fontSize: 23,
    transform: [{ rotate: '-16deg' }],
  },
  cheerCard: {
    minHeight: 86,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.primarySoft,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CFE6FF',
  },
  cheerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cheerCopy: {
    flex: 1,
    gap: 2,
  },
  sparkle: {
    position: 'absolute',
    right: 18,
    top: 14,
    color: Palette.secondaryBlue,
    fontSize: 18,
  },
  cheerPlane: {
    position: 'absolute',
    right: 30,
    bottom: 14,
    color: Palette.primary,
    fontSize: 17,
    transform: [{ rotate: '-18deg' }],
  },
  calendarButton: {
    alignSelf: 'center',
    minWidth: 132,
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Palette.line,
  },
  calendarText: {
    color: Palette.primaryDark,
  },
});
