import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';

/** Web (testing only) keeps Pax's own tab bar; phones use the native one in `_layout.tsx`. */
export default function TabLayout() {
  return (
    <Tabs initialRouteName="today" screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="pray" options={{ title: 'Pray' }} />
      <Tabs.Screen name="study" options={{ title: 'Study' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
