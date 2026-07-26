import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/features/auth/auth-store';
import { useFormError } from '@/features/auth/use-form-error';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const { message, fields, capture, clear } = useFormError();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    clear();
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
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
            <ThemedText type="title">정운영어</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              로그인하고 오늘의 학습을 시작하세요
            </ThemedText>
          </View>

          {message ? (
            <ThemedText type="small" style={styles.formError}>
              {message}
            </ThemedText>
          ) : null}

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
            placeholder="비밀번호"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={canSubmit ? handleSubmit : undefined}
          />

          <PrimaryButton label="로그인" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} />

          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              아직 계정이 없으신가요?
            </ThemedText>
            <Link href="/signup" replace>
              <ThemedText type="smallBold" style={styles.link}>
                회원가입
              </ThemedText>
            </Link>
          </View>

          {/* 소셜 로그인은 개발자 앱 검수 완료 후 추가한다 (카카오 → 네이버 → 구글 → Apple) */}
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
    gap: 18,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    gap: 6,
    marginBottom: 8,
  },
  formError: {
    color: '#E5484D',
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
