import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckIcon, FlameIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';
import { DEFAULT_NOTIFICATION_PREFS, REMINDER_TIMES, type ReminderSlot } from '@/data/types';
import { requestPermission } from '@/notifications/reminders';
import { useAppState } from '@/state/AppState';

const SLOTS: { slot: ReminderSlot; label: string; time: string }[] = [
  { slot: 'evening', label: 'Every evening', time: '8:00 PM' },
  { slot: 'morning', label: 'Every morning', time: '7:30 AM' },
];

/**
 * The Pax screen that explains reminders before the system prompt (SPEC: Notifications rule 2).
 * Opened from Profile in Phase 1; after the first finished lesson once Learn exists.
 */
export default function RemindersScreen() {
  const t = useTheme();
  const { notificationPrefs, updateNotificationPrefs } = useAppState();
  const current = notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;
  const [slot, setSlot] = useState<ReminderSlot>(current.slot);
  const [angelus, setAngelus] = useState(current.angelus);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const enabled = current.dailyReminder || current.angelus;

  const turnOn = async () => {
    setBusy(true);
    try {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        setDenied(true);
        return;
      }
      await updateNotificationPrefs({ dailyReminder: true, slot, localTime: REMINDER_TIMES[slot], angelus });
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    await updateNotificationPrefs({ ...current, dailyReminder: false, angelus: false });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.neutral.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12, gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Pax mood="happy" size={170} shadow={false} />
          <Text variant="display" align="center" accessibilityRole="header">
            Want a nudge from Pax?
          </Text>
          <Text variant="bodyStrong" align="center" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_700Bold' }}>
            A short daily reminder is the easiest way to keep going. You choose when.
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-start',
            borderWidth: t.border.width,
            borderColor: t.neutral.border,
            backgroundColor: t.neutral.surfaceMuted,
            borderRadius: t.radius.card,
            paddingVertical: 12,
            paddingHorizontal: 14,
          }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: t.accent.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <FlameIcon size={22} color={t.accent.onAccent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="small" style={{ fontFamily: 'Nunito_900Black' }}>
              Your streak is waiting
            </Text>
            <Text variant="small" color={t.neutral.textMuted}>
              Two minutes with today’s readings keeps it going. I saved you a spot.
            </Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text variant="body" style={{ fontFamily: 'Nunito_900Black', marginBottom: 2 }}>
            Remind me
          </Text>
          {SLOTS.map((s) => {
            const on = s.slot === slot;
            return (
              <Option key={s.slot} selected={on} onPress={() => setSlot(s.slot)} role="radio" label={s.label}>
                <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }} color={on ? t.accent.text : t.neutral.textMuted}>
                  {s.time}
                </Text>
              </Option>
            );
          })}
          <Option selected={false} onPress={() => setAngelus(!angelus)} role="checkbox" checked={angelus} label="Also pray the Angelus at noon">
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: t.border.width,
                borderColor: angelus ? t.accent.accent : t.neutral.textSubtle,
                backgroundColor: angelus ? t.accent.accent : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {angelus ? <CheckIcon size={14} color={t.accent.onAccent} /> : null}
            </View>
          </Option>
        </View>

        {denied ? (
          <View style={{ gap: 6 }}>
            <Text variant="body" color={t.neutral.textMuted} align="center">
              Notifications are turned off for Pax. You can turn them on in Settings whenever you like.
            </Text>
            {Platform.OS !== 'web' ? (
              <Pressable accessibilityRole="link" onPress={() => void Linking.openSettings()} style={{ alignSelf: 'center', padding: 6 }}>
                <Text variant="body" color={t.accent.text} style={{ textDecorationLine: 'underline', fontFamily: 'Nunito_800ExtraBold' }}>
                  Open Settings
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {Platform.OS === 'web' ? (
          <Text variant="small" color={t.neutral.textMuted} align="center">
            Reminders are scheduled on your phone, so they aren’t available on the web.
          </Text>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 12 }}>
        <RaisedButton label={enabled ? 'Save reminders' : 'Turn on reminders'} onPress={() => void turnOn()} disabled={busy || Platform.OS === 'web'} />
        <RaisedButton kind="ghost" label={enabled ? 'Turn off reminders' : 'Not now'} onPress={() => (enabled ? void turnOff() : router.back())} />
      </View>
    </SafeAreaView>
  );
}

function Option({
  label,
  selected,
  onPress,
  role,
  checked,
  children,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role: 'radio' | 'checkbox';
  checked?: boolean;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected } : { checked }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        height: t.size.rowHeight,
        borderRadius: t.radius.tile,
        borderWidth: t.border.width,
        borderColor: selected ? t.accent.accent : t.neutral.border,
        backgroundColor: selected ? t.accent.tint : t.neutral.surface,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Text variant="bodyStrong">{label}</Text>
      {children}
    </Pressable>
  );
}
