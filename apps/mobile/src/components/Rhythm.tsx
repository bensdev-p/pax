import { useTheme } from '@pax/tokens/react';
import { View } from 'react-native';

import type { GraceOffer, Rhythm } from '@/data/types';
import { weekdayList } from '@/lib/calendar';

import { CheckIcon, ShieldIcon } from './Icons';
import { Pax } from './Pax';
import { RaisedButton } from './Raised';
import { Text } from './Text';

export const RHYTHM_MARKS: { key: keyof Rhythm; label: string }[] = [
  { key: 'read', label: 'Read' },
  { key: 'pray', label: 'Pray' },
  { key: 'study', label: 'Study' },
];

/** Today's three marks as pills: filled with the accent once done (SPEC: Habit model). */
export function RhythmMarks({ rhythm, colors }: { rhythm: Rhythm; colors?: { accent: string; onAccent: string } }) {
  const t = useTheme();
  const accent = colors?.accent ?? t.accent.accent;
  const onAccent = colors?.onAccent ?? t.accent.onAccent;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {RHYTHM_MARKS.map(({ key, label }) => {
        const done = rhythm[key];
        return (
          <View
            key={key}
            accessibilityLabel={`${label}: ${done ? 'done' : 'not yet'}`}
            style={{
              flex: 1,
              height: 34,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: t.radius.chip,
              borderWidth: t.border.width,
              borderColor: done ? accent : t.neutral.border,
              backgroundColor: done ? accent : 'transparent',
            }}>
            {done ? (
              <CheckIcon size={14} color={onAccent} />
            ) : (
              <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: t.neutral.textSubtle }} />
            )}
            <Text variant="label" caps color={done ? onAccent : t.neutral.textMuted}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Pax offers grace days for the missed days before today, and lets the user decline. Calm,
 * never guilt-driven (SPEC: Pax the mascot).
 */
export function GraceOfferCard({
  offer,
  left,
  onAnswer,
}: {
  offer: GraceOffer;
  left: number;
  onAnswer: (accept: boolean) => void;
}) {
  const t = useTheme();
  const n = offer.dates.length;
  return (
    <View
      style={{
        borderWidth: t.border.width,
        borderColor: t.neutral.border,
        borderRadius: t.radius.button,
        padding: 14,
        gap: 12,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pax mood="encouraging" size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldIcon size={18} />
            <Text variant="label" caps color={t.neutral.textMuted}>
              {left} grace {left === 1 ? 'day' : 'days'} this month
            </Text>
          </View>
          <Text variant="body">
            {`${weekdayList(offer.dates)} slipped by. Use ${n === 1 ? 'a grace day' : `${n} grace days`} to keep your ${offer.streak}\u2011day streak?`}
          </Text>
        </View>
      </View>
      <View>
        <RaisedButton label="Keep my streak" height={46} onPress={() => onAnswer(true)} />
        <RaisedButton kind="ghost" label="Start fresh" onPress={() => onAnswer(false)} />
      </View>
    </View>
  );
}
