import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { JournalEntryCard, TagChip } from '@/components/Journal';
import { Pax } from '@/components/Pax';
import { RaisedButton } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { journalView } from '@/lib/notes';
import { useNotes } from '@/state/notes';

/** The journal in Me: every answer, verse note and entry, newest first, filtered by tag. */
export default function JournalScreen() {
  const t = useTheme();
  const { notes, loaded } = useNotes({ kind: 'journal' });
  const [tag, setTag] = useState<string | null>(null);
  const { entries, tags } = journalView(notes, tag);

  return (
    <Screen header={<Header title="Journal" subtitle="Private to you, on this phone" />}>
      <RaisedButton label="New entry" onPress={() => router.push('/journal/edit')} />

      {tags.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tags.map((x) => (
            <TagChip key={x} tag={x} selected={tag === x} onPress={() => setTag(tag === x ? null : x)} />
          ))}
        </View>
      ) : null}

      {loaded && !entries.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pax mood="hint" size={84} />
          <Text variant="body" color={t.neutral.textMuted} style={{ flex: 1 }}>
            {tag
              ? `Nothing tagged #${tag} yet.`
              : 'Answer my question under today’s readings or a plan day, add a note to a verse, or write anything here. It stays on your phone.'}
          </Text>
        </View>
      ) : null}

      {entries.map((n) => (
        <JournalEntryCard key={n.id} note={n} />
      ))}
    </Screen>
  );
}
