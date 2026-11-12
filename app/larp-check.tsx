import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/src/components/Appear';
import { Button } from '@/src/components/Button';
import { Chip } from '@/src/components/Chip';
import { NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { LiveDot } from '@/src/components/LiveDot';
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
  const urgent = live && secondsLeft <= 30;

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

  const capturing = !myCheck && live;
  const missing = !workUri ? 'Add a photo of the work' : !selfieUri ? 'Add your selfie' : null;

  return (
    <Screen
      scroll
      header={
        <NavBar
          onClose={() => router.back()}
          right={
            live ? (
              <View
                style={[styles.timerPill, { backgroundColor: urgent ? colors.bad : colors.night }]}
                accessibilityRole="timer"
                accessibilityLabel={`${formatClock(secondsLeft)} left`}
              >
                <LiveDot size={7} color={urgent ? '#FFFFFF' : undefined} />
                <Text style={styles.timerPillText}>{formatClock(secondsLeft)}</Text>
              </View>
            ) : null
          }
        />
      }
      footer={
        capturing ? (
          <Button
            title={post.isPending ? 'Posting…' : (missing ?? 'Post Larp Check · +10 XP')}
            size="lg"
            onPress={submit}
            disabled={Boolean(missing) || !skillId || post.isPending}
            loading={post.isPending}
          />
        ) : myCheck ? (
          <Button title="Back to feed" size="lg" onPress={() => router.back()} />
        ) : undefined
      }
    >
      <Appear>
        <View style={styles.titleRow}>
          <View style={[styles.bolt, { backgroundColor: colors.accent }]}>
            <Icon name="bolt" filled size={20} color={colors.accentInk} />
          </View>
          <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
            Larp Check
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {myCheck
            ? 'Posted. Your proof is live.'
            : live
              ? 'Two minutes. Show the work and your face. No filters, no do-overs.'
              : 'No Larp Check is live right now. It fires once a day at a random moment inside your window.'}
        </Text>
      </Appear>

      {!live && !myCheck ? (
        <Button
          title="Choose when checks can fire"
          icon="clock"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/settings/larp-check')}
          style={styles.scheduleBtn}
        />
      ) : null}

      {capturing ? (
        <Appear delay={80}>
          {/* Dual-photo stage: the work fills the frame, the selfie sits inset. */}
          <View style={[styles.stage, { backgroundColor: colors.surface2 }]}>
            <Pressable
              style={styles.stageFill}
              onPress={() => pick('work')}
              accessibilityRole="button"
              accessibilityLabel={workUri ? 'Change photo of the work' : 'Add photo of the work'}
            >
              {workUri ? (
                <Image source={{ uri: workUri }} style={styles.stageImage} />
              ) : (
                <View style={styles.stagePlaceholder}>
                  <View style={[styles.stageIcon, { backgroundColor: colors.surface }]}>
                    <Icon name="photo" size={26} color={colors.ink} />
                  </View>
                  <Text style={[styles.stageHint, { color: colors.ink }]}>The work</Text>
                  <Text style={[styles.stageSub, { color: colors.muted }]}>Tap to add a photo</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={[styles.selfieInset, { borderColor: colors.bg, backgroundColor: colors.surface3 }]}
              onPress={() => pick('selfie')}
              accessibilityRole="button"
              accessibilityLabel={selfieUri ? 'Retake selfie' : 'Add selfie'}
            >
              {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={styles.stageImage} />
              ) : (
                <>
                  <Icon name="camera" size={22} color={colors.ink} />
                  <Text style={[styles.selfieHint, { color: colors.ink }]}>Selfie</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>What are you practising?</Text>
          <View style={styles.chips}>
            {skills.map((s) => (
              <Chip key={s!.id} label={s!.name} selected={s!.id === skillId} color={s!.color} onPress={() => setChosenSkillId(s!.id)} />
            ))}
          </View>
        </Appear>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, height: 32 },
  timerPillText: { color: '#fff', fontFamily: fonts.num, fontSize: 18, fontVariant: ['tabular-nums'] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  bolt: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 32, lineHeight: 36, letterSpacing: -1.1 },
  subtitle: { fontFamily: fonts.body, fontSize: 15.5, marginTop: 10, lineHeight: 22, letterSpacing: -0.1 },
  scheduleBtn: { alignSelf: 'flex-start', marginTop: 16 },
  stage: { borderRadius: 28, aspectRatio: 3 / 4, marginTop: 20, overflow: 'hidden' },
  stageFill: { flex: 1 },
  stageImage: { width: '100%', height: '100%' },
  stagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  stageIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stageHint: { fontFamily: fonts.display, fontSize: 18, letterSpacing: -0.35 },
  stageSub: { fontFamily: fonts.body, fontSize: 13.5 },
  selfieInset: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 96,
    height: 128,
    borderRadius: 18,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  selfieHint: { fontFamily: fonts.bodyBold, fontSize: 12 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15, marginTop: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
});
