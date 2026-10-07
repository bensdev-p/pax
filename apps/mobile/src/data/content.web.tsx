import { createContext, useContext, type ReactNode } from 'react';

import type { ContentStore, Prayer, RosaryMystery } from './types';

// A browser can't hold the bundled SQLite databases, so the web build reads the same rows from
// content.json. Supabase Postgres replaces this when the web version reads live content.
const data = require('../../assets/content/content.json') as {
  contentVersion: string;
  prayers: Prayer[];
  rosary_mysteries: RosaryMystery[];
};

const store: ContentStore = {
  version: data.contentVersion,
  prayers: async () => [...data.prayers].sort((a, b) => a.sort_order - b.sort_order),
  prayer: async (slug) => data.prayers.find((p) => p.slug === slug) ?? null,
  mysteries: async (set) =>
    data.rosary_mysteries.filter((m) => m.mystery_set === set).sort((a, b) => a.number - b.number),
};

const ContentContext = createContext<ContentStore>(store);

export function ContentProvider({
  children,
}: {
  installedVersion: string | null;
  onInstalled: (version: string) => void;
  children: ReactNode;
}) {
  return <ContentContext.Provider value={store}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentStore {
  return useContext(ContentContext);
}
