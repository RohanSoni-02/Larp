import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { Appear } from '@/src/components/Appear';
import { Art } from '@/src/components/Art';
import { Button } from '@/src/components/Button';
import { Icon, type AppIconName } from '@/src/components/Icon';
import { Scrim } from '@/src/components/Scrim';
import { Screen } from '@/src/components/Screen';
import { Wordmark } from '@/src/components/Wordmark';
import { fonts, useTheme } from '@/src/theme';
import { springs } from '@/src/theme/motion';

const PILLARS: { icon: AppIconName; title: string; body: string }[] = [
  { icon: 'camera', title: 'Proof', body: 'Sessions make practice verifiable: time, photos, short clips.' },
  { icon: 'trending', title: 'Progress', body: 'Hours, streaks and skill trees make invisible progress visible.' },
  { icon: 'people', title: 'People', body: 'A community that actually understands your craft.' },
];

const CARD_W = 132;
const CARD_H = 178;

/** Where each proof card comes to rest once the stack fans out. */
const FAN = [
  { x: -100, y: 18, rotate: -9 },
  { x: 100, y: 18, rotate: 9 },
  { x: 0, y: 0, rotate: 0 },
] as const;

function ProofCard({
  index,
  color,
  seed,
  skill,
  alignEnd = false,
  children,
}: {
  index: number;
  color: string;
  seed: string;
  skill: string;
  /** Content hugs the right edge (the card whose left half is covered). */
  alignEnd?: boolean;
  children: ReactNode;
}) {
  const { colors, elevation } = useTheme();
  const reduceMotion = useReducedMotion();
  const fan = useSharedValue(reduceMotion ? 1 : 0);
  const rest = FAN[index]!;

  useEffect(() => {
    if (reduceMotion) return;
    fan.value = withDelay(180 + index * 70, withSpring(1, springs.reward));
  }, [fan, index, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rest.x * fan.value },
      { translateY: rest.y * fan.value },
      { rotate: `${rest.rotate * fan.value}deg` },
      { scale: 0.92 + 0.08 * fan.value },
    ],
  }));

  return (
    <Animated.View style={[styles.card, elevation.float, { borderColor: colors.bg, backgroundColor: color }, animatedStyle]}>
      <View style={styles.cardClip}>
        <Art seed={seed} color={color} quality={0.8} aspectRatio={CARD_W / CARD_H} style={StyleSheet.absoluteFill} />
        <Scrim extent={0.7} opacity={0.55} />
        <View style={[styles.cardSkill, alignEnd && styles.cardSkillEnd]}>
          <Text style={styles.cardSkillText}>{skill}</Text>
        </View>
        <View style={[styles.cardFoot, alignEnd && styles.cardFootEnd]}>{children}</View>
      </View>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const roomy = height >= 740;

  return (
    <Screen contentStyle={styles.content}>
      <Appear>
        <Wordmark />
      </Appear>

      <View style={styles.hero} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.stack}>
          <ProofCard index={0} color="#C2703D" seed="welcome-pottery" skill="Pottery">
            <Text style={styles.cardNum}>80</Text>
            <Text style={styles.cardUnit}>min today</Text>
          </ProofCard>
          <ProofCard index={1} color="#1F9D74" seed="welcome-climb" skill="Bouldering" alignEnd>
            <View style={styles.cardRow}>
              <Icon name="check-circle" filled size={15} color="#FFFFFF" />
              <Text style={styles.cardLanded}>Landed</Text>
            </View>
            <Text style={styles.cardUnit}>Heel hooks</Text>
          </ProofCard>
          <ProofCard index={2} color={colors.primary} seed="welcome-piano" skill="Piano">
            <View style={styles.cardRow}>
              <Icon name="flame" filled size={22} color="#FFB347" />
              <Text style={styles.cardNum}>12</Text>
            </View>
            <Text style={styles.cardUnit}>day streak</Text>
          </ProofCard>
        </View>
      </View>

      <Appear delay={120}>
        <Text style={[styles.headline, { color: colors.ink }]} accessibilityRole="header">
          Everyone starts{'\n'}out larping.
        </Text>
        <Text style={[styles.lede, { color: colors.muted }]}>
          This is where you stop pretending. A Strava for skills: log practice, prove it, watch the hours add up.
        </Text>
      </Appear>

      {roomy ? (
        <Appear delay={200} style={styles.pillars}>
          {PILLARS.map((p) => (
            <View key={p.title} style={styles.pillar}>
              <View style={[styles.pillarIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name={p.icon} size={18} color={colors.accentStrong} />
              </View>
              <View style={styles.pillarText}>
                <Text style={[styles.pillarTitle, { color: colors.ink }]}>{p.title}</Text>
                <Text style={[styles.pillarBody, { color: colors.muted }]}>{p.body}</Text>
              </View>
            </View>
          ))}
        </Appear>
      ) : null}

      <Appear delay={280} style={styles.cta}>
        <Button title="Start larping" size="lg" onPress={() => router.push('/sign-in')} />
        <Text style={[styles.fine, { color: colors.subtle }]}>
          Piano, pottery, pen spinning. If you can practise it, you can larp it.
        </Text>
      </Appear>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 12 },
  hero: { flex: 1, minHeight: 190, alignItems: 'center', justifyContent: 'center' },
  stack: { width: CARD_W, height: CARD_H },
  card: { position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: 24, borderWidth: 3 },
  cardClip: { flex: 1, borderRadius: 21, overflow: 'hidden' },
  cardSkill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 999,
    paddingHorizontal: 9,
    height: 22,
    justifyContent: 'center',
  },
  cardSkillText: { color: '#FFFFFF', fontFamily: fonts.bodyBold, fontSize: 11.5 },
  cardSkillEnd: { left: 'auto', right: 10 },
  cardFoot: { position: 'absolute', left: 12, right: 12, bottom: 11 },
  cardFootEnd: { alignItems: 'flex-end' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardNum: { color: '#FFFFFF', fontFamily: fonts.numHeavy, fontSize: 40, lineHeight: 40, fontVariant: ['tabular-nums'] },
  cardLanded: { color: '#FFFFFF', fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.4 },
  cardUnit: { color: 'rgba(255,255,255,0.9)', fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 2 },
  headline: { fontFamily: fonts.displayHeavy, fontSize: 38, lineHeight: 40, letterSpacing: -1.4 },
  lede: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, letterSpacing: -0.15, marginTop: 12, maxWidth: 340 },
  pillars: { marginTop: 24, gap: 14 },
  pillar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillarIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pillarText: { flex: 1 },
  pillarTitle: { fontFamily: fonts.bodyBold, fontSize: 15, letterSpacing: -0.2 },
  pillarBody: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 18, marginTop: 1 },
  cta: { marginTop: 28, gap: 12, paddingBottom: 4 },
  fine: { fontFamily: fonts.body, fontSize: 12.5, textAlign: 'center' },
});
