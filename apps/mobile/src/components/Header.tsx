import { useTheme } from '@pax/tokens/react';
import { Stack } from 'expo-router';
import { Pressable, View } from 'react-native';

import { HeaderBar, type HeaderProps } from './HeaderBar';
import { ChevronIcon } from './Icons';
import { Text } from './Text';

/**
 * Screen headers on phones are the system navigation bar (Ben, Phase 3, on trial): on iOS a back
 * button naming the previous screen, a large title that shrinks into a translucent bar as you
 * scroll; on Android a Material top app bar. Titles stay in Nunito. The subtitle (the native bar
 * has none) sits under the title at the top of the content. Sheets and modals with a close
 * button keep Pax's own header. To go back to Pax's headers everywhere, delete this file and
 * rename `Header.web.tsx` to `Header.tsx`.
 */
export function Header(props: HeaderProps) {
  const t = useTheme();
  if (!usesNativeHeader(props)) return <HeaderBar {...props} />;
  const { title, subtitle, right, onTitlePress, titleHint } = props;
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          // A tappable title (the reader's "Psalms 22 ⌄") stays small, like Apple Books.
          headerLargeTitle: !onTitlePress,
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerTintColor: t.accent.accent,
          headerStyle: { backgroundColor: t.neutral.background },
          headerLargeStyle: { backgroundColor: t.neutral.background },
          headerTitleStyle: { fontFamily: 'Nunito_900Black', color: t.neutral.text },
          headerLargeTitleStyle: { fontFamily: 'Nunito_900Black', color: t.neutral.text },
          headerBackTitleStyle: { fontFamily: 'Nunito_700Bold' },
          headerRight: right ? () => right : undefined,
          headerTitle: onTitlePress
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint={titleHint}
                  onPress={onTitlePress}
                  hitSlop={8}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
                    {title}
                  </Text>
                  <View style={{ transform: [{ rotate: '90deg' }] }}>
                    <ChevronIcon size={14} color={t.neutral.textSubtle} />
                  </View>
                </Pressable>
              )
            : undefined,
        }}
      />
      {subtitle ? (
        <Text variant="small" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold', marginTop: -6 }}>
          {subtitle}
        </Text>
      ) : null}
    </>
  );
}

/** Sheets and modals (a close button) keep Pax's header; every other screen uses the native bar. */
export const usesNativeHeader = (props: HeaderProps) => !props.close;
