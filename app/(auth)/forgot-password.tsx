import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/src/components/Appear';
import { Button } from '@/src/components/Button';
import { Field } from '@/src/components/Field';
import { NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { sendPasswordReset } from '@/src/features/auth/api';
import { fonts, typography, useTheme } from '@/src/theme';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the reset email. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      scroll
      header={<NavBar onBack={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))} />}
      contentStyle={styles.content}
    >
      <Appear>
        <Text style={[typography.largeTitle, { color: colors.ink }]} accessibilityRole="header">
          {sent ? 'Check your inbox' : 'Reset password'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {sent
            ? `If ${email.trim()} has a larpr account, we sent it a link to choose a new password. It can take a minute to arrive.`
            : 'Enter the email you signed up with and we’ll send you a link to choose a new one.'}
        </Text>
      </Appear>

      <Appear delay={70} style={styles.form}>
        {sent ? (
          <>
            <Button title="Back to sign in" onPress={() => router.replace('/sign-in')} />
            <Pressable
              onPress={() => setSent(false)}
              hitSlop={10}
              accessibilityRole="button"
              style={({ pressed }) => [styles.link, pressed && { opacity: 0.55 }]}
            >
              <Text style={[styles.linkText, { color: colors.accentStrong }]}>Use a different email</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              autoFocus
              onSubmitEditing={() => emailValid && void submit()}
            />

            {error ? (
              <View style={[styles.error, { backgroundColor: colors.surface2 }]} accessibilityRole="alert">
                <Icon name="info" size={16} color={colors.bad} />
                <Text style={[styles.errorText, { color: colors.bad }]}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Send reset link"
              icon="mail"
              loading={busy}
              disabled={!emailValid}
              onPress={() => void submit()}
              style={styles.submit}
            />
          </>
        )}
      </Appear>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 12 },
  subtitle: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, letterSpacing: -0.15, marginTop: 8 },
  form: { marginTop: 28 },
  submit: { marginTop: 6 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: 12, marginBottom: 12 },
  errorText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, lineHeight: 19 },
  link: { alignSelf: 'center', marginTop: 18 },
  linkText: { fontFamily: fonts.bodyBold, fontSize: 14.5, letterSpacing: -0.15 },
});
