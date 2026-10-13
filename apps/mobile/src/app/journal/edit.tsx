import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '@/components/Header';
import { TagChip } from '@/components/Journal';
import { RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';
import { userStore } from '@/data/userStore';
import type { Note, NoteTarget } from '@/data/types';
import { defaultTags, makeNote, normalizeTag, SUGGESTED_TAGS, tagsFrom } from '@/lib/notes';
import { useTapTwice } from '@/lib/useTapTwice';
import { notes } from '@/state/notes';

const TARGETS: NoteTarget[] = ['verse', 'readings', 'course_day', 'entry'];

/**
 * Write in the journal: an answer to Pax's question (readings, plan day), a note on a verse,
 * or a free entry. Private, on the phone only. Opened with `id` to edit an entry, or with a
 * target (and the question as `prompt`) to answer it; an earlier answer is reopened.
 */
export default function JournalEditScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; targetType?: string; targetKey?: string; prompt?: string; title?: string }>();
  const targetType: NoteTarget = TARGETS.includes(params.targetType as NoteTarget) ? (params.targetType as NoteTarget) : 'entry';
  const [existing, setExisting] = useState<Note | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>(defaultTags(targetType));
  const [custom, setCustom] = useState('');
  const [usedTags, setUsedTags] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const journal = await userStore.getNotes({ kind: 'journal' });
      setUsedTags([...new Set(journal.flatMap((n) => n.tags))]);
      const found = params.id
        ? journal.find((n) => n.id === params.id)
        : targetType !== 'entry' && params.targetKey
          ? journal.find((n) => n.targetType === targetType && n.targetKey === params.targetKey)
          : undefined;
      if (found) {
        setExisting(found);
        setBody(found.body ?? '');
        setTags(found.tags);
      }
      setLoaded(true);
    })();
  }, [params.id, params.targetKey, targetType]);

  const prompt = existing?.prompt ?? (params.prompt ? String(params.prompt) : null);
  const kindOf = existing?.targetType ?? targetType;
  const title = params.title ? String(params.title) : kindOf === 'entry' ? 'Journal' : kindOf === 'verse' ? 'Note on a verse' : 'Pax asks';
  const offered = [...new Set([...SUGGESTED_TAGS, ...usedTags, ...tags])];

  const toggle = (tag: string) => setTags(tags.includes(tag) ? tags.filter((x) => x !== tag) : [...tags, tag]);
  const addCustom = () => {
    const tag = normalizeTag(custom);
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setCustom('');
  };

  const save = async () => {
    const text = body.trim();
    if (!text) {
      if (existing) await notes.remove(existing.id);
    } else {
      const base =
        existing ??
        makeNote({ kind: 'journal', targetType, targetKey: params.targetKey ? String(params.targetKey) : undefined, prompt });
      await notes.save({ ...base, body: text, tags: tagsFrom(text, tags) });
    }
    router.back();
  };

  const remove = async () => {
    if (existing) await notes.remove(existing.id);
    router.back();
  };
  const deleting = useTapTwice(() => void remove());

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: t.neutral.background, paddingTop: insets.top }}>
      <Header close title={title} subtitle="Private to you, on this phone" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
        {prompt ? (
          <View style={{ borderLeftWidth: 4, borderLeftColor: t.accent.accent, paddingLeft: 12 }}>
            <Text variant="scripture">{prompt}</Text>
          </View>
        ) : null}

        {loaded ? (
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            autoFocus={!existing}
            placeholder={kindOf === 'entry' ? 'Write anything: a prayer, a thought, a grace from today…' : 'Write your answer…'}
            placeholderTextColor={t.neutral.textSubtle}
            textAlignVertical="top"
            accessibilityLabel="Write your entry"
            style={{
              minHeight: 180,
              borderWidth: t.border.width,
              borderColor: t.neutral.border,
              borderRadius: t.radius.button,
              padding: 14,
              color: t.neutral.text,
              backgroundColor: t.neutral.surface,
              fontFamily: 'SourceSerif4_400Regular',
              fontSize: t.font.size.scripture,
              lineHeight: t.font.size.scripture * 1.5,
            }}
          />
        ) : null}

        <View style={{ gap: 8 }}>
          <Text variant="label" caps color={t.neutral.textMuted}>
            Tags
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {offered.map((tag) => (
              <TagChip key={tag} tag={tag} selected={tags.includes(tag)} onPress={() => toggle(tag)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              onSubmitEditing={addCustom}
              placeholder="#your-own-tag"
              placeholderTextColor={t.neutral.textSubtle}
              autoCapitalize="none"
              returnKeyType="done"
              accessibilityLabel="Add a tag"
              style={{
                flex: 1,
                height: 40,
                borderWidth: t.border.width,
                borderColor: t.neutral.border,
                borderRadius: t.radius.chip,
                paddingHorizontal: 12,
                color: t.neutral.text,
                fontFamily: 'Nunito_700Bold',
              }}
            />
            <RaisedButton kind="neutral" label="Add" height={40} onPress={addCustom} />
          </View>
          <Text variant="small" color={t.neutral.textSubtle}>
            You can also type #tags in your entry.
          </Text>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12, gap: 4 }}>
        <RaisedButton label="Save" onPress={() => void save()} />
        {existing ? <RaisedButton kind="ghost" label={deleting.armed ? 'Tap again to delete' : 'Delete entry'} onPress={deleting.press} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}
