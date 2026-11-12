import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
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
        <Text style={[styles.title, { color: colors.ink }]}>This invite link is incomplete.</Text>
      ) : isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} />
      ) : (
        <>
          <Text style={[styles.kicker, { color: accent }]}>YOU’RE INVITED</Text>
          <Card variant="raised" style={[styles.hero, { borderColor: accent }]}>
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
              <Text style={[styles.meta, { color: colors.muted }]}>A friend invited you to Larping.</Text>
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
                title="Continue setup"
                onPress={() => {
                  prefillOnboarding();
                  router.replace('/onboarding');
                }}
              />
            ) : isSelf ? (
              <>
                <Text style={[styles.meta, { color: colors.muted, textAlign: 'center' }]}>
                  This is your own invite — share it with a friend.
                </Text>
                <Button title="Back to Larping" variant="secondary" onPress={() => router.replace('/')} />
              </>
            ) : (
              <>
                <Button
                  title={preview?.skill ? `Accept & start ${preview.skill.name}` : 'Accept invite'}
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
  kicker: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 1.4, textAlign: 'center' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 26, textAlign: 'center', marginTop: 40 },
  hero: { alignItems: 'center', marginTop: 14, paddingVertical: 24, borderWidth: 2 },
  name: { fontFamily: fonts.displayHeavy, fontSize: 24, marginTop: 10 },
  meta: { fontFamily: fonts.body, fontSize: 14, marginTop: 2 },
  skill: { alignSelf: 'stretch', borderRadius: 16, padding: 14, marginTop: 18, marginHorizontal: 4 },
  skillLabel: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15 },
  skillName: { fontFamily: fonts.display, fontSize: 22, marginTop: 2 },
  blurb: { fontFamily: fonts.body, fontSize: 13.5, marginTop: 8, lineHeight: 19 },
  pitch: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, marginTop: 18, textAlign: 'center' },
});
