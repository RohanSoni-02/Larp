import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import type { LarpCheckPrefs } from '@/src/features/larpcheck/api';
import { useLarpCheckPrefs, useSaveLarpCheckPrefs } from '@/src/features/larpcheck/hooks';
import { registerForPush } from '@/src/lib/push';
import { fonts, useTheme } from '@/src/theme';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const STEP = 30;
const MIN_GAP = 60;
const WEEKDAYS = [1, 2, 3, 4, 5];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const PRESETS: { label: string; emoji: string; days: number[]; start: number; end: number }[] = [
  { label: 'Mornings', emoji: '🌅', days: ALL_DAYS, start: 7 * 60, end: 10 * 60 },
  { label: 'Lunch break', emoji: '🥪', days: WEEKDAYS, start: 12 * 60, end: 14 * 60 },
  { label: 'After work', emoji: '🏠', days: WEEKDAYS, start: 17 * 60 + 30, end: 21 * 60 },
  { label: 'Evenings', emoji: '🌙', days: ALL_DAYS, start: 19 * 60, end: 23 * 60 },
  { label: 'Weekends', emoji: '🎉', days: [0, 6], start: 10 * 60, end: 20 * 60 },
  { label: 'Any time', emoji: '⚡', days: ALL_DAYS, start: 9 * 60, end: 21 * 60 },
];

