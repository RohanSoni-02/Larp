import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';

import { Screen } from '@/src/components/Screen';
import { fonts, useTheme } from '@/src/theme';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  return (
    <Screen contentStyle={styles.content}>
      <Text style={[styles.title, { color: colors.ink }]}>This branch hasn't grown yet</Text>
      <Link href="/" style={[styles.link, { color: colors.primary }]}>
        Back to home
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontFamily: fonts.display, fontSize: 20 },
  link: { fontFamily: fonts.bodyBold, fontSize: 16 },
});
