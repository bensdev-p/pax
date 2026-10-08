import { useTheme } from '@pax/tokens/react';
import { View } from 'react-native';

/** A row of beads: prayed ones filled, the current one ringed (Rosary and chaplets). */
export function Beads({ count, current, label = 'Hail Mary' }: { count: number; current: number; label?: string }) {
  const t = useTheme();
  return (
    <View
      accessibilityLabel={`${label} ${current + 1} of ${count}`}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 }}>
      {Array.from({ length: count }, (_, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <View
            key={i}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: done || now ? t.accent.accent : t.neutral.surface,
              borderWidth: now ? 4 : t.border.width,
              borderColor: now ? t.accent.tint : done ? t.accent.accent : t.neutral.border,
              transform: [{ scale: now ? 1.15 : 1 }],
            }}
          />
        );
      })}
    </View>
  );
}
