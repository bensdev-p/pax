import { useTheme } from '@pax/tokens/react';
import { Pressable, View } from 'react-native';

import { Text } from './Text';

/**
 * A chunky hour/minute stepper in plain JS, so it runs in Expo Go without a native picker.
 * Value is "HH:MM" (24-hour); minutes move in 5-minute steps.
 */
export function TimePicker({ value, onChange }: { value: string; onChange: (hhmm: string) => void }) {
  const t = useTheme();
  const [h, m] = value.split(':').map(Number) as [number, number];
  const pm = h >= 12;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const set = (hours: number, mins: number) =>
    onChange(`${String(((hours % 24) + 24) % 24).padStart(2, '0')}:${String(((mins % 60) + 60) % 60).padStart(2, '0')}`);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: t.radius.tile,
        backgroundColor: t.neutral.surfaceMuted,
      }}>
      <Stepper label="hour" value={String(hour12)} onMinus={() => set(h - 1, m)} onPlus={() => set(h + 1, m)} />
      <Text variant="headline">:</Text>
      <Stepper
        label="minutes"
        value={String(m).padStart(2, '0')}
        onMinus={() => set(m === 0 ? h - 1 : h, m - 5)}
        onPlus={() => set(m === 55 ? h + 1 : h, m + 5)}
      />
      <View style={{ gap: 6, marginLeft: 4 }}>
        {(['AM', 'PM'] as const).map((label) => {
          const on = (label === 'PM') === pm;
          return (
            <Pressable
              key={label}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => !on && set(h + 12, m)}
              style={{
                width: 52,
                height: 34,
                borderRadius: t.radius.chip,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: t.border.width,
                borderColor: on ? t.accent.accent : t.neutral.border,
                backgroundColor: on ? t.accent.tint : t.neutral.surface,
              }}>
              <Text variant="label" color={on ? t.accent.text : t.neutral.textMuted}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const t = useTheme();
  const button = (sign: '−' | '+', onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${sign === '+' ? 'Later' : 'Earlier'} ${label}`}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.neutral.surface,
        borderWidth: t.border.width,
        borderColor: t.neutral.border,
        borderBottomWidth: pressed ? t.border.width : 4,
        marginTop: pressed ? 2 : 0,
      })}>
      <Text variant="title" color={t.neutral.textMuted}>
        {sign}
      </Text>
    </Pressable>
  );
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      {button('+', onPlus)}
      <Text variant="display" accessibilityLabel={`${label} ${value}`} style={{ minWidth: 44, textAlign: 'center' }}>
        {value}
      </Text>
      {button('−', onMinus)}
    </View>
  );
}
