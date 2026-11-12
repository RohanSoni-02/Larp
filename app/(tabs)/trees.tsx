import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import SphereImageGrid from '@/components/ui/img-sphere';
import { Button } from '@/src/components/Button';
import { Chip } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { TopBar } from '@/src/components/Header';
import { Icon } from '@/src/components/Icon';
import { IconButton } from '@/src/components/IconButton';
import { ProgressBar } from '@/src/components/ProgressBar';
import { PressableScale } from '@/src/components/PressableScale';
import { Screen } from '@/src/components/Screen';
import { Skeleton } from '@/src/components/Skeleton';
import { useSession } from '@/src/features/auth/SessionProvider';
import { inviteMessage } from '@/src/features/invite/api';
import { useMyProfile } from '@/src/features/profile/hooks';
import { buildPortfolioSphereImages } from '@/src/features/skills/skillImages';
import { useMyPortfolio, useSkillTree } from '@/src/features/trees/hooks';
import { BRANCH_COLORS, TreeSvg, useTreePalette } from '@/src/features/trees/TreeSvg';
import { useUiStore } from '@/src/stores/ui';
import { fonts, GUTTER, useTheme } from '@/src/theme';

function LegendItem({ kind, label }: { kind: 'landed' | 'progress' | 'ready' | 'locked'; label: string }) {
  const { colors } = useTheme();
  const palette = useTreePalette();
  const c = BRANCH_COLORS[0];
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendGlyph,
          kind === 'landed' && { backgroundColor: c },
          kind === 'progress' && { borderWidth: 2, borderColor: c },
          kind === 'ready' && { borderWidth: 1.5, borderColor: c, borderStyle: 'dashed' },
          kind === 'locked' && { backgroundColor: palette.lockedFill, borderWidth: 1, borderColor: palette.lockedStroke },
        ]}
      >
        {kind === 'landed' ? <Icon name="check" size={10} color="#FFFFFF" weight="bold" /> : null}
        {kind === 'locked' ? <Icon name="lock" size={8} color={palette.lockedGlyph} /> : null}
      </View>
      <Text style={[styles.legendText, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export default function TreesScreen() {
  const { colors } = useTheme();
  const { data: portfolio } = useMyPortfolio();
  const { session } = useSession();
  const { data: profile } = useMyProfile(session?.user?.id);
  const treeSkillId = useUiStore((s) => s.treeSkillId);
  const setTreeSkillId = useUiStore((s) => s.setTreeSkillId);
  const [showSphere, setShowSphere] = useState(true);

  const skills = useMemo(() => (portfolio ?? []).map((us) => us.skills).filter(Boolean), [portfolio]);

  useEffect(() => {
    if (skills.length > 0 && !skills.some((s) => s!.id === treeSkillId)) {
      setTreeSkillId(skills[0]!.id);
    }
  }, [skills, treeSkillId, setTreeSkillId]);

  const selectedId = treeSkillId ?? skills[0]?.id ?? null;
  const { data: tree } = useSkillTree(selectedId ?? undefined);

  // The node to work on next: one already under way, otherwise the first that is open.
  const upNext = useMemo(() => {
    const nodes = (tree?.branches ?? []).flatMap((b, bi) => b.nodes.map((n) => ({ ...n, branchName: b.name, branchSlot: bi })));
    return (
      nodes
        .filter((n) => n.state === 'in_progress')
        .sort((a, b) => b.sessionsLogged / b.sessionsToLand - a.sessionsLogged / a.sessionsToLand)[0] ??
      nodes.find((n) => n.state === 'available') ??
      null
    );
  }, [tree]);

  const sphereImages = useMemo(
    () =>
      buildPortfolioSphereImages(portfolio ?? [], {
        actionLabel: 'Switch to this skill tree',
        onSelectSkill: (skill) => setTreeSkillId(skill.id),
      }),
    [portfolio, setTreeSkillId],
  );

  return (
    <Screen
      scroll
      padded={false}
      edges={['top']}
      header={
        <TopBar
          title="Skill trees"
          right={
            <>
              {skills.length > 1 ? (
                <IconButton
                  name="globe"
                  onPress={() => setShowSphere((prev) => !prev)}
                  accessibilityLabel={showSphere ? 'Hide skill sphere' : 'Show skill sphere'}
                  color={showSphere ? colors.ink : colors.muted}
                  size={22}
                />
              ) : null}
              <IconButton name="plus" onPress={() => router.push('/skills/add')} accessibilityLabel="Add a skill" size={24} />
            </>
          }
        />
      }
    >
      <Text style={[styles.subtitle, { color: colors.muted }]}>What to practise next, one node at a time.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {skills.map((skill) => (
          <Chip
            key={skill!.id}
            label={skill!.name}
            selected={skill!.id === selectedId}
            onPress={() => setTreeSkillId(skill!.id)}
            color={skill!.color}
          />
        ))}
        <Chip label="Add a skill" icon="plus" selected={false} onPress={() => router.push('/skills/add')} />
      </ScrollView>

      {skills.length === 0 ? (
        <EmptyState
          icon="trees"
          title="No skills yet"
          body="Add your first skill and its tree appears here, ready to climb."
          action={<Button title="Add a skill" icon="plus" size="sm" onPress={() => router.push('/skills/add')} />}
        />
      ) : tree ? (
        <>
          <View style={[styles.summary, { backgroundColor: colors.surface2 }]}>
            <View style={styles.summaryHead}>
              <View style={[styles.skillDot, { backgroundColor: tree.skill.color }]} />
              <Text style={[styles.skillName, { color: colors.ink }]} numberOfLines={1}>
                {tree.skill.name}
              </Text>
              {tree.skill.is_custom ? (
                <View style={[styles.communityPill, { backgroundColor: colors.surface3 }]}>
                  <Text style={[styles.communityPillText, { color: colors.ink }]}>Community skill</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.statsRow}>
              <View>
                <Text style={[styles.statValue, { color: colors.ink }]}>
                  {tree.landedCount}
                  <Text style={[styles.statOf, { color: colors.muted }]}>/{tree.totalCount}</Text>
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Nodes landed</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.surface3 }]} />
              <View>
                <Text style={[styles.statValue, { color: colors.ink }]}>{tree.xp.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>XP earned</Text>
              </View>
            </View>
            <ProgressBar
              progress={tree.totalCount ? tree.landedCount / tree.totalCount : 0}
              color={tree.skill.color}
              trackColor={colors.surface3}
              height={8}
            />
          </View>

          {upNext ? (
            <View style={[styles.upNext, { backgroundColor: colors.night }]}>
              <PressableScale
                scale={0.98}
                pressedOpacity={0.7}
                onPress={() => router.push({ pathname: '/node/[id]', params: { id: upNext.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Up next: ${upNext.name}, ${upNext.sessionsLogged} of ${upNext.sessionsToLand} sessions`}
                style={styles.upNextText}
              >
                <Text style={[styles.upNextKicker, { color: colors.nightMuted }]}>
                  {upNext.state === 'in_progress' ? 'Keep going' : 'Up next'} · {upNext.branchName}
                </Text>
                <Text style={[styles.upNextName, { color: colors.nightInk }]} numberOfLines={1}>
                  {upNext.name}
                </Text>
                <View style={styles.upNextPips}>
                  {Array.from({ length: upNext.sessionsToLand }, (_, i) => (
                    <View
                      key={i}
                      style={[styles.upNextPip, { backgroundColor: i < upNext.sessionsLogged ? colors.nightInk : colors.nightLine }]}
                    />
                  ))}
                  <Text style={[styles.upNextCount, { color: colors.nightMuted }]}>
                    {upNext.sessionsLogged}/{upNext.sessionsToLand}
                  </Text>
                </View>
              </PressableScale>
              <PressableScale
                scale={0.92}
                onPress={() => router.push({ pathname: '/session/new', params: { skillId: tree.skill.id, nodeId: upNext.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Practise ${upNext.name} now`}
                style={[styles.upNextBtn, { backgroundColor: colors.accent }]}
              >
                <Icon name="play" size={16} color={colors.accentInk} />
                <Text style={[styles.upNextBtnText, { color: colors.accentInk }]}>Practise</Text>
              </PressableScale>
            </View>
          ) : null}

          <View style={styles.actionsWrap}>
            <View style={styles.treeActions}>
              <Button
                title="Leaderboard"
                icon="podium"
                variant="secondary"
                size="sm"
                style={styles.treeAction}
                onPress={() =>
                  router.push({
                    pathname: '/leaderboard',
                    params: { skillId: tree.skill.id, title: tree.skill.name, color: tree.skill.color },
                  })
                }
              />
              <Button
                title="Mentors"
                icon="mentor"
                variant="secondary"
                size="sm"
                style={styles.treeAction}
                onPress={() => router.push({ pathname: '/mentorship/ask', params: { skillId: tree.skill.id } })}
              />
              {profile ? (
                <Button
                  title="Invite"
                  icon="person-add"
                  variant="secondary"
                  size="sm"
                  style={styles.treeAction}
                  onPress={() =>
                    void Share.share({
                      message: inviteMessage(profile.display_name, profile.handle, {
                        name: tree.skill.name,
                        slug: tree.skill.slug,
                      }),
                    })
                  }
                />
              ) : null}
            </View>
          </View>

          <View style={[styles.treeCard, { backgroundColor: colors.surface2, borderColor: colors.surface2 }]}>
            <TreeSvg
              tree={tree}
              onNodePress={(node) => router.push({ pathname: '/node/[id]', params: { id: node.id } })}
            />
          </View>

          <View style={styles.legend}>
            <LegendItem kind="landed" label="Landed" />
            <LegendItem kind="progress" label="Sessions logged, out of 5" />
            <LegendItem kind="ready" label="Ready to start" />
            <LegendItem kind="locked" label="Land the node below first" />
          </View>
        </>
      ) : selectedId ? (
        <View style={styles.loading} accessibilityLabel="Loading skill tree">
          <Skeleton height={168} radius={24} />
          <Skeleton height={420} radius={24} />
        </View>
      ) : null}

      {skills.length > 1 && showSphere ? (
        <View style={[styles.sphereCard, { backgroundColor: colors.surface2 }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sphereTitle, { color: colors.ink }]}>Your skills</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{skills.length} skills · drag to spin</Text>
          </View>
          <SphereImageGrid
            images={sphereImages}
            containerSize={300}
            sphereRadius={118}
            dragSensitivity={0.75}
            baseImageScale={0.15}
            autoRotate
            autoRotateSpeed={0.22}
            selectedSkillId={selectedId}
            showLabels
            onSelectImage={(img) => {
              if (img.skillId) setTreeSkillId(img.skillId);
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: fonts.body, fontSize: 14.5, paddingHorizontal: GUTTER, marginTop: -2, marginBottom: 14 },
  loading: { gap: 12, paddingHorizontal: GUTTER, marginTop: 18 },
  chips: { gap: 8, paddingHorizontal: GUTTER },
  rowBetween: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  meta: { fontFamily: fonts.body, fontSize: 13 },
  sphereCard: { marginTop: 28, marginHorizontal: GUTTER, borderRadius: 24, padding: 16, alignItems: 'center', overflow: 'hidden' },
  sphereTitle: { fontFamily: fonts.display, fontSize: 17, letterSpacing: -0.35 },
  summary: { marginTop: 18, marginHorizontal: GUTTER, borderRadius: 24, padding: 18, gap: 14 },
  upNext: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, marginHorizontal: GUTTER, borderRadius: 24, padding: 18 },
  upNextText: { flex: 1, minWidth: 0 },
  upNextKicker: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  upNextName: { fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.5, marginTop: 2 },
  upNextPips: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  upNextPip: { width: 18, height: 5, borderRadius: 3 },
  upNextCount: { fontFamily: fonts.num, fontSize: 15, marginLeft: 6, fontVariant: ['tabular-nums'] },
  upNextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, borderRadius: 21, paddingHorizontal: 16 },
  upNextBtnText: { fontFamily: fonts.bodyBold, fontSize: 14.5, letterSpacing: -0.15 },
  actionsWrap: { marginTop: 12, paddingHorizontal: GUTTER },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skillDot: { width: 12, height: 12, borderRadius: 6 },
  skillName: { fontFamily: fonts.displayHeavy, fontSize: 26, lineHeight: 30, letterSpacing: -0.8, flexShrink: 1 },
  communityPill: { borderRadius: 999, paddingHorizontal: 9, height: 22, justifyContent: 'center' },
  communityPillText: { fontFamily: fonts.bodyBold, fontSize: 11.5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  statValue: { fontFamily: fonts.numHeavy, fontSize: 36, lineHeight: 38, fontVariant: ['tabular-nums'] },
  statOf: { fontFamily: fonts.numMedium, fontSize: 22 },
  statLabel: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 1 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  treeActions: { flexDirection: 'row', gap: 8 },
  treeAction: { flex: 1, paddingHorizontal: 8 },
  treeCard: {
    marginTop: 12,
    marginHorizontal: GUTTER,
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, marginTop: 16, paddingHorizontal: GUTTER },
  legendItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  legendGlyph: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  legendText: { fontFamily: fonts.body, fontSize: 12.5, flexShrink: 1 },
});
