import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { cn } from '@/lib/utils';
import { Avatar } from '@/src/components/Avatar';
import { fonts, tierMetal, useTheme } from '@/src/theme';

export interface LeaderboardRanking {
  userId: string;
  userName: string;
  rank: number;
  value: number;
  avatarUrl?: string;
  avatarColor?: string;
  byline?: string;
  valueLabel?: string;
}

export interface LeaderboardPodiumProps {
  rankings: LeaderboardRanking[];
  className?: string;
  style?: StyleProp<ViewStyle>;
  valueSuffix?: string;
  formatValue?: (value: number) => string;
  onUserPress?: (userId: string) => void;
}

function CrownIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"
        fill={color}
      />
      <Path d="M5 21h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

const RANK_LOOK: Record<number, { metal: string; avatar: number; pedestal: number }> = {
  1: { metal: tierMetal[3], avatar: 68, pedestal: 92 },
  2: { metal: tierMetal[2], avatar: 54, pedestal: 68 },
  3: { metal: tierMetal[1], avatar: 54, pedestal: 52 },
};

export const LeaderboardPodium = React.forwardRef<React.ComponentRef<typeof View>, LeaderboardPodiumProps>(
  ({ rankings, className, style, valueSuffix, formatValue, onUserPress }, ref) => {
    const { colors } = useTheme();

    // Classic 2 - 1 - 3 order
    const orderedSlots = React.useMemo(() => {
      const byRank = new Map<number, LeaderboardRanking>();
      for (const item of rankings) {
        if (item.rank >= 1 && item.rank <= 3 && !byRank.has(item.rank)) byRank.set(item.rank, item);
      }
      const sorted = [...rankings].sort((a, b) => a.rank - b.rank);
      const first = byRank.get(1) ?? sorted[0];
      const second = byRank.get(2) ?? sorted[1];
      const third = byRank.get(3) ?? sorted[2];
      return [
        second ? { ...second, rank: 2 } : null,
        first ? { ...first, rank: 1 } : null,
        third ? { ...third, rank: 3 } : null,
      ];
    }, [rankings]);

    if (rankings.length === 0) return null;

    const renderValue = (item: LeaderboardRanking) => {
      if (item.valueLabel) return item.valueLabel;
      if (formatValue) return formatValue(item.value);
      const base = item.value.toLocaleString();
      return valueSuffix ? `${base} ${valueSuffix}` : base;
    };

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel="Leaderboard top 3 podium"
        style={[styles.container, style]}
        testID={cn('leaderboard-podium', className)}
      >
        {orderedSlots.map((slot, idx) => {
          if (!slot) return <View key={`empty-${idx}`} style={styles.column} />;
          const look = RANK_LOOK[slot.rank] ?? RANK_LOOK[3]!;
          const isFirst = slot.rank === 1;

          const content = (
            <View style={styles.columnInner}>
              <View style={styles.crownSlot}>{isFirst ? <CrownIcon color={look.metal} size={22} /> : null}</View>
              <View
                style={[
                  styles.avatarRing,
                  {
                    width: look.avatar + 8,
                    height: look.avatar + 8,
                    borderRadius: (look.avatar + 8) / 2,
                    borderColor: look.metal,
                  },
                ]}
              >
                {slot.avatarUrl ? (
                  <Image
                    source={{ uri: slot.avatarUrl }}
                    accessibilityLabel={slot.userName}
                    style={{ width: look.avatar, height: look.avatar, borderRadius: look.avatar / 2 }}
                  />
                ) : (
                  <Avatar name={slot.userName} color={slot.avatarColor} size={look.avatar} shape="circle" />
                )}
                <View style={[styles.rankBadge, { backgroundColor: look.metal, borderColor: colors.bg }]}>
                  <Text style={styles.rankBadgeText}>{slot.rank}</Text>
                </View>
              </View>
              <Text style={[styles.userName, { color: colors.ink }]} numberOfLines={1}>
                {slot.userName}
              </Text>
              <Text style={[styles.scoreText, { color: isFirst ? colors.ink : colors.muted }]} numberOfLines={1}>
                {renderValue(slot)}
              </Text>
              <View
                style={[
                  styles.pedestal,
                  { height: look.pedestal, backgroundColor: isFirst ? colors.accent : colors.surface2 },
                ]}
              >
                <Text style={[styles.pedestalRank, { color: isFirst ? colors.accentInk : colors.subtle }]}>{slot.rank}</Text>
              </View>
            </View>
          );

          if (onUserPress) {
            return (
              <Pressable
                key={slot.userId}
                style={({ pressed }) => [styles.column, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => onUserPress(slot.userId)}
                accessibilityRole="button"
                accessibilityLabel={`Place ${slot.rank}: ${slot.userName}, ${renderValue(slot)}`}
              >
                {content}
              </Pressable>
            );
          }
          return (
            <View key={slot.userId} style={styles.column}>
              {content}
            </View>
          );
        })}
      </View>
    );
  },
);

LeaderboardPodium.displayName = 'LeaderboardPodium';

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  column: { flex: 1, alignItems: 'center' },
  columnInner: { width: '100%', alignItems: 'center' },
  crownSlot: { height: 26, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12 },
  rankBadge: {
    position: 'absolute',
    bottom: -9,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 11, lineHeight: 13 },
  userName: { fontFamily: fonts.bodyBold, fontSize: 13.5, letterSpacing: -0.2, textAlign: 'center', maxWidth: '96%' },
  scoreText: { fontFamily: fonts.num, fontSize: 16, marginTop: 1, marginBottom: 10, fontVariant: ['tabular-nums'] },
  pedestal: {
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    alignItems: 'center',
    paddingTop: 10,
  },
  pedestalRank: { fontFamily: fonts.numHeavy, fontSize: 30 },
});
