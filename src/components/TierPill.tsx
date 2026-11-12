import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { TIER_NAMES } from '@/src/types/app';
import { fonts, tierMetal, useTheme } from '@/src/theme';

type TierPillProps = {
  tier: string;
  /** "Larping" reads as "Day one" for brand-new practitioners. */
  showDayOne?: boolean;
};

export function TierPill({ tier, showDayOne = true }: TierPillProps) {
  const { colors } = useTheme();
  const index = Math.max(0, TIER_NAMES.indexOf(tier as (typeof TIER_NAMES)[number]));
  const isLarping = tier === 'Larping';
  const isLegit = tier === 'Legit';
  const label = isLarping && showDayOne ? 'Day one' : tier;
  return (
    <View
      style={[styles.pill, { backgroundColor: isLegit ? colors.goldSoft : colors.surface2 }]}
      accessibilityLabel={isLarping && showDayOne ? 'Tier Larping, day one' : `Tier ${tier}`}
    >
      {isLegit ? (
        <Icon name="verified" size={11} color={colors.gold} />
      ) : (
        <View style={[styles.dot, { backgroundColor: tierMetal[index] }]} />
      )}
      <Text style={[styles.text, { color: isLegit ? colors.gold : colors.ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 22,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: -0.05 },
});