function formatMinute(m: number): string {
  if (m >= 1440) return 'midnight';
  const h = Math.floor(m / 60);
  const min = m % 60;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${min ? `:${String(min).padStart(2, '0')}` : ''} ${suffix}`;
}

export default function LarpCheckSettingsScreen() {
  const { data: prefs, isLoading } = useLarpCheckPrefs();
  return (
    <Screen scroll>
      {isLoading || !prefs ? (
        <ActivityIndicator style={{ marginTop: 60 }} />
      ) : (
        <PrefsForm key={JSON.stringify(prefs)} initial={prefs} />
      )}
    </Screen>
  );
}

function PrefsForm({ initial }: { initial: LarpCheckPrefs }) {
  const { colors } = useTheme();
  const { session } = useSession();
  const save = useSaveLarpCheckPrefs();
  const [form, setForm] = useState<LarpCheckPrefs>(initial);

  const toggleDay = (d: number) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort(),
    }));

  const shiftStart = (delta: number) =>
    setForm((f) => {
      const startMinute = Math.max(0, Math.min(1440 - MIN_GAP, f.startMinute + delta));
      return { ...f, startMinute, endMinute: Math.max(f.endMinute, startMinute + MIN_GAP) };
    });

  const shiftEnd = (delta: number) =>
    setForm((f) => {
      const endMinute = Math.max(MIN_GAP, Math.min(1440, f.endMinute + delta));
      return { ...f, endMinute, startMinute: Math.min(f.startMinute, endMinute - MIN_GAP) };
    });

  const activePreset = PRESETS.find(
    (p) =>
      p.start === form.startMinute &&
      p.end === form.endMinute &&
      p.days.length === form.days.length &&
      p.days.every((d) => form.days.includes(d)),
  );

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const canSave = !form.enabled || form.days.length > 0;

  const submit = async () => {
    try {
      await save.mutateAsync(form);
      const push = form.enabled && session ? await registerForPush(session.user.id) : 'registered';
      Alert.alert(
        form.enabled ? 'Larp Check scheduled' : 'Larp Checks paused',
        form.enabled
          ? push === 'denied'
            ? 'Saved, but notifications are off — turn them on in Settings so we can ping you.'
            : push === 'unavailable'
              ? 'Saved. Push needs a device build; the app will still show the check when it fires.'
              : 'You’ll get one surprise ping inside your window.'
          : 'No surprise checks until you turn them back on.',
      );
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const daySummary =
    form.days.length === 7
      ? 'every day'
      : form.days.length === 5 && WEEKDAYS.every((d) => form.days.includes(d))
        ? 'on weekdays'
        : form.days.length === 2 && form.days.includes(0) && form.days.includes(6)
          ? 'on weekends'
          : form.days.length === 0
            ? 'on no days'
            : `on ${form.days.map((d) => DAY_NAMES[d]!.slice(0, 3)).join(', ')}`;

  return (
    <>
      <View style={styles.header}>
        <Button title="Cancel" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>
      <Text style={[styles.kicker, { color: colors.primary }]}>⚡ LARP CHECK</Text>
      <Text style={[styles.title, { color: colors.ink }]}>Your check, your schedule</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Once a day we’ll ping you at a random moment inside your window. Two minutes to show what you’re working on.
        You never see the exact time — that’s the fun.
      </Text>

      <Card style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.ink }]}>Surprise Larp Checks</Text>
          <Text style={[styles.rowSub, { color: colors.muted }]}>{form.enabled ? 'On' : 'Paused'}</Text>
        </View>
        <Switch
          value={form.enabled}
          onValueChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
          trackColor={{ true: colors.primary, false: colors.line }}
          accessibilityLabel="Surprise Larp Checks"
        />
      </Card>

      <View style={!form.enabled && { opacity: 0.4 }} pointerEvents={form.enabled ? 'auto' : 'none'}>
        <Text style={[styles.label, { color: colors.muted }]}>Quick picks</Text>
        <View style={styles.presets}>
          {PRESETS.map((p) => {
            const on = activePreset?.label === p.label;
            return (
              <Pressable
                key={p.label}
                onPress={() => setForm((f) => ({ ...f, days: p.days, startMinute: p.start, endMinute: p.end }))}
                style={[
                  styles.preset,
                  { backgroundColor: on ? colors.primarySoft : colors.surface, borderColor: on ? colors.primary : colors.line },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
                <Text style={[styles.presetLabel, { color: colors.ink }]}>{p.label}</Text>
                <Text style={[styles.presetMeta, { color: colors.muted }]}>
                  {formatMinute(p.start)}–{formatMinute(p.end)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>Days</Text>
        <View style={styles.days}>
          {DAY_LABELS.map((l, d) => {
            const on = form.days.includes(d);
            return (
              <Pressable
                key={d}
                onPress={() => toggleDay(d)}
                style={[styles.day, { backgroundColor: on ? colors.ink : colors.fill, borderColor: 'transparent' }]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={DAY_NAMES[d]}
              >
                <Text style={[styles.dayText, { color: on ? colors.bg : colors.ink }]}>{l}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>Window</Text>
        <Card variant="flat" style={{ gap: 12 }}>
          <TimeStepper label="Not before" value={form.startMinute} onShift={shiftStart} />
          <View style={[styles.divider, { backgroundColor: colors.line }]} />
          <TimeStepper label="Not after" value={form.endMinute} onShift={shiftEnd} />
        </Card>

        <View style={[styles.summary, { backgroundColor: colors.surface2 }]}>
          <Text style={[styles.summaryText, { color: colors.ink }]}>
            One check {daySummary}, sometime between{' '}
            <Text style={{ fontFamily: fonts.bodyBold }}>{formatMinute(form.startMinute)}</Text> and{' '}
            <Text style={{ fontFamily: fonts.bodyBold }}>{formatMinute(form.endMinute)}</Text>.
          </Text>
        </View>
      </View>

      <Button
        title="Save schedule"
        onPress={submit}
        disabled={!dirty || !canSave || save.isPending}
        loading={save.isPending}
        style={{ marginTop: 18 }}
      />
      <View style={{ height: 30 }} />
    </>
  );
}

function TimeStepper({ label, value, onShift }: { label: string; value: number; onShift: (delta: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepper}>
      <Text style={[styles.rowTitle, { color: colors.muted, flex: 1 }]}>{label}</Text>
      <Pressable
        onPress={() => onShift(-STEP)}
        style={[styles.stepBtn, { backgroundColor: colors.surface2 }]}
        accessibilityLabel={`${label} earlier`}
      >
        <Text style={[styles.stepText, { color: colors.ink }]}>−</Text>
      </Pressable>
      <Text style={[styles.time, { color: colors.ink }]}>{formatMinute(value)}</Text>
      <Pressable
        onPress={() => onShift(STEP)}
        style={[styles.stepBtn, { backgroundColor: colors.surface2 }]}
        accessibilityLabel={`${label} later`}
      >
        <Text style={[styles.stepText, { color: colors.ink }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-start' },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 12.5, letterSpacing: 1.2, marginTop: 4 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 28, marginTop: 2 },
  sub: { fontFamily: fonts.body, fontSize: 14, marginTop: 6, lineHeight: 20 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15 },
  rowSub: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 22, marginBottom: 10, letterSpacing: -0.15 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { width: '31.5%', borderRadius: 16, borderWidth: 1.5, padding: 10, gap: 2 },
  presetLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, marginTop: 2 },
  presetMeta: { fontFamily: fonts.body, fontSize: 11.5 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: fonts.bodyBold, fontSize: 15 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: fonts.bodyBold, fontSize: 20 },
  time: { fontFamily: fonts.display, fontSize: 17, minWidth: 84, textAlign: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
  summary: { borderRadius: 14, padding: 12, marginTop: 14 },
  summaryText: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20 },
});
