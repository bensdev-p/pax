import { mysteriesForDay, toIsoDate } from '@pax/liturgy';
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
import type { Devotion, Prayer, RosaryMystery } from '@/data/types';
import { KIND_LABELS, NOVENA_DAYS, novenaWindow } from '@/lib/devotions';
import { MYSTERY_SET_NAMES } from '@/lib/format';
import { useAppState } from '@/state/AppState';

const SECTIONS: { category: string; title: string }[] = [
  { category: 'essentials', title: 'The essentials' },
  { category: 'daily', title: 'Through the day' },
  { category: 'marian', title: 'With Mary' },
  { category: 'eucharist', title: 'The Eucharist' },
  { category: 'saints', title: 'With the saints' },
  { category: 'departed', title: 'For the faithful departed' },
  { category: 'rosary', title: 'Rosary prayers' },
];

const DEVOTION_SECTIONS: { title: string; kinds: Devotion['kind'][] }[] = [
  { title: 'Chaplets and the Stations', kinds: ['chaplet', 'stations'] },
  { title: 'Litanies', kinds: ['litany'] },
  { title: 'Novenas', kinds: ['novena'] },
];

const SEASON_TAGS: Record<string, string> = { LENT: 'LENT', PASCHAL_TRIDUUM: 'LENT', EASTER_TIME: 'EASTER', ADVENT: 'ADVENT' };

export default function PrayScreen() {
  const t = useTheme();
  const content = useContent();
  const { today, progress, novenas } = useAppState();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [mysteries, setMysteries] = useState<RosaryMystery[]>([]);
  const [devotions, setDevotions] = useState<Devotion[]>([]);
  const [novenasNow, setNovenasNow] = useState<string[]>([]);
  const set = today ? mysteriesForDay(today) : 'joyful';
  const date = today?.date ?? toIsoDate(new Date());

  useEffect(() => {
    void content.prayers().then(setPrayers);
    void content.mysteries(set).then(setMysteries);
    void content.devotions().then(setDevotions);
  }, [content, set]);

  // Novenas whose nine days before the feast include today.
  useEffect(() => {
    void Promise.all(
      devotions
        .filter((d) => d.anchor)
        .map(async (d) => {
          const w = await novenaWindow(d.anchor!, date);
          return w && w.start <= date ? d.slug : null;
        }),
    ).then((slugs) => setNovenasNow(slugs.filter((s): s is string => !!s)));
  }, [devotions, date]);

  const inProgress = novenas.filter((n) => n.daysDone < NOVENA_DAYS);
  const seasonTag = today ? SEASON_TAGS[today.season] : undefined;
  const featured = devotions.filter(
    (d) => !inProgress.some((n) => n.slug === d.slug) && (novenasNow.includes(d.slug) || (d.kind !== 'novena' && d.season === seasonTag)),
  );
  const openDevotion = (slug: string) => router.push({ pathname: '/devotion/[slug]', params: { slug } });

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

      {inProgress.length ? (
        <View style={{ gap: 10 }}>
          <Text variant="title">Your novenas</Text>
          {inProgress.map((n) => {
            const prayed = n.lastPrayedOn === date;
            return (
              <Card
                key={n.slug}
                tinted
                onPress={() => openDevotion(n.slug)}
                accessibilityLabel={`${n.title}, ${n.daysDone} of ${NOVENA_DAYS} days prayed`}
                contentStyle={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="label" caps color={t.accent.text}>
                    {prayed ? `Day ${n.daysDone} prayed today` : `Day ${n.daysDone + 1} of ${NOVENA_DAYS} is ready`}
                  </Text>
                  <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                    {n.title}
                  </Text>
                </View>
                <ChevronIcon color={t.neutral.textSubtle} />
              </Card>
            );
          })}
        </View>
      ) : null}

      {featured.length ? (
        <View style={{ gap: 10 }}>
          <Text variant="title">For this season</Text>
          {featured.map((d) => (
            <DevotionRow key={d.slug} devotion={d} tinted onPress={() => openDevotion(d.slug)} />
          ))}
        </View>
      ) : null}

      {DEVOTION_SECTIONS.map(({ title, kinds }) => {
        const items = devotions.filter((d) => kinds.includes(d.kind));
        if (!items.length) return null;
        return (
          <View key={title} style={{ gap: 10 }}>
            <Text variant="title">{title}</Text>
            {items.map((d) => (
              <DevotionRow key={d.slug} devotion={d} onPress={() => openDevotion(d.slug)} />
            ))}
          </View>
        );
      })}

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

function DevotionRow({ devotion, onPress, tinted }: { devotion: Devotion; onPress: () => void; tinted?: boolean }) {
  const t = useTheme();
  return (
    <Card
      tinted={tinted}
      onPress={onPress}
      accessibilityLabel={devotion.title}
      contentStyle={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1, gap: 2 }}>
        {tinted ? (
          <Text variant="label" caps color={t.accent.text}>
            {KIND_LABELS[devotion.kind]}
            {devotion.minutes ? ` · ${devotion.minutes} min` : ''}
          </Text>
        ) : null}
        <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
          {devotion.title}
        </Text>
        <Text variant="small" color={t.neutral.textMuted} numberOfLines={1}>
          {devotion.summary}
        </Text>
      </View>
      <ChevronIcon color={t.neutral.textSubtle} />
    </Card>
  );
}
