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
        // "automatic" lets iOS keep content clear of the native tab bar it floats over.
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[body, { paddingBottom: 32 }]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, body]}>{children}</View>
      )}
      {footer}
    </>
  );
  if (sheet) return <View style={{ flex: 1, paddingTop: 10, backgroundColor: t.neutral.background }}>{content}</View>;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.neutral.background }}>
      {content}
    </SafeAreaView>
  );
}
