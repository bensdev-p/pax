import { mysteriesForDay } from '@pax/liturgy';
import { withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ChevronIcon, RosaryIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { Card, RaisedButton, RaisedSurface } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Prayer, RosaryMystery } from '@/data/types';
import { MYSTERY_SET_NAMES } from '@/lib/format';
import { useAppState } from '@/state/AppState';

const SECTIONS: { category: string; title: string }[] = [
  { category: 'essentials', title: 'The essentials' },
  { category: 'marian', title: 'With Mary' },
  { category: 'daily', title: 'Through the day' },
  { category: 'rosary', title: 'Rosary prayers' },
];

export default function PrayScreen() {
  const t = useTheme();
  const content = useContent();
  const { today, progress } = useAppState();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [mysteries, setMysteries] = useState<RosaryMystery[]>([]);
  const set = today ? mysteriesForDay(today) : 'joyful';

  useEffect(() => {
    void content.prayers().then(setPrayers);
    void content.mysteries(set).then(setMysteries);
  }, [content, set]);

  return (
    <Screen>
      <Text variant="hero" style={{ fontSize: 28 }} accessibilityRole="header">
        Pray
      </Text>

      <RaisedSurface
        color={t.accent.accent}
        edgeColor={t.accent.edge}
        edge={t.edge.hero}
        radius={t.radius.panel}
        contentStyle={{ padding: 18, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="label" caps color={t.accent.onAccent}>
              Today’s Rosary
            </Text>
            <Text variant="headline" color={t.accent.onAccent}>
              The {MYSTERY_SET_NAMES[set]} Mysteries
            </Text>
          </View>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: withAlpha('#FFFFFF', 0.9),
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <RosaryIcon size={34} />
          </View>
        </View>
        <View style={{ gap: 6 }}>
          {mysteries.map((m) => (
            <View key={m.slug} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: withAlpha(t.accent.onAccent, 0.25),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text variant="label" color={t.accent.onAccent} style={{ fontSize: 12 }}>
                  {m.number}
                </Text>
              </View>
              <Text variant="small" color={t.accent.onAccent} style={{ fontFamily: 'Nunito_800ExtraBold', flex: 1 }}>
                {m.title}
              </Text>
            </View>
          ))}
        </View>
        <RaisedButton
          kind="white"
          height={50}
          label={progress?.didPrayerToday ? 'Pray it again' : 'Start the Rosary'}
          onPress={() => router.push('/rosary')}
        />
      </RaisedSurface>

      {prayers.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 24 }}>
          <Pax mood="hint" size={120} />
        </View>
      ) : (
        SECTIONS.map(({ category, title }) => {
          const items = prayers.filter((p) => p.category === category);
          if (!items.length) return null;
          return (
            <View key={category} style={{ gap: 10 }}>
              <Text variant="title">{title}</Text>
              {items.map((p) => (
                <Card
                  key={p.slug}
                  onPress={() => router.push({ pathname: '/prayer/[slug]', params: { slug: p.slug } })}
                  accessibilityLabel={p.title}
                  contentStyle={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                      {p.title}
                    </Text>
                    <Text variant="small" color={t.neutral.textMuted} numberOfLines={1}>
                      {p.text.replace(/\n+/g, ' ')}
                    </Text>
                  </View>
                  <ChevronIcon color={t.neutral.textSubtle} />
                </Card>
              ))}
            </View>
          );
        })
      )}
    </Screen>
  );
}
