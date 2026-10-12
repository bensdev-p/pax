import type { DaySnapshot } from '@pax/liturgy';
import { useTheme } from '@pax/tokens/react';
import { View } from 'react-native';

import type { Progress } from '@/data/types';

import { FlameIcon } from './Icons';
import { Text } from './Text';

/** Season chip and streak (SPEC: Today, header). */
export function StatsBar({ today, progress }: { today: DaySnapshot; progress: Progress | null }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        borderBottomWidth: t.border.width,
        borderBottomColor: t.neutral.divider,
      }}>
      <View
        accessibilityLabel={`${today.seasonName}, liturgical color ${today.color}`}
        style={{
          height: 32,
          paddingHorizontal: 12,
          borderRadius: t.radius.chip,
          backgroundColor: t.accent.accent,
          justifyContent: 'center',
        }}>
        <Text variant="label" caps color={t.accent.onAccent} style={{ letterSpacing: 0.5 }}>
          {today.seasonName}
        </Text>
      </View>
      <Stat label="day streak" value={progress?.currentStreak ?? 0} color={t.game.streakText} icon={<FlameIcon size={24} />} />
    </View>
  );
}

function Stat({ value, color, icon, label }: { value: number; color: string; icon: React.ReactNode; label: string }) {
  return (
    <View accessibilityLabel={`${value} ${label}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text variant="button" color={color}>
        {value.toLocaleString('en-US')}
      </Text>
    </View>
  );
}
