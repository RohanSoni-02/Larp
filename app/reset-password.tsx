import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/src/components/Appear';
import { Button } from '@/src/components/Button';
import { Field } from '@/src/components/Field';
import { NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import { updatePassword } from '@/src/features/auth/api';
import { fonts, typography, useTheme } from '@/src/theme';

const MIN_PASSWORD = 8;

/** Landing page for the password-reset email; the link signs the user in first. */
export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordValid = password.length >= MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = passwordValid && confirm === password;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update your password. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const title = !session ? 'Link expired' : done ? 'Password updated' : 'Choose a new password';
  const subtitle = !session
    ? 'This reset link has expired or was already used. Request a new one and open the newest email.'
    : done
      ? 'You’re signed in. Use your new password next time.'
      : `For ${session.user.email ?? 'your account'}.`;

  return (
    <Screen
      scroll
      header={<NavBar onClose={() => router.replace(session ? '/' : '/sign-in')} />}
      contentStyle={styles.content}
    >
      <Appear>
        <Text style={[typography.largeTitle, { color: colors.ink }]} accessibilityRole="header">
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
      </Appear>

      <Appear delay={70} style={styles.form}>
        {!session ? (
          <Button title="Send a new link" icon="mail" onPress={() => router.replace('/forgot-password')} />
        ) : done ? (
          <Button title="Continue" onPress={() => router.replace('/')} />
        ) : (
          <>
            <Field
              label="New password"
              hint={`At least ${MIN_PASSWORD} characters.`}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="new-password"
              autoFocus
            />
            <Field
              label="Confirm new password"
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
              title="Update password"
              loading={busy}
              disabled={!canSubmit}
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
});
