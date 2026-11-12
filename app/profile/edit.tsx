import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Field } from '@/src/components/Field';
import { NavBar } from '@/src/components/Header';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import { useMyProfile, useUpdateProfile } from '@/src/features/profile/hooks';
import { fonts, useTheme } from '@/src/theme';
import type { Profile } from '@/src/types/app';

export default function EditProfileScreen() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const { data: profile } = useMyProfile(userId);

  if (!profile) return <Screen header={<NavBar title="Edit profile" onClose={() => router.back()} />}>{null}</Screen>;
  return <EditForm key={profile.id} profile={profile} userId={profile.id} />;
}

function EditForm({ profile, userId }: { profile: Profile; userId: string }) {
  const { colors } = useTheme();
  const update = useUpdateProfile();
  const [name, setName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? '');

  const save = () => {
    if (!name.trim()) return;
    update.mutate(
      { userId, input: { display_name: name.trim(), bio: bio.trim() } },
      {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  };

  return (
    <Screen
      scroll
      header={<NavBar title="Edit profile" onClose={() => router.back()} />}
      footer={<Button title="Save" size="lg" onPress={save} disabled={!name.trim() || update.isPending} loading={update.isPending} />}
    >
      <View style={styles.identity}>
        <Avatar name={name.trim() || profile.display_name} color={profile.avatar_color} size={88} />
        <Text style={[styles.handle, { color: colors.muted }]}>@{profile.handle}</Text>
      </View>
      <Field label="Display name" value={name} onChangeText={setName} autoComplete="name" />
      <Field
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder="What are you learning, and why?"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: 10, paddingTop: 8, paddingBottom: 22 },
  handle: { fontFamily: fonts.bodyMedium, fontSize: 14 },
});
