import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { BackIcon, CloseIcon } from './Icons';
import { Text } from './Text';

/** Back (or close) button, title and subtitle, as on the Daily readings canvas. */
export function Header({
  title,
  subtitle,
  close,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  close?: boolean;
  right?: ReactNode;
  onBack?: () => void;
}) {
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
      <View style={{ flex: 1 }}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="label" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
