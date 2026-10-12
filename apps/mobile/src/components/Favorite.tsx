import { useTheme } from '@pax/tokens/react';
import { Pressable } from 'react-native';

import { makeNote } from '@/lib/notes';
import { notes, useNotes } from '@/state/notes';

import { StarIcon } from './Icons';

/** A star in a prayer's or devotion's header: favorites show first on the Pray tab. */
export function FavoriteButton({ targetType, slug, title }: { targetType: 'prayer' | 'devotion'; slug: string; title: string }) {
  const t = useTheme();
  const { notes: found } = useNotes({ kind: 'favorite', targetType, targetKey: slug });
  const favorite = found[0];
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!favorite }}
      accessibilityLabel={favorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
      hitSlop={8}
      onPress={() =>
        void (favorite ? notes.remove(favorite.id) : notes.save(makeNote({ kind: 'favorite', targetType, targetKey: slug, prompt: title })))
      }
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <StarIcon size={26} filled={!!favorite} color={favorite ? '#FFC107' : t.neutral.textSubtle} />
    </Pressable>
  );
}
