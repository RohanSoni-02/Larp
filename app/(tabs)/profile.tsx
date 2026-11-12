import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';

import { TopBar } from '@/src/components/Header';
import { IconButton } from '@/src/components/IconButton';
import { ListGroup, ListRow } from '@/src/components/ListRow';
import { Screen } from '@/src/components/Screen';
import { Sheet } from '@/src/components/Sheet';
import { deleteAccount, signOut } from '@/src/features/auth/api';
import { useSession } from '@/src/features/auth/SessionProvider';
import { inviteMessage } from '@/src/features/invite/api';
import { useSetShowOnLeaderboards } from '@/src/features/leaderboard/hooks';
import { useTriggerLarpCheck } from '@/src/features/larpcheck/hooks';
import { useFeedbackThreads } from '@/src/features/mentorship/hooks';
import { useMyProfile } from '@/src/features/profile/hooks';
import { ProfileView } from '@/src/features/profile/ProfileView';
import { fonts, useTheme } from '@/src/theme';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;
  const { data: profile } = useMyProfile(userId);
  const { data: threads } = useFeedbackThreads();
  const triggerLarpCheck = useTriggerLarpCheck();
  const setShowOnBoards = useSetShowOnLeaderboards();
  const [menuOpen, setMenuOpen] = useState(false);

  const pendingInbox = (threads ?? []).filter((t) => t.direction === 'inbox' && t.status === 'pending').length;

  function confirmDelete() {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account, sessions, XP and media. There is no undo.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            deleteAccount().catch((error: unknown) =>
              Alert.alert('Could not delete account', error instanceof Error ? error.message : 'Try again.'),
            );
          },
        },
      ],
    );
  }

  function go(action: () => void) {
    setMenuOpen(false);
    action();
  }

  if (!userId) return null;

  return (
    <Screen
      scroll
      padded={false}
      edges={['top']}
      header={
        <TopBar
          left={
            <Text style={[styles.handle, { color: colors.ink }]} numberOfLines={1} accessibilityRole="header">
              {profile?.handle ?? ''}
            </Text>
          }
          right={
            <IconButton
              name="menu"
              accessibilityLabel="Settings and tools"
              onPress={() => setMenuOpen(true)}
              badge={pendingInbox}
            />
          }
        />
      }
    >
      <ProfileView userId={userId} isMe />
      <View style={{ height: 32 }} />

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Settings and tools">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 6 }}>
          <ListGroup title="Tools">
            <ListRow
              icon="bolt"
              title="Larp Check schedule"
              subtitle="Pick the days and hours that fit your routine"
              onPress={() => go(() => router.push('/settings/larp-check'))}
            />
            <ListRow
              icon="mentor"
              title="Mentorship"
              subtitle="Feedback you asked for and requests to review"
              badge={pendingInbox}
              onPress={() => go(() => router.push('/mentorship'))}
            />
            <ListRow
              icon="person-add"
              title="Invite a friend"
              subtitle="Share a link and they follow you on sign-up"
              onPress={() =>
                profile && void Share.share({ message: inviteMessage(profile.display_name, profile.handle) })
              }
            />
          </ListGroup>

          <ListGroup title="Privacy" footer="When off, you still see your own rank.">
            <ListRow
              icon="podium"
              title="Show me on leaderboards"
              right={
                <Switch
                  value={profile?.show_on_leaderboards ?? true}
                  onValueChange={(v) => setShowOnBoards.mutate(v)}
                  trackColor={{ true: colors.good, false: colors.surface3 }}
                  accessibilityLabel="Show me on leaderboards"
                />
              }
            />
          </ListGroup>

          <ListGroup title="Account">
            {__DEV__ ? (
              <ListRow
                icon="bolt"
                title="Trigger Larp Check (dev)"
                onPress={() =>
                  triggerLarpCheck.mutate(undefined, {
                    onSuccess: () => go(() => router.push('/larp-check')),
                    onError: (e) => Alert.alert('Larp Check', e instanceof Error ? e.message : 'Failed'),
                  })
                }
              />
            ) : null}
            <ListRow icon="logout" title="Sign out" chevron={false} onPress={() => go(() => void signOut())} />
            <ListRow icon="trash" title="Delete account" destructive onPress={confirmDelete} />
          </ListGroup>
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  handle: { fontFamily: fonts.displayHeavy, fontSize: 22, letterSpacing: -0.6 },
});
