import { mysteriesForDay, type MysterySet } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { Card, RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { RosaryMystery } from '@/data/types';
import { MYSTERY_SET_NAMES } from '@/lib/format';
import { ROSARY_DAYS, ROSARY_ORDER } from '@/lib/pray';
import { useAppState } from '@/state/AppState';

/** The four sets of mysteries, when each is prayed, and a way to pray any of them today. */
export default function MysteriesScreen() {
  const t = useTheme();
  const content = useContent();
  const { today } = useAppState();
  const todays = today ? mysteriesForDay(today) : null;
  const [sets, setSets] = useState<Partial<Record<MysterySet, RosaryMystery[]>>>({});

  useEffect(() => {
    void Promise.all(ROSARY_ORDER.map(async (s) => [s, await content.mysteries(s)] as const)).then((pairs) => setSets(Object.fromEntries(pairs)));
  }, [content]);

  return (
    <Screen header={<Header title="The Rosary" subtitle="Four sets of mysteries" />}>
      {ROSARY_ORDER.map((set) => {
        const isToday = set === todays;
        return (
          <Card key={set} tinted={isToday} contentStyle={{ padding: 16, gap: 12 }}>
            <View style={{ gap: 2 }}>
              <Text variant="label" caps color={isToday ? t.accent.text : t.neutral.textMuted}>
                {isToday ? `Today · ${ROSARY_DAYS[set]}` : ROSARY_DAYS[set]}
              </Text>
              <Text variant="headline">The {MYSTERY_SET_NAMES[set]} Mysteries</Text>
            </View>
            <View style={{ gap: 8 }}>
              {(sets[set] ?? []).map((m) => (
                <View key={m.slug} style={{ flexDirection: 'row', gap: 10 }}>
                  <Text variant="bodyStrong" color={t.accent.text} style={{ width: 18, fontFamily: 'Nunito_900Black' }}>
                    {m.number}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{m.title}</Text>
                    <Text variant="small" color={t.neutral.textMuted}>
                      Fruit: {m.fruit}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <RaisedButton
              kind={isToday ? undefined : 'neutral'}
              height={44}
              label={isToday ? 'Pray today’s mysteries' : 'Pray these mysteries'}
              onPress={() => router.push({ pathname: '/rosary', params: isToday ? {} : { set } })}
            />
          </Card>
        );
      })}
    </Screen>
  );
}
