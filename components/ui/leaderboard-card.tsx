"use client"

import * as React from "react"
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native"

import { cn } from "@/lib/utils"
import { LeaderboardPodium, type LeaderboardRanking as LeaderboardPodiumRanking } from "@/components/ui/leaderboard-podium"
import { LeaderboardRankings, type LeaderboardRankingItem } from "@/components/ui/leaderboard-rankings"
import { Icon } from "@/src/components/Icon"
import { fonts, useTheme } from "@/src/theme"

interface LeaderboardRunOption {
  id: string
  label: string
}

interface LeaderboardCardProps extends Omit<ViewProps, "style"> {
  title?: string
  fromDate: string | Date
  toDate: string | Date
  podiumRankings: LeaderboardPodiumRanking[]
  rankings: LeaderboardRankingItem[]
  currentUserId?: string
  runOptions?: LeaderboardRunOption[]
  selectedRunId?: string
  onRunChange?: (runId: string) => void
  valueSuffix?: string
  formatValue?: (value: number) => string
  onUserPress?: (userId: string) => void
  headerRight?: React.ReactNode
  className?: string
  style?: StyleProp<ViewStyle>
}

function formatRangeDate(date: string | Date) {
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const LeaderboardCard = React.forwardRef<React.ComponentRef<typeof View>, LeaderboardCardProps>(
  (
    {
      className,
      style,
      title = "Leaderboard",
      fromDate,
      toDate,
      podiumRankings,
      rankings,
      currentUserId,
      runOptions,
      selectedRunId,
      onRunChange,
      valueSuffix,
      formatValue,
      onUserPress,
      headerRight,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme()
    const fromLabel = formatRangeDate(fromDate)
    const toLabel = formatRangeDate(toDate)
    const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? ""
    const hasOnRunChange = Boolean(onRunChange)
    const [localRunId, setLocalRunId] = React.useState<string | null>(null)

    const activeRunId = hasOnRunChange
      ? resolvedRunId
      : localRunId && runOptions?.some((o) => o.id === localRunId)
        ? localRunId
        : resolvedRunId

    const handleSelectRun = (runId: string) => {
      if (onRunChange) {
        onRunChange(runId)
        return
      }
      setLocalRunId(runId)
    }

    return (
      <View ref={ref} style={style} testID={cn("leaderboard-card", className)} {...props}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.ink }]} numberOfLines={1}>
              {title}
            </Text>
            {fromLabel || toLabel ? (
              <View style={styles.dateRangeRow}>
                <Icon name="calendar" size={12} color={colors.muted} />
                <Text style={[styles.dateText, { color: colors.muted }]}>
                  {fromLabel} – {toLabel}
                </Text>
              </View>
            ) : null}
          </View>

          {runOptions && runOptions.length > 0 ? (
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Select leaderboard period"
              style={[styles.runGroup, { backgroundColor: colors.fill }]}
            >
              {runOptions.map((option) => {
                const selected = option.id === activeRunId
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={option.label}
                    onPress={() => handleSelectRun(option.id)}
                    style={[styles.runOption, selected && { backgroundColor: colors.ink }]}
                  >
                    <Text style={[styles.runOptionText, { color: selected ? colors.bg : colors.muted }]}>{option.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          ) : (
            headerRight ?? null
          )}
        </View>

        <LeaderboardPodium
          rankings={podiumRankings}
          style={styles.podiumSpacing}
          valueSuffix={valueSuffix}
          formatValue={formatValue}
          onUserPress={onUserPress}
        />

        <LeaderboardRankings
          rankings={rankings}
          currentUserId={currentUserId}
          showPagination
          defaultPageSize={10}
          valueSuffix={valueSuffix}
          formatValue={formatValue}
          onUserPress={onUserPress}
        />
      </View>
    )
  }
)

LeaderboardCard.displayName = "LeaderboardCard"

const styles = StyleSheet.create({
  headerRow: { marginBottom: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  titleBlock: { gap: 3, flexShrink: 1 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 22, lineHeight: 26, letterSpacing: -0.7 },
  dateRangeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dateText: { fontFamily: fonts.body, fontSize: 12.5 },
  runGroup: { flexDirection: "row", alignItems: "center", borderRadius: 999, padding: 3, gap: 2 },
  runOption: {
    paddingHorizontal: 11,
    height: 28,
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  runOptionText: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  podiumSpacing: { marginBottom: 6 },
})

export { LeaderboardCard }
export type { LeaderboardCardProps, LeaderboardRunOption }
