import { router, useLocalSearchParams } from 'expo-router';

import { NavBar } from '@/src/components/Header';
import { Screen } from '@/src/components/Screen';
import { useMyProfile } from '@/src/features/profile/hooks';
import { ProfileView } from '@/src/features/profile/ProfileView';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile } = useMyProfile(id);
  if (!id) return null;
  return (
    <Screen scroll padded={false} header={<NavBar title={profile?.handle} onBack={() => router.back()} />}>
      <ProfileView userId={id} isMe={false} />
    </Screen>
  );
}
