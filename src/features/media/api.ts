import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

/** Short-lived signed URL for a storage object in the private `media` bucket. */
export function useSignedUrl(storageKey: string | null | undefined): string | null {
  const { data } = useQuery({
    queryKey: ['signed-url', storageKey],
    enabled: Boolean(storageKey),
    staleTime: 45 * 60 * 1000, // URLs live 60 min; refresh at 45
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('media')
        .createSignedUrl(storageKey!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  return data ?? null;
}

/** Upload a local file to the user's media folder; returns the storage key. */
export async function uploadToMediaBucket(userId: string, localUri: string, extension: string): Promise<string> {
  const key = `${userId}/${globalThis.crypto.randomUUID()}.${extension}`;
  const response = await fetch(localUri);
  const blob = await response.blob();
  const { error } = await supabase.storage.from('media').upload(key, blob, {
    contentType: extension === 'mp4' ? 'video/mp4' : 'image/jpeg',
  });
  if (error) throw error;
  return key;
}
