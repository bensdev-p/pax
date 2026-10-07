import { getDaySnapshots, toIsoDate, type DaySnapshot } from '@pax/liturgy';
import { tokens } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { SectionLabel } from '@/components/LibraryBits';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { dayLabel } from '@/lib/format';

/** Saints and feasts of the coming weeks, from the liturgical calendar. Bios and cards come later. */
export default function SaintsScreen() {
  const t = useTheme();
  const [days, setDays] = useState<DaySnapshot[]>([]);
  useEffect(() => {
    void getDaySnapshots(toIsoDate(new Date()), 42).then((list) => setDays(list.filter((d) => d.saintKeys.length > 0)));
  }, []);

  return (
    <Screen header={<Header title="Saints" subtitle="By feast day" />}>
      <Text variant="small" color={t.neutral.textMuted}>
        The next six weeks of saints and feasts in the US calendar. Short bios and saint cards are coming.
      </Text>
      <View style={{ gap: 2 }}>
        <SectionLabel>Coming up</SectionLabel>
        {days.map((d) => (
          <View
            key={d.date}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 10,
              borderBottomWidth: t.border.width,
              borderBottomColor: t.neutral.divider,
            }}>
            <View
              accessibilityLabel={`Liturgical color ${d.color}`}
              style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: tokens.palettes[d.color][t.scheme].accent }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="label" caps color={t.neutral.textMuted}>
                {dayLabel(d)} · {d.rankName}
              </Text>
              <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                {d.name}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}
