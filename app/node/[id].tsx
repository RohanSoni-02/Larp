import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { useMarkNodeInProgress, useNodeDetail } from '@/src/features/trees/hooks';
import { fonts, useTheme } from '@/src/theme';

const STATE_COPY: Record<string, string> = {
  landed: 'Landed. Gold on your tree.',
  in_progress: 'In progress — keep at it.',
  available: 'Ready to start.',
  locked: 'Land the node below first.',
};

export default function NodeScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: node, isLoading } = useNodeDetail(id);
  const markInProgress = useMarkNodeInProgress();

  if (isLoading || !node) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.body, { color: colors.muted }]}>Loading node…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={[styles.kicker, { color: colors.muted }]}>
        {node.skillName} · {node.branchName}
      </Text>
      <Text style={[styles.title, { color: colors.ink }]}>{node.name}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{STATE_COPY[node.state]}</Text>

      <View style={[styles.progressCard, { backgroundColor: colors.surface2, borderColor: colors.surface2 }]}>
        <Text style={[styles.progressBig, { color: colors.ink }]}>
          {node.sessionsLogged} of {node.sessionsToLand}
        </Text>
        <Text style={[styles.progressSub, { color: colors.muted }]}>sessions logged on this node</Text>
      </View>

      {node.requiresVideo ? (
        <Text style={[styles.videoNote, { color: colors.gold }]}>
          This node asks for video proof when you land it — add a clip when you save the session.
        </Text>
      ) : null}

      {node.landedBy.length > 0 ? (
        <View style={styles.landedBy}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>Landed by people you follow</Text>
          <View style={styles.avatars}>
            {node.landedBy.map((u) => (
              <View key={u.id} style={{ marginRight: -8 }}>
                <Avatar name={u.name} color={u.color} size={34} />
              </View>
            ))}
          </View>
          <Text style={[styles.body, { color: colors.muted }]}>{node.landedBy.map((u) => u.name.split(' ')[0]).join(', ')}</Text>
        </View>
      ) : null}

      <Button
        title="Practise this now"
        onPress={() =>
          router.push({ pathname: '/session/new', params: { skillId: node.skillId, nodeId: node.id } })
        }
        disabled={node.state === 'locked'}
        style={{ marginTop: 22 }}
      />
      {node.state === 'available' ? (
        <Button
          title="Mark as in progress"
          variant="secondary"
          onPress={() => markInProgress.mutate(node.id)}
          loading={markInProgress.isPending}
          style={{ marginTop: 10 }}
        />
      ) : null}
      <Button title="Close" variant="ghost" onPress={() => router.back()} style={{ marginTop: 10 }} />
      <View style={{ height: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15, marginTop: 8 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 32, marginTop: 6 },
  body: { fontFamily: fonts.body, fontSize: 15, marginTop: 8, lineHeight: 22 },
  progressCard: { borderWidth: 1, borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 18 },
  progressBig: { fontFamily: fonts.displayHeavy, fontSize: 34 },
  progressSub: { fontFamily: fonts.body, fontSize: 13, marginTop: 4 },
  videoNote: { fontFamily: fonts.body, fontSize: 14, marginTop: 14, lineHeight: 20 },
  landedBy: { marginTop: 20, gap: 8 },
  sectionLabel: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: -0.15 },
  avatars: { flexDirection: 'row', paddingLeft: 8 },
});
