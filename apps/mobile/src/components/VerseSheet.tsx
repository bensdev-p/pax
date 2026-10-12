import { useTheme } from '@pax/tokens/react';
import { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { verseLabel, type VerseDetail } from '@/data/library';
import { openVerse } from '@/lib/libraryLinks';

import { ChevronIcon } from './Icons';
import { Text } from './Text';
import { VerseActions } from './VerseActions';

/**
 * Long-press menu for a verse in the reader: highlight, bookmark and a note, in a sheet over
 * the page so reading isn't interrupted. Swipe up (or "Notes, Catechism and Fathers") opens the
 * full verse panel; swipe down closes the sheet.
 */
export function VerseSheet({ verse, onClose }: { verse: VerseDetail | null; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const openFull = () => {
    if (!verse) return;
    onClose();
    openVerse(verse.ref);
  };

  const [drag] = useState(() => new Animated.Value(0));
  // A swipe that closed the sheet leaves it dragged down: start each new sheet in place.
  useEffect(() => {
    if (verse) drag.setValue(0);
  }, [verse, drag]);
  const pan = PanResponder.create({
    // Only a clear vertical swipe takes over, so taps on the colors and the note still work.
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
    onPanResponderMove: (_e, g) => drag.setValue(g.dy > 0 ? g.dy : g.dy / 3),
    onPanResponderRelease: (_e, g) => {
      if (g.dy > 90 || g.vy > 0.8) onClose();
      else if (g.dy < -50 || g.vy < -0.8) openFull();
      Animated.spring(drag, { toValue: 0, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: false }).start(),
  });
  return (
    <Modal visible={!!verse} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.25)',
          }}
        />
        {verse ? (
          <Animated.View
            {...pan.panHandlers}
            style={{
              transform: [{ translateY: drag }],
              backgroundColor: t.neutral.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 18,
              paddingTop: 10,
              paddingBottom: insets.bottom + 16,
              gap: 14,
            }}>
            <View
              accessibilityLabel="Swipe up for notes, Catechism and Fathers; swipe down to close"
              style={{
                alignSelf: 'center',
                width: 40,
                height: 5,
                borderRadius: 3,
                backgroundColor: t.neutral.border,
              }}
            />
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
              onPress={openFull}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                paddingVertical: 4,
              }}>
              <Text variant="label" caps color={t.neutral.textMuted}>
                Notes, Catechism and Fathers
              </Text>
              <ChevronIcon size={16} color={t.neutral.textMuted} />
            </Pressable>
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
