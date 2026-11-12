import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Chip } from '@/src/components/Chip';
import { Field } from '@/src/components/Field';
import { Icon } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { Screen } from '@/src/components/Screen';
import { NavBar } from '@/src/components/Header';
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

  const inputStyle = [styles.input, { backgroundColor: colors.surface, borderColor: colors.surface, color: colors.ink }] as const;

  return (
    <Screen
      scroll
      header={<NavBar onClose={() => router.back()} />}
      footer={
        <Button
          title={createSkill.isPending ? 'Creating…' : 'Create skill'}
          size="lg"
          onPress={submit}
          disabled={!name.trim() || Boolean(duplicate) || createSkill.isPending}
          loading={createSkill.isPending}
        />
      }
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>Create a skill</Text>
      </View>

      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Kendama" />
      {duplicate ? (
        <Text style={[styles.duplicate, { color: colors.bad }]}>
          “{duplicate.name}” already exists. Add that one instead so the community grows together.
        </Text>
      ) : null}

      <Text style={[styles.label, { color: colors.muted }]}>Category</Text>
      <View style={styles.wrapRow}>
        {CATEGORIES.map((c) => (
          <Chip key={c} size="sm" label={CATEGORY_LABELS[c]} selected={c === category} onPress={() => setCategory(c)} />
        ))}
      </View>

      <Text style={[styles.label, { color: colors.muted }]}>Colour</Text>
      <View style={styles.wrapRow}>
        {SWATCHES.map((s) => (
          <PressableScale
            key={s}
            scale={0.88}
            onPress={() => setColor(s)}
            accessibilityRole="radio"
            accessibilityState={{ selected: color === s }}
            accessibilityLabel={`Colour ${s}`}
            style={[styles.swatchRing, { borderColor: color === s ? colors.ink : 'transparent' }]}
          >
            <View style={[styles.swatch, { backgroundColor: s }]}>
              {color === s ? <Icon name="check" size={15} color="#FFFFFF" weight="bold" /> : null}
            </View>
          </PressableScale>
        ))}
      </View>

      <View style={{ marginTop: 20 }}>
        <Field label="Signature kudo (optional)" value={kudoLabel} onChangeText={setKudoLabel} placeholder="e.g. Smooth landing" />
        <Field label="Class title (optional)" value={classTitle} onChangeText={setClassTitle} placeholder="e.g. Kendama Knight" />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.ink }]}>Starter tree</Text>
      <Text style={[styles.sectionSub, { color: colors.muted }]}>Up to 4 steps per branch. You can change them later.</Text>
      {TREE_TEMPLATE.map((branch, bi) => (
        <View key={branch.branch} style={[styles.branch, { backgroundColor: colors.surface2 }]}>
          <Text style={[styles.branchName, { color: colors.ink }]}>{branch.branch}</Text>
          {(steps[bi] ?? []).map((step, si) => (
            <TextInput
              key={si}
              value={step}
              onChangeText={(v) => setStep(bi, si, v)}
              placeholder={`Step ${si + 1}`}
              placeholderTextColor={colors.subtle}
              selectionColor={colors.accent}
              accessibilityLabel={`${branch.branch} step ${si + 1}`}
              style={[inputStyle, { marginTop: 6 }]}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, letterSpacing: -1 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonts.body, fontSize: 15 },
  duplicate: { fontFamily: fonts.body, fontSize: 13, marginTop: 6, lineHeight: 18 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatchRing: { borderWidth: 2, borderRadius: 22, padding: 2 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: fonts.display, fontSize: 19, letterSpacing: -0.4, marginTop: 14 },
  sectionSub: { fontFamily: fonts.body, fontSize: 13.5, marginTop: 3, marginBottom: 4 },
  branch: { marginTop: 10, borderRadius: 18, padding: 12, paddingTop: 14 },
  branchName: { fontFamily: fonts.bodyBold, fontSize: 15, marginLeft: 2 },
});
