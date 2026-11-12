import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { PostCard } from '@/src/components/PostCard';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import { usePost } from '@/src/features/posts/hooks';
import { fonts, useTheme } from '@/src/theme';

export default function PostScreen() {
  const { colors } = useTheme();
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session } = useSession();
  const { data: post, isLoading } = usePost(id!, kind === 'larp_check' ? 'larp_check' : 'session');

  return (
    <Screen scroll>
      <Button title="← Back" variant="ghost" size="sm" onPress={() => router.back()} style={styles.back} />
      {isLoading ? (
        <Text style={[styles.loading, { color: colors.muted }]}>Loading…</Text>
      ) : post ? (
        <PostCard post={post} meId={session?.user?.id} />
      ) : (
        <View style={styles.center}>
          <Text style={[styles.loading, { color: colors.muted }]}>This post is gone, or it was never shared with you.</Text>
        </View>
      )}
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', marginBottom: 10 },
  loading: { fontFamily: fonts.body, fontSize: 15, textAlign: 'center', marginTop: 40 },
  center: { paddingTop: 40 },
});
