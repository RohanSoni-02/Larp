import { useSignedUrl } from '@/src/features/media/api';
import { supabase } from '@/src/lib/supabase';
import type { PostMedia } from '@/src/types/app';

/** Public bucket holding the official larpr guides' avatars and photos. */
export const OFFICIAL_BUCKET = 'official';

/**
 * Public URL for an object in the `official` bucket. Pure string building, no
 * network call, so it is safe to use while rendering lists.
 */
export function officialMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(OFFICIAL_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * The URL to display for a post's media: official photos come straight from the
 * public bucket; everything else is a short-lived signed URL from the private
 * `media` bucket.
 */
export function usePostMediaUrl(media: PostMedia | null | undefined): string | null {
  const publicUrl = officialMediaUrl(media?.publicPath);
  const signed = useSignedUrl(publicUrl ? null : (media?.key ?? null));
  return publicUrl ?? signed;
}
