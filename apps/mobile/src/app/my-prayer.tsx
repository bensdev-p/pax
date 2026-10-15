import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChip } from '@/components/FilterChip';
import { Header } from '@/components/Header';
import { LockIcon } from '@/components/Icons';
import { RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';
import { userStore } from '@/data/userStore';
import type { MyPrayer } from '@/data/types';
import { myPrayerFrom } from '@/lib/myPrayers';
import { PRAYER_SECTIONS } from '@/lib/pray';
import { myPrayers } from '@/state/myPrayers';

/**
 * Adds a prayer to the user's prayer book, or edits one (`id`). Title, an optional author, one of
 * the book's sections, the prayer as typed or pasted, and optionally its Latin. Kept on the phone.
 */
export default function MyPrayerScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; section?: string }>();
  const [existing, setExisting] = useState<MyPrayer | null>(null);
  const [loaded, setLoaded] = useState(!params.id);
  const [title, setTitle] = useState('');
  const [by, setBy] = useState('');
  const [category, setCategory] = useState(
    PRAYER_SECTIONS.some((s) => s.category === params.section) ? String(params.section) : PRAYER_SECTIONS[1]!.category,
  );
  const [text, setText] = useState('');
  const [latin, setLatin] = useState('');
  const [showLatin, setShowLatin] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    void userStore.getMyPrayers().then((all) => {
      const found = all.find((p) => p.id === params.id);
      if (found) {
        setExisting(found);
        setTitle(found.title);
        setBy(found.by ?? '');
        setCategory(found.category);
        setText(found.text);
        setLatin(found.latinText ?? '');
        setShowLatin(!!found.latinText);
      }
      setLoaded(true);
    });
  }, [params.id]);

  const prayer = myPrayerFrom({ title, by, category, text, latinText: latin }, existing ?? undefined);

  const save = async () => {
    if (!prayer) return;
    await myPrayers.save(prayer);
    router.back();
  };

  const field = {
    placeholderTextColor: t.neutral.textSubtle,
    style: {
      borderWidth: t.border.width,
      borderColor: t.neutral.border,
      borderRadius: t.radius.tile,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: t.neutral.text,
      backgroundColor: t.neutral.surface,
      fontFamily: 'Nunito_800ExtraBold',
      fontSize: t.font.size.bodyLarge,
    },
  };
  const prayerField = {
    ...field,
    multiline: true,
    textAlignVertical: 'top' as const,
    style: {
      ...field.style,
      minHeight: 180,
      fontFamily: 'SourceSerif4_400Regular',
      fontSize: t.font.size.scripture - 1,
      lineHeight: (t.font.size.scripture - 1) * 1.45,
    },
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: t.neutral.background, paddingTop: insets.top }}>
      <Header close title={existing ? 'Edit your prayer' : 'Add a prayer'} subtitle="Kept only on this phone" />
      {loaded ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          <Label text="Title" />
          <TextInput {...field} value={title} onChangeText={setTitle} placeholder="Prayer for Peace" accessibilityLabel="Title" autoFocus={!existing} />

          <Label text="By · optional" />
          <TextInput {...field} value={by} onChangeText={setBy} placeholder="Saint Augustine, Pope Pius XII…" accessibilityLabel="Who wrote it" />

          <Label text="Section" />
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PRAYER_SECTIONS.map((s) => (
              <FilterChip key={s.category} label={s.title} selected={s.category === category} onPress={() => setCategory(s.category)} />
            ))}
          </View>

          <Label text="The prayer" />
          <TextInput {...prayerField} value={text} onChangeText={setText} placeholder="Paste or type it here…" accessibilityLabel="The prayer" />
          <Text variant="small" color={t.neutral.textMuted}>
            Each line shows as you write it; a blank line starts a new verse. “V.” and “R.” lines are marked as in the book.
          </Text>

          {showLatin ? (
            <>
              <Label text="In Latin · optional" />
              <TextInput {...prayerField} value={latin} onChangeText={setLatin} placeholder="Pater noster…" accessibilityLabel="The prayer in Latin" />
            </>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setShowLatin(true)} hitSlop={8} style={{ alignSelf: 'flex-start', paddingVertical: 6 }}>
              <Text variant="label" caps color={t.accent.text}>
                + Add the Latin
              </Text>
            </Pressable>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
            <View style={{ paddingTop: 2 }}>
              <LockIcon size={16} color={t.neutral.textSubtle} />
            </View>
            <Text variant="small" color={t.neutral.textMuted} style={{ flex: 1 }}>
              Saved only on this phone, like your journal.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
        <RaisedButton label={existing ? 'Save' : 'Add to my prayer book'} disabled={!prayer} onPress={() => void save()} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  const t = useTheme();
  return (
    <Text variant="label" caps color={t.neutral.textMuted} style={{ marginTop: 4 }}>
      {text}
    </Text>
  );
}
