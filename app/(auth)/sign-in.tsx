import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Field } from '@/src/components/Field';
import { Screen } from '@/src/components/Screen';
import {
  isAppleSignInAvailable,
  sendEmailCode,
  signInWithApple,
  signInWithGoogle,
  signInWithPassword,
  verifyEmailCode,
} from '@/src/features/auth/api';
import { env } from '@/src/lib/env';
import { fonts, useTheme } from '@/src/theme';

export default function SignInScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [emailSent, setEmailSent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (error) {
      Alert.alert('Sign-in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={[styles.title, { color: colors.ink }]}>Sign in</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Pick up right where your practice left off.
      </Text>

      {appleAvailable && (
        <Button
          title="Continue with Apple"
          variant="ghost"
          loading={busy === 'apple'}
          onPress={() => run('apple', signInWithApple)}
        />
      )}
      {env.googleWebClientId ? (
        <Button
          title="Continue with Google"
          variant="ghost"
          loading={busy === 'google'}
          onPress={() => run('google', signInWithGoogle)}
          style={styles.gapTop}
        />
      ) : null}

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.line }]} />
        <Text style={[styles.dividerText, { color: colors.muted }]}>or with email</Text>
        <View style={[styles.divider, { backgroundColor: colors.line }]} />
      </View>

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />

      {mode === 'password' ? (
        <>
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />
          <Button
            title="Sign in"
            loading={busy === 'password'}
            disabled={!email.includes('@') || password.length === 0}
            onPress={() => run('password', () => signInWithPassword(email, password))}
          />
          {__DEV__ ? (
            <View style={[styles.devHint, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
              <Text style={[styles.devHintText, { color: colors.muted }]}>
                Local dev: any seed user works, e.g.{'\n'}
                <Text style={{ fontFamily: fonts.bodyBold }}>maya.lifts@larping.dev</Text> /{' '}
                <Text style={{ fontFamily: fonts.bodyBold }}>password123</Text>
              </Text>
            </View>
          ) : null}
          <Button
            title="Email me a sign-in code instead"
            variant="ghost"
            size="sm"
            onPress={() => setMode('code')}
            style={styles.gapTop}
          />
        </>
      ) : emailSent ? (
        <>
          <Field
            label="6-digit code"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={6}
          />
          <Button
            title="Verify code"
            loading={busy === 'verify'}
            disabled={code.trim().length !== 6}
            onPress={() => run('verify', () => verifyEmailCode(email, code))}
          />
          <Button
            title="Use a different email"
            variant="ghost"
            size="sm"
            onPress={() => {
              setEmailSent(false);
              setCode('');
            }}
            style={styles.gapTop}
          />
        </>
      ) : (
        <>
          <Button
            title="Email me a code"
            loading={busy === 'send'}
            disabled={!email.includes('@')}
            onPress={() =>
              run('send', async () => {
                await sendEmailCode(email);
                setEmailSent(true);
              })
            }
          />
          <Button
            title="Sign in with password instead"
            variant="ghost"
            size="sm"
            onPress={() => setMode('password')}
            style={styles.gapTop}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 40 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 34 },
  subtitle: { fontFamily: fonts.body, fontSize: 16, marginBottom: 12 },
  gapTop: { marginTop: 10 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontFamily: fonts.body, fontSize: 13 },
  devHint: { borderWidth: 1, borderRadius: 12, padding: 12 },
  devHintText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
