import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Chip } from '@/src/components/Chip';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { useMyCheck, usePostLarpCheck, useTodayWindow } from '@/src/features/larpcheck/hooks';
import { useMyPortfolio } from '@/src/features/trees/hooks';
import { formatClock } from '@/src/lib/format';
import { useNow } from '@/src/lib/useNow';
import { fonts, useTheme } from '@/src/theme';

export default function LarpCheckScreen() {
  const { colors } = useTheme();
  const { data: window } = useTodayWindow();
  const { data: myCheck } = useMyCheck(window?.id);
  const { data: portfolio } = useMyPortfolio();
  const post = usePostLarpCheck();

  const skills = useMemo(() => (portfolio ?? []).map((us) => us.skills).filter(Boolean), [portfolio]);
  const [chosenSkillId, setChosenSkillId] = useState<string | null>(null);
  const skillId = chosenSkillId ?? skills[0]?.id ?? null;
  const [workUri, setWorkUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const now = useNow();

  // Recomputed on every 1s tick; firedAt is the source of truth.
  const secondsLeft = window ? Math.max(0, Math.floor(120 - (now - new Date(window.firedAt).getTime()) / 1000)) : 0;
  const live = Boolean(window) && secondsLeft > 0;

  const pick = async (which: 'work' | 'selfie') => {
    const useCamera = which === 'selfie';
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, cameraType: ImagePicker.CameraType.front })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = result.assets?.[0];
    if (!result.canceled && asset) {
      if (which === 'work') setWorkUri(asset.uri);
      else setSelfieUri(asset.uri);
    }
  };

  const submit = () => {
    if (!window || !skillId || !workUri || !selfieUri) return;
    post.mutate(
      { windowId: window.id, skillId, workUri, selfieUri },
      {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert('Could not post', e instanceof Error ? e.message : 'Try again.'),
      },
    );
  };

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <Button title="Close" variant="ghost" size="sm" onPress={() => router.back()} />
        {live ? (
          <View style={[styles.timerPill, { backgroundColor: colors.bad }]}>
            <Text style={styles.timerPillText}>{formatClock(secondsLeft)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.title, { color: colors.ink }]}>⚡ Larp Check</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {myCheck
          ? 'Posted. Your proof is live.'
          : live
            ? 'Two minutes. Show the work and your face — no filters, no do-overs.'
            : 'No Larp Check is live right now. It fires once a day at a random moment inside your window.'}
      </Text>
      {!live ? (
        <Button
          title="⏰ Choose when checks can fire"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/settings/larp-check')}
          style={{ alignSelf: 'flex-start', marginTop: 12 }}
        />
      ) : null}

      {!myCheck && live ? (
        <>
          {/* Dual-photo stage */}
          <View style={[styles.stage, { backgroundColor: colors.surface2, borderColor: colors.line }]}>
            {workUri ? (
              <Image source={{ uri: workUri }} style={styles.stageImage} />
            ) : (
              <Pressable style={styles.stagePlaceholder} onPress={() => pick('work')} accessibilityLabel="Add photo of the work">
                <Icon name="camera" size={34} color={colors.muted} />
                <Text style={[styles.stageHint, { color: colors.muted }]}>The work</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.selfieInset, { borderColor: colors.bg, backgroundColor: colors.surface }]}
              onPress={() => pick('selfie')}
              accessibilityLabel="Add selfie"
            >
              {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={styles.selfieImage} />
              ) : (
                <Icon name="camera" size={20} color={colors.muted} />
              )}
            </Pressable>
          </View>

          <View style={styles.pickRow}>
            <Button title="Work photo" variant="secondary" size="sm" onPress={() => pick('work')} />
            <Button title="Selfie" variant="secondary" size="sm" onPress={() => pick('selfie')} />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>What are you practising?</Text>
          <View style={styles.chips}>
            {skills.map((s) => (
              <Chip key={s!.id} label={s!.name} selected={s!.id === skillId} color={s!.color} onPress={() => setChosenSkillId(s!.id)} />
            ))}
          </View>

          <Button
            title={post.isPending ? 'Posting…' : 'Post Larp Check (+10 XP)'}
            onPress={submit}
            disabled={!workUri || !selfieUri || !skillId || post.isPending}
            loading={post.isPending}
            style={{ marginTop: 18 }}
          />
        </>
      ) : myCheck ? (
        <Button title="Back to feed" onPress={() => router.back()} style={{ marginTop: 20 }} />
      ) : null}
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  timerPillText: { color: '#fff', fontFamily: fonts.num, fontSize: 17, fontVariant: ['tabular-nums'] },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, marginTop: 10 },
  subtitle: { fontFamily: fonts.body, fontSize: 15, marginTop: 6, lineHeight: 22 },
  stage: { borderWidth: 1, borderRadius: 20, aspectRatio: 3 / 4, marginTop: 18, overflow: 'hidden' },
  stageImage: { width: '100%', height: '100%' },
  stagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  stageHint: { fontFamily: fonts.bodyBold, fontSize: 15 },
  selfieInset: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 92,
    height: 122,
    borderRadius: 14,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieImage: { width: '100%', height: '100%' },
  pickRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15, marginTop: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
});
