// Filled, two-tone icons from the Next Screens canvas (SPEC: Icons). Never thin line icons,
// except the back/close chevrons which the canvas also draws as strokes.
import { useTheme } from '@pax/tokens/react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function TodayIcon({ size = 30 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="5" fill="#FFC107" />
      <Path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
        stroke="#F5A300"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LearnIcon({ size = 30 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 10l9-6 9 6-9 6z" fill="#FF6B6B" />
      <Path d="M7 13v4c3 2 7 2 10 0v-4l-5 3z" fill="#E04848" />
    </Svg>
  );
}

export function LibraryIcon({ size = 30 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="4" width="5" height="16" rx="1.5" fill="#2FA4E7" />
      <Rect x="9.5" y="6" width="5" height="14" rx="1.5" fill="#58A445" />
      <Rect x="15" y="5" width="5" height="15" rx="1.5" fill="#FF9F1C" transform="rotate(8 17.5 12)" />
    </Svg>
  );
}

export function PrayIcon({ size = 30 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 22c-3-3-7-7-7-12a7 7 0 0 1 14 0c0 5-4 9-7 12z" fill="#8E5CF6" />
      <Path d="M12 6v8M9 9h6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileIcon({ size = 30 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="5" fill="#AFAFAF" />
      <Path d="M3 22c1-5 5-8 9-8s8 3 9 8z" fill="#CFCFCF" />
    </Svg>
  );
}

export function FlameIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 2 5 2-3 2-6 1-10z"
        fill={color ?? '#FF9F1C'}
      />
      {color ? null : <Path d="M12 13c1 2 3 3 3 5a3 3 0 0 1-6 0c0-2 2-3 3-5z" fill="#FFD25E" />}
    </Svg>
  );
}

export function BoltIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#FFC107" />
    </Svg>
  );
}

export function ReviewIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="6" width="13" height="15" rx="3" fill="#7CC6F2" />
      <Rect x="8" y="3" width="13" height="15" rx="3" fill="#2FA4E7" />
    </Svg>
  );
}

export function BookIcon({ size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3z" fill="#FF6B6B" />
      <Path d="M21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z" fill="#E04848" />
    </Svg>
  );
}

/** A candle in the accent color, used for the wreath prayer and the feast card. */
export function CandleIcon({ size = 26 }: IconProps) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6z" fill="#FFC107" />
      <Rect x="9" y="12" width="6" height="10" rx="1.5" fill={t.accent.accent} />
    </Svg>
  );
}

export function RosaryIcon({ size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="4" r="2" fill="#8E5CF6" />
      <Circle cx="17" cy="7" r="2" fill="#8E5CF6" />
      <Circle cx="7" cy="7" r="2" fill="#8E5CF6" />
      <Circle cx="18" cy="12" r="2" fill="#8E5CF6" />
      <Circle cx="6" cy="12" r="2" fill="#8E5CF6" />
      <Path d="M12 15v7M9 18h6" stroke="#6D3FD1" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export function PrayerCardIcon({ size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="4" y="3" width="16" height="18" rx="3" fill="#FFC107" />
      <Path d="M12 6v8M9 9h6" stroke="#B07800" strokeWidth="2.2" strokeLinecap="round" />
      <Rect x="8" y="16" width="8" height="2" rx="1" fill="#B07800" />
    </Svg>
  );
}

export function BellIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6z" fill="#FFC107" />
      <Path d="M9.5 18a2.5 2.5 0 0 0 5 0z" fill="#F5A300" />
    </Svg>
  );
}

export function PaletteIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z" fill="#8E5CF6" />
      <Circle cx="7.5" cy="11" r="1.6" fill="#FFC107" />
      <Circle cx="10" cy="7" r="1.6" fill="#58A445" />
      <Circle cx="15" cy="7" r="1.6" fill="#FF6B6B" />
    </Svg>
  );
}

export function MoonIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="#2FA4E7" />
      <Circle cx="17" cy="6" r="1.4" fill="#FFC107" />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5 9-10"
        stroke={color}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BackIcon({ size = 26, color = '#AFAFAF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 26, color = '#AFAFAF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronIcon({ size = 20, color = '#AFAFAF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size = 20, color = '#AFAFAF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="5" y="10" width="14" height="11" rx="3" fill={color} />
      <Path d="M8 10V8a4 4 0 0 1 8 0v2" stroke={color} strokeWidth="2.5" fill="none" />
    </Svg>
  );
}

/** Advent wreath that lights one candle per week (SPEC: seasonal touches). */
export function AdventWreath({ week, width = 150 }: { week: number; width?: number }) {
  // Candles left to right: violet, violet, rose (Gaudete), violet; lit in order 1, 2, 3, 4.
  const candles = [
    { x: 27, y: 54, h: 32, color: '#7C4DDB', order: 1 },
    { x: 56, y: 48, h: 36, color: '#7C4DDB', order: 2 },
    { x: 84, y: 48, h: 36, color: '#E35D8F', order: 3 },
    { x: 111, y: 54, h: 32, color: '#7C4DDB', order: 4 },
  ];
  return (
    <Svg width={width} height={(width * 110) / 150} viewBox="0 0 150 110" accessibilityLabel={`Advent wreath, ${week} candle${week === 1 ? '' : 's'} lit`}>
      <Path d="M9 88a66 16 0 1 0 132 0a66 16 0 1 0 -132 0" fill="#2E7D32" />
      <Path d="M23 84a52 10 0 1 0 104 0a52 10 0 1 0 -104 0" fill="#43A047" />
      <Circle cx="20" cy="86" r="5" fill="#D12F33" />
      <Circle cx="130" cy="86" r="5" fill="#D12F33" />
      <Circle cx="75" cy="99" r="5" fill="#D12F33" />
      {candles.map((c) => {
        const cx = c.x + 6;
        const lit = c.order <= week;
        return (
          <G key={c.order}>
            <Rect x={c.x} y={c.y} width="12" height={c.h} rx="3" fill={c.color} />
            {lit ? (
              <>
                <Path d={`M${cx} ${c.y - 14}c-6 7-6 12 0 14 6-2 6-7 0-14z`} fill="#FFC107" />
                <Path d={`M${cx} ${c.y - 8}c-2 3-2 5 0 6 2-1 2-3 0-6z`} fill="#FFF3C4" />
              </>
            ) : (
              <Path d={`M${cx} ${c.y - 6}v6`} stroke="#3C3C3C" strokeWidth="2" strokeLinecap="round" />
            )}
          </G>
        );
      })}
    </Svg>
  );
}

export function ShieldIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="#2FA4E7" />
      <Path d="M8 12l3 3 5-6" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloudIcon({ size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 19a5 5 0 0 1-.6-9.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 10z" fill="#7CC6F2" />
      <Path d="M9 19a4 4 0 0 1 1.5-7.7A5 5 0 0 1 19.5 13 3 3 0 0 1 18 19z" fill="#2FA4E7" />
    </Svg>
  );
}
