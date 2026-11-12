import { router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/src/components/EmptyState';
import { NavBar } from '@/src/components/Header';
import { PostCard } from '@/src/components/PostCard';
import { Screen } from '@/src/components/Screen';
import { PostSkeleton } from '@/src/components/Skeleton';
import { useSession } from '@/src/features/auth/SessionProvider';
import { usePost } from '@/src/features/posts/hooks';

export default function PostScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind?: string }>();
  const { session } = useSession();
  const { data: post, isLoading } = usePost(id!, kind === 'larp_check' ? 'larp_check' : 'session');

  return (
    <Screen scroll padded={false} header={<NavBar title="Post" onBack={() => router.back()} />}>
      {isLoading ? (
        <PostSkeleton />
      ) : post ? (
        <PostCard post={post} meId={session?.user?.id} />
      ) : (
        <EmptyState icon="eye" title="This post is gone" body="Or it was never shared with you." />
      )}
    </Screen>
  );
}
