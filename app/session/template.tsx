import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Field } from '@/src/components/Field';
import { NavBar } from '@/src/components/Header';
import { IconButton } from '@/src/components/IconButton';
import { Stepper } from '@/src/components/Stepper';
import { Screen } from '@/src/components/Screen';
import { isValidPlan, planMinutes, type TemplateBlock } from '@/src/features/templates/blocks';
import { useDeleteTemplate, useMyTemplates, useSaveTemplate } from '@/src/features/templates/hooks';
import { useSessionStore } from '@/src/stores/session';
import { fonts, useTheme } from '@/src/theme';

const STEP = 5;

export default function TemplateEditorScreen() {
  const { colors } = useTheme();
  const skillId = useSessionStore((s) => s.active?.skillId ?? null);
  const { data: saved } = useMyTemplates();
  const save = useSaveTemplate();
  const remove = useDeleteTemplate();

  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<TemplateBlock[]>([
    { label: 'Warm-up', minutes: 5 },
    { label: 'Main drill', minutes: 20 },
  ]);

  const plan = { name, blocks };
  const valid = isValidPlan(plan);

  const patch = (i: number, next: Partial<TemplateBlock>) =>
    setBlocks((bs) => bs.map((b, j) => (j === i ? { ...b, ...next } : b)));

  const submit = () =>
    save.mutate(
      { ...plan, skillId },
      {
        onSuccess: () => router.back(),
        onError: (e) => Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.'),
      },
    );

  return (
    <Screen
      scroll
      header={<NavBar onClose={() => router.back()} />}
      footer={
        <Button
          title={`Save template · ${planMinutes(plan)} min`}
          size="lg"
          onPress={submit}
          disabled={!valid || save.isPending}
          loading={save.isPending}
        />
      }
    >
      <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
        New template
      </Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Split practice into blocks. You’ll get a buzz and a notification when each one ends.
      </Text>

      <View style={{ marginTop: 16 }}>
        <Field label="Name" value={name} onChangeText={setName} maxLength={40} placeholder="e.g. Scales, song, improv" />
      </View>

      <View style={{ gap: 8, marginTop: 8 }}>
        {blocks.map((b, i) => (
          <Card key={i} variant="flat" style={styles.block}>
            <View style={[styles.index, { backgroundColor: colors.surface3 }]}>
              <Text style={[styles.indexText, { color: colors.ink }]}>{i + 1}</Text>
            </View>
            <TextInput
              value={b.label}
              onChangeText={(label) => patch(i, { label })}
              maxLength={24}
              placeholder="Block name"
              placeholderTextColor={colors.subtle}
              selectionColor={colors.accent}
              accessibilityLabel={`Block ${i + 1} name`}
              style={[styles.blockInput, { color: colors.ink }]}
            />
            <Stepper
              label={`block ${i + 1} length`}
              value={`${b.minutes}m`}
              valueWidth={44}
              canDecrement={b.minutes > STEP}
              canIncrement={b.minutes < 180}
              onDecrement={() => patch(i, { minutes: Math.max(STEP, b.minutes - STEP) })}
              onIncrement={() => patch(i, { minutes: Math.min(180, b.minutes + STEP) })}
            />
            {blocks.length > 1 ? (
              <IconButton
                name="close"
                size={15}
                color={colors.muted}
                onPress={() => setBlocks((bs) => bs.filter((_, j) => j !== i))}
                accessibilityLabel={`Remove block ${i + 1}`}
                style={styles.remove}
              />
            ) : null}
          </Card>
        ))}
      </View>

      {blocks.length < 12 ? (
        <Button
          title="Add block"
          icon="plus"
          variant="secondary"
          size="sm"
          onPress={() => setBlocks((bs) => [...bs, { label: 'Play', minutes: 10 }])}
          style={{ alignSelf: 'flex-start', marginTop: 10 }}
        />
      ) : null}

      {(saved ?? []).length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Your templates</Text>
          {(saved ?? []).map((t) => (
            <View key={t.id} style={[styles.savedRow, { borderBottomColor: colors.line }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.savedName, { color: colors.ink }]}>{t.name}</Text>
                <Text style={[styles.savedMeta, { color: colors.muted }]}>
                  {t.blocks.map((b) => `${b.label} ${b.minutes}m`).join(' · ')}
                </Text>
              </View>
              <Button title="Delete" variant="danger" size="sm" onPress={() => remove.mutate(t.id)} />
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, letterSpacing: -1, marginTop: 4 },
  sub: { fontFamily: fonts.body, fontSize: 14.5, marginTop: 8, lineHeight: 21 },
  block: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingLeft: 12, paddingRight: 8 },
  index: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontFamily: fonts.num, fontSize: 14 },
  blockInput: { flex: 1, minWidth: 0, fontFamily: fonts.bodyBold, fontSize: 15, paddingVertical: 4 },
  remove: { width: 28, height: 34 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 26, letterSpacing: -0.15 },
  savedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  savedName: { fontFamily: fonts.bodyBold, fontSize: 15 },
  savedMeta: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 },
});
