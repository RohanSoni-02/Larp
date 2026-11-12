import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '@/src/lib/supabase';
import { elapsedSec, type ActiveSession } from '@/src/stores/session';

import { uploadToMediaBucket } from '../media/api';

export type SaveSessionResult = {
  session_id: string;
  already_saved: boolean;
  xp_gained: number;
  xp_breakdown: { reason: string; amount: number }[];
  daily_cap_reached: boolean;
  just_landed: boolean;
  node_name: string | null;
  streak: number;
  shield_earned: boolean;
  tier_before: number;
  tier_after: number;
  tier_up: boolean;
  level_before: number;
  level_after: number;
  level_up: boolean;
};

/**
 * Save the active session through the anti-cheat RPC. XP, streaks, tiers and
 * node completions are all computed server-side; the client only sends the
 * honest inputs (when, how long, what, optional node + "I landed it").
 */
export async function saveActiveSession(meId: string, active: ActiveSession): Promise<SaveSessionResult> {
  const durationSec = Math.max(60, Math.round(elapsedSec(active)));
  const startedAt = new Date(Date.now() - durationSec * 1000).toISOString();

  const { data, error } = await supabase.rpc('save_session', {
    p_client_uuid: active.clientUuid,
    p_skill_id: active.skillId,
    p_started_at: startedAt,
    p_duration_sec: durationSec,
    p_node_id: active.nodeId,
    p_note: active.note.trim() || null,
    p_label: active.label,
    p_visibility: active.visibility,
    p_landed_node: active.landed,
    p_room_id: active.roomId,
  });
  if (error) throw error;
  const result = data as SaveSessionResult;

  // Proof photo/clip: compress on device, upload, attach to the session.
  if (active.localMedia && !result.already_saved) {
    let uri = active.localMedia.uri;
    if (active.localMedia.kind === 'image') {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG },
      );
      uri = manipulated.uri;
    }
    const key = await uploadToMediaBucket(meId, uri, active.localMedia.kind === 'video' ? 'mp4' : 'jpg');
    const { error: mediaError } = await supabase.from('media').insert({
      owner_id: meId,
      session_id: result.session_id,
      kind: active.localMedia.kind,
      storage_key: key,
      duration_ms:
        active.localMedia.kind === 'video' && active.localMedia.durationMs
          ? Math.min(30_000, Math.round(active.localMedia.durationMs))
          : null,
    });
    if (mediaError) throw mediaError;
  }

  return result;
}
