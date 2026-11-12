import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/src/lib/supabase';

export type PushResult = 'registered' | 'denied' | 'unavailable';

/**
 * Ask for notification permission and store this device's Expo push token so
 * the server can push Larp Checks. Remote push needs an EAS projectId and a
 * real device; without them we still get local notifications + in-app polling.
 */
export async function registerForPush(meId: string): Promise<PushResult> {
  if (Platform.OS === 'web') return 'unavailable';
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('larp-check', {
        name: 'Larp Checks',
        importance: AndroidImportance.MAX,
        vibrationPattern: [0, 250, 120, 250],
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const status = current.granted ? 'granted' : (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return 'denied';

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return 'unavailable';

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: meId, expo_token: token, platform: Platform.OS, last_seen_at: new Date().toISOString() },
        { onConflict: 'expo_token' },
      );
    if (error) throw error;
    return 'registered';
  } catch {
    return 'unavailable';
  }
}
