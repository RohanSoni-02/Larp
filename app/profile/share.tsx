import { router } from 'expo-router';
import { Share, StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/src/components/Appear';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import { useMyProfile } from '@/src/features/profile/hooks';
import { usePortfolio } from '@/src/features/trees/hooks';
import { levelFromXp } from '@/src/gamification/levels';
import { formatDuration } from '@/src/lib/format';
import { fonts, tierMetal, useTheme } from '@/src/theme';
import { tierName } from '@/src/types/app';

/** Shareable profile card (screenshot it, or use the share sheet for text). */
export default function ShareCardScreen() {
  const { colors, elevation } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;
  const { data: profile } = useMyProfile(userId);
  const { data: portfolio } = usePortfolio(userId);

  if (!profile) return null;
  const level = levelFromXp(profile.xp_total);
  const top = (portfolio ?? []).slice(0, 3);

  const shareText = () => {
    void Share.share({
      message: `I'm level ${level.level} on Larping${top.length > 0 ? ` — ${top.map((p) => `${p.skills.name} (${tierName(p.tier)})`).join(', ')}` : ''}. Come practice with me: @${profile.handle}`,
    });
  };

  return (
    <Screen
      header={<NavBar title="Share profile" onClose={() => router.back()} />}
      footer={<Button title="Share" icon="share-up" size="lg" onPress={shareText} />}
    >
      <View style={styles.center}>
        <Appear style={styles.cardWrap}>
          <View style={[styles.card, elevation.float, { backgroundColor: colors.night }]}>
            <View style={styles.cardRow}>
              <Avatar name={profile.display_name} color={profile.avatar_color} size={60} />
              <View style={styles.cardIdentity}>
                <Text style={[styles.cardName, { color: colors.nightInk }]} numberOfLines={1}>
                  {profile.display_name}
                </Text>
                <Text style={[styles.cardHandle, { color: colors.nightMuted }]} numberOfLines={1}>
                  @{profile.handle}
                </Text>
              </View>
              <View style={styles.level}>
                <Text style={[styles.levelNum, { color: colors.nightInk }]}>{level.level}</Text>
                <Text style={[styles.levelLabel, { color: colors.nightMuted }]}>LEVEL</Text>
              </View>
            </View>

            {top.length > 0 ? (
              <View style={[styles.skills, { borderTopColor: colors.nightLine }]}>
                {top.map((p) => (
                  <View key={p.skill_id} style={styles.skillRow}>
                    <View style={[styles.skillDot, { backgroundColor: p.skills.color }]} />
                    <Text style={[styles.skillName, { color: colors.nightInk }]} numberOfLines={1}>
                      {p.skills.name}
                    </Text>
                    <Text style={[styles.skillTime, { color: colors.nightMuted }]}>{formatDuration(p.total_minutes * 60)}</Text>
                    <View style={[styles.tier, { borderColor: tierMetal[p.tier] ?? tierMetal[0] }]}>
                      <Text style={[styles.tierText, { color: colors.nightInk }]}>{tierName(p.tier)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.cardFoot}>
              <View style={[styles.logo, { backgroundColor: colors.accent }]}>
                <Text style={[styles.logoText, { color: colors.accentInk }]}>L</Text>
              </View>
              <Text style={[styles.footText, { color: colors.nightMuted }]}>larping · get good at things, together</Text>
            </View>
          </View>
        </Appear>
        <View style={styles.tip}>
          <Icon name="camera" size={14} color={colors.subtle} />
          <Text style={[styles.tipText, { color: colors.subtle }]}>Screenshot the card, or share a link as text.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { width: '100%' },
  card: { borderRadius: 28, padding: 22, gap: 20 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardIdentity: { flex: 1, minWidth: 0 },
  cardName: { fontFamily: fonts.displayHeavy, fontSize: 23, letterSpacing: -0.7 },
  cardHandle: { fontFamily: fonts.body, fontSize: 14, marginTop: 2 },
  level: { alignItems: 'center' },
  levelNum: { fontFamily: fonts.numHeavy, fontSize: 40, lineHeight: 40, fontVariant: ['tabular-nums'] },
  levelLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1 },
  skills: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 12 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skillDot: { width: 10, height: 10, borderRadius: 5 },
  skillName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15.5, letterSpacing: -0.2 },
  skillTime: { fontFamily: fonts.num, fontSize: 17, fontVariant: ['tabular-nums'] },
  tier: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 10, height: 24, justifyContent: 'center' },
  tierText: { fontFamily: fonts.bodyBold, fontSize: 11.5 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: fonts.numHeavy, fontSize: 15, lineHeight: 18 },
  footText: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  tipText: { fontFamily: fonts.body, fontSize: 13 },
});
