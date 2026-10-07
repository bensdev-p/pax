import { useTheme } from '@pax/tokens/react';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tabs } from 'expo-router/js-tabs';

import { LearnIcon, LibraryIcon, PrayIcon, ProfileIcon, TodayIcon } from './Icons';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, (p: { size: number }) => React.ReactElement> = {
  today: TodayIcon,
  learn: LearnIcon,
  library: LibraryIcon,
  pray: PrayIcon,
  profile: ProfileIcon,
};

/** 30 px two-tone icons; the active tab sits in an outlined box tinted with the accent. */
export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 6,
        paddingTop: 8,
        paddingHorizontal: 10,
        paddingBottom: Math.max(insets.bottom, 12),
        borderTopWidth: t.border.width,
        borderTopColor: t.neutral.divider,
        backgroundColor: t.neutral.background,
      }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options;
        const Icon = ICONS[route.name];
        if (!Icon) return null;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options?.title ?? route.name}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={({ pressed }) => ({
              flex: 1,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: t.radius.tile,
              borderWidth: t.border.width,
              borderColor: focused ? t.accent.accent : 'transparent',
              backgroundColor: focused ? t.accent.tint : 'transparent',
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}>
            <Icon size={t.size.tabIcon} />
          </Pressable>
        );
      })}
    </View>
  );
}
