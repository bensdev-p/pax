import { useTheme } from '@pax/tokens/react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { BookmarkIcon, ChevronIcon } from '@/components/Icons';
import { SectionLabel } from '@/components/LibraryBits';
import { Pax } from '@/components/Pax';
import { Card } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import { verseLabel, type VerseDetail } from '@/data/library';
import type { Note } from '@/data/types';
import { openChapter } from '@/lib/libraryLinks';
import { HIGHLIGHT_COLORS, isHighlightColor } from '@/lib/notes';
import { useNotes } from '@/state/notes';

/** Your bookmarks and highlights in the Bible, newest first; each opens the reader at the verse. */
export default function MarksScreen() {
  const t = useTheme();
  const library = useLibrary();
  const { notes: bookmarks, loaded: b } = useNotes({ kind: 'bookmark' });
  const { notes: highlights, loaded: h } = useNotes({ kind: 'highlight' });
  const [verses, setVerses] = useState<Record<string, VerseDetail>>({});

  const refs = [...new Set([...bookmarks, ...highlights].map((n) => n.targetKey))].sort().join(',');
  useEffect(() => {
    if (!refs) return;
    void Promise.all(refs.split(',').map((r) => library.verse(r))).then((list) =>
      setVerses(Object.fromEntries(list.filter((v): v is VerseDetail => !!v).map((v) => [v.ref, v]))),
    );
  }, [library, refs]);

  const row = (n: Note, mark: React.ReactNode) => {
    const v = verses[n.targetKey];
    return (
      <Card
        key={n.id}
        onPress={v ? () => openChapter(v.book, v.douay_chapter, v.ref) : undefined}
        accessibilityLabel={v ? verseLabel(v) : n.targetKey}
        contentStyle={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {mark}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
            {v ? verseLabel(v) : (n.prompt ?? n.targetKey)}
          </Text>
          {v ? (
            <Text variant="small" color={t.neutral.textMuted} numberOfLines={2}>
              {v.text}
            </Text>
          ) : null}
        </View>
        <ChevronIcon color={t.neutral.textSubtle} />
      </Card>
    );
  };

  return (
    <Screen header={<Header title="Highlights and bookmarks" subtitle="In the Douay-Rheims" />}>
      {b && h && !bookmarks.length && !highlights.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pax mood="hint" size={84} />
          <Text variant="body" color={t.neutral.textMuted} style={{ flex: 1 }}>
            Press and hold any verse in the Bible to highlight it, bookmark it or add a note.
          </Text>
        </View>
      ) : null}

      {bookmarks.length ? (
        <View style={{ gap: 10 }}>
          <SectionLabel>Bookmarks</SectionLabel>
          {bookmarks.map((n) => row(n, <BookmarkIcon size={22} color={t.accent.accent} />))}
        </View>
      ) : null}

      {highlights.length ? (
        <View style={{ gap: 10 }}>
          <SectionLabel>Highlights</SectionLabel>
          {highlights.map((n) =>
            row(
              n,
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: isHighlightColor(n.highlightColor) ? HIGHLIGHT_COLORS[n.highlightColor].swatch : t.neutral.border,
                }}
              />,
            ),
          )}
        </View>
      ) : null}
    </Screen>
  );
}
