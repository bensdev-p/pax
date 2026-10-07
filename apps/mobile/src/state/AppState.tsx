import { getDaySnapshot, getDaySnapshots, toIsoDate, type DaySnapshot } from '@pax/liturgy';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState as RNAppState } from 'react-native';

import { userStore } from '@/data/userStore';
import type { ActivityKind, NotificationPrefs, Progress, Settings } from '@/data/types';
import { rescheduleReminders } from '@/notifications/reminders';
import { DAILY_XP_GOAL, writeWidgetFeed } from '@/widgets/widgetFeed';

interface AppStateValue {
  ready: boolean;
  /** Today's DaySnapshot in the phone's local date. */
  today: DaySnapshot | null;
  settings: Settings;
  progress: Progress | null;
  notificationPrefs: NotificationPrefs | null;
  updateSettings(patch: Partial<Settings>): Promise<void>;
  updateNotificationPrefs(prefs: NotificationPrefs): Promise<void>;
  /** Marks today's lesson, readings or prayer done; refreshes the streak and widget feed. */
  recordActivity(kind: ActivityKind, xp?: number): Promise<void>;
}

const Ctx = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState<DaySnapshot | null>(null);
  const [settings, setSettings] = useState<Settings>({ appearance: 'light', lockedColor: null, contentVersion: null });
  const [progress, setProgress] = useState<Progress | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs | null>(null);
  const prefsRef = useRef<NotificationPrefs | null>(null);

  /** Runs on open, on returning to the app, and after anything is finished. */
  const refresh = useCallback(async (opts: { reschedule: boolean }) => {
    const date = toIsoDate(new Date());
    const [snapshot, nextProgress] = await Promise.all([getDaySnapshot(date), userStore.getProgress(date)]);
    setToday(snapshot);
    setProgress(nextProgress);
    const feed = await getDaySnapshots(date, 14);
    await writeWidgetFeed(feed, {
      date,
      currentStreak: nextProgress.currentStreak,
      doneToday: nextProgress.doneToday,
      xpToday: nextProgress.xpToday,
      xpGoal: DAILY_XP_GOAL,
    });
    const prefs = prefsRef.current;
    if (opts.reschedule && prefs) await rescheduleReminders(prefs, feed);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, prefs] = await Promise.all([userStore.getSettings(), userStore.getNotificationPrefs()]);
      if (cancelled) return;
      setSettings(s);
      setNotificationPrefs(prefs);
      prefsRef.current = prefs;
      await refresh({ reschedule: true });
      if (!cancelled) setReady(true);
    })().catch((err) => {
      console.error('Pax failed to start', err);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // A new local day (or a long time away) refreshes the snapshot and reschedules reminders.
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh({ reschedule: true });
    });
    return () => sub.remove();
  }, [refresh]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings(await userStore.setSettings(patch));
  }, []);

  const updateNotificationPrefs = useCallback(
    async (prefs: NotificationPrefs) => {
      await userStore.setNotificationPrefs(prefs);
      prefsRef.current = prefs;
      setNotificationPrefs(prefs);
      const date = toIsoDate(new Date());
      await rescheduleReminders(prefs, await getDaySnapshots(date, 14));
    },
    [],
  );

  const recordActivity = useCallback(
    async (kind: ActivityKind, xp = 0) => {
      await userStore.recordActivity(toIsoDate(new Date()), kind, xp);
      await refresh({ reschedule: false });
    },
    [refresh],
  );

  return (
    <Ctx.Provider
      value={{ ready, today, settings, progress, notificationPrefs, updateSettings, updateNotificationPrefs, recordActivity }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState(): AppStateValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useAppState must be used inside <AppStateProvider>');
  return value;
}

