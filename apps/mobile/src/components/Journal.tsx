import { useTheme } from '@pax/tokens/react';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { Note } from '@/data/types';
import { useNotes } from '@/state/notes';

import { NoteIcon } from './Icons';
import { Card } from './Raised';
import { Text } from './Text';

/** A "#tag" chip for choosing and filtering journal tags. */
export function TagChip({ tag, selected, onPress }: { tag: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        height: 34,
        justifyContent: 'center',
        borderRadius: t.radius.chip,
        borderWidth: t.border.width,
        borderColor: selected ? t.accent.accent : t.neutral.border,
        backgroundColor: selected ? t.accent.tint : 'transparent',
      }}>
      <Text variant="small" style={{ fontFamily: 'Nunito_800ExtraBold' }} color={selected ? t.accent.text : t.neutral.textMuted}>
        #{tag}
      </Text>
    </Pressable>
  );
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Mon, Oct 12" in the phone's local time. */
export function entryDate(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const SOURCE = { readings: 'Today’s readings', course_day: 'Reading plan', verse: 'Note on a verse', entry: 'Journal', prayer: 'Prayer', devotion: 'Devotion' };

/** One journal entry in a list: date, what it answers, the start of the text and its tags. */
export function JournalEntryCard({ note }: { note: Note }) {
  const t = useTheme();
  const open: Href = { pathname: '/journal/edit', params: { id: note.id } };
  return (
    <Card onPress={() => router.push(open)} accessibilityLabel={`Journal entry, ${entryDate(note.createdAt)}`} contentStyle={{ padding: 14, gap: 6 }}>
      <Text variant="label" caps color={t.accent.text}>
        {`${entryDate(note.createdAt)} · ${SOURCE[note.targetType]}`}
      </Text>
      {note.prompt ? (
        <Text variant="small" color={t.neutral.textMuted} numberOfLines={2} style={{ fontStyle: 'italic' }}>
          {note.prompt}
        </Text>
      ) : null}
      <Text variant="body" numberOfLines={4}>
        {note.body}
      </Text>
      {note.tags.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {note.tags.map((tag) => (
            <Text key={tag} variant="small" color={t.accent.text} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

/**
 * Pax's question with a private answer: "Answer privately" opens the journal; once answered,
 * the answer shows here and opens for editing.
 */
export function PaxQuestion({
  question,
  targetType,
  targetKey,
}: {
  question: string;
  targetType: 'readings' | 'course_day';
  targetKey: string;
}) {
  const t = useTheme();
  const { notes } = useNotes({ kind: 'journal', targetType, targetKey });
  const answer = notes[0];
  const open = () =>
    router.push(
      answer
        ? { pathname: '/journal/edit', params: { id: answer.id } }
        : { pathname: '/journal/edit', params: { targetType, targetKey, prompt: question } },
    );
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" caps color={t.neutral.textMuted}>
        Pax asks
      </Text>
      <Text variant="body">{question}</Text>
      {answer?.body ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Your answer, tap to edit" onPress={open}>
          <View style={{ borderLeftWidth: 3, borderLeftColor: t.accent.accent, paddingLeft: 10, marginTop: 2 }}>
            <Text variant="small" color={t.neutral.textMuted} numberOfLines={3} style={{ fontStyle: 'italic' }}>
              {answer.body}
            </Text>
          </View>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" onPress={open} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 2 }}>
        <NoteIcon size={18} />
        <Text variant="label" caps color={t.accent.text}>
          {answer ? 'Edit your answer' : 'Answer privately'}
        </Text>
      </Pressable>
    </View>
  );
}
