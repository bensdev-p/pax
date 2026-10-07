import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { tidy } from '@/components/FatherCard';
import { Header } from '@/components/Header';
import { ListRow, SectionLabel } from '@/components/LibraryBits';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import type { CccSection } from '@/data/library';

/** The Catechism's outline. Pax links to the Vatican's text rather than copying it. */
export default function CatechismScreen() {
  const t = useTheme();
  const library = useLibrary();
  const [outline, setOutline] = useState<CccSection[]>([]);
  useEffect(() => {
    void library.cccOutline().then(setOutline);
  }, [library]);

  const parts = useMemo(() => {
    const map = new Map<string, CccSection[]>();
    for (const s of outline) map.set(s.part, [...(map.get(s.part) ?? []), s]);
    return [...map.entries()];
  }, [outline]);

  return (
    <Screen header={<Header title="Catechism" subtitle="Catechism of the Catholic Church" />}>
      <Text variant="small" color={t.neutral.textMuted}>
        Each paragraph shows the Scripture it cites and opens the full text on vatican.va.
      </Text>
      {parts.map(([part, sections]) => (
        <View key={part} style={{ gap: 2 }}>
          <SectionLabel color={t.accent.text}>{tidy(part)}</SectionLabel>
          {sections.map((s) => (
            <ListRow
              key={`${s.first}`}
              title={tidy(s.heading)}
              subtitle={s.section !== s.heading && s.section !== part ? tidy(s.section) : undefined}
              right={s.first === s.last ? `${s.first}` : `${s.first}–${s.last}`}
              onPress={() => router.push({ pathname: '/ccc/[number]', params: { number: String(s.first) } })}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}
