import { ScrollView, StyleSheet, View } from 'react-native';

import { dayKey } from '@/src/lib/format';
import { useTheme } from '@/src/theme';

type HeatmapProps = {
  /** local date (YYYY-MM-DD) → minutes practised */
  minutesByDay: Record<string, number>;
  weeks?: number;
};

/** GitHub-style practice heatmap: 7 rows × N week columns, oldest first. */
export function Heatmap({ minutesByDay, weeks = 14 }: HeatmapProps) {
  const { colors } = useTheme();
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  // Start on the Monday `weeks-1` weeks ago.
  const start = new Date(end);
  start.setDate(start.getDate() - ((end.getDay() + 6) % 7) - 7 * (weeks - 1));

  const columns: { key: string; level: number }[][] = [];
  let col: { key: string; level: number }[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const minutes = minutesByDay[dayKey(d)] ?? 0;
    const level = minutes === 0 ? 0 : minutes < 20 ? 1 : minutes < 40 ? 2 : minutes < 70 ? 3 : 4;
    col.push({ key: dayKey(d), level });
    if (col.length === 7) {
      columns.push(col);
      col = [];
    }
  }
  if (col.length) columns.push(col);

  const shade = [colors.heat0, colors.heat1, colors.heat2, colors.heat3, colors.heat4];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.grid} accessibilityLabel={`Practice heatmap for the last ${weeks} weeks`}>
        {columns.map((column, i) => (
          <View key={i} style={styles.col}>
            {column.map((cell) => (
              <View
                key={cell.key}
                style={[styles.cell, { backgroundColor: shade[cell.level] }]}
                accessibilityLabel={`${cell.key}: ${Math.round(minutesByDay[cell.key] ?? 0)} minutes`}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 3 },
  col: { gap: 3 },
  cell: { width: 15, height: 15, borderRadius: 4 },
});
