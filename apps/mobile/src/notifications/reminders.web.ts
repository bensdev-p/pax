import type { DaySnapshot } from '@pax/liturgy';

import type { NotificationPrefs } from '@/data/types';

// Reminders are scheduled on the phone. The web version has none.
export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermission(): Promise<PermissionState> {
  return 'unsupported';
}
export async function requestPermission(): Promise<PermissionState> {
  return 'unsupported';
}
export async function rescheduleReminders(
  _prefs: NotificationPrefs,
  _days: DaySnapshot[],
  _opts: { today: string; doneToday: boolean; daily?: unknown[] },
) {
  return 0;
}
export function addNotificationTapListener(_open: (url: string) => void) {
  return () => {};
}
