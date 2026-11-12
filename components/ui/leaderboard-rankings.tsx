import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { cn } from '@/lib/utils';
import { Avatar } from '@/src/components/Avatar';
import { IconButton } from '@/src/components/IconButton';
import { fonts, tierMetal, useTheme } from '@/src/theme';

export interface LeaderboardRankingItem {
  userId: string;
  rank: number;
  userName: string;
  byline?: string;
  value: number;
  displayed?: boolean;
  avatarUrl?: string;
  avatarColor?: string;
  valueLabel?: string;
}

export interface LeaderboardRankingsProps {
  rankings: LeaderboardRankingItem[];
  currentUserId?: string;
  showPagination?: boolean;
  defaultPageSize?: number;
  /** Show only the first N rows (no pagination); the current user stays pinned below. */
  limit?: number;
  valueSuffix?: string;
  formatValue?: (value: number) => string;
  onUserPress?: (userId: string) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const MEDAL: Record<number, string> = { 1: tierMetal[3], 2: tierMetal[2], 3: tierMetal[1] };

export const LeaderboardRankings = React.forwardRef<React.ComponentRef<typeof View>, LeaderboardRankingsProps>(
  (
    { rankings, currentUserId, showPagination = false, defaultPageSize = 10, limit, valueSuffix, formatValue, onUserPress, className, style },
    ref,
  ) => {
    const { colors } = useTheme();
    const [page, setPage] = React.useState(0);

    const visibleItems = React.useMemo(
      () =>
        rankings
          .filter((item) => item.displayed !== false || item.userId === currentUserId)
          .sort((a, b) => a.rank - b.rank),
      [rankings, currentUserId],
    );

    const pageSize = Math.max(1, defaultPageSize);
    const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize));
    const currentPage = Math.min(page, Math.max(0, totalPages - 1));

    const pagedItems = React.useMemo(() => {
      if (limit) return visibleItems.slice(0, limit);
      if (!showPagination) return visibleItems;
      const start = currentPage * pageSize;
      return visibleItems.slice(start, start + pageSize);
    }, [visibleItems, showPagination, currentPage, pageSize, limit]);

    const pinnedCurrentUser = React.useMemo(() => {
      if (!currentUserId) return null;
      if (pagedItems.some((item) => item.userId === currentUserId)) return null;
      return visibleItems.find((item) => item.userId === currentUserId) ?? null;
    }, [currentUserId, pagedItems, visibleItems]);

    const renderScore = (item: LeaderboardRankingItem) => {
      if (item.valueLabel) return item.valueLabel;
      if (formatValue) return formatValue(item.value);
      const base = item.value.toLocaleString();
      return valueSuffix ? `${base} ${valueSuffix}` : base;
    };

    const renderRow = (item: LeaderboardRankingItem, isPinned = false, isFirstRow = false) => {
      const isCurrentUser = Boolean(currentUserId && item.userId === currentUserId);
      const medal = MEDAL[item.rank];

      const rowInner = (
        <View
          style={[
            styles.row,
            !isFirstRow && !isCurrentUser && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
            isCurrentUser && { backgroundColor: colors.accentSoft, borderRadius: 14 },
          ]}
        >
          <View style={styles.rankCell}>
            {medal ? <View style={[styles.medalDot, { backgroundColor: medal }]} /> : null}
            <Text style={[styles.rankText, { color: medal ? colors.ink : colors.muted }]}>{item.rank}</Text>
          </View>

          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} accessibilityLabel={item.userName} style={styles.avatarImage} />
          ) : (
            <Avatar name={item.userName} color={item.avatarColor} size={40} />
          )}

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.ink }]} numberOfLines={1}>
                {item.userName}
              </Text>
              {isCurrentUser ? (
                <View style={[styles.youBadge, { backgroundColor: colors.ink }]}>
                  <Text style={[styles.youBadgeText, { color: colors.bg }]}>You</Text>
                </View>
              ) : null}
            </View>
            {item.byline ? (
              <Text style={[styles.byline, { color: colors.muted }]} numberOfLines={1}>
                {item.byline}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.valueText, { color: colors.ink }]}>{renderScore(item)}</Text>
        </View>
      );

      const key = isPinned ? `pinned-${item.userId}` : item.userId;
      if (onUserPress) {
        return (
          <Pressable
            key={key}
            onPress={() => onUserPress(item.userId)}
            accessibilityRole="button"
            accessibilityLabel={`Rank ${item.rank}, ${item.userName}, ${renderScore(item)}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {rowInner}
          </Pressable>
        );
      }
      return <View key={key}>{rowInner}</View>;
    };

    if (visibleItems.length === 0) {
      return (
        <View ref={ref} style={[styles.emptyBox, { backgroundColor: colors.surface2 }, style]} testID={cn('leaderboard-rankings', className)}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No rankings recorded for this period yet.</Text>
        </View>
      );
    }

    return (
      <View ref={ref} style={[styles.listContainer, style]} testID={cn('leaderboard-rankings', className)}>
        <View>{pagedItems.map((item, i) => renderRow(item, false, i === 0))}</View>

        {pinnedCurrentUser ? (
          <View style={styles.pinnedSection}>
            <View style={styles.pinnedDivider}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.pinnedDot, { backgroundColor: colors.subtle }]} />
              ))}
            </View>
            {renderRow(pinnedCurrentUser, true, true)}
          </View>
        ) : null}

        {showPagination && !limit && totalPages > 1 ? (
          <View style={[styles.paginationBar, { borderTopColor: colors.line }]}>
            <Text style={[styles.pageInfo, { color: colors.muted }]}>
              Page {currentPage + 1} of {totalPages}
            </Text>
            <View style={styles.pageButtons}>
              <IconButton
                name="back"
                variant="tonal"
                size={15}
                accessibilityLabel="Previous page"
                disabled={currentPage === 0}
                onPress={() => setPage(Math.max(0, currentPage - 1))}
              />
              <IconButton
                name="chevron-right"
                variant="tonal"
                size={15}
                accessibilityLabel="Next page"
                disabled={currentPage >= totalPages - 1}
                onPress={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              />
            </View>
          </View>
        ) : null}
      </View>
    );
  },
);

LeaderboardRankings.displayName = 'LeaderboardRankings';

const styles = StyleSheet.create({
  listContainer: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 8 },
  rankCell: { width: 26, alignItems: 'center', gap: 3 },
  medalDot: { width: 6, height: 6, borderRadius: 3 },
  rankText: { fontFamily: fonts.num, fontSize: 17, fontVariant: ['tabular-nums'] },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  userInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontFamily: fonts.bodyBold, fontSize: 14.5, letterSpacing: -0.2, flexShrink: 1 },
  youBadge: { borderRadius: 999, paddingHorizontal: 7, height: 18, justifyContent: 'center' },
  youBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10.5 },
  byline: { fontFamily: fonts.body, fontSize: 12.5, marginTop: 1 },
  valueText: { fontFamily: fonts.num, fontSize: 19, fontVariant: ['tabular-nums'], marginLeft: 6 },
  pinnedSection: { marginTop: 4, gap: 4 },
  pinnedDivider: { flexDirection: 'row', justifyContent: 'center', gap: 4, paddingVertical: 6 },
  pinnedDot: { width: 3, height: 3, borderRadius: 2 },
  paginationBar: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageInfo: { fontFamily: fonts.body, fontSize: 13 },
  pageButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyBox: { paddingVertical: 24, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
});
