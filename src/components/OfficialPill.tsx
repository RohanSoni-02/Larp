import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { fonts, useTheme } from '@/src/theme';

/**
 * Marks an account run by the larpr team. It takes the place of the tier pill:
 * guides have no earned tier, and the label is how people know the post is
 * editorial starter content rather than a member's own practice.
 */
export function OfficialPill() {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.pill, { backgroundColor: colors.accentSoft }]}
      accessibilityLabel="Official larpr guide"
    >
      <Icon name="mentor" filled size={11} color={colors.accentStrong} />
      <Text style={[styles.text, { color: colors.accentStrong }]}>Guide</Text>
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
  text: { fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: -0.05 },
});
