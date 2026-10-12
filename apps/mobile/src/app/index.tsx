import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { anyNotificationsOn } from '@/data/types';
import { needsOnboarding } from '@/lib/onboarding';
import { useAppState } from '@/state/AppState';

/** The app's start: the welcome on a new install, otherwise Today. */
export default function Index() {
  const { settings, progress, courses, novenas, notificationPrefs, updateSettings } = useAppState();
  const decision = progress
    ? needsOnboarding({
        onboarded: settings.onboarded,
        longestStreak: progress.longestStreak,
        plans: courses.length,
        novenas: novenas.length,
        remindersOn: !!notificationPrefs && anyNotificationsOn(notificationPrefs),
        hasReadingPosition: !!settings.lastRead,
      })
    : 'no';

  // People who already used Pax before onboarding existed skip it.
  useEffect(() => {
    if (decision === 'mark-done') void updateSettings({ onboarded: true });
  }, [decision, updateSettings]);

  return <Redirect href={decision === 'show' ? '/welcome' : '/today'} />;
}
