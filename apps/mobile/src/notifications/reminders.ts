import type { DaySnapshot } from '@pax/liturgy';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationPrefs } from '@/data/types';

import { planNotifications } from './plan';

/**
 * Local notifications, scheduled on the phone so they work offline (SPEC: Notifications).
 * What to schedule lives in ./plan; this file talks to expo-notifications.
 */
const CHANNEL_ID = 'reminders';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders from Pax',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function getPermission(): Promise<PermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Only called from the Pax permission screen, never at first launch (rule 2). On Android 13+
 * the channel must exist before the system prompt appears.
 */
export async function requestPermission(): Promise<PermissionState> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  if (!current.canAskAgain) return 'denied';
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

/** Cancels Pax's pending notifications and schedules the plan for the coming days. */
export async function rescheduleReminders(
  prefs: NotificationPrefs,
  days: DaySnapshot[],
  opts: { today: string; doneToday: boolean },
): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const plan = planNotifications(prefs, days, { now: new Date(), ...opts });
  if (!plan.length || (await getPermission()) !== 'granted') return 0;
  await ensureChannel();
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, data: { kind: n.kind, url: n.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: CHANNEL_ID },
    });
  }
  return plan.length;
}

/**
 * Opens the screen a tapped notification links to, including the tap that launched the app.
 * In Expo Go the phone opens Expo Go itself; a development build opens Pax directly.
 */
export function addNotificationTapListener(open: (url: string) => void) {
  const handle = (response: Notifications.NotificationResponse | null) => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === 'string') open(url);
  };
  handle(Notifications.getLastNotificationResponse());
  Notifications.clearLastNotificationResponse();
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
