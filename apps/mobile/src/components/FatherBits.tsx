import { withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { Pressable, View } from 'react-native';

import type { FatherAuthor } from '@/data/library';
import { diedLabel, eraTint } from '@/lib/fathers';

import { ChevronIcon, QuillIcon } from './Icons';
import { Card } from './Raised';
import { Text } from './Text';

/** A quill in a round badge, colored by the Father's era. */
export function QuillBadge({ year, size = 40 }: { year: number | null; size?: number }) {
  const t = useTheme();
  const tint = eraTint(year);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: withAlpha(tint, t.scheme === 'dark' ? 0.24 : 0.16),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <QuillIcon size={size * 0.58} color={tint} />
    </View>
  );
}

const count = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'excerpt' : 'excerpts'}`;

/** One of the most-quoted Fathers, as a tile. */
export function FatherTile({ author, onPress }: { author: FatherAuthor; onPress: () => void }) {
  const t = useTheme();
  const died = diedLabel(author);
  return (
    <Card onPress={onPress} style={{ flex: 1 }} accessibilityLabel={`${author.name}, ${count(author.excerpts)}`} contentStyle={{ padding: 12, gap: 8, minHeight: 112 }}>
      <QuillBadge year={author.year} size={36} />
      <View style={{ gap: 1 }}>
        <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black', fontSize: 15, lineHeight: 19 }} numberOfLines={2}>
          {author.name}
        </Text>
        <Text variant="small" color={t.neutral.textMuted} numberOfLines={1}>
          {[died, author.excerpts.toLocaleString('en-US')].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Card>
  );
}

/** A Father in a list: quill, familiar name, his other name and how much there is to read. */
export function FatherRow({ author, onPress }: { author: FatherAuthor; onPress: () => void }) {
  const t = useTheme();
  const died = diedLabel(author);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${author.name}, ${count(author.excerpts)}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginHorizontal: -8,
        borderRadius: t.radius.tile,
        backgroundColor: pressed ? t.neutral.surfaceMuted : 'transparent',
      })}>
      <QuillBadge year={author.year} size={36} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
          {author.name}
        </Text>
        {author.also[0] ? (
          <Text variant="small" color={t.neutral.textMuted} numberOfLines={1}>
            Also {author.also[0]}
          </Text>
        ) : null}
        <Text variant="small" color={t.neutral.textSubtle}>
          {[died, count(author.excerpts)].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <ChevronIcon color={t.neutral.textSubtle} />
    </Pressable>
  );
}

/** A book of the Bible on a Father's page, with how many excerpts he has on it. */
export function BookChip({ name, count: n, onPress }: { name: string; count: number; onPress: () => void }) {
  const t = useTheme();
  return (
    <Card onPress={onPress} style={{ flex: 1 }} accessibilityLabel={`${name}, ${count(n)}`} contentStyle={{ paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black', flex: 1 }} numberOfLines={1}>
        {name}
      </Text>
      <Text variant="small" color={t.neutral.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
        {n.toLocaleString('en-US')}
      </Text>
    </Card>
  );
}

/** Lays items out two to a row (React Native has no grid). */
export function pairs<T>(items: T[]): [T, T | undefined][] {
  const out: [T, T | undefined][] = [];
  for (let i = 0; i < items.length; i += 2) out.push([items[i]!, items[i + 1]]);
  return out;
}
