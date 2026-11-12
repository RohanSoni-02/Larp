import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { withAlpha } from '@/src/lib/color';
import { TIER_NAMES } from '@/src/types/app';
import { fonts, tierMetal, useTheme } from '@/src/theme';

type StampProps = {
  tier: string;
  skillName: string;
  size?: number;
};

/** Tier medal used on profile ladders, share cards and tier-up. */
export function Stamp({ tier, skillName, size = 104 }: StampProps) {
  const { colors } = useTheme();
  const index = Math.max(0, TIER_NAMES.indexOf(tier as (typeof TIER_NAMES)[number]));
  const metal = tierMetal[index];
  return (
    <View
      accessibilityLabel={`${tier} in ${skillName}`}
      style={[
        styles.medal,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: withAlpha(metal, 0.55),
          backgroundColor: withAlpha(metal, 0.1),
        },
      ]}
    >
      <View style={[styles.inner, { borderRadius: size / 2, borderColor: withAlpha(metal, 0.22) }]}>
        <Icon name={index === 3 ? 'verified' : 'medal'} size={Math.round(size * 0.24)} color={metal} />
        <Text style={[styles.tier, { color: colors.ink, fontSize: size * 0.14 }]} numberOfLines={1} adjustsFontSizeToFit>
          {tier}
        </Text>
        <Text style={[styles.skill, { color: colors.muted, fontSize: Math.max(9, size * 0.1) }]} numberOfLines={1}>
          {skillName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  medal: { borderWidth: 1.5, padding: 5 },
  inner: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 1,
  },
  tier: { fontFamily: fonts.display, letterSpacing: -0.3, marginTop: 2 },
  skill: { fontFamily: fonts.bodyMedium },
});
