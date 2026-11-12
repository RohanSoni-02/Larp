import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { upcomingBoundaries, type SessionPlan } from './blocks';

const ALERT_KIND = 'session_block';

/** Cancel every scheduled block-boundary alert (pause, save, discard). */
export async function cancelBlockAlerts(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.kind === ALERT_KIND)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Best-effort: alerts are a nicety, the in-app timer is the source of truth.
  }
}

/**
 * Local notifications at each upcoming block boundary, so the phone can sit
 * face-down (or the app be backgrounded) during a templated session.
 */
export async function scheduleBlockAlerts(plan: SessionPlan, elapsedSec: number): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelBlockAlerts();
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    for (const b of upcomingBoundaries(plan, elapsedSec)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: b.startsBlock ? `Next: ${b.startsBlock.label}` : `${plan.name} complete`,
          body: b.startsBlock
            ? `${b.startsBlock.minutes} min — keep going.`
            : 'Nice work. Add a note or a clip and save your session.',
          data: { kind: ALERT_KIND, url: '/session/focus' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.round(b.atSec)),
        },
      });
    }
  } catch {
    // Best-effort (simulators, denied permissions).
  }
}
