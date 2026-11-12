import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { Stamp } from '@/src/components/Stamp';
import { fonts, useTheme } from '@/src/theme';
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

export default function CelebrationScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ result?: string }>();
  let result: CelebrationResult | null = null;
  try {
    result = params.result ? (JSON.parse(params.result) as CelebrationResult) : null;
  } catch {
    result = null;
  }

  const [scale] = useState(() => new Animated.Value(0.3));
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 9, stiffness: 120 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  if (!result) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.ink }]}>Session saved</Text>
          <Button title="Done" onPress={() => router.back()} style={{ marginTop: 18 }} />
        </View>
      </Screen>
    );
  }

  const notes: string[] = [];
  if (result.just_landed && result.node_name) notes.push(`“${result.node_name}” landed on your tree`);
  if (result.streak > 1) notes.push(`${result.streak}-day streak`);
  if (result.shield_earned) notes.push('Streak shield earned');
  if (result.level_up) notes.push(`Level ${result.level_after}`);
  if (result.daily_cap_reached) notes.push('Daily XP cap reached — go rest');

  return (
    <Screen>
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale }], opacity, alignItems: 'center' }}>
          <Text style={[styles.xp, { color: colors.gold }]}>+{result.xp_gained} XP</Text>
          <Text style={[styles.subtitle, { color: colors.ink }]}>
            {result.skillName ? `${result.skillName} practice, banked.` : 'Practice, banked.'}
          </Text>

          {result.tier_up ? (
            <View style={styles.stampWrap}>
              <Stamp tier={tierName(result.tier_after)} skillName={result.skillName} size={132} />
              <Text style={[styles.stampLabel, { color: colors.gold }]}>New stamp: {tierName(result.tier_after)}</Text>
            </View>
          ) : null}

          <View style={styles.notes}>
            {result.xp_breakdown?.map((b, i) => (
              <Text key={i} style={[styles.note, { color: colors.muted }]}>
                +{b.amount} · {b.reason}
              </Text>
            ))}
            {notes.map((n) => (
              <Text key={n} style={[styles.note, { color: colors.ink }]}>
                {n}
              </Text>
            ))}
          </View>
        </Animated.View>

        <Button title="Done" onPress={() => router.back()} style={styles.cta} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 26 },
  xp: { fontFamily: fonts.numHeavy, fontSize: 88, lineHeight: 90, fontVariant: ['tabular-nums'] },
  subtitle: { fontFamily: fonts.bodyBold, fontSize: 17, marginTop: 6 },
  stampWrap: { alignItems: 'center', marginTop: 22, gap: 10 },
  stampLabel: { fontFamily: fonts.bodyBold, fontSize: 14 },
  notes: { alignItems: 'center', marginTop: 22, gap: 6 },
  note: { fontFamily: fonts.body, fontSize: 14 },
  cta: { marginTop: 26, minWidth: 200 },
});
