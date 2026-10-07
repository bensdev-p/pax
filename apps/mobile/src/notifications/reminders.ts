import type { DaySnapshot } from '@pax/liturgy';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationPrefs } from '@/data/types';

/**
 * Local reminders, scheduled on the phone so they work offline (SPEC: Notifications).
 * iOS keeps at most 64 pending notifications per app, so we schedule the next 14 days and
 * reschedule each time the app opens (rule 1). Copy is in Pax's voice: warm, never guilt (rule 3).
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

export function reminderCopy(day: DaySnapshot, slot: 'morning' | 'evening'): { title: string; body: string } {
  const isFeast = day.rank === 'SOLEMNITY' || day.rank === 'FEAST' || day.rank === 'MEMORIAL';
  if (slot === 'morning') {
    return isFeast
      ? { title: `Good morning! It's ${day.name}`, body: 'Two minutes with today’s readings? I saved you a spot.' }
      : { title: 'Good morning from Pax', body: `It’s ${day.seasonName}. Two minutes with today’s readings?` };
  }
  return isFeast
    ? { title: 'Still time today', body: `Today the Church celebrates ${day.name}. A short prayer before bed?` }
    : { title: 'Still time today', body: 'A decade of the Rosary or today’s Gospel. I’ll keep you company.' };
}

function at(date: string, hhmm: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const [hh, mm] = hhmm.split(':').map(Number) as [number, number];
  return new Date(y, m - 1, d, hh, mm);
}

/** Cancels Pax's pending reminders and schedules the next 14 days from the snapshot feed. */
export async function rescheduleReminders(prefs: NotificationPrefs, days: DaySnapshot[]): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.dailyReminder && !prefs.angelus) return 0;
  if ((await getPermission()) !== 'granted') return 0;
  await ensureChannel();

  const now = Date.now();
  let count = 0;
  for (const day of days.slice(0, 14)) {
    if (prefs.dailyReminder) {
      const when = at(day.date, prefs.localTime);
      if (when.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          content: { ...reminderCopy(day, prefs.slot), data: { kind: 'daily_reminder', url: 'paxapp://today' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID },
        });
        count++;
      }
    }
    if (prefs.angelus) {
      const when = at(day.date, '12:00');
      if (when.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'The Angelus',
            body: 'The Angel of the Lord declared unto Mary… Pray it with me?',
            data: { kind: 'angelus', url: 'paxapp://prayer/angelus' },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID },
        });
        count++;
      }
    }
  }
  return count;
}

/** Opens the deep link carried by a tapped notification. */
export function addNotificationTapListener(open: (url: string) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string') open(url);
  });
  return () => sub.remove();
}
