import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { NavBar } from '@/src/components/Header';
import { Icon, type AppIconName } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { Screen } from '@/src/components/Screen';
import { Skeleton } from '@/src/components/Skeleton';
import { Stepper } from '@/src/components/Stepper';
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

const PRESETS: { label: string; icon: AppIconName; days: number[]; start: number; end: number }[] = [
  { label: 'Mornings', icon: 'sunrise', days: ALL_DAYS, start: 7 * 60, end: 10 * 60 },
  { label: 'Lunch break', icon: 'cup', days: WEEKDAYS, start: 12 * 60, end: 14 * 60 },
  { label: 'After work', icon: 'home', days: WEEKDAYS, start: 17 * 60 + 30, end: 21 * 60 },
  { label: 'Evenings', icon: 'moon', days: ALL_DAYS, start: 19 * 60, end: 23 * 60 },
  { label: 'Weekends', icon: 'sun', days: [0, 6], start: 10 * 60, end: 20 * 60 },
  { label: 'Any time', icon: 'bolt', days: ALL_DAYS, start: 9 * 60, end: 21 * 60 },
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
    <>
      {isLoading || !prefs ? (
        <Screen header={<NavBar onClose={() => router.back()} />}>
          <View style={{ gap: 14, paddingTop: 8 }} accessibilityLabel="Loading schedule">
            <Skeleton width="75%" height={32} radius={10} />
            <Skeleton height={64} radius={18} />
            <Skeleton height={150} radius={18} />
          </View>
        </Screen>
      ) : (
        <PrefsForm key={JSON.stringify(prefs)} initial={prefs} />
      )}
    </>
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
    <Screen
      scroll
      header={<NavBar onClose={() => router.back()} />}
      footer={
        <Button
          title="Save schedule"
          size="lg"
          onPress={submit}
          disabled={!dirty || !canSave || save.isPending}
          loading={save.isPending}
        />
      }
    >
      <View style={styles.kickerRow}>
        <Icon name="bolt" filled size={13} color={colors.accentStrong} />
        <Text style={[styles.kicker, { color: colors.accentStrong }]}>LARP CHECK</Text>
      </View>
      <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
        Your check, your schedule
      </Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Once a day we’ll ping you at a random moment inside your window. Two minutes to show what you’re working on.
        You never see the exact time. That’s the fun.
      </Text>

      <Card style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.ink }]}>Surprise Larp Checks</Text>
          <Text style={[styles.rowSub, { color: colors.muted }]}>{form.enabled ? 'On' : 'Paused'}</Text>
        </View>
        <Switch
          value={form.enabled}
          onValueChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
          trackColor={{ true: colors.good, false: colors.surface3 }}
          accessibilityLabel="Surprise Larp Checks"
        />
      </Card>

      <View style={!form.enabled && { opacity: 0.4 }} pointerEvents={form.enabled ? 'auto' : 'none'}>
        <Text style={[styles.label, { color: colors.muted }]}>Quick picks</Text>
        <View style={styles.presets}>
          {PRESETS.map((p) => {
            const on = activePreset?.label === p.label;
            return (
              <PressableScale
                key={p.label}
                scale={0.96}
                onPress={() => setForm((f) => ({ ...f, days: p.days, startMinute: p.start, endMinute: p.end }))}
                style={[
                  styles.preset,
                  { backgroundColor: on ? colors.accentSoft : colors.surface2, borderColor: on ? colors.accent : 'transparent' },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${p.label}, ${formatMinute(p.start)} to ${formatMinute(p.end)}`}
              >
                <Icon name={p.icon} size={20} color={on ? colors.accentStrong : colors.ink} />
                <Text style={[styles.presetLabel, { color: colors.ink }]}>{p.label}</Text>
                <Text style={[styles.presetMeta, { color: colors.muted }]}>
                  {formatMinute(p.start)}–{formatMinute(p.end)}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>Days</Text>
        <View style={styles.days}>
          {DAY_LABELS.map((l, d) => {
            const on = form.days.includes(d);
            return (
              <PressableScale
                key={d}
                scale={0.9}
                onPress={() => toggleDay(d)}
                style={[styles.day, { backgroundColor: on ? colors.ink : colors.fill }]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={DAY_NAMES[d]}
              >
                <Text style={[styles.dayText, { color: on ? colors.bg : colors.ink }]}>{l}</Text>
              </PressableScale>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>Window</Text>
        <Card variant="flat" style={{ gap: 12 }}>
          <TimeStepper label="Not before" value={form.startMinute} onShift={shiftStart} />
          <View style={[styles.divider, { backgroundColor: colors.line }]} />
          <TimeStepper label="Not after" value={form.endMinute} onShift={shiftEnd} />
        </Card>

        <View style={[styles.summary, { backgroundColor: colors.accentSoft }]}>
          <Icon name="bolt" filled size={16} color={colors.accentStrong} />
          <Text style={[styles.summaryText, { color: colors.ink }]}>
            One check {daySummary}, sometime between{' '}
            <Text style={{ fontFamily: fonts.bodyBold }}>{formatMinute(form.startMinute)}</Text> and{' '}
            <Text style={{ fontFamily: fonts.bodyBold }}>{formatMinute(form.endMinute)}</Text>.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function TimeStepper({ label, value, onShift }: { label: string; value: number; onShift: (delta: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepper}>
      <Text style={[styles.rowTitle, { color: colors.ink, flex: 1 }]}>{label}</Text>
      <Stepper
        label={label}
        value={formatMinute(value)}
        valueWidth={86}
        onDecrement={() => onShift(-STEP)}
        onIncrement={() => onShift(STEP)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, letterSpacing: -1, marginTop: 6 },
  sub: { fontFamily: fonts.body, fontSize: 14.5, marginTop: 8, lineHeight: 21 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15 },
  rowSub: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 22, marginBottom: 10, letterSpacing: -0.15 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { width: '31.5%', borderRadius: 18, borderWidth: 1.5, padding: 12, gap: 2 },
  presetLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, marginTop: 6 },
  presetMeta: { fontFamily: fonts.body, fontSize: 11.5 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: fonts.bodyBold, fontSize: 15 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { height: StyleSheet.hairlineWidth },
  summary: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 14, marginTop: 14 },
  summaryText: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20 },
});
