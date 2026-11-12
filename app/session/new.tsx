import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Chip } from '@/src/components/Chip';
import { NavAction, NavBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { ProgressBar } from '@/src/components/ProgressBar';
import { useSession } from '@/src/features/auth/SessionProvider';
import { saveActiveSession } from '@/src/features/session/api';
import { blockAt, planMinutes, PRESET_PLANS, type SessionPlan } from '@/src/features/templates/blocks';
import { useMyTemplates } from '@/src/features/templates/hooks';
import { useMyPortfolio, useSkillTree } from '@/src/features/trees/hooks';
import { useUsableSkills } from '@/src/features/skills/hooks';
import { formatClock } from '@/src/lib/format';
import { elapsedSec, useSessionStore } from '@/src/stores/session';
import { fonts, GUTTER, useTheme } from '@/src/theme';

const MAX_CLIP_MS = 30_000;

export default function NewSessionScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ skillId?: string; nodeId?: string; label?: string; roomId?: string }>();
  const { session } = useSession();
  const meId = session?.user?.id;

  const { data: portfolio } = useMyPortfolio();
  const { data: catalog } = useUsableSkills();
  const skills = useMemo(
    () => (portfolio && portfolio.length > 0 ? portfolio.map((us) => us.skills).filter(Boolean) : (catalog ?? [])),
    [portfolio, catalog],
  );

  const store = useSessionStore();
  const active = store.active;
  const [saving, setSaving] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Start (or adopt) a session from route params.
  useEffect(() => {
    if (!active && params.skillId) {
      store.begin({
        skillId: params.skillId,
        nodeId: params.nodeId ?? null,
        label: params.label ?? '',
        roomId: params.roomId ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skillId = active?.skillId ?? params.skillId ?? skills[0]?.id ?? null;
  const { data: tree } = useSkillTree(skillId ?? undefined);
  const selectableNodes = useMemo(
    () =>
      (tree?.branches ?? [])
        .flatMap((b) => b.nodes.map((n) => ({ ...n, branchName: b.name })))
        .filter((n) => n.state === 'available' || n.state === 'in_progress'),
    [tree],
  );
  const selectedNode = active?.nodeId ? selectableNodes.find((n) => n.id === active.nodeId) ?? null : null;

  const running = Boolean(active?.runningSince);
  const elapsed = elapsedSec(active);
  const skill = skills.find((s) => s.id === skillId);

  const { data: savedTemplates } = useMyTemplates();
  const [pendingPlan, setPendingPlan] = useState<SessionPlan | null>(null);
  const plan = active ? (active.plan ?? null) : pendingPlan;
  const position = plan ? blockAt(plan, elapsed) : null;

  const choosePlan = (next: SessionPlan | null) => {
    if (next && Platform.OS !== 'web') void Notifications.requestPermissionsAsync().catch(() => undefined);
    if (active) store.setPlan(next);
    else setPendingPlan(next);
  };

  const attachAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const isVideo = asset.type === 'video';
    if (isVideo && (asset.duration ?? 0) > MAX_CLIP_MS + 500) {
      Alert.alert('Clip too long', 'Proof clips can be up to 30 seconds. Trim it and try again.');
      return;
    }
    store.setMedia({ uri: asset.uri, kind: isVideo ? 'video' : 'image', durationMs: isVideo ? asset.duration : null });
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      videoMaxDuration: 30,
      allowsEditing: false,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset) attachAsset(asset);
  };

  const recordClip = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access to record proof clips.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 30,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
      });
      const asset = result.assets?.[0];
      if (!result.canceled && asset) attachAsset(asset);
    } catch {
      Alert.alert('Camera unavailable', 'Recording needs a device camera — pick a clip from your library instead.');
    }
  };

  const save = async () => {
    if (!active || !meId) return;
    if (elapsed < 55) {
      Alert.alert('Too short', 'Sessions under a minute are not saved. Keep practising!');
      return;
    }
    setSaving(true);
    try {
      const result = await saveActiveSession(meId, active);
      store.discard();
      router.replace({
        pathname: '/session/celebration',
        params: { result: JSON.stringify({ ...result, skillName: skill?.name ?? '' }) },
      });
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Something went wrong.');
      setSaving(false);
    }
  };

  return (
    <Screen
      scroll
      header={
        <NavBar
          onClose={active ? undefined : () => router.back()}
          right={
            active ? (
              <NavAction
                label="Discard"
                tone="bad"
                onPress={() => {
                  store.discard();
                  router.back();
                }}
              />
            ) : null
          }
        />
      }
      footer={
        <Button
          title={saving ? 'Saving…' : 'Save session'}
          size="lg"
          onPress={save}
          disabled={!active || saving}
          loading={saving}
        />
      }
    >

      <Text style={[styles.title, { color: colors.ink }]}>Log a session</Text>
      {active?.label ? <Text style={[styles.label, { color: colors.muted }]}>{active.label}</Text> : null}

      {/* Skill picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ gap: 8 }}>
        {skills.map((s) => (
          <Chip
            key={s!.id}
            label={s!.name}
            selected={s!.id === skillId}
            color={s!.color}
            onPress={() => {
              if (!active) store.begin({ skillId: s!.id });
              else store.setSkill(s!.id);
            }}
          />
        ))}
      </ScrollView>

      {/* Plan / template */}
      <View style={styles.planHead}>
        <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 0 }]}>Session plan</Text>
        <Pressable onPress={() => router.push('/session/template')} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.link, { color: colors.accentStrong }]}>New template</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ gap: 8 }}>
        <Chip label="Free timer" selected={!plan} onPress={() => choosePlan(null)} />
        {[...PRESET_PLANS, ...(savedTemplates ?? [])].map((p) => (
          <Chip
            key={'id' in p ? String(p.id) : p.name}
            label={`${p.name} · ${planMinutes(p)}m`}
            selected={plan?.name === p.name}
            onPress={() => choosePlan({ name: p.name, blocks: p.blocks })}
          />
        ))}
      </ScrollView>

      {/* Timer */}
      <Card style={styles.timerCard}>
        {position ? (
          <Text style={[styles.blockNow, { color: colors.accentStrong }]}>
            {position.done ? `${plan!.name} complete` : `${position.block.label} · ${formatClock(position.remainingSec)} left`}
          </Text>
        ) : null}
        <Text style={[styles.clock, { color: running || elapsed === 0 ? colors.ink : colors.muted }]}>{formatClock(elapsed)}</Text>
        <Text style={[styles.clockHint, { color: colors.muted }]}>
          {running ? 'Practising…' : elapsed > 0 ? 'Paused' : 'Ready when you are'}
        </Text>
        {plan && position ? (
          <View style={styles.blocks}>
            {plan.blocks.map((b, i) => (
              <View key={`${b.label}-${i}`} style={{ flex: b.minutes }}>
                <ProgressBar
                  progress={i < position.index || position.done ? 1 : i === position.index ? position.progress : 0}
                  height={6}
                />
                <Text numberOfLines={1} style={[styles.blockLabel, { color: i === position.index ? colors.ink : colors.muted }]}>
                  {b.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.timerButtons}>
          {active ? (
            <Button
              title={running ? 'Pause' : 'Resume'}
              icon={running ? 'pause' : 'play'}
              variant={running ? 'secondary' : 'primary'}
              onPress={store.toggle}
              style={styles.timerMain}
            />
          ) : (
            <Button
              title="Start"
              icon="play"
              onPress={() => skillId && store.begin({ skillId, plan: pendingPlan })}
              disabled={!skillId}
              style={styles.timerMain}
            />
          )}
        </View>
        {active ? (
          <View style={styles.timerExtras}>
            <Button
              title="Focus mode"
              icon="headphones"
              variant="secondary"
              size="sm"
              onPress={() => router.push('/session/focus')}
              accessibilityLabel="Open full-screen focus mode"
            />
            <Button title="+10 min (demo)" variant="ghost" size="sm" onPress={store.addTenMinutes} />
          </View>
        ) : null}
      </Card>

      {/* Node picker */}
      {selectableNodes.length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Working on a node?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ gap: 8 }}>
            <Chip label="Free practice" selected={!active?.nodeId} onPress={() => store.setNode(null)} />
            {selectableNodes.map((n) => (
              <Chip
                key={n.id}
                label={`${n.name} · ${n.sessionsLogged}/${n.sessionsToLand}`}
                selected={active?.nodeId === n.id}
                onPress={() => store.setNode(n.id)}
              />
            ))}
          </ScrollView>
          {selectedNode ? (
            <Pressable
              style={[styles.landedRow, { backgroundColor: active?.landed ? colors.goldSoft : colors.surface2 }]}
              onPress={() => store.setLanded(!active?.landed)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: Boolean(active?.landed) }}
            >
              <View style={[styles.checkbox, { borderColor: colors.subtle }, active?.landed && { backgroundColor: colors.gold, borderColor: colors.gold }]}>
                {active?.landed ? <Icon name="check" size={14} color="#1B1505" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.landedTitle, { color: colors.ink }]}>I landed it</Text>
                <Text style={[styles.landedSub, { color: colors.muted }]}>
                  “{selectedNode.name}” is done. Gold stamp on your tree.
                  {selectedNode.requiresVideo ? ' This node asks for video proof.' : ''}
                </Text>
              </View>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {/* Note + photo */}
      <TextInput
        value={active?.note ?? ''}
        onChangeText={store.setNote}
        placeholder='How did it go? "struggled with bar 12"'
        placeholderTextColor={colors.subtle}
        selectionColor={colors.accent}
        multiline
        accessibilityLabel="Session note"
        style={[styles.note, { backgroundColor: colors.surface2, borderColor: colors.surface2, color: colors.ink }]}
      />
      <View style={styles.mediaRow}>
        <Button title={active?.localMedia ? 'Change proof' : 'Photo or clip'} icon="photo" variant="secondary" size="sm" onPress={pickPhoto} disabled={!active} />
        {Platform.OS !== 'web' ? (
          <Button title="Record up to 30s" icon="video" variant="secondary" size="sm" onPress={recordClip} disabled={!active} />
        ) : null}
        {active?.localMedia ? (
          <View style={styles.mediaPreviewWrap}>
            {active.localMedia.kind === 'image' ? (
              <Image source={{ uri: active.localMedia.uri }} style={styles.mediaPreview} />
            ) : (
              <View style={[styles.mediaPreview, styles.videoPreview, { backgroundColor: colors.surface2 }]}>
                <Icon name="play" size={18} color={colors.ink} />
              </View>
            )}
            <Pressable onPress={() => store.setMedia(null)} accessibilityLabel="Remove proof" style={styles.mediaRemove}>
              <Icon name="close" size={12} color="#fff" />
            </Pressable>
          </View>
        ) : null}
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 38, letterSpacing: -1.1 },
  label: { fontFamily: fonts.body, fontSize: 14, marginTop: 4 },
  chips: { marginTop: 12, marginHorizontal: -GUTTER, paddingHorizontal: GUTTER, flexGrow: 0 },
  timerCard: { marginTop: 18, alignItems: 'center', paddingVertical: 28, borderRadius: 28 },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  link: { fontFamily: fonts.bodyBold, fontSize: 13.5 },
  blockNow: { fontFamily: fonts.bodyBold, fontSize: 14, marginBottom: 4 },
  blocks: { flexDirection: 'row', gap: 6, alignSelf: 'stretch', marginTop: 16 },
  blockLabel: { fontFamily: fonts.body, fontSize: 11.5, marginTop: 4, textAlign: 'center' },
  clock: { fontFamily: fonts.numHeavy, fontSize: 104, fontVariant: ['tabular-nums'], lineHeight: 104, letterSpacing: -1 },
  clockHint: { fontFamily: fonts.body, fontSize: 14, marginTop: 4 },
  timerButtons: { alignSelf: 'stretch', alignItems: 'center', marginTop: 20 },
  timerMain: { width: 200 },
  timerExtras: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 22, letterSpacing: -0.15 },
  landedRow: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 16, padding: 14, marginTop: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  landedTitle: { fontFamily: fonts.bodyBold, fontSize: 15 },
  landedSub: { fontFamily: fonts.body, fontSize: 13, marginTop: 2, lineHeight: 18 },
  note: { borderWidth: 1, borderRadius: 16, padding: 14, minHeight: 84, marginTop: 20, fontFamily: fonts.body, fontSize: 15, textAlignVertical: 'top' },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 },
  mediaPreviewWrap: { position: 'relative' },
  mediaPreview: { width: 56, height: 56, borderRadius: 10 },
  videoPreview: { alignItems: 'center', justifyContent: 'center' },
  mediaRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
