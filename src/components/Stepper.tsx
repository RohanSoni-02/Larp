import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { PressableScale } from '@/src/components/PressableScale';
import { fonts, useTheme } from '@/src/theme';

type StepperProps = {
  /** Already formatted for display ("9 am", "20 min"). */
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Names what is being adjusted, for screen readers. */
  label: string;
  canDecrement?: boolean;
  canIncrement?: boolean;
  /** Width reserved for the value so the buttons do not shift as it changes. */
  valueWidth?: number;
};

/** Minus / value / plus control for small numeric adjustments. */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  label,
  canDecrement = true,
  canIncrement = true,
  valueWidth = 64,
}: StepperProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${value}`}>
      <PressableScale
        onPress={onDecrement}
        disabled={!canDecrement}
        disabledOpacity={0.3}
        scale={0.88}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        style={[styles.btn, { backgroundColor: colors.fill }]}
      >
        <Icon name="minus" size={16} color={colors.ink} weight="bold" />
      </PressableScale>
      <Text style={[styles.value, { color: colors.ink, minWidth: valueWidth }]}>{value}</Text>
      <PressableScale
        onPress={onIncrement}
        disabled={!canIncrement}
        disabledOpacity={0.3}
        scale={0.88}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        style={[styles.btn, { backgroundColor: colors.fill }]}
      >
        <Icon name="plus" size={16} color={colors.ink} weight="bold" />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: fonts.num, fontSize: 19, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
