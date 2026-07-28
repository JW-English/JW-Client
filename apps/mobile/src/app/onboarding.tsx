import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import { useFormError } from '@/features/auth/use-form-error';
import { useTheme } from '@/hooks/use-theme';

const GRADES = [1, 2, 3];

/**
 * 최초 프로필 설정.
 *
 * 회원가입 폼이 아니라 별도 화면인 이유: 소셜 로그인에는 가입 폼이 없다.
 * 카카오·네이버로 들어온 학생도 여기를 거쳐야 학년이 채워진다.
 * 학년이 없으면 단어 DAY 가 열리지 않는다.
 */
export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const me = useAuthStore((state) => state.me);
  const submitOnboarding = useAuthStore((state) => state.submitOnboarding);
  const { message, fields, capture, clear } = useFormError();

  const [name, setName] = useState(me?.name ?? '');
  const [grade, setGrade] = useState<number | null>(me?.grade ?? null);
  const [school, setSchool] = useState(me?.school ?? '');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && grade !== null && !submitting;

  async function handleSubmit() {
    if (grade === null) return;
    clear();
    setSubmitting(true);
    try {
      await submitOnboarding({
        name: name.trim(),
        grade,
        school: school.trim() || undefined,
      });
      router.replace('/');
    } catch (error) {
      capture(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText type="title">거의 다 됐어요</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              학년에 맞는 단어장을 보여드리려고 해요
            </ThemedText>
          </View>

          {message ? (
            <ThemedText type="small" style={styles.formError}>
              {message}
            </ThemedText>
          ) : null}

          <TextField label="이름" value={name} onChangeText={setName} error={fields.name} />

          <View style={styles.field}>
            <ThemedText type="smallBold">학년</ThemedText>
            <View style={styles.gradeRow}>
              {GRADES.map((value) => {
                const active = grade === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setGrade(value)}
                    style={[
                      styles.gradeChip,
                      {
                        backgroundColor: active ? Palette.primary : theme.backgroundElement,
                        borderColor: active ? Palette.primary : theme.backgroundSelected,
                      },
                    ]}>
                    <ThemedText type="smallBold" style={active ? styles.gradeTextActive : undefined}>
                      고{value}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {fields.grade ? (
              <ThemedText type="small" style={styles.formError}>
                {fields.grade}
              </ThemedText>
            ) : null}
          </View>

          <TextField
            label="학교 (선택)"
            value={school}
            onChangeText={setSchool}
            error={fields.school}
            placeholder="정운고등학교"
          />

          <PrimaryButton
            label="시작하기"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            학년은 나중에 마이페이지에서 바꿀 수 있어요
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 24, gap: 18, flexGrow: 1, justifyContent: 'center' },
  header: { gap: 6, marginBottom: 4 },
  field: { gap: 8 },
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  gradeTextActive: { color: '#ffffff' },
  formError: { color: Palette.danger },
  hint: { textAlign: 'center' },
});
