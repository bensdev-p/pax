import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';

import { Header } from '@/components/Header';
import { DevotionRow } from '@/components/PrayBits';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { NOVENA_DAYS } from '@/lib/devotions';
import { DEVOTION_KINDS, devotionLabel, isDevotionKind, sortDevotions, type DevotionKind } from '@/lib/pray';
import { useAppState } from '@/state/AppState';
import { useDevotions } from '@/state/devotions';

export function generateStaticParams(): { kind: DevotionKind }[] {
  return (Object.keys(DEVOTION_KINDS) as DevotionKind[]).map((kind) => ({ kind }));
}

/** One kind of devotion from the Pray hub: novenas in progress and the season's first. */
export default function DevotionKindScreen() {
  const t = useTheme();
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const { today, novenas } = useAppState();
  const { devotions, featured } = useDevotions(today);
  const k: DevotionKind = isDevotionKind(kind) ? kind : 'chaplet';
  const going = novenas.filter((n) => n.daysDone < NOVENA_DAYS);
  const list = sortDevotions(devotions.filter((d) => d.kind === k), going, featured);

  return (
    <Screen header={<Header title={DEVOTION_KINDS[k].title} />}>
      <Text variant="body" color={t.neutral.textMuted}>
        {DEVOTION_KINDS[k].intro}
      </Text>
      {list.map((d) => (
        <DevotionRow
          key={d.slug}
          devotion={d}
          label={devotionLabel(d, going, featured)}
          onPress={() => router.push({ pathname: '/devotion/[slug]', params: { slug: d.slug } })}
        />
      ))}
    </Screen>
  );
}
