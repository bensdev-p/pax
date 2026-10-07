import { useTheme } from '@pax/tokens/react';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useContent } from '@/data/content';
import type { Prayer } from '@/data/types';

/** Pre-renders every prayer page for the static web build. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const data = require('../../../assets/content/content.json') as { prayers: { slug: string }[] };
  return data.prayers.map((p) => ({ slug: p.slug }));
}

export default function PrayerScreen() {
  const t = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const content = useContent();
  const [prayer, setPrayer] = useState<Prayer | null | undefined>(undefined);
  const [latin, setLatin] = useState(false);

  useEffect(() => {
    void content.prayer(String(slug)).then(setPrayer);
  }, [content, slug]);

  return (
    <Screen header={<Header title={prayer?.title ?? (prayer === null ? 'Prayer not found' : '')} subtitle={prayer ? 'Traditional' : undefined} />}>
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
        <Text variant="scripture" selectable>
          {latin && prayer.latin_text ? prayer.latin_text : prayer.text}
        </Text>
      ) : null}
    </Screen>
  );
}
