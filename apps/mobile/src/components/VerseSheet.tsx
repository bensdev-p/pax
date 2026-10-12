import { useTheme } from '@pax/tokens/react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { verseLabel, type VerseDetail } from '@/data/library';
import { openVerse } from '@/lib/libraryLinks';

import { ChevronIcon } from './Icons';
import { Text } from './Text';
import { VerseActions } from './VerseActions';

/**
 * Long-press menu for a verse in the reader: highlight, bookmark and a note, in a sheet over
 * the page so reading isn't interrupted. "Notes and links" opens the full verse panel.
 */
export function VerseSheet({ verse, onClose }: { verse: VerseDetail | null; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!verse} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.25)' }} />
        {verse ? (
          <View
            style={{
              backgroundColor: t.neutral.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 18,
              paddingTop: 10,
              paddingBottom: insets.bottom + 16,
              gap: 14,
            }}>
            <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.neutral.border }} />
            <View style={{ gap: 4 }}>
              <Text variant="label" caps color={t.accent.text}>
                {verseLabel(verse)}
              </Text>
              <Text variant="scripture" numberOfLines={3}>
                {verse.text}
              </Text>
            </View>
            <VerseActions verse={verse} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                openVerse(verse.ref);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 }}>
              <Text variant="label" caps color={t.neutral.textMuted}>
                Notes, Catechism and Fathers
              </Text>
              <ChevronIcon size={16} color={t.neutral.textMuted} />
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
