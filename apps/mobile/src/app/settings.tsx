import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/features/auth/auth-store';
import { useWithdraw } from '@/features/me/use-me';
import {
  PLAYBACK_RATES,
  useLearningSettings,
} from '@/features/settings/use-learning-settings';
import { useTheme } from '@/hooks/use-theme';

/**
 * 설정.
 *
 * 담는 것은 "가끔 들어와 바꾸고 나오는 것"이다. 학습 기본값은 서버에 둘 이유가 없어
 * 기기에 저장한다.
 */
export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const me = useAuthStore((state) => state.me);
  const signOut = useAuthStore((state) => state.signOut);
  const { settings, update } = useLearningSettings();
  const withdraw = useWithdraw();
  const [busy, setBusy] = useState(false);

  function confirmSignOut() {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  /** 앱스토어 심사가 앱 내 계정 삭제 경로를 요구한다 */
  function confirmWithdraw() {
    Alert.alert(
      '회원탈퇴',
      '탈퇴하면 다시 로그인할 수 없어요.\n같은 이메일로는 재가입도 되지 않습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            if (busy) return;
            setBusy(true);
            try {
              await withdraw.mutateAsync();
              await signOut();
            } catch {
              Alert.alert('탈퇴 실패', '잠시 후 다시 시도해 주세요.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="계정">
          <Row label="이메일" value={me?.email ?? '—'} />
          <Row
            label="프로필 수정"
            hint="이름 · 학년 · 학교"
            onPress={() => router.push('/onboarding')}
          />
          <Row label="비밀번호 변경" onPress={() => router.push('/settings/password')} />
        </Section>

        <Section title="학습">
          <Row
            label="듣기 재생 속도"
            value={`${settings.playbackRate}x`}
            onPress={() => {
              const next =
                PLAYBACK_RATES[
                  (PLAYBACK_RATES.indexOf(settings.playbackRate) + 1) % PLAYBACK_RATES.length
                ];
              update({ playbackRate: next });
            }}
          />
          <ToggleRow
            label="해석 기본 표시"
            value={settings.showTranslation}
            onChange={(v) => update({ showTranslation: v })}
          />
          <ToggleRow
            label="재생 따라 자동 스크롤"
            value={settings.autoScroll}
            onChange={(v) => update({ autoScroll: v })}
          />
        </Section>

        <Section title="앱">
          <Row
            label="저장한 회차"
            hint="오프라인 음원 관리"
            onPress={() => router.push('/listening/downloads')}
          />
          <Row label="버전" value={Constants.expoConfig?.version ?? '—'} />
          <Row
            label="이용약관"
            onPress={() => Alert.alert('준비 중', '아직 링크가 등록되지 않았어요.')}
          />
          <Row
            label="개인정보처리방침"
            onPress={() => Alert.alert('준비 중', '아직 링크가 등록되지 않았어요.')}
          />
        </Section>

        <View style={styles.dangerZone}>
          <Pressable
            accessibilityRole="button"
            onPress={confirmSignOut}
            style={({ pressed }) => [
              styles.dangerButton,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.82 : 1 },
            ]}>
            <ThemedText type="small">로그아웃</ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={confirmWithdraw}
            style={({ pressed }) => [styles.withdrawButton, { opacity: pressed ? 0.6 : 1 }]}>
            <ThemedText type="small" themeColor="textSecondary">
              회원탈퇴
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <View
        style={[
          styles.sectionBody,
          { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
        ]}>
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  hint,
  onPress,
}: {
  label: string;
  value?: string;
  hint?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <ThemedText type="small">{label}</ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
      {value ? (
        <ThemedText type="small" themeColor="textSecondary">
          {value}
        </ThemedText>
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
      {content}
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" style={styles.rowBody}>
        {label}
      </ThemedText>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  section: { gap: 8 },
  sectionTitle: { paddingHorizontal: 4 },
  sectionBody: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: 8,
  },
  rowBody: { flex: 1, gap: 2 },
  pressed: { opacity: 0.6 },
  dangerZone: { marginTop: 10, gap: 14, alignItems: 'center' },
  dangerButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  withdrawButton: { padding: 8 },
});
