import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { Appear } from '@/src/components/Appear';
import { Button } from '@/src/components/Button';
import { Icon, type AppIconName } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { Stamp } from '@/src/components/Stamp';
import { fonts, useTheme } from '@/src/theme';
import { durations, springs } from '@/src/theme/motion';
import { tierName } from '@/src/types/app';

type CelebrationResult = {
  skillName: string;
  xp_gained: number;
  xp_breakdown: { reason: string; amount: number }[];
  daily_cap_reached: boolean;
  just_landed: boolean;
  node_name: string | null;
  streak: number;
  shield_earned: boolean;
  tier_after: number;
  tier_up: boolean;
  level_after: number;
  level_up: boolean;
};

const COUNT_MS = 900;

/** Counts up to `target` with an ease-out, so the last few points land slowly. */
function useCountUp(target: number, enabled: boolean): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / COUNT_MS);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 4))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);
  return enabled ? value : target;
}

export default function CelebrationScreen() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const params = useLocalSearchParams<{ result?: string }>();
  let result: CelebrationResult | null = null;
  try {
    result = params.result ? (JSON.parse(params.result) as CelebrationResult) : null;
  } catch {
    result = null;
  }

  const xp = useCountUp(result?.xp_gained ?? 0, !reduceMotion);
  const pop = useSharedValue(reduceMotion ? 1 : 0.6);
  const fade = useSharedValue(0);
  useEffect(() => {
    pop.value = withSpring(1, springs.reward);
    fade.value = withTiming(1, { duration: durations.base });
  }, [pop, fade]);
  const heroStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: pop.value }] }));

  if (!result) {
    return (
      <Screen footer={<Button title="Done" size="lg" onPress={() => router.back()} />}>
        <View style={styles.center}>
          <View style={[styles.savedIcon, { backgroundColor: colors.accentSoft }]}>
            <Icon name="check" size={28} color={colors.accentStrong} weight="bold" />
          </View>
          <Text style={[styles.title, { color: colors.ink }]}>Session saved</Text>
        </View>
      </Screen>
    );
  }

  const highlights: { icon: AppIconName; text: string; tint: string }[] = [];
  if (result.just_landed && result.node_name) highlights.push({ icon: 'check-circle', text: `“${result.node_name}” landed on your tree`, tint: colors.good });
  if (result.streak > 1) highlights.push({ icon: 'flame', text: `${result.streak}-day streak`, tint: colors.flame });
  if (result.shield_earned) highlights.push({ icon: 'shield', text: 'Streak shield earned', tint: colors.accentStrong });
  if (result.level_up) highlights.push({ icon: 'sparkles', text: `Level ${result.level_after}`, tint: colors.gold });
  if (result.daily_cap_reached) highlights.push({ icon: 'moon', text: 'Daily XP cap reached. Go rest.', tint: colors.muted });

  const breakdown = result.xp_breakdown ?? [];

  return (
    <Screen scroll contentStyle={styles.content} footer={<Button title="Done" size="lg" onPress={() => router.back()} />}>
      <Animated.View style={[styles.hero, heroStyle]} accessibilityLabel={`Plus ${result.xp_gained} XP`}>
        <View style={styles.xpRow}>
          <Text style={[styles.xp, { color: colors.gold }]}>+{xp}</Text>
          <Text style={[styles.xpUnit, { color: colors.gold }]}>XP</Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.ink }]}>
          {result.skillName ? `${result.skillName} practice, banked.` : 'Practice, banked.'}
        </Text>
      </Animated.View>

      {result.tier_up ? (
        <Appear delay={350} style={styles.stampWrap}>
          <Stamp tier={tierName(result.tier_after)} skillName={result.skillName} size={132} />
          <Text style={[styles.stampLabel, { color: colors.gold }]}>New stamp: {tierName(result.tier_after)}</Text>
        </Appear>
      ) : null}

      {highlights.length > 0 ? (
        <View style={styles.highlights}>
          {highlights.map((h, i) => (
            <Appear key={h.text} delay={450 + i * 70}>
              <View style={[styles.highlight, { backgroundColor: colors.surface2 }]}>
                <Icon name={h.icon} filled size={18} color={h.tint} />
                <Text style={[styles.highlightText, { color: colors.ink }]}>{h.text}</Text>
              </View>
            </Appear>
          ))}
        </View>
      ) : null}

      {breakdown.length > 0 ? (
        <Appear delay={500 + highlights.length * 70} style={styles.breakdown}>
          <Text style={[styles.breakdownTitle, { color: colors.muted }]}>Where it came from</Text>
          {breakdown.map((b, i) => (
            <View key={i} style={[styles.line, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
              <Text style={[styles.lineReason, { color: colors.ink }]} numberOfLines={1}>
                {b.reason}
              </Text>
              <Text style={[styles.lineAmount, { color: colors.ink }]}>+{b.amount}</Text>
            </View>
          ))}
        </Appear>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  savedIcon: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 26, letterSpacing: -0.8 },
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: 32 },
  hero: { alignItems: 'center' },
  xpRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  xp: { fontFamily: fonts.numHeavy, fontSize: 96, lineHeight: 98, fontVariant: ['tabular-nums'] },
  xpUnit: { fontFamily: fonts.num, fontSize: 36 },
  subtitle: { fontFamily: fonts.display, fontSize: 19, letterSpacing: -0.4, marginTop: 4, textAlign: 'center' },
  stampWrap: { alignItems: 'center', marginTop: 26, gap: 10 },
  stampLabel: { fontFamily: fonts.bodyBold, fontSize: 14 },
  highlights: { marginTop: 28, gap: 8 },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingHorizontal: 14, minHeight: 48, paddingVertical: 10 },
  highlightText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14.5, letterSpacing: -0.15 },
  breakdown: { marginTop: 24 },
  breakdownTitle: { fontFamily: fonts.bodyMedium, fontSize: 12.5, marginBottom: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 40 },
  lineReason: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, letterSpacing: -0.1 },
  lineAmount: { fontFamily: fonts.num, fontSize: 18, fontVariant: ['tabular-nums'] },
});
