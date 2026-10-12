import { getDaySnapshots, type DaySnapshot } from '@pax/liturgy';
import { isPaletteName, paletteLabel, tokens } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { DayActivity } from '@/data/types';
import { dayStatus, rhythmOf, type DayStatus } from '@/data/streak';
import { userStore } from '@/data/userStore';
import { datesOfMonth, MONTH_NAMES, monthGrid, monthLabel, shiftMonth, weekdayName } from '@/lib/calendar';

import { BackIcon, ChevronIcon } from './Icons';
import { RhythmMarks } from './Rhythm';
import { Text } from './Text';

const CELL = 36;
/** The cell with room for the selection ring around the day's circle. */
const RING = 44;

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

      <View style={{ gap: 0 }}>
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
                  <View style={{ width: RING, height: RING }} />
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      {show && shown ? <DayDetails date={show} day={shown} activity={loaded?.activity.get(show)} past={show <= today} /> : null}

      <Legend />
    </View>
  );
}

/** The tapped day, in that day's liturgical color. */
function DayDetails({
  date,
  day,
  activity,
  past,
}: {
  date: string;
  day: DaySnapshot;
  activity: DayActivity | undefined;
  past: boolean;
}) {
  const t = useTheme();
  const name = isPaletteName(day.color) ? day.color : 'green';
  const p = tokens.palettes[name][t.scheme];
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        padding: 10,
        borderRadius: t.radius.tile,
        backgroundColor: p.tint,
      }}>
      <View style={{ width: 5, borderRadius: 3, backgroundColor: p.accent }} />
      <View style={{ flex: 1, gap: 8 }}>
        <View>
          <Text variant="label" caps color={p.text}>
            {`${weekdayName(date)}, ${MONTH_NAMES[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8))}`}
          </Text>
          <Text variant="bodyStrong" color={p.text} style={{ fontFamily: 'Nunito_900Black' }}>
            {day.name}
          </Text>
          <Text variant="small" color={t.neutral.textMuted}>
            {`${day.rankName} · ${paletteLabel(name)}`}
          </Text>
        </View>
        {past ? <RhythmMarks rhythm={rhythmOf(activity)} colors={p} /> : null}
        {activity?.grace ? (
          <Text variant="small" color={t.neutral.textMuted}>
            A grace day kept your streak.
          </Text>
        ) : null}
      </View>
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
  const circle = status === 'full' || status === 'partial';
  const fill = status === 'full' ? p.accent : status === 'partial' ? p.tint : 'transparent';
  const border = circle ? p.accent : isToday ? t.neutral.text : 'transparent';
  const text =
    status === 'full'
      ? p.onAccent
      : status === 'partial' || status === 'grace'
        ? p.text
        : status === 'future'
          ? t.neutral.textSubtle
          : t.neutral.textMuted;
  const label = { full: 'all three done', partial: 'partly done', grace: 'grace day', missed: 'missed', future: 'ahead' }[status];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${MONTH_NAMES[Number(date.slice(5, 7)) - 1]} ${day}, ${label}${color ? `, ${color}` : ''}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      // The selection ring sits outside the day's own circle, so it shows on any day.
      style={{
        width: RING,
        height: RING,
        borderRadius: RING / 2,
        borderWidth: t.border.width,
        borderColor: selected ? t.neutral.text : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: CELL,
          height: CELL,
          borderRadius: CELL / 2,
          backgroundColor: fill,
          borderWidth: status === 'grace' ? 0 : t.border.width,
          borderColor: border,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {status === 'grace' ? (
          <View style={{ position: 'absolute' }}>
            <GraceShield size={CELL} fill={p.tint} stroke={p.accent} />
          </View>
        ) : null}
        <Text variant="small" color={text} style={{ fontFamily: 'Nunito_900Black', lineHeight: 16, marginTop: status === 'grace' ? -2 : 0 }}>
          {day}
        </Text>
        {status === 'missed' || status === 'future' ? (
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color ? p.accent : 'transparent', marginTop: 1 }} />
        ) : null}
      </View>
    </Pressable>
  );
}

/** A day-sized shield in the day's liturgical color: a grace day kept the streak. */
function GraceShield({ size, fill, stroke }: { size: number; fill: string; stroke: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 1.5L21 4.6V11c0 5.4-3.8 9.4-9 11.5C6.8 20.4 3 16.4 3 11V4.6z" fill={fill} stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  );
}

function Legend() {
  const t = useTheme();
  const swatch = (style: object) => <View style={[{ width: 16, height: 16, borderRadius: 8, borderWidth: t.border.width }, style]} />;
  const items = [
    { label: 'All three', icon: swatch({ backgroundColor: t.accent.accent, borderColor: t.accent.accent }) },
    { label: 'Some', icon: swatch({ backgroundColor: t.accent.tint, borderColor: t.accent.accent }) },
    { label: 'Grace day', icon: <GraceShield size={18} fill={t.accent.tint} stroke={t.accent.accent} /> },
  ];
  const dots = (['green', 'violet', 'red', 'white'] as const).map((c) => tokens.palettes[c][t.scheme].accent);
  return (
    <View style={{ gap: 8, paddingTop: 2 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16, rowGap: 6 }}>
        {items.map((it) => (
          <View key={it.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {it.icon}
            <Text variant="label" color={t.neutral.textMuted}>
              {it.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {dots.map((c) => (
            <View key={c} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
          ))}
        </View>
        <Text variant="label" color={t.neutral.textMuted} style={{ flexShrink: 1 }}>
          Dot: missed or still ahead, in the day’s liturgical color
        </Text>
      </View>
    </View>
  );
}
