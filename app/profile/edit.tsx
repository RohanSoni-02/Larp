import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import { useMyProfile, useUpdateProfile } from '@/src/features/profile/hooks';
import { fonts, useTheme } from '@/src/theme';
import type { Profile } from '@/src/types/app';

export default function EditProfileScreen() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const { data: profile } = useMyProfile(userId);

  return (
    <Screen scroll>
      {profile ? <EditForm key={profile.id} profile={profile} userId={profile.id} /> : null}
    </Screen>
  );
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

  const inputStyle = [styles.input, { backgroundColor: colors.surface2, borderColor: colors.surface2, color: colors.ink }] as const;

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Edit profile</Text>
        <Button title="Close" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>
      <Text style={[styles.label, { color: colors.muted }]}>Display name</Text>
      <TextInput value={name} onChangeText={setName} style={inputStyle} accessibilityLabel="Display name" />
      <Text style={[styles.label, { color: colors.muted }]}>Bio</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        multiline
        placeholder="What are you learning, and why?"
        placeholderTextColor={colors.muted}
        style={[inputStyle, styles.bio]}
        accessibilityLabel="Bio"
      />
      <Button title="Save" onPress={save} disabled={!name.trim() || update.isPending} loading={update.isPending} style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 28 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15, marginTop: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonts.body, fontSize: 15 },
  bio: { minHeight: 90, textAlignVertical: 'top' },
});
