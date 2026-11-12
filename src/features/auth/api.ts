import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { env } from '@/src/lib/env';
import { supabase } from '@/src/lib/supabase';

/** Step 1 of magic link: email a 6-digit code (no redirect URL juggling). */
export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Step 2 of magic link: verify the 6-digit code from the email. */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: code.trim(),
    type: 'email',
  });
  if (error) throw error;
}

/** Email + password sign-in (seed users locally; real accounts in production). */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Native Sign in with Apple → Supabase idToken exchange. */
export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('Apple sign-in did not return an identity token.');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  // Apple only sends the name on the FIRST sign-in; persist it if we got one.
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ');
  if (fullName) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from('profiles').update({ display_name: fullName }).eq('id', data.user.id);
    }
  }
}

/** Native Google sign-in → Supabase idToken exchange. */
export async function signInWithGoogle(): Promise<void> {
  if (!env.googleWebClientId) {
    throw new Error('Google sign-in is not configured (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID).');
  }
  GoogleSignin.configure({ webClientId: env.googleWebClientId });
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }
  const response = await GoogleSignin.signIn();
  // Tolerate API shape differences across library versions.
  const idToken: string | undefined =
    (response as { data?: { idToken?: string | null } }).data?.idToken ??
    (response as { idToken?: string | null }).idToken ??
    undefined;
  if (!idToken) throw new Error('Google sign-in did not return an ID token.');

  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Apple App Store requirement: full account deletion inside the app. */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
