import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { initAnalytics } from '@/src/lib/analytics';
import { initCrashReporting } from '@/src/lib/crashReporting';
import { NotificationBridge } from '@/src/lib/NotificationBridge';
import { warnIfMissing } from '@/src/lib/env';
import { queryClient } from '@/src/lib/queryClient';
import { SessionProvider, useSession } from '@/src/features/auth/SessionProvider';
import { useMyProfile } from '@/src/features/profile/hooks';
import { AppThemeProvider, useAppFonts, useTheme } from '@/src/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    warnIfMissing();
    initAnalytics();
    initCrashReporting();
  }, []);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useMyProfile(session?.user?.id);
  const segments = useSegments();
  const { isDark, colors } = useTheme();

  if (isLoading || (session && profileLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator color={colors.muted} accessibilityLabel="Loading" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';
  const onInvite = (segments[0] as string | undefined) === 'invite';
  const onboarded = Boolean(profile?.onboarded_at);

  const parts = segments as unknown as string[];
  if (!onInvite) {
    if (!session && !inAuthGroup) return <Redirect href="/welcome" />;
    if (session && !onboarded && parts[1] !== 'onboarding') return <Redirect href="/onboarding" />;
    if (session && onboarded && inAuthGroup) return <Redirect href="/" />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NotificationBridge userId={session?.user?.id} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="session/new"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="session/celebration"
          options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="node/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="comments/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="skills/add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="skills/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="larp-check" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="story/[userId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="activity" options={{ presentation: 'card' }} />
        <Stack.Screen name="user/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="post/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="session/focus" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="session/template" options={{ presentation: 'modal' }} />
        <Stack.Screen name="leaderboard" options={{ presentation: 'card' }} />
        <Stack.Screen name="mentorship/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="mentorship/ask" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/larp-check" options={{ presentation: 'modal' }} />
        <Stack.Screen name="invite" options={{ presentation: 'card', gestureEnabled: false }} />
      </Stack>
    </>
  );
}
