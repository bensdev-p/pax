import { useTheme } from '@pax/tokens/react';
import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Neutral background, safe-area top, optional fixed header and footer. `sheet` is for screens
 * shown as a native iOS sheet: no status-bar inset, a little room under the grabber.
 */
export function Screen({
  header,
  footer,
  children,
  scroll = true,
  sheet = false,
  contentStyle,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  sheet?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const body = [{ padding: 16, gap: 14 }, contentStyle];
  const content = (
    <>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={[body, { paddingBottom: 32 }]}>{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1 }, body]}>{children}</View>
      )}
      {footer}
    </>
  );
  if (sheet) {
    // In a native sheet the screen's height isn't fixed, so a header above a ScrollView can collapse
    // onto it. The ScrollView is the whole sheet instead (iOS also expands the sheet when it scrolls),
    // with the header as its first row. Taps on buttons work while the keyboard is up, and the
    // content scrolls clear of the keyboard.
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: t.neutral.background }}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {header}
        <View style={body}>{children}</View>
        {footer}
      </ScrollView>
    );
  }
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.neutral.background }}>
      {content}
    </SafeAreaView>
  );
}
