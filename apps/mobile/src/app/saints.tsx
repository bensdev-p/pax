import { getDaySnapshots, toIsoDate } from '@pax/liturgy';
import { tokens } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Header } from '@/components/Header';
import { ChevronIcon } from '@/components/Icons';
import { SectionLabel } from '@/components/LibraryBits';
import { SaintArt } from '@/components/SaintArt';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Saint } from '@/data/types';
import { celebrationsOf, saintColor, shortDate, type Celebration } from '@/lib/saints';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Row {
  saint: Saint;
  celebration: Celebration;
}

/** The saints and feasts of the coming year in the US calendar, grouped by month. */
export default function SaintsScreen() {
  const t = useTheme();
  const content = useContent();
  const [rows, setRows] = useState<Row[] | null>(null);
  const today = toIsoDate(new Date());

  useEffect(() => {
    void (async () => {
      const [days, saints] = await Promise.all([getDaySnapshots(today, 366), content.saints()]);
      const byKey = new Map(saints.map((s) => [s.romcal_key, s]));
      const next: Row[] = [];
      for (const day of days) {
        for (const celebration of celebrationsOf(day)) {
          const saint = byKey.get(celebration.key);
          if (saint) next.push({ saint, celebration });
        }
      }
      setRows(next);
    })();
  }, [content, today]);

  const months = useMemo(() => {
    const groups: { title: string; rows: Row[] }[] = [];
    for (const row of rows ?? []) {
      const [y, m] = row.celebration.date.split('-').map(Number) as [number, number];
      const title = `${MONTH_NAMES[m - 1]}${y !== Number(today.slice(0, 4)) ? ` ${y}` : ''}`;
      if (groups[groups.length - 1]?.title !== title) groups.push({ title, rows: [] });
      groups[groups.length - 1]!.rows.push(row);
    }
    return groups;
  }, [rows, today]);

  return (
    <Screen header={<Header title="Saints" subtitle="The year ahead in the US calendar" />}>
      {rows && rows.length === 0 ? (
        <Text variant="body" color={t.neutral.textMuted}>
          The saints’ write-ups aren’t installed yet.
        </Text>
      ) : null}
      {months.map((month) => (
        <View key={month.title} style={{ gap: 2 }}>
          <SectionLabel>{month.title}</SectionLabel>
          {month.rows.map(({ saint, celebration }) => {
            const palette = tokens.palettes[saintColor(saint, celebration)][t.scheme];
            const isToday = celebration.date === today;
            return (
              <Pressable
                key={`${celebration.date}-${saint.romcal_key}`}
                accessibilityRole="button"
                accessibilityLabel={`${shortDate(celebration.date)}, ${saint.name}`}
                onPress={() =>
                  router.push({ pathname: '/saint/[key]', params: { key: saint.romcal_key, date: celebration.date } })
                }
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  marginHorizontal: -8,
                  borderRadius: t.radius.tile,
                  backgroundColor: pressed ? t.neutral.surfaceMuted : isToday ? t.accent.tint : 'transparent',
                })}>
                <View
                  style={{
                    width: 44,
                    height: 52,
                    borderRadius: 10,
                    backgroundColor: palette.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View style={{ width: 36, height: 44, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    <SaintArt kind={saint.kind} robe={palette.accent} size={30} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="label" caps color={isToday ? t.accent.text : t.neutral.textMuted}>
                    {isToday ? 'Today' : shortDate(celebration.date)}
                    {celebration.optional ? ' · Optional' : ` · ${celebration.day.rankName}`}
                  </Text>
                  <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                    {saint.name}
                  </Text>
                  {saint.subtitle ? (
                    <Text variant="small" color={t.neutral.textMuted} numberOfLines={1}>
                      {saint.subtitle}
                    </Text>
                  ) : null}
                </View>
                <ChevronIcon color={t.neutral.textSubtle} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </Screen>
  );
}
