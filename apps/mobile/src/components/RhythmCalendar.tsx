import { getDaySnapshots, type DaySnapshot } from '@pax/liturgy';
import { isPaletteName, tokens } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import type { DayActivity } from '@/data/types';
import { dayStatus, rhythmOf, type DayStatus } from '@/data/streak';
import { userStore } from '@/data/userStore';
import { datesOfMonth, MONTH_NAMES, monthGrid, monthLabel, shiftMonth, weekdayName } from '@/lib/calendar';

import { BackIcon, ChevronIcon, ShieldIcon } from './Icons';
import { RhythmMarks } from './Rhythm';
import { Text } from './Text';

const CELL = 38;

/**
 * The month in Me: full, partial and missed days, each in that day's liturgical color, and a
 * shield where a grace day kept the streak (SPEC: Habit model). `version` changes whenever
 * progress does, so the month reloads after something is finished.
 */
export function RhythmCalendar({ today, version }: { today: string; version: unknown }) {
  const t = useTheme();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<{
    month: string;
    activity: Map<string, DayActivity>;
    days: Map<string, DaySnapshot>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const dates = datesOfMonth(month);
    void Promise.all([userStore.getActivity(dates[0]!, dates.at(-1)!), getDaySnapshots(dates[0]!, dates.length)]).then(
      ([activity, days]) => {
        if (cancelled) return;
        setData({
          month,
          activity: new Map(activity.map((a) => [a.date, a])),
          days: new Map(days.map((d) => [d.date, d])),
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [month, version]);

  const current = month === today.slice(0, 7);
  const loaded = data?.month === month ? data : null;
  const show = selected?.startsWith(month) ? selected : null;
  const shown = show ? loaded?.days.get(show) : undefined;
  const go = (delta: number) => {
    setMonth(shiftMonth(month, delta));
    setSelected(null);
  };

  return (
    <View
      style={{
        borderWidth: t.border.width,
        borderColor: t.neutral.border,
        borderRadius: t.radius.button,
        padding: 12,
        gap: 10,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => go(-1)} hitSlop={8} style={{ padding: 6 }}>
          <BackIcon size={22} color={t.neutral.textMuted} />
        </Pressable>
        <Text variant="bodyStrong" align="center" style={{ flex: 1, fontFamily: 'Nunito_900Black' }}>
          {monthLabel(month)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          disabled={current}
          onPress={() => go(1)}
          hitSlop={8}
          style={{ padding: 6, opacity: current ? 0.3 : 1 }}>
          <ChevronIcon size={22} color={t.neutral.textMuted} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} variant="label" align="center" color={t.neutral.textSubtle} style={{ flex: 1 }}>
            {d}
          </Text>
        ))}
      </View>

      <View style={{ gap: 4 }}>
        {monthGrid(month).map((week, w) => (
          <View key={w} style={{ flexDirection: 'row' }}>
            {week.map((date, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                {date ? (
                  <DayCell
                    date={date}
                    color={loaded?.days.get(date)?.color}
                    status={date > today ? 'future' : dayStatus(loaded?.activity.get(date))}
                    isToday={date === today}
                    selected={date === show}
                    onPress={() => setSelected(date === show ? null : date)}
                  />
                ) : (
                  <View style={{ width: CELL, height: CELL }} />
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      {show && shown ? (
        <View style={{ gap: 8, paddingTop: 4 }}>
          <View>
            <Text variant="label" caps color={t.neutral.textMuted}>
              {`${weekdayName(show)}, ${MONTH_NAMES[Number(show.slice(5, 7)) - 1]} ${Number(show.slice(8))}`}
            </Text>
            <Text variant="bodyStrong">{shown.name}</Text>
          </View>
          {show <= today ? <RhythmMarks rhythm={rhythmOf(loaded?.activity.get(show))} /> : null}
          {loaded?.activity.get(show)?.grace ? (
            <Text variant="small" color={t.neutral.textMuted}>
              A grace day kept your streak.
            </Text>
          ) : null}
        </View>
      ) : (
        <Legend />
      )}
    </View>
  );
}

function DayCell({
  date,
  color,
  status,
  isToday,
  selected,
  onPress,
}: {
  date: string;
  color: string | undefined;
  status: DayStatus | 'future';
  isToday: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const p = tokens.palettes[isPaletteName(color) ? color : 'green'][t.scheme];
  const day = Number(date.slice(8));
  const fill = status === 'full' ? p.accent : status === 'partial' ? p.tint : 'transparent';
  const border =
    status === 'full' || status === 'partial' ? p.accent : isToday || selected ? t.neutral.text : 'transparent';
  const text =
    status === 'full' ? p.onAccent : status === 'partial' ? p.text : status === 'future' ? t.neutral.textSubtle : t.neutral.textMuted;
  const label = { full: 'all three done', partial: 'partly done', grace: 'grace day', missed: 'missed', future: 'ahead' }[status];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${MONTH_NAMES[Number(date.slice(5, 7)) - 1]} ${day}, ${label}${color ? `, ${color}` : ''}`}
      onPress={onPress}
      style={{
        width: CELL,
        height: CELL,
        borderRadius: CELL / 2,
        backgroundColor: fill,
        borderWidth: t.border.width,
        borderColor: border,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text variant="small" color={text} style={{ fontFamily: 'Nunito_900Black', lineHeight: 16 }}>
        {day}
      </Text>
      {status === 'missed' || status === 'future' ? (
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color ? p.accent : 'transparent', marginTop: 1 }} />
      ) : null}
      {status === 'grace' ? (
        <View style={{ position: 'absolute', right: -3, bottom: -3 }}>
          <ShieldIcon size={15} />
        </View>
      ) : null}
    </Pressable>
  );
}

function Legend() {
  const t = useTheme();
  const swatch = (style: object) => <View style={[{ width: 14, height: 14, borderRadius: 7, borderWidth: t.border.width }, style]} />;
  const items = [
    { label: 'All three', icon: swatch({ backgroundColor: t.accent.accent, borderColor: t.accent.accent }) },
    { label: 'Some', icon: swatch({ backgroundColor: t.accent.tint, borderColor: t.accent.accent }) },
    { label: 'Missed', icon: <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.accent.accent, margin: 4 }} /> },
    { label: 'Grace', icon: <ShieldIcon size={14} /> },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 6 }}>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {it.icon}
          <Text variant="label" color={t.neutral.textMuted}>
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
