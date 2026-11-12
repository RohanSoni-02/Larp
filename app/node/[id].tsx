import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/src/components/Appear';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { NavBar } from '@/src/components/Header';
import { Icon, type AppIconName } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { Skeleton } from '@/src/components/Skeleton';
import { useMarkNodeInProgress, useNodeDetail } from '@/src/features/trees/hooks';
import { fonts, useTheme } from '@/src/theme';

const STATE: Record<string, { label: string; icon: AppIconName; copy: string }> = {
  landed: { label: 'Landed', icon: 'check-circle', copy: 'Gold on your tree.' },
  in_progress: { label: 'In progress', icon: 'timer', copy: 'Keep at it.' },
  available: { label: 'Ready to start', icon: 'play', copy: 'Log a session on it to begin.' },
  locked: { label: 'Locked', icon: 'lock', copy: 'Land the node below first.' },
};

export default function NodeScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: node, isLoading } = useNodeDetail(id);
  const markInProgress = useMarkNodeInProgress();
  const close = () => router.back();

  if (isLoading || !node) {
    return (
      <Screen header={<NavBar onClose={close} />}>
        <View style={styles.loading} accessibilityLabel="Loading node">
          <Skeleton width={150} height={14} />
          <Skeleton width="70%" height={34} radius={10} />
          <Skeleton width="100%" height={120} radius={24} style={{ marginTop: 12 }} />
        </View>
      </Screen>
    );
  }

  const state = STATE[node.state]!;
  const landed = node.state === 'landed';
  const tint = landed ? colors.gold : node.state === 'locked' ? colors.subtle : colors.accentStrong;
  const pips = Array.from({ length: node.sessionsToLand }, (_, i) => i < node.sessionsLogged);

  return (
    <Screen
      scroll
      header={<NavBar onClose={close} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Practise this now"
            icon="play"
            size="lg"
            onPress={() => router.push({ pathname: '/session/new', params: { skillId: node.skillId, nodeId: node.id } })}
            disabled={node.state === 'locked'}
          />
          {node.state === 'available' ? (
            <Button
              title="Mark as in progress"
              variant="secondary"
              onPress={() => markInProgress.mutate(node.id)}
              loading={markInProgress.isPending}
            />
          ) : null}
        </View>
      }
    >
      <Appear>
        <Text style={[styles.kicker, { color: colors.muted }]}>
          {node.skillName} · {node.branchName}
        </Text>
        <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
          {node.name}
        </Text>
        <View style={[styles.statePill, { backgroundColor: landed ? colors.goldSoft : colors.surface2 }]}>
          <Icon name={state.icon} filled size={14} color={tint} />
          <Text style={[styles.stateLabel, { color: landed ? colors.gold : colors.ink }]}>{state.label}</Text>
          <Text style={[styles.stateCopy, { color: colors.muted }]}>{state.copy}</Text>
        </View>
      </Appear>

      <Appear delay={70}>
        <View
          style={[styles.progressCard, { backgroundColor: colors.surface2 }]}
          accessibilityLabel={`${node.sessionsLogged} of ${node.sessionsToLand} sessions logged on this node`}
        >
          <View style={styles.progressTop}>
            <Text style={[styles.progressBig, { color: colors.ink }]}>
              {node.sessionsLogged}
              <Text style={[styles.progressOf, { color: colors.muted }]}>/{node.sessionsToLand}</Text>
            </Text>
            <Text style={[styles.progressSub, { color: colors.muted }]}>sessions logged{'\n'}on this node</Text>
          </View>
          <View style={styles.pips}>
            {pips.map((on, i) => (
              <View key={i} style={[styles.pip, { backgroundColor: on ? (landed ? colors.gold : colors.accent) : colors.surface3 }]} />
            ))}
          </View>
        </View>

        {node.requiresVideo ? (
          <View style={[styles.note, { backgroundColor: colors.goldSoft }]}>
            <Icon name="video" size={18} color={colors.gold} />
            <Text style={[styles.noteText, { color: colors.ink }]}>
              This node asks for video proof when you land it. Add a clip when you save the session.
            </Text>
          </View>
        ) : null}

        {node.landedBy.length > 0 ? (
          <View style={styles.landedBy}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>Landed by people you follow</Text>
            <View style={styles.landedRow}>
              <View style={styles.avatars}>
                {node.landedBy.map((u) => (
                  <View key={u.id} style={[styles.avatarRing, { borderColor: colors.bg }]}>
                    <Avatar name={u.name} color={u.color} size={34} />
                  </View>
                ))}
              </View>
              <Text style={[styles.landedNames, { color: colors.ink }]} numberOfLines={2}>
                {node.landedBy.map((u) => u.name.split(' ')[0]).join(', ')}
              </Text>
            </View>
          </View>
        ) : null}
      </Appear>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { gap: 12, paddingTop: 8 },
  footer: { gap: 10 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 13.5, letterSpacing: -0.1, marginTop: 4 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 38, letterSpacing: -1.2, marginTop: 6 },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 32,
    marginTop: 14,
  },
  stateLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5 },
  stateCopy: { fontFamily: fonts.body, fontSize: 13.5, flexShrink: 1 },
  progressCard: { borderRadius: 24, padding: 20, marginTop: 22, gap: 16 },
  progressTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  progressBig: { fontFamily: fonts.numHeavy, fontSize: 56, lineHeight: 58, fontVariant: ['tabular-nums'] },
  progressOf: { fontFamily: fonts.numMedium, fontSize: 30 },
  progressSub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19 },
  pips: { flexDirection: 'row', gap: 6 },
  pip: { flex: 1, height: 8, borderRadius: 4 },
  note: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 14, marginTop: 12 },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  landedBy: { marginTop: 26, gap: 10 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15 },
  landedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatars: { flexDirection: 'row', paddingLeft: 8 },
  avatarRing: { marginLeft: -8, borderWidth: 2, borderRadius: 13 },
  landedNames: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14.5 },
});
