import { PALETTE_NAMES, paletteLabel, tokens, type Appearance, type PaletteName } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { BellIcon, BoltIcon, CheckIcon, ChevronIcon, FlameIcon, MoonIcon, PaletteIcon, ShieldIcon } from '@/components/Icons';
import { Pax } from '@/components/Pax';
import { Card } from '@/components/Raised';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { formatTime } from '@/notifications/plan';
import { useAppState } from '@/state/AppState';

const APPEARANCES: { value: Appearance; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function ProfileScreen() {
  const t = useTheme();
  const { today, progress, settings, notificationPrefs, updateSettings } = useAppState();

  const reminderLine = (() => {
    const p = notificationPrefs;
    if (!p) return 'Off';
    const parts = [p.morning, p.evening].filter((r) => r.enabled).map((r) => formatTime(r.time));
    if (p.nudges) parts.push('nudges');
    if (p.angelus) parts.push('Angelus');
    return parts.length ? parts.join(' · ') : 'Off';
  })();

  return (
    <Screen>
      <Text variant="hero" style={{ fontSize: 28 }} accessibilityRole="header">
        Profile
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <StatCard icon={<FlameIcon size={22} />} value={progress?.currentStreak ?? 0} label="day streak" />
        <StatCard icon={<BoltIcon size={22} />} value={progress?.xpTotal ?? 0} label="total XP" />
        <StatCard icon={<ShieldIcon />} value={progress?.graceDaysLeft ?? 2} label="grace days left" />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}>
        <Pax mood="hint" size={84} />
        <Text variant="body" color={t.neutral.textMuted} style={{ flex: 1 }}>
          Your liturgical calendar, saint cards and OCIA milestones will live here soon.
        </Text>
      </View>

      <Text variant="title">Settings</Text>

      <Card onPress={() => router.push('/reminders')} accessibilityLabel="Reminders" contentStyle={rowStyle}>
        <IconTile color="#FFC107">
          <BellIcon />
        </IconTile>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
            Reminders
          </Text>
          <Text variant="small" color={t.neutral.textMuted}>
            {reminderLine}
          </Text>
        </View>
        <ChevronIcon color={t.neutral.textSubtle} />
      </Card>

      <Card contentStyle={[rowStyle, { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile color="#2FA4E7">
            <MoonIcon />
          </IconTile>
          <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black', flex: 1 }}>
            Appearance
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {APPEARANCES.map(({ value, label }) => (
            <Choice key={value} label={label} selected={settings.appearance === value} onPress={() => void updateSettings({ appearance: value })} />
          ))}
        </View>
      </Card>

      <Card contentStyle={[rowStyle, { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile color="#8E5CF6">
            <PaletteIcon />
          </IconTile>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ fontFamily: 'Nunito_900Black' }}>
              Theme color
            </Text>
            <Text variant="small" color={t.neutral.textMuted}>
              {settings.lockedColor
                ? `Locked to ${paletteLabel(settings.lockedColor).toLowerCase()}`
                : `Follows the Church year${today ? ` (today: ${paletteLabel(today.color as PaletteName).toLowerCase()})` : ''}`}
            </Text>
          </View>
        </View>
        <Choice
          label="Follow the Church year"
          selected={!settings.lockedColor}
          onPress={() => void updateSettings({ lockedColor: null })}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {PALETTE_NAMES.map((name) => (
            <Swatch
              key={name}
              name={name}
              selected={settings.lockedColor === name}
              onPress={() => void updateSettings({ lockedColor: name })}
            />
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const rowStyle = { paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 };

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        borderWidth: t.border.width,
        borderColor: t.neutral.border,
        borderRadius: t.radius.button,
        padding: 10,
        gap: 2,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon}
        <Text variant="title">{value.toLocaleString('en-US')}</Text>
      </View>
      <Text variant="label" color={t.neutral.textMuted} style={{ fontFamily: 'Nunito_800ExtraBold' }}>
        {label}
      </Text>
    </View>
  );
}

function IconTile({ color, children }: { color: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: `${color}${t.scheme === 'dark' ? '38' : '26'}`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 44,
        borderRadius: t.radius.tile,
        borderWidth: t.border.width,
        borderColor: selected ? t.accent.accent : t.neutral.border,
        backgroundColor: selected ? t.accent.tint : t.neutral.surface,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
      }}>
      <Text variant="small" style={{ fontFamily: 'Nunito_900Black' }} color={selected ? t.accent.text : t.neutral.textMuted}>
        {label}
      </Text>
    </Pressable>
  );
}

function Swatch({ name, selected, onPress }: { name: PaletteName; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const p = tokens.palettes[name][t.scheme];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`Lock to ${paletteLabel(name)}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: p.accent,
        borderBottomWidth: 4,
        borderBottomColor: p.edge,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: selected ? 3 : 0,
        borderColor: selected ? t.neutral.text : undefined,
      }}>
      {selected ? <CheckIcon size={16} color={p.onAccent} /> : null}
    </Pressable>
  );
}
