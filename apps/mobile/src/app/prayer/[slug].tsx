import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FavoriteButton } from '@/components/Favorite';
import { Header } from '@/components/Header';
import { PrayerText } from '@/components/PrayerText';
import { RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Prayer } from '@/data/types';
import { asPrayer, isMySlug, myIdOf } from '@/lib/myPrayers';
import { PRAYER_SECTIONS } from '@/lib/pray';
import { useTapTwice } from '@/lib/useTapTwice';
import { myPrayers, useMyPrayers } from '@/state/myPrayers';

/** Pre-renders every prayer page for the static web build. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const data = require('../../../assets/content/content.json') as { prayers: { slug: string }[] };
  return data.prayers.map((p) => ({ slug: p.slug }));
}

export default function PrayerScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const content = useContent();
  const [builtIn, setBuiltIn] = useState<Prayer | null | undefined>(undefined);
  const [latin, setLatin] = useState(false);
  // A prayer the user added (`mine-<id>`) comes from user.db, and updates after an edit.
  const own = isMySlug(String(slug));
  const { prayers: mine, loaded } = useMyPrayers();
  const added = own ? mine.find((p) => p.id === myIdOf(String(slug))) : undefined;
  const prayer = own ? (added ? asPrayer(added) : loaded ? null : undefined) : builtIn;
  const deleting = useTapTwice(() => {
    if (!added) return;
    // Leave first, so this page doesn't show "Prayer not found" on its way out.
    router.back();
    void myPrayers.remove(added.id);
  });

  useEffect(() => {
    if (own) return;
    void content.prayer(String(slug)).then(setBuiltIn);
  }, [content, slug, own]);

  const section = PRAYER_SECTIONS.find((s) => s.category === prayer?.category)?.title;
  const subtitle = !prayer
    ? undefined
    : prayer.mine
      ? [prayer.by, section, 'Yours'].filter(Boolean).join(' · ')
      : (latin && prayer.latin_title) || 'Traditional';

  return (
    <Screen
      header={<Header
          title={prayer?.title ?? (prayer === null ? 'Prayer not found' : '')}
          subtitle={subtitle}
          right={prayer ? <FavoriteButton targetType="prayer" slug={prayer.slug} title={prayer.title} /> : undefined}
        />}
      footer={
        added ? (
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12 }}>
            <RaisedButton
              kind="neutral"
              label="Edit"
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/my-prayer', params: { id: added.id } })}
            />
            <RaisedButton kind="neutral" label={deleting.armed ? 'Tap again' : 'Delete'} style={{ flex: 1 }} onPress={deleting.press} />
          </View>
        ) : undefined
      }>
      {prayer?.latin_text ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['English', 'Latin'] as const).map((label) => {
            const on = (label === 'Latin') === latin;
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setLatin(label === 'Latin')}
                style={{
                  paddingHorizontal: 14,
                  height: 36,
                  borderRadius: t.radius.chip,
                  justifyContent: 'center',
                  borderWidth: t.border.width,
                  borderColor: on ? t.accent.accent : t.neutral.border,
                  backgroundColor: on ? t.accent.tint : t.neutral.surface,
                }}>
                <Text variant="label" caps color={on ? t.accent.text : t.neutral.textMuted}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      {prayer ? (
        <PrayerText text={latin && prayer.latin_text ? prayer.latin_text : prayer.text} selectable />
      ) : null}
    </Screen>
  );
}
