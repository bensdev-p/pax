import { useTheme } from '@pax/tokens/react';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { SearchIcon } from './Icons';
import { Card } from './Raised';
import { Text } from './Text';

/** Small caps label above a group, as on the canvas ("FIRST READING"). */
export function SectionLabel({ children, color }: { children: ReactNode; color?: string }) {
  const t = useTheme();
  return (
    <Text variant="label" caps color={color ?? t.neutral.textMuted}>
      {children}
    </Text>
  );
}

/** The grey search field from the Library canvas, as a button that opens search. */
export function SearchField({ onPress, placeholder }: { onPress: () => void; placeholder: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel="Search the library"
      onPress={onPress}
      style={{
        height: 50,
        borderWidth: t.border.width,
        borderColor: t.neutral.border,
        borderRadius: t.radius.tile,
        backgroundColor: t.neutral.surfaceMuted,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}>
      <SearchIcon color={t.neutral.textSubtle} />
      <Text variant="bodyStrong" color={t.neutral.textSubtle} style={{ fontFamily: 'Nunito_700Bold' }}>
        {placeholder}
      </Text>
    </Pressable>
  );
}

/** One of the four Library shelves. */
export function ShelfTile({
  icon,
  tint,
  title,
  subtitle,
  onPress,
}: {
  icon: ReactNode;
  tint: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Card
      onPress={onPress}
      radius={t.radius.card}
      style={{ flex: 1 }}
      accessibilityLabel={title}
      contentStyle={{ padding: 14, gap: 8, minHeight: 132 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: t.radius.tile,
          backgroundColor: `${tint}${t.scheme === 'dark' ? '38' : '24'}`,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <Text variant="title" style={{ fontSize: 18 }}>
        {title}
      </Text>
      <Text variant="small" color={t.neutral.textMuted}>
        {subtitle}
      </Text>
    </Card>
  );
}

/** A rounded chip; the first one on the canvas is accent-tinted. */
export function Chip({ label, onPress, accent }: { label: string; onPress: () => void; accent?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 40,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: t.border.width,
        borderColor: accent ? t.accent.accent : t.neutral.border,
        backgroundColor: accent ? t.accent.tint : t.neutral.surface,
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}>
      <Text
        variant="body"
        color={accent ? t.accent.text : t.neutral.text}
        style={{ fontFamily: accent ? 'Nunito_900Black' : 'Nunito_800ExtraBold' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A thin row with a title, optional subtitle and a chevron-like count. */
export function ListRow({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: t.border.width,
        borderBottomColor: t.neutral.divider,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        opacity: pressed ? 0.6 : 1,
      })}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" color={t.neutral.textMuted} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? (
        <Text variant="small" color={t.neutral.textSubtle} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
          {right}
        </Text>
      ) : null}
    </Pressable>
  );
}
