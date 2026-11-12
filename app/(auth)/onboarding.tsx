import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

import SphereImageGrid from '@/components/ui/img-sphere';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Chip } from '@/src/components/Chip';
import { Field } from '@/src/components/Field';
import { NavAction, NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import { acceptInvite } from '@/src/features/invite/api';
import { useCompleteOnboarding, useMyProfile, useSuggestedPeople } from '@/src/features/profile/hooks';
import { useSkillGroups } from '@/src/features/skills/hooks';
import { buildCatalogSphereImages } from '@/src/features/skills/skillImages';
import { deviceTimezone } from '@/src/lib/timezone';
import { useInviteStore } from '@/src/stores/invite';
import { useOnboardingStore } from '@/src/stores/onboarding';
import { fonts, GUTTER, useTheme } from '@/src/theme';

const STEPS = ['Your name', 'Your skills', 'Your people', 'Your reminder'] as const;

const REMINDER_OPTIONS = [
  { label: 'Morning · 8:00', value: '08:00' },
  { label: 'Lunch · 12:00', value: '12:00' },
  { label: 'Evening · 18:00', value: '18:00' },
  { label: 'Night · 21:00', value: '21:00' },
] as const;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;
  const { data: profile } = useMyProfile(userId);
  const [step, setStep] = useState(0);

  const store = useOnboardingStore();
  const pendingInvite = useInviteStore((s) => s.pending);
  const { groups } = useSkillGroups();
  const { data: suggestions = [] } = useSuggestedPeople(store.selectedSkillIds, userId);
  const complete = useCompleteOnboarding();

  const nameReady = useMemo(
    () => (store.displayName || profile?.display_name || '').trim().length >= 2,
    [store.displayName, profile?.display_name],
  );

  const onboardingSphereImages = useMemo(() => {
    const allSkills = groups.flatMap((g) => g.skills);
    return buildCatalogSphereImages(
      allSkills.map((skill) => {
        const isSelected = store.selectedSkillIds.includes(skill.id);
        return {
          id: skill.id,
          name: skill.name,
          category: skill.category,
          color: skill.color,
          description: skill.blurb ?? `Track and prove your ${skill.name.toLowerCase()} progress.`,
          actionLabel: isSelected ? 'Remove from my skills' : 'Select this skill',
          onAction: () => store.toggleSkill(skill.id),
        };
      }),
      24,
    );
  }, [groups, store]);

  const canContinue =
    step === 0 ? nameReady : step === 1 ? store.selectedSkillIds.length > 0 : true;

  async function scheduleReminder(time: string | null): Promise<void> {
    if (!time) return;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const [hour, minute] = time.split(':').map((n) => parseInt(n, 10));
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to practise',
          body: 'A few minutes counts. Start a session and keep the streak alive.',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    } catch {
      // Reminders are best-effort on emulators; never block onboarding.
    }
  }

  async function finish() {
    if (!userId) return;
    try {
      await complete.mutateAsync({
        userId,
        displayName: (store.displayName || profile?.display_name || '').trim(),
        timezone: deviceTimezone(),
        reminderTime: store.reminderTime,
        skillIds: store.selectedSkillIds,
        followUserIds: store.followUserIds,
      });
      await scheduleReminder(store.reminderTime);
      const invite = useInviteStore.getState().pending;
      if (invite) {
        try {
          await acceptInvite(userId, invite);
        } catch {
          // Invite extras are a bonus; never block finishing setup.
        }
        useInviteStore.getState().setPending(null);
      }
      store.reset();
      router.replace('/');
    } catch (error) {
      Alert.alert('Could not finish setup', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      header={
        <View>
          <NavBar
            onBack={step > 0 ? () => setStep(step - 1) : undefined}
            right={step === 2 ? <NavAction label="Skip" tone="muted" onPress={() => setStep(3)} /> : null}
          />
          <View
            style={styles.progress}
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
          >
            {STEPS.map((name, i) => (
              <View key={name} style={[styles.progressSeg, { backgroundColor: i <= step ? colors.accent : colors.surface3 }]} />
            ))}
          </View>
        </View>
      }
      footer={
        <Button
          title={step === STEPS.length - 1 ? 'Start larping' : 'Continue'}
          size="lg"
          loading={complete.isPending}
          disabled={!canContinue}
          onPress={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
        />
      }
    >
      {pendingInvite ? (
        <View style={[styles.inviteBanner, { backgroundColor: colors.primarySoft }]}>
          <Icon name="ticket" size={18} color={colors.accentStrong} />
          <Text style={[styles.inviteText, { color: colors.ink }]}>
            Invited by @{pendingInvite.from}
            {pendingInvite.skill ? '. Their skill is pre-picked for you.' : ''}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.stepLabel, { color: colors.muted }]}>
        Step {step + 1} of {STEPS.length}
      </Text>

      {step === 0 && (
        <View style={styles.step}>
          <Text style={[styles.title, { color: colors.ink }]}>What should we call you?</Text>
          <Field
            label="Display name"
            value={store.displayName || profile?.display_name || ''}
            onChangeText={store.setDisplayName}
            placeholder="e.g. Jordan M."
            autoComplete="name"
          />
        </View>
      )}

      {step === 1 && (
        <View style={styles.step}>
          <Text style={[styles.title, { color: colors.ink }]}>What are you learning?</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            Pick at least one — or spin the 3D skill sphere to explore multiple skills.
          </Text>
          {onboardingSphereImages.length > 0 ? (
            <Card style={{ alignItems: 'center', overflow: 'hidden' }}>
              <SphereImageGrid
                images={onboardingSphereImages}
                containerSize={280}
                sphereRadius={110}
                dragSensitivity={0.75}
                baseImageScale={0.15}
                autoRotate
                autoRotateSpeed={0.22}
                showLabels
                selectedSkillId={store.selectedSkillIds[store.selectedSkillIds.length - 1] ?? null}
              />
            </Card>
          ) : null}
          {groups.map((group) => (
            <View key={group.category} style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.muted }]}>{group.label}</Text>
              <View style={styles.chips}>
                {group.skills.map((skill) => (
                  <Chip
                    key={skill.id}
                    label={skill.name}
                    color={skill.color}
                    selected={store.selectedSkillIds.includes(skill.id)}
                    onPress={() => store.toggleSkill(skill.id)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {step === 2 && (
        <View style={styles.step}>
          <Text style={[styles.title, { color: colors.ink }]}>Follow a few people</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            Progress is louder together. Skip if you like — your feed grows with you.
          </Text>
          {suggestions.map((person) => {
            const following = store.followUserIds.includes(person.id);
            return (
              <View key={person.id} style={styles.personRow}>
                <Avatar name={person.display_name} color={person.avatar_color} />
                <View style={styles.personText}>
                  <Text style={[styles.personName, { color: colors.ink }]}>{person.display_name}</Text>
                  {person.bio ? (
                    <Text style={[styles.personBio, { color: colors.muted }]} numberOfLines={1}>
                      {person.bio}
                    </Text>
                  ) : null}
                </View>
                <Button
                  title={following ? 'Following' : 'Follow'}
                  variant={following ? 'secondary' : 'primary'}
                  size="sm"
                  onPress={() => store.toggleFollow(person.id)}
                />
              </View>
            );
          })}
          {suggestions.length === 0 && (
            <Text style={[styles.body, { color: colors.muted }]}>
              No suggestions yet — you will be the trendsetter here.
            </Text>
          )}
        </View>
      )}

      {step === 3 && (
        <View style={styles.step}>
          <Text style={[styles.title, { color: colors.ink }]}>When do you practise?</Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            A gentle daily nudge. Streaks love a routine.
          </Text>
          <View style={styles.chips}>
            {REMINDER_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={store.reminderTime === option.value}
                onPress={() => store.setReminderTime(option.value)}
              />
            ))}
            <Chip
              label="No reminders"
              selected={store.reminderTime === null}
              onPress={() => store.setReminderTime(null)}
            />
          </View>
        </View>
      )}

    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 24 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: GUTTER, paddingTop: 4, paddingBottom: 8 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },
  stepLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, marginBottom: 8 },
  inviteBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 14, marginBottom: 18 },
  inviteText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 19 },
  step: { gap: 14 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 32, lineHeight: 36, letterSpacing: -1.1 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  group: { gap: 8 },
  groupLabel: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personText: { flex: 1, minWidth: 0 },
  personName: { fontFamily: fonts.bodyBold, fontSize: 15 },
  personBio: { fontFamily: fonts.body, fontSize: 13 },
});
