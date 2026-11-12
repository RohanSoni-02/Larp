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
        Pick one. It starts with a simple community tree you can make your own later, or create your own from scratch.
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
        icon="plus"
        variant="secondary"
        onPress={() => router.push('/skills/create')}
        style={{ marginTop: 14, marginBottom: 8 }}
      />

      {CATEGORIES.map((cat) => {
        const open = openCategory === cat.category;
        return (
          <View key={cat.category} style={[styles.category, { backgroundColor: colors.surface2 }]}>
            <Pressable
              style={styles.categoryHeader}
              onPress={() => setOpenCategory(open ? null : cat.category)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              accessibilityLabel={`${cat.title} category`}
            >
              <Text style={[styles.categoryTitle, { color: colors.ink }]}>{cat.title}</Text>
              <Text style={[styles.categoryCount, { color: colors.muted }]}>{cat.names.length}</Text>
              <View style={open ? styles.chevronOpen : undefined}>
                <Icon name="chevron-right" size={14} color={colors.muted} weight="semibold" />
              </View>
            </Pressable>
            {open
              ? cat.names.map((name, i) => (
                  <View key={name} style={[styles.nameRow, { borderTopColor: colors.surface3 }]}>
                    <Text style={[styles.nameText, { color: colors.ink }]}>{name}</Text>
                    {owned.has(name.toLowerCase()) ? (
                      <View style={styles.owned}>
                        <Icon name="check" size={13} color={colors.good} weight="bold" />
                        <Text style={[styles.ownedText, { color: colors.good }]}>Added</Text>
                      </View>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34, letterSpacing: -1 },
  subtitle: { fontFamily: fonts.body, fontSize: 14.5, marginTop: 8, lineHeight: 21 },
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
  category: { borderRadius: 18, marginTop: 8, overflow: 'hidden' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, minHeight: 54 },
  categoryTitle: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: -0.2 },
  categoryCount: { fontFamily: fonts.num, fontSize: 16 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  owned: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
  nameText: { fontFamily: fonts.body, fontSize: 15, flex: 1, marginRight: 10 },
  ownedText: { fontFamily: fonts.bodyBold, fontSize: 13 },
});
