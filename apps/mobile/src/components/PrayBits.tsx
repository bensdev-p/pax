import { withAlpha } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { Devotion } from '@/data/types';
import type { ForYouItem } from '@/lib/pray';

import { ChevronIcon } from './Icons';
import { Card } from './Raised';
import { Text } from './Text';

/** A devotion in a list: title and summary; `label` (tinted) marks a seasonal or in-progress one. */
export function DevotionRow({ devotion, onPress, label }: { devotion: Devotion; onPress: () => void; label?: string }) {
  const t = useTheme();
  return (
    <Card
      tinted={!!label}
      onPress={onPress}
      accessibilityLabel={devotion.title}
      contentStyle={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1, gap: 2 }}>
        {label ? (
          <Text variant="label" caps color={t.accent.text}>
            {label}
          </Text>
        ) : null}
        <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
          {devotion.title}
        </Text>
        <Text variant="small" color={t.neutral.textMuted} numberOfLines={2}>
          {devotion.summary}
          {devotion.minutes ? ` · ${devotion.minutes} min` : ''}
        </Text>
      </View>
      <ChevronIcon color={t.neutral.textSubtle} />
    </Card>
  );
}

/** A card in the "For you" row: a novena with its progress, a seasonal pick or a favorite. */
export function ForYouCard({ item, onPress }: { item: ForYouItem; onPress: () => void }) {
  const t = useTheme();
  return (
    <Card
      onPress={onPress}
      tinted={item.kind === 'novena'}
      accessibilityLabel={`${item.label}: ${item.title}`}
      style={{ width: 156 }}
      contentStyle={{ padding: 12, gap: 6, minHeight: 92 }}>
      <Text variant="label" caps color={item.kind === 'favorite' ? t.game.streakText : t.accent.text} numberOfLines={1}>
        {item.label}
      </Text>
      <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black', fontSize: 15 }} numberOfLines={2}>
        {item.title}
      </Text>
      {item.progress !== undefined ? (
        <View style={{ marginTop: 'auto', height: 6, borderRadius: 3, backgroundColor: t.neutral.border, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(item.progress * 100)}%`, height: 6, backgroundColor: t.accent.accent }} />
        </View>
      ) : null}
    </Card>
  );
}

/** A tile on the shelf of ways to pray. */
export function WayTile({ title, subtitle, tint, icon, onPress }: { title: string; subtitle: string; tint: string; icon: ReactNode; onPress: () => void }) {
  const t = useTheme();
  return (
    <Card onPress={onPress} radius={t.radius.card} style={{ flex: 1 }} accessibilityLabel={`${title}, ${subtitle}`} contentStyle={{ padding: 14, gap: 8, minHeight: 116 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: t.radius.tile,
          backgroundColor: withAlpha(tint, t.scheme === 'dark' ? 0.22 : 0.14),
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <View style={{ gap: 1 }}>
        <Text variant="title" style={{ fontSize: 17 }} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="small" color={t.neutral.textMuted} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Card>
  );
}

/** Marks a prayer the user added to their prayer book. */
export function YoursBadge() {
  const t = useTheme();
  return (
    <View style={{ borderRadius: 8, backgroundColor: t.accent.tint, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text variant="label" caps color={t.accent.text} style={{ fontSize: 11 }}>
        Yours
      </Text>
    </View>
  );
}
