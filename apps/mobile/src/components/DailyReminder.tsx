import { useTheme } from '@pax/tokens/react';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { formatTime } from '@/notifications/plan';
import { requestPermission } from '@/notifications/reminders';

import { BellIcon } from './Icons';
import { Text } from './Text';
import { TimePicker } from './TimePicker';

/**
 * A daily reminder for a novena or reading plan: set, change or turn off its time. Asks for
 * notification permission the first time one is set (on this Pax screen, never at launch).
 */
export function DailyReminder({
  time,
  onChange,
  defaultTime = '19:00',
}: {
  time: string | null;
  onChange: (time: string | null) => Promise<void>;
  defaultTime?: string;
}) {
  const t = useTheme();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const set = async (next: string | null) => {
    setNotice(null);
    if (next && Platform.OS !== 'web' && (await requestPermission()) !== 'granted') {
      setNotice('Notifications are off for Pax. You can turn them on in your phone’s Settings.');
      return;
    }
    if (next && Platform.OS === 'web') setNotice('Reminders work in the phone app, not on the web.');
    await onChange(next);
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BellIcon />
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {time ? `Reminder at ${formatTime(time)}` : 'Daily reminder'}
        </Text>
        {time ? (
          <Pressable accessibilityRole="button" onPress={() => void set(null)} hitSlop={8}>
            <Text variant="label" caps color={t.neutral.textMuted}>
              Turn off
            </Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => setEditing(!editing)} hitSlop={8}>
          <Text variant="label" caps color={t.accent.text}>
            {editing ? 'Done' : time ? 'Change' : 'Set'}
          </Text>
        </Pressable>
      </View>
      {editing ? <TimePicker value={time ?? defaultTime} onChange={(next) => void set(next)} /> : null}
      {notice ? (
        <Text variant="small" color={t.neutral.textMuted}>
          {notice}
        </Text>
      ) : null}
    </View>
  );
}
