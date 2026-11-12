import { supabase } from '@/src/lib/supabase';
import { dayKey } from '@/src/lib/format';
import type { LarpWindow } from '@/src/types/app';

import { uploadToMediaBucket } from '../media/api';

/**
 * Today's Larp Check window. Your personal window (fired inside the hours you
 * chose) wins; the shared regional window is the fallback.
 */
export async function getTodayWindow(meId: string): Promise<LarpWindow | null> {
  const { data: rows, error } = await supabase
    .from('larp_check_windows')
    .select('id, region, fired_at, user_id')
    .eq('window_date', dayKey(new Date()))
    .or(`user_id.is.null,user_id.eq.${meId}`)
    .order('fired_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  const data = rows?.find((w) => w.user_id === meId) ?? rows?.[0];
  if (!data) return null;
  const left = 120 - (Date.now() - new Date(data.fired_at).getTime()) / 1000;
  return { id: data.id, region: data.region, firedAt: data.fired_at, secondsLeft: Math.max(0, Math.floor(left)) };
}

/** Have I posted for this window? (Determines the BeReal blur.) */
export async function getMyCheck(meId: string, windowId: string): Promise<{ id: string; isLate: boolean } | null> {
  const { data, error } = await supabase
    .from('larp_checks')
    .select('id, is_late')
    .eq('user_id', meId)
    .eq('window_id', windowId)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, isLate: data.is_late } : null;
}

/**
 * Post a Larp Check: upload both photos, create the check, then link media.
 * `is_late` and the +10 XP are computed server-side (trigger).
 */
export async function postLarpCheck(
  meId: string,
  input: { windowId: string; skillId: string; workUri: string; selfieUri: string },
): Promise<void> {
  const { data: check, error } = await supabase
    .from('larp_checks')
    .insert({ user_id: meId, window_id: input.windowId, skill_id: input.skillId })
    .select('id')
    .single();
  if (error) throw error;

  const [workKey, selfieKey] = await Promise.all([
    uploadToMediaBucket(meId, input.workUri, 'jpg'),
    uploadToMediaBucket(meId, input.selfieUri, 'jpg'),
  ]);

  const { data: mediaRows, error: mediaError } = await supabase
    .from('media')
    .insert([
      { owner_id: meId, larp_check_id: check.id, kind: 'image', storage_key: workKey },
      { owner_id: meId, larp_check_id: check.id, kind: 'image', storage_key: selfieKey },
    ])
    .select('id, storage_key');
  if (mediaError) throw mediaError;

  const workId = mediaRows?.find((m) => m.storage_key === workKey)?.id;
  const selfieId = mediaRows?.find((m) => m.storage_key === selfieKey)?.id;

  // Column-limited update: only work_media_id / selfie_media_id are client-writable.
  const { error: linkError } = await supabase
    .from('larp_checks')
    .update({ work_media_id: workId, selfie_media_id: selfieId })
    .eq('id', check.id);
  if (linkError) throw linkError;
}

export type LarpCheckPrefs = {
  enabled: boolean;
  /** 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** Minutes after local midnight. */
  startMinute: number;
  endMinute: number;
};

export const DEFAULT_LARP_CHECK_PREFS: LarpCheckPrefs = {
  enabled: true,
  days: [0, 1, 2, 3, 4, 5, 6],
  startMinute: 600,
  endMinute: 1260,
};

export async function getLarpCheckPrefs(meId: string): Promise<LarpCheckPrefs> {
  const { data, error } = await supabase
    .from('larp_check_prefs')
    .select('enabled, days, start_minute, end_minute')
    .eq('user_id', meId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_LARP_CHECK_PREFS;
  return { enabled: data.enabled, days: data.days, startMinute: data.start_minute, endMinute: data.end_minute };
}

/** Saves prefs and re-rolls the not-yet-fired check into the new hours (server-side). */
export async function saveLarpCheckPrefs(prefs: LarpCheckPrefs): Promise<void> {
  const { error } = await supabase.rpc('set_larp_check_prefs', {
    p_enabled: prefs.enabled,
    p_days: prefs.days,
    p_start_minute: prefs.startMinute,
    p_end_minute: prefs.endMinute,
  });
  if (error) throw error;
}

/** Dev menu: fire a live Larp Check right now (2-minute window). */
export async function triggerLarpCheckNow(): Promise<void> {
  const { error } = await supabase.rpc('dev_trigger_larp_check');
  if (error) throw error;
}
