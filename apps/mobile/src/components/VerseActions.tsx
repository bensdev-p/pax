import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { verseLabel, type VerseDetail } from '@/data/library';
import { HIGHLIGHT_COLORS, makeNote, type HighlightColor } from '@/lib/notes';
import { notes, useNotes } from '@/state/notes';

import { BookmarkIcon, CheckIcon, NoteIcon } from './Icons';
import { Text } from './Text';

/** Highlight (four colors), bookmark and a private note for one verse, in the verse panel. */
export function VerseActions({ verse }: { verse: VerseDetail }) {
  const t = useTheme();
  const { notes: mine } = useNotes({ targetType: 'verse', targetKey: verse.ref });
  const highlight = mine.find((n) => n.kind === 'highlight');
  const bookmark = mine.find((n) => n.kind === 'bookmark');
  const note = mine.find((n) => n.kind === 'journal');
  const label = verseLabel(verse);

  const setHighlight = (color: HighlightColor) => {
    if (highlight?.highlightColor === color) void notes.remove(highlight.id);
    else void notes.save(highlight ? { ...highlight, highlightColor: color } : makeNote({ kind: 'highlight', targetType: 'verse', targetKey: verse.ref, highlightColor: color, prompt: label }));
  };
  const toggleBookmark = () => {
    if (bookmark) void notes.remove(bookmark.id);
    else void notes.save(makeNote({ kind: 'bookmark', targetType: 'verse', targetKey: verse.ref, prompt: label }));
  };
  const openNote = () =>
    router.push(
      note
        ? { pathname: '/journal/edit', params: { id: note.id } }
        : {
            pathname: '/journal/edit',
            params: { targetType: 'verse', targetKey: verse.ref, prompt: `${label} · ${verse.text}`, title: 'Note on a verse' },
          },
    );

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((c) => {
          const on = highlight?.highlightColor === c;
          return (
            <Pressable
              key={c}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`Highlight ${HIGHLIGHT_COLORS[c].label.toLowerCase()}`}
              onPress={() => setHighlight(c)}
              hitSlop={4}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: HIGHLIGHT_COLORS[c].swatch,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: on ? 3 : 0,
                borderColor: t.neutral.text,
              }}>
              {on ? <CheckIcon size={14} color="#FFFFFF" /> : null}
            </Pressable>
          );
        })}
        <View style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!bookmark }}
          accessibilityLabel="Bookmark this verse"
          onPress={toggleBookmark}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 36,
            paddingHorizontal: 12,
            borderRadius: t.radius.chip,
            borderWidth: t.border.width,
            borderColor: bookmark ? t.accent.accent : t.neutral.border,
            backgroundColor: bookmark ? t.accent.tint : 'transparent',
          }}>
          <BookmarkIcon size={18} filled={!!bookmark} color={bookmark ? t.accent.accent : t.neutral.textSubtle} />
          <Text variant="label" caps color={bookmark ? t.accent.text : t.neutral.textMuted}>
            {bookmark ? 'Saved' : 'Bookmark'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={openNote}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          padding: 12,
          borderRadius: t.radius.button,
          borderWidth: t.border.width,
          borderColor: t.neutral.border,
          backgroundColor: pressed ? t.neutral.surfaceMuted : 'transparent',
        })}>
        <NoteIcon size={20} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" caps color={t.accent.text}>
            {note ? 'Your note' : 'Add a private note'}
          </Text>
          {note?.body ? (
            <Text variant="small" color={t.neutral.textMuted} numberOfLines={3}>
              {note.body}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
