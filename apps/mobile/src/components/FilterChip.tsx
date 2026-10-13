import { useTheme } from '@pax/tokens/react';
import { Pressable } from 'react-native';

import { Text } from './Text';

/** One choice in a row of chips (prayer book sections, the Fathers' eras). */
export function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        height: 36,
        justifyContent: 'center',
        borderRadius: t.radius.chip,
        borderWidth: t.border.width,
        borderColor: selected ? t.accent.accent : t.neutral.border,
        backgroundColor: selected ? t.accent.tint : 'transparent',
      }}>
      <Text variant="small" style={{ fontFamily: 'Nunito_800ExtraBold' }} color={selected ? t.accent.text : t.neutral.textMuted}>
        {label}
      </Text>
    </Pressable>
  );
}
