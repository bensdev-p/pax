import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { BackIcon, ChevronIcon, CloseIcon } from './Icons';
import { Text } from './Text';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  close?: boolean;
  right?: ReactNode;
  onBack?: () => void;
  /** Makes the title a button (with a small chevron), e.g. the reader's book and chapter. */
  onTitlePress?: () => void;
  titleHint?: string;
}

/**
 * Pax's own header: back (or close) button, title and subtitle, as on the Daily readings canvas.
 * Used on web, and for sheets and modals with a close button on phones.
 */
export function HeaderBar({
  title,
  subtitle,
  close,
  right,
  onBack,
  onTitlePress,
  titleHint,
}: HeaderProps) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={close ? 'Close' : 'Back'}
        hitSlop={8}
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/today')))}
        style={{ width: 44, height: 44, justifyContent: 'center' }}>
        {close ? <CloseIcon color={t.neutral.textSubtle} /> : <BackIcon color={t.neutral.textSubtle} />}
      </Pressable>
      <Pressable
        disabled={!onTitlePress}
        onPress={onTitlePress}
        accessibilityRole={onTitlePress ? 'button' : undefined}
        accessibilityHint={titleHint}
        style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.6 : 1 })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          {onTitlePress && title ? (
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <ChevronIcon size={16} color={t.neutral.textSubtle} />
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text variant="label" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
      {right}
    </View>
  );
}
