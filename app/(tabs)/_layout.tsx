import type { ColorValue } from 'react-native';
import { Tabs, router } from 'expo-router';

import { Icon, type AppIconName } from '@/src/components/Icon';
import { TabBar } from '@/src/components/TabBar';
import { useTheme } from '@/src/theme';

function tabIcon(name: AppIconName) {
  function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Icon name={name} color={color} size={size} filled={focused} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: tabIcon('explore') }} />
      <Tabs.Screen
        name="start"
        options={{ title: 'Start' }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/session/new');
          },
        }}
      />
      <Tabs.Screen name="arena" options={{ title: 'Arena', tabBarIcon: tabIcon('arena') }} />
      <Tabs.Screen name="trees" options={{ title: 'Trees', tabBarIcon: tabIcon('trees') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('profile') }} />
    </Tabs>
  );
}
