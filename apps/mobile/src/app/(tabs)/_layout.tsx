import { useTheme } from '@pax/tokens/react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

/**
 * The system tab bar (Ben, Phase 3, on trial): iOS draws its own (Liquid Glass on iOS 26, SF
 * Symbols, tap again to scroll to the top); Android draws Material 3's navigation bar with
 * Material Symbols. Tinted with the day's liturgical color. To go back to Pax's own bar, delete
 * this file and rename `_layout.web.tsx` to `_layout.tsx`.
 */
export default function TabLayout() {
  const t = useTheme();
  return (
    <NativeTabs
      tintColor={t.accent.accent}
      iconColor={{ default: t.neutral.textSubtle, selected: t.accent.accent }}
      labelStyle={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 10 }}
      indicatorColor={t.accent.tint}>
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} md="sunny" />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pray">
        <NativeTabs.Trigger.Icon sf={{ default: 'hands.and.sparkles', selected: 'hands.and.sparkles.fill' }} md="folded_hands" />
        <NativeTabs.Trigger.Label>Pray</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="study">
        <NativeTabs.Trigger.Icon sf={{ default: 'graduationcap', selected: 'graduationcap.fill' }} md="school" />
        <NativeTabs.Trigger.Label>Study</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Icon sf={{ default: 'books.vertical', selected: 'books.vertical.fill' }} md="local_library" />
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="me">
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
        <NativeTabs.Trigger.Label>Me</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
