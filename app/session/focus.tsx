import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, Vibration, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
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
  const { width } = useWindowDimensions();

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
        <StatusBar style="light" />
        <View style={styles.center}>
          <Text style={styles.big}>No session running</Text>
          <Text style={styles.total}>Start a session first, then come back here to lock in.</Text>
        </View>
        <PressableScale onPress={() => router.back()} style={[styles.secondary, { marginBottom: insets.bottom + 20 }]} accessibilityRole="button">
          <Text style={styles.secondaryText}>Back</Text>
        </PressableScale>
      </View>
    );
  }

  const main = pos && !pos.done ? pos.remainingSec : elapsed;
  const ring = Math.min(1, pos ? (pos.done ? 1 : pos.progress) : (elapsed % 3600) / 3600);
  const size = Math.min(width - 56, 320);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <StatusBar style="light" />
      <View style={styles.top}>
        <PressableScale onPress={() => router.back()} scale={0.9} hitSlop={10} accessibilityRole="button" accessibilityLabel="Leave focus mode" style={styles.exit}>
          <Icon name="chevron-down" size={18} color="#FFFFFF" weight="semibold" />
        </PressableScale>
        <Text style={styles.topMeta}>{plan ? plan.name : 'Free practice'}</Text>
        <View style={styles.exitSpacer} />
      </View>

      <View style={styles.center}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
            <Svg width={size} height={size}>
              <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={stroke} />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={ACCENT}
                strokeOpacity={running ? 1 : 0.45}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={circumference * (1 - ring)}
              />
            </Svg>
          </View>
          <Text style={styles.blockName}>
            {pos ? (pos.done ? 'Plan complete' : pos.block.label) : running ? 'Practising' : 'Paused'}
          </Text>
          <Text style={[styles.clock, !running && { opacity: 0.45 }]} accessibilityRole="timer">
            {formatClock(main)}
          </Text>
          <Text style={styles.total}>Total {formatClock(elapsed)}</Text>
        </View>
        {pos?.next ? (
          <Text style={styles.next}>
            Up next: {pos.next.label} · {pos.next.minutes} min
          </Text>
        ) : null}
      </View>

      <View style={styles.bottom}>
        <PressableScale
          onPress={toggle}
          scale={0.975}
          style={[styles.primary, !running && { backgroundColor: '#fff' }]}
          accessibilityRole="button"
          accessibilityLabel={running ? 'Pause' : 'Resume'}
        >
          <Icon name={running ? 'pause' : 'play'} size={18} color={running ? '#FFFFFF' : BG} />
          <Text style={[styles.primaryText, !running && { color: BG }]}>{running ? 'Pause' : 'Resume'}</Text>
        </PressableScale>
        <PressableScale onPress={() => router.back()} scale={0.975} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>Finish and save</Text>
        </PressableScale>
        <Text style={styles.tip}>Turn on Do Not Disturb. We’ll still buzz you at the end of each block.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingHorizontal: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exit: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff14', alignItems: 'center', justifyContent: 'center' },
  exitSpacer: { width: 40 },
  topMeta: { color: '#ffffff99', fontFamily: fonts.bodyBold, fontSize: 14.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blockName: { color: ACCENT, fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.3 },
  clock: { color: '#fff', fontFamily: fonts.numHeavy, fontSize: 96, lineHeight: 98, fontVariant: ['tabular-nums'], marginTop: 2 },
  total: { color: '#ffffff99', fontFamily: fonts.body, fontSize: 14, marginTop: 6, textAlign: 'center' },
  next: { color: '#ffffffcc', fontFamily: fonts.bodyBold, fontSize: 15, marginTop: 22 },
  big: { color: '#fff', fontFamily: fonts.displayHeavy, fontSize: 26, letterSpacing: -0.7, textAlign: 'center' },
  bottom: { gap: 10 },
  primary: { flexDirection: 'row', gap: 8, backgroundColor: ACCENT, borderRadius: 999, height: 60, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 17, letterSpacing: -0.2 },
  secondary: { borderRadius: 999, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff14' },
  secondaryText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 15 },
  tip: { color: '#ffffff73', fontFamily: fonts.body, fontSize: 12.5, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
