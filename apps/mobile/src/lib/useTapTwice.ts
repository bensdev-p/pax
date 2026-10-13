import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

/** How long the second tap stays armed. */
const ARMED_MS = 4000;

/**
 * Pax's confirmation for something that can't be undone (decided with Ben: Pax's own look, not a
 * system alert): the first tap arms it and the button says so, a second tap within a few seconds
 * does it.
 */
export function useTapTwice(action: () => void): { armed: boolean; press: () => void } {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const press = () => {
    if (timer.current) clearTimeout(timer.current);
    if (armed) {
      setArmed(false);
      action();
      return;
    }
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), ARMED_MS);
  };
  return { armed, press };
}
