import { mysteriesForDay, toIsoDate } from '@pax/liturgy';
import { withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { BookIcon, CandleIcon, CrossIcon, MoonIcon, PrayerCardIcon, RosaryIcon, ScrollIcon } from '@/components/Icons';
import { ForYouCard, WayTile } from '@/components/PrayBits';
import { RaisedButton, RaisedSurface } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Devotion, Prayer } from '@/data/types';
import { weekdayName } from '@/lib/calendar';
import { NOVENA_DAYS } from '@/lib/devotions';
import { MYSTERY_SET_NAMES } from '@/lib/format';
import { forYou, type DevotionKind } from '@/lib/pray';
import { prayedRosaryToday } from '@/lib/today';
import { useAppState } from '@/state/AppState';
import { useDevotions } from '@/state/devotions';
import { useNotes } from '@/state/notes';

/**
 * Pray as a hub (Ben's layout notes, Phase 3): today's Rosary, "For you", then a shelf of
 * ways to pray, each opening its own short page. Nothing here is a long list.
 */
export default function PrayScreen() {
  const t = useTheme();
  const content = useContent();
  const { today, settings, novenas } = useAppState();
  const { devotions, featured } = useDevotions(today);
  const { notes: favorites } = useNotes({ kind: 'favorite' });
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const set = today ? mysteriesForDay(today) : 'joyful';
  const date = today?.date ?? toIsoDate(new Date());

  useEffect(() => {
    void content.prayers().then(setPrayers);
  }, [content]);

  const items = forYou({ date, novenas, featured, favorites });
  const ofKind = (kind: DevotionKind) => devotions.filter((d) => d.kind === kind);
  const openDevotion = (slug: string) => router.push({ pathname: '/devotion/[slug]', params: { slug } });
  // A kind with one devotion (the Stations, for now the Divine Mercy Chaplet) opens it directly.
  const openKind = (kind: DevotionKind) => {
    const list = ofKind(kind);
    if (list.length === 1) openDevotion(list[0]!.slug);
    else router.push({ pathname: '/devotions/[kind]', params: { kind } });
  };
  const titles = (list: Devotion[]) => list.map((d) => d.title.replace(/^(Litany of |Novena to )/, '')).join(', ');
  const novenasGoing = novenas.filter((n) => n.daysDone < NOVENA_DAYS).length;

  return (
    <Screen>
      <Text variant="hero" style={{ fontSize: 28 }} accessibilityRole="header">
        Pray
      </Text>

      <RaisedSurface color={t.accent.accent} edgeColor={t.accent.edge} edge={t.edge.hero} radius={t.radius.panel} contentStyle={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label" caps color={t.accent.onAccent}>
              {`Today’s Rosary · ${weekdayName(date)}`}
            </Text>
            <Text variant="headline" color={t.accent.onAccent}>
              The {MYSTERY_SET_NAMES[set]} Mysteries
            </Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: withAlpha('#FFFFFF', 0.9), alignItems: 'center', justifyContent: 'center' }}>
            <RosaryIcon size={30} />
          </View>
        </View>
        <RaisedButton
          kind="white"
          height={46}
          label={today && prayedRosaryToday(settings.prayedToday, today.date) ? 'Pray it again' : 'Start the Rosary'}
          onPress={() => router.push('/rosary')}
        />
      </RaisedSurface>

      {items.length ? (
        <View style={{ gap: 10 }}>
          <Text variant="title">For you</Text>
          {/* Bleeds to the screen edges so cards scroll in from the side. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {items.map((item) => (
              <ForYouCard
                key={item.key}
                item={item}
                onPress={() =>
                  item.target.type === 'devotion' ? openDevotion(item.target.slug) : router.push({ pathname: '/prayer/[slug]', params: { slug: item.target.slug } })
                }
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <Text variant="title">Ways to pray</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <WayTile title="Rosary" subtitle="4 sets of mysteries" tint="#2FA4E7" icon={<RosaryIcon size={28} />} onPress={() => router.push('/mysteries')} />
          <WayTile title="Examen" subtitle="Look back on the day" tint="#5B6CD9" icon={<MoonIcon size={28} />} onPress={() => router.push('/examen')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <WayTile title="Chaplets" subtitle={titles(ofKind('chaplet')) || ' '} tint="#FF6B6B" icon={<PrayerCardIcon size={28} />} onPress={() => openKind('chaplet')} />
          <WayTile title="Stations" subtitle="of the Cross" tint="#8E5CF6" icon={<CrossIcon size={28} />} onPress={() => openKind('stations')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <WayTile title="Litanies" subtitle={`${ofKind('litany').length} litanies`} tint="#E86A9A" icon={<ScrollIcon />} onPress={() => openKind('litany')} />
          <WayTile
            title="Novenas"
            subtitle={novenasGoing ? `${novenasGoing} in progress` : `${ofKind('novena').length} nine-day prayers`}
            tint="#FF9F1C"
            icon={<CandleIcon size={28} />}
            onPress={() => openKind('novena')}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <WayTile title="Prayer book" subtitle={`${prayers.length} prayers`} tint="#58A445" icon={<BookIcon size={28} />} onPress={() => router.push('/prayers')} />
        </View>
      </View>
    </Screen>
  );
}
