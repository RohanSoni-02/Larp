import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import SphereImageGrid from '@/components/ui/img-sphere';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { NavBar } from '@/src/components/Header';
import { useSession } from '@/src/features/auth/SessionProvider';
import { addSkillToPortfolio } from '@/src/features/skills/api';
import { CATEGORIES, createCustomSkill, SWATCHES, TREE_TEMPLATE } from '@/src/features/skills/catalog';
import { useUsableSkills } from '@/src/features/skills/hooks';
import { buildCatalogSphereImages } from '@/src/features/skills/skillImages';
import { fonts, useTheme } from '@/src/theme';
import type { SkillCategory } from '@/src/types/app';

export default function AddSkillScreen() {
  const { colors } = useTheme();
  const { session } = useSession();
  const meId = session?.user?.id;
  const { data: usable } = useUsableSkills();
  const [openCategory, setOpenCategory] = useState<SkillCategory | null>(CATEGORIES[0]!.category);
  const [busyName, setBusyName] = useState<string | null>(null);

  const owned = useMemo(
    () => new Set((usable ?? []).filter((s) => s.status !== 'approved').map((s) => s.lower_name)),
    [usable],
  );

  const quickAdd = useCallback(
    async (name: string, category: SkillCategory, index: number) => {
      if (!meId || busyName) return;
      setBusyName(name);
      try {
        const skillId = await createCustomSkill(meId, {
          name,
          category,
          color: SWATCHES[index % SWATCHES.length]!,
          kudoLabel: 'Nice progress',
          classTitle: 'Adventurer',
          branches: TREE_TEMPLATE.map((b) => ({ name: b.branch, steps: b.steps })),
        });
        await addSkillToPortfolio(meId, skillId);
        router.back();
      } catch (e) {
        Alert.alert('Could not add skill', e instanceof Error ? e.message : 'Try again.');
      } finally {
        setBusyName(null);
      }
    },
    [meId, busyName],
  );

  const activeCategoryGroup = useMemo(
    () => CATEGORIES.find((c) => c.category === openCategory) ?? CATEGORIES[0]!,
    [openCategory],
  );

  const sphereImages = useMemo(
    () =>
      buildCatalogSphereImages(
        activeCategoryGroup.names.map((name, idx) => {
          const isOwned = owned.has(name.toLowerCase());
          return {
            id: `${activeCategoryGroup.category}-${name}`,
            name,
            category: activeCategoryGroup.category,
            color: SWATCHES[idx % SWATCHES.length]!,
            owned: isOwned,
            actionLabel: isOwned ? undefined : 'Add to my skills',
            onAction: isOwned ? undefined : () => void quickAdd(name, activeCategoryGroup.category, idx),
          };
        }),
        24,
      ),
    [activeCategoryGroup, owned, quickAdd],
  );

  return (
    <Screen scroll header={<NavBar onClose={() => router.back()} />}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>Add a skill</Text>
      </View>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        Pick one — it starts with a simple community tree you can make your own later. Or create your own from scratch.
      </Text>

      <Card style={styles.sphereCard}>
        <View style={styles.sphereHeader}>
          <Text style={[styles.sphereTitle, { color: colors.ink }]}>
            {activeCategoryGroup.title} · {activeCategoryGroup.names.length} skills
          </Text>
          <Text style={[styles.sphereHint, { color: colors.muted }]}>Drag to spin · tap an orb</Text>
        </View>
        <SphereImageGrid
          images={sphereImages}
          containerSize={290}
          sphereRadius={114}
          dragSensitivity={0.75}
          baseImageScale={0.15}
          autoRotate
          autoRotateSpeed={0.22}
          showLabels
        />
      </Card>

      <Button
        title="Create your own skill"
        variant="secondary"
        onPress={() => router.push('/skills/create')}
        style={{ marginTop: 14, marginBottom: 8 }}
      />

      {CATEGORIES.map((cat) => {
        const open = openCategory === cat.category;
        return (
          <View key={cat.category} style={[styles.category, { borderColor: colors.line, backgroundColor: colors.surface }]}>
            <Pressable
              style={styles.categoryHeader}
              onPress={() => setOpenCategory(open ? null : cat.category)}
              accessibilityLabel={`${cat.title} category`}
            >
              <Text style={[styles.categoryTitle, { color: colors.ink }]}>{cat.title}</Text>
              <Icon name="chevron-right" size={16} color={colors.muted} />
            </Pressable>
            {open
              ? cat.names.map((name, i) => (
                  <View key={name} style={[styles.nameRow, { borderTopColor: colors.line }]}>
                    <Text style={[styles.nameText, { color: colors.ink }]}>{name}</Text>
                    {owned.has(name.toLowerCase()) ? (
                      <Text style={[styles.ownedText, { color: colors.good }]}>Added</Text>
                    ) : (
                      <Button
                        title={busyName === name ? 'Adding…' : 'Add'}
                        size="sm"
                        variant="secondary"
                        disabled={Boolean(busyName)}
                        onPress={() => void quickAdd(name, cat.category, i)}
                      />
                    )}
                  </View>
                ))
              : null}
          </View>
        );
      })}
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, letterSpacing: -1 },
  subtitle: { fontFamily: fonts.body, fontSize: 14, marginTop: 6, lineHeight: 20 },
  sphereCard: { marginTop: 14, alignItems: 'center', overflow: 'hidden' },
  sphereHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sphereTitle: { fontFamily: fonts.bodyBold, fontSize: 15 },
  sphereHint: { fontFamily: fonts.body, fontSize: 12.5 },
  category: { borderWidth: 1, borderRadius: 16, marginTop: 12, overflow: 'hidden' },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  categoryTitle: { fontFamily: fonts.bodyBold, fontSize: 16 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderTopWidth: 1 },
  nameText: { fontFamily: fonts.body, fontSize: 15, flex: 1, marginRight: 10 },
  ownedText: { fontFamily: fonts.bodyBold, fontSize: 13 },
});
