import { Asset } from 'expo-asset';
import { Directory, File } from 'expo-file-system';
import { widgetsDirectory } from 'expo-widgets';

import type { PaxMood } from '@/components/Pax';

import { PaxPrayerWidget, PaxTodayWidget, PaxWeekWidget, PaxWordWidget } from './layouts';
import type { WidgetFeedWriter } from './widgetFeed';

/** Hands each widget its timeline; WidgetKit redraws them from there. */
export const widgetWriter: WidgetFeedWriter = {
  async write(timelines) {
    PaxTodayWidget.updateTimeline(timelines.today);
    PaxPrayerWidget.updateTimeline(timelines.prayer);
    PaxWordWidget.updateTimeline(timelines.word);
    PaxWeekWidget.updateTimeline(timelines.week);
  },
};

/** The moods the large Today widget shows through the day (lib/format paxMoodFor). */
const PAX_IMAGES: Partial<Record<PaxMood, number>> = {
  hello: require('../../assets/images/pax/hello.png'),
  encouraging: require('../../assets/images/pax/encouraging.png'),
  asleep: require('../../assets/images/pax/asleep.png'),
  happy: require('../../assets/images/pax/happy.png'),
};

let copied: Promise<Partial<Record<PaxMood, string>>> | null = null;

/**
 * Widgets can't read the app's own files, so Pax's pictures are copied into the App Group
 * folder expo-widgets shares with them, once per launch. Missing pictures just leave the widget without Pax.
 */
export function widgetPaxImages(): Promise<Partial<Record<PaxMood, string>>> {
  copied ??= (async () => {
    const out: Partial<Record<PaxMood, string>> = {};
    if (!widgetsDirectory) return out;
    const dir = new Directory(widgetsDirectory);
    dir.create({ intermediates: true, idempotent: true });
    for (const [mood, module] of Object.entries(PAX_IMAGES) as [PaxMood, number][]) {
      try {
        const asset = await Asset.fromModule(module).downloadAsync();
        if (!asset.localUri) continue;
        // Copied fresh each launch, so a redrawn Pax reaches the widgets too.
        const target = new File(dir, `pax-${mood}.png`);
        if (target.exists) target.delete();
        await new File(asset.localUri).copy(target);
        out[mood] = target.uri;
      } catch (error) {
        console.warn(`Pax could not share the ${mood} picture with widgets:`, error);
      }
    }
    return out;
  })();
  return copied;
}
