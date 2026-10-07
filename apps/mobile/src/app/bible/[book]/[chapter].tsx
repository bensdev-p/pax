import { parseCitation, rangesInclude } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackIcon, ChevronIcon } from '@/components/Icons';
import { Header } from '@/components/Header';
import { Text } from '@/components/Text';
import { useLibrary } from '@/data/content';
import type { ChapterView } from '@/data/library';
import { openVerse } from '@/lib/libraryLinks';
import { useAppState } from '@/state/AppState';

/**
 * The Douay-Rheims reader. Verses are shown in Douay order and numbering; a dot marks verses
 * with Challoner notes or Catechism and Fathers links. Tapping a verse opens them.
 */
export default function ReaderScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ book: string; chapter: string; verse?: string; hl?: string }>();
  const book = String(params.book);
  const chapterNumber = Number(params.chapter);
  const library = useLibrary();
  const { updateSettings } = useAppState();
  const [view, setView] = useState<ChapterView | null>(null);
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const scrolled = useRef(false);

  const highlight = useMemo(() => (params.hl ? parseCitation(String(params.hl)) : []), [params.hl]);

  useEffect(() => {
    scrolled.current = false;
    void library.chapter(book, chapterNumber).then(setView);
    void updateSettings({ lastRead: { book, chapter: chapterNumber } });
  }, [library, book, chapterNumber, updateSettings]);

  // Where this Douay chapter sits in modern numbering (Psalms, Joel 2–3, Malachi 4).
  const modern = view ? [...new Set(view.verses.map((v) => v.chapter))] : [];
  const modernName = view?.book.osis === 'Ps' ? 'Psalm' : view?.book.name;
  const subtitle =
    view && (modern.length > 1 || modern[0] !== chapterNumber || view.book.name !== view.book.name_douay)
      ? `${modernName} ${modern.join('–')} in modern Bibles`
      : undefined;

  const go = (c: number) =>
    router.replace({ pathname: '/bible/[book]/[chapter]', params: { book, chapter: String(c) } });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.neutral.background }}>
      <Header title={view ? `${view.book.name_douay} ${chapterNumber}` : ''} subtitle={subtitle} />
      <ScrollView ref={scroll} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}>
        {view?.summary || view?.incipit ? (
          <View
            style={{
              borderRadius: t.radius.button,
              backgroundColor: t.neutral.surfaceMuted,
              padding: 14,
              gap: 4,
            }}>
            {view.incipit ? (
              <Text variant="label" caps color={t.accent.text}>
                {view.incipit.replace(/\.$/, '')}
              </Text>
            ) : null}
            {view.summary ? (
              <Text variant="small" color={t.neutral.textMuted} style={{ fontStyle: 'italic' }}>
                {view.summary}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View>
          {view?.verses.map((v) => {
            const marked = highlight.length > 0 && rangesInclude(highlight, book, v.chapter, v.verse);
            const linked = v.links > 0 || v.notes > 0;
            return (
              <Pressable
                key={v.ref}
                accessibilityRole="button"
                accessibilityLabel={`Verse ${v.douay_verse}${linked ? ', has notes or links' : ''}`}
                onPress={() => openVerse(v.ref)}
                onLayout={(e) => {
                  // Read the layout now: React reuses the event object once this handler returns.
                  const y = e.nativeEvent.layout.y;
                  offsets.current[v.ref] = y;
                  if (!scrolled.current && params.verse === v.ref) {
                    scrolled.current = true;
                    setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y - 12), animated: false }), 0);
                  }
                }}
                style={({ pressed }) => ({
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  marginHorizontal: -8,
                  borderRadius: 10,
                  backgroundColor: pressed ? t.neutral.surfaceMuted : marked ? t.accent.tint : 'transparent',
                })}>
                <Text variant="scripture">
                  {/* Keep the paragraph's line height; a smaller one here squeezes the lines on iOS. */}
                  <Text variant="label" color={t.accent.text} style={{ fontSize: 12, lineHeight: t.font.size.scripture * 1.5 }}>
                    {v.douay_verse}
                    {linked ? ' •' : ''}
                    {'  '}
                  </Text>
                  {v.text}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {view ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <NavButton disabled={chapterNumber <= 1} onPress={() => go(chapterNumber - 1)} label={`Chapter ${chapterNumber - 1}`} back />
            <NavButton
              disabled={chapterNumber >= view.book.chapter_count}
              onPress={() => go(chapterNumber + 1)}
              label={`Chapter ${chapterNumber + 1}`}
            />
          </View>
        ) : null}
        <Text variant="small" color={t.neutral.textSubtle} align="center">
          Douay-Rheims Bible, Challoner revision (public domain)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function NavButton({ label, onPress, disabled, back }: { label: string; onPress: () => void; disabled?: boolean; back?: boolean }) {
  const t = useTheme();
  if (disabled) return <View />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: t.radius.tile,
        borderWidth: t.border.width,
        borderColor: t.neutral.border,
        borderBottomWidth: pressed ? t.border.width : t.edge.card,
        backgroundColor: t.neutral.surface,
      })}>
      {back ? <BackIcon size={18} color={t.neutral.textMuted} /> : null}
      <Text variant="small" style={{ fontFamily: 'Nunito_900Black' }}>
        {label}
      </Text>
      {back ? null : <ChevronIcon size={18} color={t.neutral.textMuted} />}
    </Pressable>
  );
}
