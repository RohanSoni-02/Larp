import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Icon } from '@/src/components/Icon';
import { Skeleton } from '@/src/components/Skeleton';
import { Screen } from '@/src/components/Screen';
import { TierPill } from '@/src/components/TierPill';
import { useSession } from '@/src/features/auth/SessionProvider';
import { acceptInvite, getInvitePreview } from '@/src/features/invite/api';
import { useMyProfile } from '@/src/features/profile/hooks';
import { queryClient } from '@/src/lib/queryClient';
import { useInviteStore } from '@/src/stores/invite';
import { useOnboardingStore } from '@/src/stores/onboarding';
import { useUiStore } from '@/src/stores/ui';
import { fonts, useTheme } from '@/src/theme';
import { tierName } from '@/src/types/app';

export default function InviteScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ from?: string; skill?: string }>();
  const { session } = useSession();
  const meId = session?.user?.id;
  const { data: profile } = useMyProfile(meId);
  const pending = useInviteStore((s) => s.pending);
  const setPending = useInviteStore((s) => s.setPending);

  const invite = params.from ? { from: params.from, skill: params.skill ?? null } : pending;

  useEffect(() => {
    if (params.from) setPending({ from: params.from, skill: params.skill ?? null });
  }, [params.from, params.skill, setPending]);

  const { data: preview, isLoading } = useQuery({
    queryKey: ['invite-preview', invite?.from, invite?.skill],
    enabled: Boolean(invite),
    queryFn: () => getInvitePreview(invite!),
  });

  const accept = useMutation({
    mutationFn: () => acceptInvite(meId!, invite!),
    onSuccess: ({ skillId }) => {
      setPending(null);
      if (skillId) useUiStore.getState().setTreeSkillId(skillId);
      void queryClient.invalidateQueries();
      router.replace('/(tabs)/trees');
    },
    onError: (e) => Alert.alert('Could not accept', e instanceof Error ? e.message : 'Try again.'),
  });

  /** Pre-pick the skill + inviter so onboarding starts where the link pointed. */
  const prefillOnboarding = () => {
    const ob = useOnboardingStore.getState();
    if (preview?.skill && !ob.selectedSkillIds.includes(preview.skill.id)) ob.toggleSkill(preview.skill.id);
    if (preview?.inviter && !ob.followUserIds.includes(preview.inviter.id)) ob.toggleFollow(preview.inviter.id);
  };

  const onboarded = Boolean(profile?.onboarded_at);
  const isSelf = preview?.inviter?.id === meId;
  const accent = preview?.skill?.color ?? colors.primary;

  return (
    <Screen scroll contentStyle={{ paddingTop: 30 }}>
      {!invite ? (
        <EmptyState
          icon="ticket"
          title="This invite link is incomplete"
          body="Ask your friend to send it again."
          action={<Button title="Back to Larping" variant="secondary" size="sm" onPress={() => router.replace('/')} />}
        />
      ) : isLoading ? (
        <View style={{ gap: 14, marginTop: 30 }} accessibilityLabel="Loading invite">
          <Skeleton height={230} radius={28} />
          <Skeleton height={56} radius={28} />
        </View>
      ) : (
        <>
          <View style={styles.kickerRow}>
            <Icon name="ticket" size={14} color={colors.accentStrong} />
            <Text style={[styles.kicker, { color: colors.accentStrong }]}>YOU’RE INVITED</Text>
          </View>
          <Card variant="raised" style={styles.hero}>
            {preview?.inviter ? (
              <>
                <Avatar name={preview.inviter.name} color={preview.inviter.color} size={72} />
                <Text style={[styles.name, { color: colors.ink }]}>{preview.inviter.name}</Text>
                <Text style={[styles.meta, { color: colors.muted }]}>
                  @{preview.inviter.handle}
                  {preview.inviter.classTitle ? ` · ${preview.inviter.classTitle}` : ''}
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.friend, { backgroundColor: colors.accentSoft }]}>
                  <Icon name="people" size={28} color={colors.accentStrong} />
                </View>
                <Text style={[styles.name, { color: colors.ink }]}>A friend invited you</Text>
                <Text style={[styles.meta, { color: colors.muted }]}>Come practise on Larping.</Text>
              </>
            )}
            {preview?.skill ? (
              <View style={[styles.skill, { backgroundColor: `${accent}1F` }]}>
                <Text style={[styles.skillLabel, { color: colors.muted }]}>Starter skill</Text>
                <Text style={[styles.skillName, { color: colors.ink }]}>{preview.skill.name}</Text>
                {preview.skill.inviterTier !== null ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <Text style={[styles.meta, { color: colors.muted, marginTop: 0 }]}>
                      {preview.inviter?.name.split(' ')[0]} is
                    </Text>
                    <TierPill tier={tierName(preview.skill.inviterTier)} showDayOne={false} />
                  </View>
                ) : null}
                {preview.skill.blurb ? (
                  <Text style={[styles.blurb, { color: colors.muted }]}>{preview.skill.blurb}</Text>
                ) : null}
              </View>
            ) : null}
          </Card>

          <Text style={[styles.pitch, { color: colors.ink }]}>
            Log practice, land skill-tree nodes, and level up together. Accepting follows{' '}
            {preview?.inviter?.name.split(' ')[0] ?? 'them'}
            {preview?.skill ? ` and adds ${preview.skill.name} to your trees.` : '.'}
          </Text>

          <View style={{ gap: 10, marginTop: 18 }}>
            {!session ? (
              <>
                <Button
                  size="lg"
                  title="Join Larping"
                  onPress={() => {
                    prefillOnboarding();
                    router.replace('/welcome');
                  }}
                />
                <Button
                  title="I already have an account"
                  variant="ghost"
                  onPress={() => {
                    prefillOnboarding();
                    router.replace('/sign-in');
                  }}
                />
              </>
            ) : !onboarded ? (
              <Button
                size="lg"
                title="Continue setup"
                onPress={() => {
                  prefillOnboarding();
                  router.replace('/onboarding');
                }}
              />
            ) : isSelf ? (
              <>
                <Text style={[styles.meta, { color: colors.muted, textAlign: 'center' }]}>
                  This is your own invite. Share it with a friend.
                </Text>
                <Button title="Back to Larping" variant="secondary" onPress={() => router.replace('/')} />
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  title={preview?.skill ? `Accept and start ${preview.skill.name}` : 'Accept invite'}
                  onPress={() => accept.mutate()}
                  loading={accept.isPending}
                />
                <Button
                  title="Not now"
                  variant="ghost"
                  onPress={() => {
                    setPending(null);
                    router.replace('/');
                  }}
                />
              </>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 1.4 },
  hero: { alignItems: 'center', marginTop: 16, paddingVertical: 28, borderRadius: 28 },
  friend: { width: 72, height: 72, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.displayHeavy, fontSize: 25, letterSpacing: -0.8, marginTop: 12 },
  meta: { fontFamily: fonts.body, fontSize: 14, marginTop: 2 },
  skill: { alignSelf: 'stretch', borderRadius: 16, padding: 14, marginTop: 18, marginHorizontal: 4 },
  skillLabel: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15 },
  skillName: { fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.5, marginTop: 2 },
  blurb: { fontFamily: fonts.body, fontSize: 13.5, marginTop: 8, lineHeight: 19 },
  pitch: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, marginTop: 20, textAlign: 'center', paddingHorizontal: 8 },
});
