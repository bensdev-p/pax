import type { PaxMood } from '@/components/Pax';

import { noopWidgetFeedWriter } from './widgetFeed';

/** Android and the web have no Pax widgets yet (iOS: writer.ios.ts). */
export const widgetWriter = noopWidgetFeedWriter;

export async function widgetPaxImages(): Promise<Partial<Record<PaxMood, string>>> {
  return {};
}
