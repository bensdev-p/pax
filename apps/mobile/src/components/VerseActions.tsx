import { useTheme } from '@pax/tokens/react';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { verseLabel, type VerseDetail } from '@/data/library';
import { defaultTags, HIGHLIGHT_COLORS, makeNote, tagsFrom, type HighlightColor } from '@/lib/notes';
import { notes, useNotes } from '@/state/notes';

import { BookmarkIcon, CheckIcon, NoteIcon } from './Icons';
import { RaisedButton } from './Raised';
import { Text } from './Text';

/**
 * Highlight (four colors), bookmark and a private note for one verse: in the long-press sheet
 * in the reader, and at the top of the verse panel.
 */
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
  // The note is written right here, in a small box; the journal keeps it with its tags.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const startNote = () => {
    setDraft(note?.body ?? '');
    setEditing(true);
  };
  const saveNote = async () => {
    const text = draft.trim();
    if (!text) {
      if (note) await notes.remove(note.id);
    } else {
      const base = note ?? makeNote({ kind: 'journal', targetType: 'verse', targetKey: verse.ref, prompt: `${label} · ${verse.text}`, tags: defaultTags('verse') });
      await notes.save({ ...base, body: text, tags: tagsFrom(text, base.tags) });
    }
    setEditing(false);
  };

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

      {editing ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            autoFocus
            placeholder="A private note on this verse… (#tags work too)"
            placeholderTextColor={t.neutral.textSubtle}
            textAlignVertical="top"
            accessibilityLabel="Your note on this verse"
            style={{
              minHeight: 96,
              borderWidth: t.border.width,
              borderColor: t.accent.accent,
              borderRadius: t.radius.button,
              padding: 12,
              color: t.neutral.text,
              backgroundColor: t.neutral.surface,
              fontFamily: 'SourceSerif4_400Regular',
              fontSize: 17,
              lineHeight: 25,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <RaisedButton kind="neutral" label="Cancel" height={44} style={{ flex: 1 }} onPress={() => setEditing(false)} />
            <RaisedButton label="Save note" height={44} style={{ flex: 1 }} onPress={() => void saveNote()} />
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={startNote}
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
      )}
    </View>
  );
}
