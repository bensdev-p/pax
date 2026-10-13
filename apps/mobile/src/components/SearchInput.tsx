import { useTheme } from '@pax/tokens/react';
import { Platform, TextInput, View } from 'react-native';

import { SearchIcon } from './Icons';

// The field already has a focus border; drop the browser's own outline on web.
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineWidth: 0 } as object) : null;

/** A search field that filters the list below it as you type. */
export function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        height: 50,
        borderWidth: t.border.width,
        borderColor: value.trim() ? t.accent.accent : t.neutral.border,
        borderRadius: t.radius.tile,
        backgroundColor: t.neutral.surface,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}>
      <SearchIcon color={t.neutral.textSubtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.neutral.textSubtle}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        style={[{ flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: t.neutral.text }, WEB_NO_OUTLINE]}
      />
    </View>
  );
}
