import { router } from 'expo-router';
import { Share, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Stamp } from '@/src/components/Stamp';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import { useMyProfile } from '@/src/features/profile/hooks';
import { usePortfolio } from '@/src/features/trees/hooks';
import { levelFromXp } from '@/src/gamification/levels';
import { fonts, useTheme } from '@/src/theme';
import { tierName } from '@/src/types/app';

/** Shareable profile card (screenshot it, or use the share sheet for text). */
export default function ShareCardScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;
  const { data: profile } = useMyProfile(userId);
  const { data: portfolio } = usePortfolio(userId);

  if (!profile) return null;
  const level = levelFromXp(profile.xp_total);
  const top = (portfolio ?? []).slice(0, 2);

  const shareText = () => {
    void Share.share({
      message: `I'm level ${level.level} on Larping${top.length > 0 ? ` — ${top.map((p) => `${p.skills.name} (${tierName(p.tier)})`).join(', ')}` : ''}. Come practice with me: @${profile.handle}`,
    });
  };

  return (
    <Screen>
      <Button title="Close" variant="ghost" size="sm" onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <View style={styles.center}>
        <View style={[styles.card, { backgroundColor: colors.primary }]}>
          <View style={styles.cardRow}>
            <Avatar name={profile.display_name} color={profile.avatar_color} size={54} />
            <View>
              <Text style={styles.cardName}>{profile.display_name}</Text>
              <Text style={styles.cardHandle}>@{profile.handle} · Level {level.level} Larper</Text>
            </View>
          </View>
          <View style={styles.stamps}>
            {top.map((p) => (
              <Stamp key={p.skill_id} tier={tierName(p.tier)} skillName={p.skills.name} size={92} />
            ))}
          </View>
          <Text style={styles.cardFoot}>Larping — get good at things, together</Text>
        </View>
        <Button title="Share" onPress={shareText} style={{ marginTop: 24, minWidth: 200 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', borderRadius: 24, padding: 22, gap: 18 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardName: { color: '#fff', fontFamily: fonts.displayHeavy, fontSize: 22 },
  cardHandle: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.body, fontSize: 13.5, marginTop: 2 },
  stamps: { flexDirection: 'row', gap: 14, justifyContent: 'center', paddingVertical: 6 },
  cardFoot: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
});
