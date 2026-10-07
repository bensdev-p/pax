import { useTheme } from '@pax/tokens/react';
import { View } from 'react-native';

import { Pax, type PaxMood } from './Pax';
import { Screen } from './Screen';
import { Text } from './Text';

/** A friendly "coming soon" screen for tabs that arrive in later phases. */
export function Placeholder({ title, line, mood = 'hint' }: { title: string; line: string; mood?: PaxMood }) {
  const t = useTheme();
  return (
    <Screen scroll={false} contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
      <Pax mood={mood} size={180} />
      <View style={{ gap: 6, alignItems: 'center', paddingHorizontal: 12 }}>
        <Text variant="display" align="center" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="bodyStrong" align="center" color={t.neutral.textMuted}>
          {line}
        </Text>
      </View>
    </Screen>
  );
}
