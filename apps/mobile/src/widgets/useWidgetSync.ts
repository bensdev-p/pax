import { getDaySnapshots, type DaySnapshot } from '@pax/liturgy';
import { requireOptionalNativeModule } from 'expo';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useContent, useLibrary } from '@/data/content';
import { userStore } from '@/data/userStore';
import { loadDailyWord } from '@/lib/dailyWordText';
import { rankChip, saintForDay } from '@/lib/saints';
import { useAppState } from '@/state/AppState';

import { localTime, mondayOf, setWidgetFeedWriter, WIDGET_DAYS, writeWidgetFeed, type WidgetInput } from './widgetFeed';

/** Days of calendar after today the Week widget looks through for the next solemnity. */
const LOOKAHEAD_DAYS = 60;

let writerReady: Promise<boolean> | null = null;

/**
 * Widgets need Pax's own build (TestFlight), not Expo Go, so expo-widgets is loaded only where
 * its native module exists. Until then the feed is built and kept for debugging, but goes nowhere.
 */
function installWriter(): Promise<boolean> {
  writerReady ??= (async () => {
    if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoWidgets')) return false;
    const { widgetWriter } = await import('./writer');
    setWidgetFeedWriter(widgetWriter);
    return true;
  })().catch((error: unknown) => {
    console.warn('Pax widgets are unavailable:', error);
    return false;
  });
  return writerReady;
}

/**
 * Keeps the home-screen and Lock Screen widgets in step with the app: rebuilds their timelines
 * whenever today's snapshot, progress, settings, novenas or plans change (AppState refreshes them
 * on open, on return to the app and after anything is finished).
 */
export function useWidgetSync() {
  const { today, progress, settings, novenas, courses } = useAppState();
  const content = useContent();
  const library = useLibrary();
  // Only the settings the widgets show, so moving around the Bible reader doesn't redraw them.
  const settingsKey = JSON.stringify({
    appearance: settings.appearance,
    lockedColor: settings.lockedColor,
    studyInRhythm: settings.studyInRhythm,
    prayedToday: settings.prayedToday,
    readingsRead: settings.readingsRead,
  } satisfies WidgetInput['settings']);

  useEffect(() => {
    if (!today || !progress) return;
    let cancelled = false;
    void (async () => {
      const native = await installWriter();
      const monday = mondayOf(today.date);
      const ahead = Math.round((localTime(today.date).getTime() - localTime(monday).getTime()) / 86_400_000);
      const [snapshots, activity, paxImages] = await Promise.all([
        getDaySnapshots(monday, ahead + LOOKAHEAD_DAYS + 1),
        userStore.getActivity(monday, today.date),
        native ? import('./writer').then((w) => w.widgetPaxImages()) : Promise.resolve({}),
      ]);
      const days = snapshots.slice(ahead, ahead + WIDGET_DAYS);
      const saints: WidgetInput['saints'] = {};
      const words: WidgetInput['words'] = {};
      await Promise.all(
        days.map(async (day: DaySnapshot) => {
          const [found, word] = await Promise.all([saintForDay(content, day), loadDailyWord(day, content, library)]);
          saints[day.date] = found ? { name: found.saint.name, rank: rankChip(found.saint, found.celebration) } : null;
          words[day.date] = word;
        }),
      );
      if (cancelled) return;
      await writeWidgetFeed({
        now: new Date(),
        snapshots,
        activity,
        progress: { date: today.date, currentStreak: progress.currentStreak, doneToday: progress.doneToday, rhythm: progress.rhythm },
        settings: JSON.parse(settingsKey) as WidgetInput['settings'],
        novenas,
        courses,
        saints,
        words,
        paxImages,
      });
    })().catch((error: unknown) => console.warn('Pax could not update its widgets:', error));
    return () => {
      cancelled = true;
    };
  }, [today, progress, settingsKey, novenas, courses, content, library]);
}
