import { useTheme } from '@pax/tokens/react';
import { Pressable } from 'react-native';

import { Text } from './Text';

/** One option of a segmented choice (Appearance, the Rosary's language): Pax's own, not the system's. */
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 44,
        borderRadius: t.radius.tile,
        borderWidth: t.border.width,
        borderColor: selected ? t.accent.accent : t.neutral.border,
        backgroundColor: selected ? t.accent.tint : t.neutral.surface,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
      }}>
      <Text variant="small" style={{ fontFamily: 'Nunito_900Black' }} color={selected ? t.accent.text : t.neutral.textMuted}>
        {label}
      </Text>
    </Pressable>
  );
}
