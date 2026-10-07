import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckIcon, FlameIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { RaisedButton } from '@/components/Raised';
import { Text } from '@/components/Text';
import { TimePicker } from '@/components/TimePicker';
import {
  anyNotificationsOn,
  DEFAULT_NOTIFICATION_PREFS,
  SUGGESTED_NOTIFICATION_PREFS,
  type NotificationPrefs,
  type ReminderSlot,
} from '@/data/types';
import { formatTime, NUDGE_TIMES } from '@/notifications/plan';
import { requestPermission } from '@/notifications/reminders';
import { useAppState } from '@/state/AppState';

/**
 * The Pax screen that explains reminders before the system prompt (SPEC: Notifications rule 2).
 * Opened from Profile for now; after the first finished lesson once Learn exists.
 */
export default function RemindersScreen() {
  const t = useTheme();
  const { notificationPrefs, updateNotificationPrefs } = useAppState();
  const saved = notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;
  const wasOn = anyNotificationsOn(saved);
  const [prefs, setPrefs] = useState<NotificationPrefs>(wasOn ? saved : SUGGESTED_NOTIFICATION_PREFS);
  const [editing, setEditing] = useState<ReminderSlot | null>(null);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const web = Platform.OS === 'web';

  const save = async () => {
    setBusy(true);
    try {
      if (anyNotificationsOn(prefs) && (await requestPermission()) !== 'granted') {
        setDenied(true);
        return;
      }
      await updateNotificationPrefs(prefs);
      router.back();
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    await updateNotificationPrefs({
      ...prefs,
      morning: { ...prefs.morning, enabled: false },
      evening: { ...prefs.evening, enabled: false },
      nudges: false,
      angelus: false,
    });
    router.back();
  };

  const slot = (key: ReminderSlot, label: string) => {
    const r = prefs[key];
    const open = editing === key;
    return (
      <View style={{ gap: 8 }}>
        <View
          style={{
            minHeight: t.size.rowHeight,
            borderRadius: t.radius.tile,
            borderWidth: t.border.width,
            borderColor: r.enabled ? t.accent.accent : t.neutral.border,
            backgroundColor: r.enabled ? t.accent.tint : t.neutral.surface,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: r.enabled }}
            accessibilityLabel={label}
            onPress={() => setPrefs({ ...prefs, [key]: { ...r, enabled: !r.enabled } })}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14, paddingVertical: 12 }}>
            <Box checked={r.enabled} />
            <Text variant="bodyStrong">{label}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change ${label.toLowerCase()} time, now ${formatTime(r.time)}`}
            onPress={() => {
              setEditing(open ? null : key);
              if (!r.enabled) setPrefs({ ...prefs, [key]: { ...r, enabled: true } });
            }}
            style={{
              marginRight: 8,
              paddingHorizontal: 12,
              height: 36,
              borderRadius: t.radius.chip,
              justifyContent: 'center',
              borderWidth: t.border.width,
              borderColor: open ? t.accent.accent : 'transparent',
              backgroundColor: open ? t.neutral.surface : 'transparent',
            }}>
            <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }} color={r.enabled ? t.accent.text : t.neutral.textMuted}>
              {formatTime(r.time)}
            </Text>
          </Pressable>
        </View>
        {open ? (
          <TimePicker value={r.time} onChange={(time) => setPrefs({ ...prefs, [key]: { enabled: true, time } })} />
        ) : null}
      </View>
    );
  };

  const nudgeTimes = NUDGE_TIMES.map(formatTime).join(', ').replace(/, ([^,]*)$/, ' and $1');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.neutral.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12, gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Pax mood="happy" size={150} shadow={false} />
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
            style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: t.accent.accent, alignItems: 'center', justifyContent: 'center' }}>
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
          {slot('morning', 'Every morning')}
          {slot('evening', 'Every evening')}
          <Check
            label="Nudge me if I haven’t prayed yet"
            detail={`Around ${nudgeTimes}, only on days you haven’t read or prayed yet.`}
            checked={prefs.nudges}
            onPress={() => setPrefs({ ...prefs, nudges: !prefs.nudges })}
          />
          <Check label="Also pray the Angelus at noon" checked={prefs.angelus} onPress={() => setPrefs({ ...prefs, angelus: !prefs.angelus })} />
          <Text variant="small" color={t.neutral.textMuted}>
            Once you’ve read or prayed for the day, I’ll stay quiet until tomorrow.
          </Text>
        </View>

        {denied ? (
          <View style={{ gap: 6 }}>
            <Text variant="body" color={t.neutral.textMuted} align="center">
              Notifications are turned off for Pax. You can turn them on in Settings whenever you like.
            </Text>
            <Pressable accessibilityRole="link" onPress={() => void Linking.openSettings()} style={{ alignSelf: 'center', padding: 6 }}>
              <Text variant="body" color={t.accent.text} style={{ textDecorationLine: 'underline', fontFamily: 'Nunito_800ExtraBold' }}>
                Open Settings
              </Text>
            </Pressable>
          </View>
        ) : null}
        {web ? (
          <Text variant="small" color={t.neutral.textMuted} align="center">
            Reminders are scheduled on your phone, so they aren’t available on the web.
          </Text>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 12 }}>
        <RaisedButton label={wasOn ? 'Save reminders' : 'Turn on reminders'} onPress={() => void save()} disabled={busy || web} />
        <RaisedButton kind="ghost" label={wasOn ? 'Turn off all reminders' : 'Not now'} onPress={() => (wasOn ? void turnOff() : router.back())} />
      </View>
    </SafeAreaView>
  );
}

function Box({ checked }: { checked: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: t.border.width,
        borderColor: checked ? t.accent.accent : t.neutral.textSubtle,
        backgroundColor: checked ? t.accent.accent : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {checked ? <CheckIcon size={14} color={t.accent.onAccent} /> : null}
    </View>
  );
}

function Check({ label, detail, checked, onPress }: { label: string; detail?: string; checked: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: t.size.rowHeight,
        borderRadius: t.radius.tile,
        borderWidth: t.border.width,
        borderColor: checked ? t.accent.accent : t.neutral.border,
        backgroundColor: checked ? t.accent.tint : t.neutral.surface,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
      <Box checked={checked} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{label}</Text>
        {detail ? (
          <Text variant="small" color={t.neutral.textMuted}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
