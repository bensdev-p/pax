import { useTheme } from '@pax/tokens/react';
import { View } from 'react-native';

/**
 * The beads being prayed: prayed ones filled, the current one ringed (Rosary and chaplets). A
 * decade hangs in a gentle arc, like a strand of beads; a few beads sit in a row.
 */
export function Beads({ count, current, label = 'Hail Mary' }: { count: number; current: number; label?: string }) {
  const t = useTheme();
  const arc = count >= 7 && count <= 10;
  const middle = (count - 1) / 2;
  return (
    <View
      accessibilityLabel={`${label} ${current + 1} of ${count}`}
      style={{
        flexDirection: 'row',
        flexWrap: arc ? 'nowrap' : 'wrap',
        justifyContent: arc ? 'space-between' : 'flex-start',
        alignItems: 'flex-start',
        gap: arc ? 0 : 10,
        height: arc ? 48 : undefined,
        paddingHorizontal: arc ? 4 : 0,
        paddingVertical: 4,
      }}>
      {Array.from({ length: count }, (_, i) => {
        const done = i < current;
        const now = i === current;
        const size = now ? 30 : 22;
        const x = middle ? (i - middle) / middle : 0;
        return (
          <View
            key={i}
            style={{
              width: size,
              height: size,
              marginTop: arc ? Math.round(16 * x * x) - (now ? 4 : 0) : 0,
              borderRadius: size / 2,
              backgroundColor: done || now ? t.accent.accent : t.neutral.surface,
              borderWidth: now ? 4 : t.border.width,
              borderColor: now ? t.accent.tint : done ? t.accent.accent : t.neutral.border,
            }}
          />
        );
      })}
    </View>
  );
}
