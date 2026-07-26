import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/features/auth/auth-store';
import { useFormError } from '@/features/auth/use-form-error';
import { useTheme } from '@/hooks/use-theme';

export default function SignUpScreen() {
  const router = useRouter();
  const theme = useTheme();
  const register = useAuthStore((state) => state.register);
  const { message, fields, capture, clear } = useFormError();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    agreed &&
    !submitting;

  async function handleSubmit() {
    clear();
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
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
            <ThemedText type="title">회원가입</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              정운영어 학습을 시작하려면 계정을 만들어 주세요
            </ThemedText>
          </View>

          {message ? (
            <ThemedText type="small" style={styles.formError}>
              {message}
            </ThemedText>
          ) : null}

          <TextField
            label="이름"
            value={name}
            onChangeText={setName}
            error={fields.name}
            placeholder="김학생"
            autoComplete="name"
            textContentType="name"
          />

          <TextField
            label="이메일"
            value={email}
            onChangeText={setEmail}
            error={fields.email}
            placeholder="student@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            textContentType="emailAddress"
          />

          <TextField
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            error={fields.password}
            placeholder="8자 이상"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          {/* 수집 항목과 목적을 화면에 명시한다 — 소셜 로그인 검수에서도 확인하는 부분이다 */}
          <View style={[styles.consent, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              수집 항목: 이름, 이메일 · 목적: 학습 기록 관리 및 본인 확인
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            onPress={() => setAgreed((prev) => !prev)}
            style={styles.agreeRow}>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: agreed ? '#208AEF' : theme.textSecondary,
                  backgroundColor: agreed ? '#208AEF' : 'transparent',
                },
              ]}>
              {agreed ? <ThemedText style={styles.check}>✓</ThemedText> : null}
            </View>
            <ThemedText type="small">
              <ThemedText type="smallBold">(필수)</ThemedText> 이용약관 및 개인정보처리방침에
              동의합니다
            </ThemedText>
          </Pressable>

          <PrimaryButton
            label="가입하기"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
          />

          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              이미 계정이 있으신가요?
            </ThemedText>
            <Link href="/login" replace>
              <ThemedText type="smallBold" style={styles.link}>
                로그인
              </ThemedText>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    gap: 6,
    marginBottom: 4,
  },
  formError: {
    color: '#E5484D',
  },
  consent: {
    borderRadius: 12,
    padding: 12,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  link: {
    color: '#208AEF',
  },
});
