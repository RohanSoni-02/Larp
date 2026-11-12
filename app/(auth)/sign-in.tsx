import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/src/components/Appear';
import { Button } from '@/src/components/Button';
import { Field } from '@/src/components/Field';
import { NavBar } from '@/src/components/Header';
import { Screen } from '@/src/components/Screen';
import { Seg } from '@/src/components/Seg';
import {
  isAppleSignInAvailable,
  sendEmailCode,
  signInWithApple,
  signInWithGoogle,
  signInWithPassword,
  verifyEmailCode,
} from '@/src/features/auth/api';
import { env } from '@/src/lib/env';
import { fonts, typography, useTheme } from '@/src/theme';

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

  const hasSocial = appleAvailable || Boolean(env.googleWebClientId);
  const emailValid = email.includes('@');

  return (
    <Screen
      scroll
      header={<NavBar onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />}
      contentStyle={styles.content}
    >
      <Appear>
        <Text style={[typography.largeTitle, { color: colors.ink }]} accessibilityRole="header">
          Sign in
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Pick up right where your practice left off.</Text>
      </Appear>

      <Appear delay={70} style={styles.form}>
        {hasSocial ? (
          <>
            <View style={styles.social}>
              {appleAvailable ? (
                <Button
                  title="Continue with Apple"
                  icon="apple"
                  variant="outline"
                  loading={busy === 'apple'}
                  onPress={() => run('apple', signInWithApple)}
                />
              ) : null}
              {env.googleWebClientId ? (
                <Button
                  title="Continue with Google"
                  icon="google"
                  variant="outline"
                  loading={busy === 'google'}
                  onPress={() => run('google', signInWithGoogle)}
                />
              ) : null}
            </View>
            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.line }]} />
              <Text style={[styles.dividerText, { color: colors.subtle }]}>or with email</Text>
              <View style={[styles.divider, { backgroundColor: colors.line }]} />
            </View>
          </>
        ) : null}

        <View style={styles.modes}>
          <Seg
            options={[
              { value: 'password', label: 'Password' },
              { value: 'code', label: 'Email code' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </View>

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!(mode === 'code' && emailSent)}
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
              disabled={!emailValid || password.length === 0}
              onPress={() => run('password', () => signInWithPassword(email, password))}
              style={styles.submit}
            />
            {__DEV__ ? (
              <View style={[styles.devHint, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.devHintText, { color: colors.muted }]}>
                  Local dev: any seed user works, e.g.{'\n'}
                  <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink }}>maya.lifts@larping.dev</Text> /{' '}
                  <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink }}>password123</Text>
                </Text>
              </View>
            ) : null}
          </>
        ) : emailSent ? (
          <>
            <Field
              label="6-digit code"
              hint={`Sent to ${email}. It can take a minute to arrive.`}
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              style={styles.codeInput}
            />
            <Button
              title="Verify code"
              loading={busy === 'verify'}
              disabled={code.trim().length !== 6}
              onPress={() => run('verify', () => verifyEmailCode(email, code))}
              style={styles.submit}
            />
            <Pressable
              onPress={() => {
                setEmailSent(false);
                setCode('');
              }}
              hitSlop={10}
              accessibilityRole="button"
              style={({ pressed }) => [styles.link, pressed && { opacity: 0.55 }]}
            >
              <Text style={[styles.linkText, { color: colors.accentStrong }]}>Use a different email</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Button
              title="Email me a code"
              icon="mail"
              loading={busy === 'send'}
              disabled={!emailValid}
              onPress={() =>
                run('send', async () => {
                  await sendEmailCode(email);
                  setEmailSent(true);
                })
              }
              style={styles.submit}
            />
            <Text style={[styles.note, { color: colors.subtle }]}>No password needed. We’ll email you a 6-digit code.</Text>
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
  social: { gap: 10 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  modes: { marginBottom: 18 },
  submit: { marginTop: 6 },
  codeInput: { fontFamily: fonts.num, fontSize: 26, letterSpacing: 6 },
  devHint: { borderRadius: 14, padding: 12, marginTop: 16 },
  devHintText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  link: { alignSelf: 'center', marginTop: 18 },
  linkText: { fontFamily: fonts.bodyBold, fontSize: 14.5, letterSpacing: -0.15 },
  note: { fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 14 },
});
