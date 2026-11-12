import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Field } from '@/src/components/Field';
import { Icon } from '@/src/components/Icon';
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
    <Screen scroll>
      <View style={styles.header}>
        <Button title="Cancel" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>
      <Text style={[styles.title, { color: colors.ink }]}>New template</Text>
      <Text style={[styles.sub, { color: colors.muted }]}>
        Split practice into blocks. You’ll get a buzz and a notification when each one ends.
      </Text>

      <View style={{ marginTop: 16 }}>
        <Field label="Name" value={name} onChangeText={setName} maxLength={40} placeholder="e.g. Scales → Song → Improv" />
      </View>

      <View style={{ gap: 8, marginTop: 8 }}>
        {blocks.map((b, i) => (
          <Card key={i} variant="flat" style={styles.block}>
            <Text style={[styles.index, { color: colors.muted }]}>{i + 1}</Text>
            <TextInput
              value={b.label}
              onChangeText={(label) => patch(i, { label })}
              maxLength={24}
              placeholder="Block name"
              placeholderTextColor={colors.muted}
              accessibilityLabel={`Block ${i + 1} name`}
              style={[styles.blockInput, { color: colors.ink }]}
            />
            <Pressable
              onPress={() => patch(i, { minutes: Math.max(STEP, b.minutes - STEP) })}
              style={[styles.step, { backgroundColor: colors.surface2 }]}
              accessibilityLabel={`Shorten block ${i + 1}`}
            >
              <Text style={[styles.stepText, { color: colors.ink }]}>−</Text>
            </Pressable>
            <Text style={[styles.mins, { color: colors.ink }]}>{b.minutes}m</Text>
            <Pressable
              onPress={() => patch(i, { minutes: Math.min(180, b.minutes + STEP) })}
              style={[styles.step, { backgroundColor: colors.surface2 }]}
              accessibilityLabel={`Lengthen block ${i + 1}`}
            >
              <Text style={[styles.stepText, { color: colors.ink }]}>+</Text>
            </Pressable>
            {blocks.length > 1 ? (
              <Pressable
                onPress={() => setBlocks((bs) => bs.filter((_, j) => j !== i))}
                hitSlop={8}
                accessibilityLabel={`Remove block ${i + 1}`}
              >
                <Icon name="close" size={16} color={colors.muted} />
              </Pressable>
            ) : null}
          </Card>
        ))}
      </View>

      {blocks.length < 12 ? (
        <Button
          title="+ Add block"
          variant="ghost"
          size="sm"
          onPress={() => setBlocks((bs) => [...bs, { label: 'Play', minutes: 10 }])}
          style={{ alignSelf: 'flex-start', marginTop: 8 }}
        />
      ) : null}

      <Button
        title={`Save template · ${planMinutes(plan)} min`}
        onPress={submit}
        disabled={!valid || save.isPending}
        loading={save.isPending}
        style={{ marginTop: 14 }}
      />

      {(saved ?? []).length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Your templates</Text>
          {(saved ?? []).map((t) => (
            <View key={t.id} style={[styles.savedRow, { borderBottomColor: colors.line }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.savedName, { color: colors.ink }]}>{t.name}</Text>
                <Text style={[styles.savedMeta, { color: colors.muted }]}>
                  {t.blocks.map((b) => `${b.label} ${b.minutes}m`).join(' → ')}
                </Text>
              </View>
              <Button title="Delete" variant="ghost" size="sm" onPress={() => remove.mutate(t.id)} />
            </View>
          ))}
        </>
      ) : null}
      <View style={{ height: 30 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-start' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, marginTop: 4 },
  sub: { fontFamily: fonts.body, fontSize: 14, marginTop: 6, lineHeight: 20 },
  block: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12 },
  index: { fontFamily: fonts.display, fontSize: 15, width: 18 },
  blockInput: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, paddingVertical: 4 },
  step: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: fonts.bodyBold, fontSize: 18 },
  mins: { fontFamily: fonts.display, fontSize: 15, minWidth: 38, textAlign: 'center' },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 14, marginTop: 26, letterSpacing: -0.15 },
  savedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  savedName: { fontFamily: fonts.bodyBold, fontSize: 15 },
  savedMeta: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 },
});
