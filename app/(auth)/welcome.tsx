import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { fonts, useTheme } from '@/src/theme';

const PILLARS = [
  { title: 'Proof', body: 'Sessions make practice verifiable — time, photos, short clips.' },
  { title: 'Progress', body: 'Hours, streaks and skill trees make invisible progress visible.' },
  { title: 'People', body: 'A community that actually understands your craft.' },
] as const;

export default function WelcomeScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.wordmark, { color: colors.primary }]}>larping</Text>
        <Text style={[styles.tagline, { color: colors.ink }]}>A Strava for skills.</Text>
        <Text style={[styles.slang, { color: colors.muted }]}>
          Everyone starts out larping.{'\n'}This is where you stop pretending.
        </Text>
      </View>

      <View style={styles.pillars}>
        {PILLARS.map((p) => (
          <View key={p.title} style={styles.pillar}>
            <Text style={[styles.pillarTitle, { color: colors.ink }]}>{p.title}</Text>
            <Text style={[styles.pillarBody, { color: colors.muted }]}>{p.body}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cta}>
        <Link href="/sign-in" asChild>
          <Button title="Start larping" onPress={() => {}} />
        </Link>
        <Text style={[styles.fine, { color: colors.muted }]}>
          Piano, pottery, pen spinning — if you can practise it, you can larp it.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: 48, gap: 12 },
  wordmark: { fontFamily: fonts.displayHeavy, fontSize: 52, letterSpacing: -1.5 },
  tagline: { fontFamily: fonts.display, fontSize: 24 },
  slang: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, marginTop: 8 },
  pillars: { marginTop: 36, gap: 18 },
  pillar: { gap: 2 },
  pillarTitle: { fontFamily: fonts.display, fontSize: 18 },
  pillarBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  cta: { marginTop: 'auto', gap: 12, paddingBottom: 12 },
  fine: { fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
});
