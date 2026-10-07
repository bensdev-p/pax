import { useTheme } from '@pax/tokens/react';
import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Neutral background, safe-area top, optional fixed header and footer. */
export function Screen({
  header,
  footer,
  children,
  scroll = true,
  contentStyle,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const body = [{ padding: 16, gap: 14 }, contentStyle];
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.neutral.background }}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={[body, { paddingBottom: 32 }]}>{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1 }, body]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}
