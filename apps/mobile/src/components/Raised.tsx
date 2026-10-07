import { useTheme } from '@pax/tokens/react';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';

/**
 * A surface with a solid bottom edge drawn in a darker shade. Pressing drops it onto the
 * edge (SPEC: Raised buttons). Used for buttons, tiles and cards.
 */
export function RaisedSurface({
  children,
  color,
  edgeColor,
  borderColor,
  edge = 4,
  radius,
  onPress,
  disabled,
  haptic = true,
  style,
  contentStyle,
  accessibilityLabel,
}: {
  children: ReactNode;
  color: string;
  edgeColor: string;
  borderColor?: string;
  edge?: number;
  radius?: number;
  onPress?: () => void;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const r = radius ?? t.radius.button;
  const body = (pressed: boolean) => (
    <View style={[{ paddingBottom: pressed ? 0 : edge, marginTop: pressed ? edge : 0 }, style]}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: pressed ? 0 : edge,
          bottom: 0,
          borderRadius: r,
          backgroundColor: edgeColor,
        }}
      />
      <View
        style={[
          {
            backgroundColor: color,
            borderRadius: r,
            borderWidth: borderColor ? t.border.width : 0,
            borderColor,
          },
          contentStyle,
        ]}>
        {children}
      </View>
    </View>
  );
  if (!onPress) return body(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      style={flexOf(style)}
      onPress={() => {
        if (haptic && Platform.OS !== 'web') void Haptics.selectionAsync();
        onPress();
      }}>
      {({ pressed }) => body(pressed && !disabled)}
    </Pressable>
  );
}

/** Lets a pressable surface take part in a row layout (flex: 1) like its inner view. */
function flexOf(style: StyleProp<ViewStyle>): ViewStyle | undefined {
  const flat = StyleSheet.flatten(style);
  return flat?.flex !== undefined ? { flex: flat.flex } : undefined;
}

type ButtonKind = 'accent' | 'white' | 'neutral' | 'ghost';

/** Uppercase, weight 900 label on a solid fill with a 5 px raised edge. */
export function RaisedButton({
  label,
  onPress,
  kind = 'accent',
  disabled,
  icon,
  height,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  icon?: ReactNode;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  if (kind === 'ghost') {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          { height: 48, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 },
          style,
        ]}>
        <Text variant="button" caps color={t.neutral.textMuted} style={{ fontSize: t.font.size.bodyLarge }}>
          {label}
        </Text>
      </Pressable>
    );
  }
  const colors = {
    accent: { fill: t.accent.accent, edge: t.accent.edge, text: t.accent.onAccent, border: undefined },
    white: { fill: '#FFFFFF', edge: 'rgba(0,0,0,0.18)', text: t.accent.edge, border: undefined },
    neutral: { fill: t.neutral.surface, edge: t.neutral.border, text: t.neutral.textMuted, border: t.neutral.border },
  }[kind];
  const off = disabled
    ? { fill: t.neutral.locked, edge: t.neutral.border, text: t.neutral.textSubtle, border: undefined }
    : colors;
  return (
    <RaisedSurface
      color={off.fill}
      edgeColor={off.edge}
      borderColor={off.border}
      edge={t.edge.button}
      radius={t.radius.button}
      onPress={onPress}
      disabled={disabled}
      style={style}
      accessibilityLabel={label}
      contentStyle={{
        height: height ?? t.size.buttonHeight,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}>
      {icon}
      <Text variant="button" caps color={off.text}>
        {label}
      </Text>
    </RaisedSurface>
  );
}

/** White card with a 2 px border and 4 px bottom edge (SPEC: Answer tiles and cards). */
export function Card({
  children,
  onPress,
  style,
  contentStyle,
  tinted,
  radius,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Accent-tinted fill and accent border, as for the "up next" card. */
  tinted?: boolean;
  radius?: number;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  return (
    <RaisedSurface
      color={tinted ? t.accent.tint : t.neutral.surface}
      edgeColor={tinted ? t.accent.accent : t.neutral.border}
      borderColor={tinted ? t.accent.accent : t.neutral.border}
      edge={t.edge.card}
      radius={radius ?? t.radius.button}
      onPress={onPress}
      style={style}
      contentStyle={contentStyle}
      accessibilityLabel={accessibilityLabel}>
      {children}
    </RaisedSurface>
  );
}
