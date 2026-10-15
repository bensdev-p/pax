import { useTheme } from '@pax/tokens/react';
import { Pressable } from 'react-native';

import { useTapTwice } from '@/lib/useTapTwice';

import { Text } from './Text';

/**
 * A quiet text link for something that can't be undone (decided with Ben, from the Fathers
 * download's Remove): the first tap only turns the words red and asks for a second tap, which
 * does it. No button and no fill, on purpose.
 */
export function TapTwiceLink({
  label,
  armedLabel,
  accessibilityLabel,
  onConfirm,
}: {
  label: string;
  armedLabel: string;
  accessibilityLabel?: string;
  onConfirm: () => void;
}) {
  const t = useTheme();
  const tap = useTapTwice(onConfirm);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tap.armed ? armedLabel : (accessibilityLabel ?? label)}
      hitSlop={8}
      onPress={tap.press}
      style={{ paddingVertical: 6 }}>
      <Text variant="label" caps color={tap.armed ? t.game.incorrect : t.neutral.textMuted}>
        {tap.armed ? armedLabel : label}
      </Text>
    </Pressable>
  );
}
