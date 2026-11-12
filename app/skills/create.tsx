import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { useSession } from '@/src/features/auth/SessionProvider';
import { addSkillToPortfolio } from '@/src/features/skills/api';
import { findNearDuplicate, SWATCHES, TREE_TEMPLATE } from '@/src/features/skills/catalog';
import { useCreateCustomSkill, useUsableSkills } from '@/src/features/skills/hooks';
import { fonts, useTheme } from '@/src/theme';
import { CATEGORY_LABELS, type SkillCategory } from '@/src/types/app';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as SkillCategory[];

export default function CreateSkillScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const meId = session?.user?.id;
  const { data: usable } = useUsableSkills();
  const createSkill = useCreateCustomSkill();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('crafts');
  const [color, setColor] = useState(SWATCHES[0]!);
  const [kudoLabel, setKudoLabel] = useState('');
  const [classTitle, setClassTitle] = useState('');
  const [steps, setSteps] = useState<string[][]>(TREE_TEMPLATE.map((b) => [...b.steps, '']));

  const duplicate = useMemo(
    () => (name.trim() ? findNearDuplicate(name, (usable ?? []).map((s) => ({ id: s.id, name: s.name }))) : null),
    [name, usable],
  );

  const setStep = (bi: number, si: number, value: string) => {
    setSteps((prev) => prev.map((branch, i) => (i === bi ? branch.map((s, j) => (j === si ? value : s)) : branch)));
  };

  const submit = async () => {
    if (!meId || !name.trim() || duplicate) return;
    try {
      const skillId = await createSkill.mutateAsync({
        name: name.trim(),
        category,
        color,
        kudoLabel: kudoLabel.trim() || 'Nice progress',
        classTitle: classTitle.trim() || 'Adventurer',
        branches: TREE_TEMPLATE.map((b, i) => ({ name: b.branch, steps: steps[i] ?? [] })),
      });
      await addSkillToPortfolio(meId, skillId);
      router.back();
    } catch (e) {
      Alert.alert('Could not create skill', e instanceof Error ? e.message : 'Try again.');
    }
  };

  const inputStyle = [styles.input, { backgroundColor: colors.surface2, borderColor: colors.surface2, color: colors.ink }] as const;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Create a skill</Text>
        <Button title="Close" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>

      <Text style={[styles.label, { color: colors.muted }]}>Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. Kendama" placeholderTextColor={colors.muted} style={inputStyle} />
      {duplicate ? (
        <Text style={[styles.duplicate, { color: colors.bad }]}>
          “{duplicate.name}” already exists — add that one instead so the community grows together.
        </Text>
      ) : null}

      <Text style={[styles.label, { color: colors.muted }]}>Category</Text>
      <View style={styles.wrapRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            style={[styles.pill, { borderColor: 'transparent', backgroundColor: c === category ? colors.ink : colors.fill }]}
          >
            <Text style={[styles.pillText, { color: c === category ? colors.bg : colors.ink }]}>{CATEGORY_LABELS[c]}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.muted }]}>Colour</Text>
      <View style={styles.wrapRow}>
        {SWATCHES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setColor(s)}
            accessibilityLabel={`Colour ${s}`}
            style={[styles.swatch, { backgroundColor: s, borderWidth: color === s ? 3 : 0, borderColor: colors.ink }]}
          />
        ))}
      </View>

      <Text style={[styles.label, { color: colors.muted }]}>Signature kudo (optional)</Text>
      <TextInput value={kudoLabel} onChangeText={setKudoLabel} placeholder='e.g. "Smooth landing"' placeholderTextColor={colors.muted} style={inputStyle} />

      <Text style={[styles.label, { color: colors.muted }]}>Class title (optional)</Text>
      <TextInput value={classTitle} onChangeText={setClassTitle} placeholder='e.g. "Kendama Knight"' placeholderTextColor={colors.muted} style={inputStyle} />

      <Text style={[styles.label, { color: colors.muted }]}>Starter tree — up to 4 steps per branch</Text>
      {TREE_TEMPLATE.map((branch, bi) => (
        <View key={branch.branch} style={{ marginTop: 10 }}>
          <Text style={[styles.branchName, { color: colors.ink }]}>{branch.branch}</Text>
          {(steps[bi] ?? []).map((step, si) => (
            <TextInput
              key={si}
              value={step}
              onChangeText={(v) => setStep(bi, si, v)}
              placeholder={`Step ${si + 1}`}
              placeholderTextColor={colors.muted}
              style={[inputStyle, { marginTop: 6 }]}
            />
          ))}
        </View>
      ))}

      <Button
        title={createSkill.isPending ? 'Creating…' : 'Create skill'}
        onPress={submit}
        disabled={!name.trim() || Boolean(duplicate) || createSkill.isPending}
        loading={createSkill.isPending}
        style={{ marginTop: 22 }}
      />
      <View style={{ height: 30 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 28 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15, marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonts.body, fontSize: 15 },
  duplicate: { fontFamily: fonts.body, fontSize: 13, marginTop: 6, lineHeight: 18 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  swatch: { width: 34, height: 34, borderRadius: 17 },
  branchName: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
