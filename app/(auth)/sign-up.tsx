import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/src/components/Appear';
import { Button } from '@/src/components/Button';
import { Field } from '@/src/components/Field';
import { NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { signUpWithPassword } from '@/src/features/auth/api';
import { fonts, typography, useTheme } from '@/src/theme';

const MIN_PASSWORD = 8;

export default function SignUpScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordValid = password.length >= MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = emailValid && passwordValid && confirm === password;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUpWithPassword(email, password);
      // Signed in: the root layout redirects to onboarding on the session change.
      if (needsConfirmation) setCheckInbox(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      scroll
      header={<NavBar onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />}
      contentStyle={styles.content}
    >
      <Appear>
        <Text style={[typography.largeTitle, { color: colors.ink }]} accessibilityRole="header">
          {checkInbox ? 'Check your inbox' : 'Create account'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {checkInbox
            ? `We sent a confirmation link to ${email.trim()}. Open it, then sign in.`
            : 'Everyone starts out larping. Make it official.'}
        </Text>
      </Appear>

      <Appear delay={70} style={styles.form}>
        {checkInbox ? (
          <Button title="Go to sign in" onPress={() => router.replace('/sign-in')} />
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
            />
            <Field
              label="Password"
              hint={`At least ${MIN_PASSWORD} characters.`}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="new-password"
            />
            <Field
              label="Confirm password"
              hint={mismatch ? 'Passwords don’t match.' : undefined}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="new-password"
              onSubmitEditing={() => canSubmit && void submit()}
            />

            {error ? (
              <View style={[styles.error, { backgroundColor: colors.surface2 }]} accessibilityRole="alert">
                <Icon name="info" size={16} color={colors.bad} />
                <Text style={[styles.errorText, { color: colors.bad }]}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Create account"
              loading={busy}
              disabled={!canSubmit}
              onPress={() => void submit()}
              style={styles.submit}
            />
          </>
        )}

        <Pressable
          onPress={() => router.replace('/sign-in')}
          hitSlop={10}
          accessibilityRole="button"
          style={({ pressed }) => [styles.link, pressed && { opacity: 0.55 }]}
        >
          <Text style={[styles.linkText, { color: colors.muted }]}>
            Already have an account? <Text style={{ color: colors.accentStrong }}>Sign in</Text>
          </Text>
        </Pressable>
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
