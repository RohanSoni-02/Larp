import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { blockAt } from '@/src/features/templates/blocks';
import { formatClock } from '@/src/lib/format';
import { useNow } from '@/src/lib/useNow';
import { elapsedSec, useSessionStore } from '@/src/stores/session';
import { fonts } from '@/src/theme';

const BG = '#0B0C16';
const ACCENT = '#8C76FF';

/** Distraction-free timer: screen stays on, one number, one button. */
export default function FocusScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const active = useSessionStore((s) => s.active);
  const toggle = useSessionStore((s) => s.toggle);
  const now = useNow(1000);

  const elapsed = elapsedSec(active, now);
  const plan = active?.plan ?? null;
  const pos = plan ? blockAt(plan, elapsed) : null;
  const running = Boolean(active?.runningSince);

  const lastIndex = useRef<number | null>(null);
  const blockKey = pos ? (pos.done ? -1 : pos.index) : null;
  useEffect(() => {
    if (blockKey === null) return;
    if (lastIndex.current !== null && lastIndex.current !== blockKey && Platform.OS !== 'web') {
      Vibration.vibrate([0, 300, 150, 300]);
    }
    lastIndex.current = blockKey;
  }, [blockKey]);

  if (!active) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.big}>No session running</Text>
        <Pressable onPress={() => router.back()} style={styles.secondary}>
          <Text style={styles.secondaryText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const main = pos && !pos.done ? pos.remainingSec : elapsed;
  const ring = pos ? (pos.done ? 1 : pos.progress) : (elapsed % 3600) / 3600;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <StatusBar style="light" />
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Leave focus mode">
          <Text style={styles.topLink}>Exit focus</Text>
        </Pressable>
        <Text style={styles.topMeta}>{plan ? plan.name : 'Free practice'}</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.blockName}>
          {pos ? (pos.done ? 'Plan complete ✓' : pos.block.label) : running ? 'Practising' : 'Paused'}
        </Text>
        <Text style={[styles.clock, !running && { opacity: 0.45 }]} accessibilityRole="timer">
          {formatClock(main)}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(1, ring) * 100}%` }]} />
        </View>
        <Text style={styles.total}>Total {formatClock(elapsed)}</Text>
        {pos?.next ? (
          <Text style={styles.next}>
            Up next: {pos.next.label} · {pos.next.minutes} min
          </Text>
        ) : null}
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={toggle}
          style={[styles.primary, !running && { backgroundColor: '#fff' }]}
          accessibilityRole="button"
          accessibilityLabel={running ? 'Pause' : 'Resume'}
        >
          <Text style={[styles.primaryText, !running && { color: BG }]}>{running ? 'Pause' : 'Resume'}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>Finish & save</Text>
        </Pressable>
        <Text style={styles.tip}>
          Tip: turn on Do Not Disturb — we’ll still buzz you at the end of each block.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingHorizontal: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topLink: { color: '#ffffffb3', fontFamily: fonts.bodyBold, fontSize: 15 },
  topMeta: { color: '#ffffff80', fontFamily: fonts.body, fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blockName: { color: ACCENT, fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.4 },
  clock: { color: '#fff', fontFamily: fonts.numHeavy, fontSize: 112, lineHeight: 114, fontVariant: ['tabular-nums'], marginTop: 6 },
  track: { width: '80%', height: 6, borderRadius: 3, backgroundColor: '#ffffff1f', marginTop: 18, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: ACCENT },
  total: { color: '#ffffff99', fontFamily: fonts.body, fontSize: 14, marginTop: 12 },
  next: { color: '#ffffffcc', fontFamily: fonts.bodyBold, fontSize: 15, marginTop: 22 },
  big: { color: '#fff', fontFamily: fonts.display, fontSize: 24, textAlign: 'center' },
  bottom: { gap: 10 },
  primary: { backgroundColor: ACCENT, borderRadius: 18, paddingVertical: 18, alignItems: 'center' },
  primaryText: { color: '#fff', fontFamily: fonts.display, fontSize: 18 },
  secondary: { borderRadius: 18, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ffffff33', marginTop: 4 },
  secondaryText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 15 },
  tip: { color: '#ffffff73', fontFamily: fonts.body, fontSize: 12.5, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
