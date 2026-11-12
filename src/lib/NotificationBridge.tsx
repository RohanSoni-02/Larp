import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { registerForPush } from '@/src/lib/push';
import { queryClient } from '@/src/lib/queryClient';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Opens the screen a notification points at (`data.url`), and refreshes the
 * Larp Check window as soon as a push lands so the banner appears instantly.
 */
export function NotificationBridge({ userId }: { userId: string | undefined }) {
  // expo-notifications' response APIs throw on web.
  if (Platform.OS === 'web') return null;
  return <NativeNotificationBridge userId={userId} />;
}

function NativeNotificationBridge({ userId }: { userId: string | undefined }) {
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const url = lastResponse?.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
  }, [lastResponse]);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: ['larp-window'] });
      void queryClient.invalidateQueries({ queryKey: ['activity'] });
    });
    return () => sub.remove();
  }, []);

  // Refresh this device's push token silently if permission was already granted.
  useEffect(() => {
    if (!userId) return;
    void (async () => {
      try {
        const { granted } = await Notifications.getPermissionsAsync();
        if (granted) await registerForPush(userId);
      } catch {
        // best-effort
      }
    })();
  }, [userId]);

  return null;
}
