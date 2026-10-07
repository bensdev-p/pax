import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { Saint } from '@/data/types';

const HALO = '#FFC107';
const SKIN = '#F3D2B5';
const MARY_BLUE = '#3D7BD9';

/**
 * Placeholder card art from the Saint of the day canvas: a haloed figure robed in the day's
 * color, with simple variants for Mary, the Lord, the angels and church feasts. Real saint
 * cards come with the saint-card collection (SPEC: Phase 4).
 */
export function SaintArt({ kind, robe, size = 70 }: { kind: Saint['kind']; robe: string; size?: number }) {
  const height = (size * 90) / 70;
  return (
    <Svg width={size} height={height} viewBox="0 0 70 90" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {kind === 'lord' ? (
        <>
          <Circle cx="35" cy="34" r="22" fill="none" stroke={HALO} strokeWidth="4" />
          <Rect x="30" y="8" width="10" height="76" rx="3" fill="#B07800" />
          <Rect x="14" y="26" width="42" height="10" rx="3" fill="#B07800" />
          <Path d="M30 84h10l6 4H24z" fill={robe} />
        </>
      ) : kind === 'church' ? (
        <>
          <Path d="M35 6l4 8h-8z" fill={HALO} />
          <Rect x="33.5" y="12" width="3" height="10" fill={HALO} />
          <Path d="M10 44l25-22 25 22z" fill={robe} />
          <Rect x="14" y="44" width="42" height="40" fill="#FFFFFF" stroke={robe} strokeWidth="3" />
          <Path d="M29 84V66a6 6 0 0 1 12 0v18z" fill={robe} />
          <Circle cx="35" cy="54" r="5" fill={HALO} />
        </>
      ) : kind === 'mary' ? (
        <>
          <Circle cx="35" cy="26" r="20" fill="none" stroke={HALO} strokeWidth="4" />
          <Path d="M14 88c0-30 8-58 21-58s21 28 21 58z" fill={MARY_BLUE} />
          <Path d="M22 50c0-16 6-28 13-28s13 12 13 28c-4-6-8-9-13-9s-9 3-13 9z" fill="#FFFFFF" />
          <Circle cx="35" cy="32" r="10" fill={SKIN} />
          <Path d="M26 62l9 12 9-12" fill={robe} />
        </>
      ) : kind === 'angels' ? (
        <>
          <Circle cx="35" cy="22" r="17" fill="none" stroke={HALO} strokeWidth="4" />
          <Path d="M32 46C18 34 6 38 4 54c10-2 18 2 26 10z" fill="#DCE6F1" />
          <Path d="M38 46c14-12 26-8 28 8-10-2-18 2-26 10z" fill="#DCE6F1" />
          <Circle cx="35" cy="26" r="11" fill={SKIN} />
          <Path d="M18 88c0-22 8-38 17-38s17 16 17 38z" fill={robe} />
        </>
      ) : kind === 'saints' ? (
        <>
          <Circle cx="24" cy="30" r="14" fill="none" stroke={HALO} strokeWidth="3.5" />
          <Circle cx="46" cy="30" r="14" fill="none" stroke={HALO} strokeWidth="3.5" />
          <Circle cx="24" cy="33" r="9" fill={SKIN} />
          <Circle cx="46" cy="33" r="9" fill={SKIN} />
          <Path d="M6 88c0-20 8-34 18-34s18 14 18 34z" fill={robe} />
          <Path d="M28 88c0-20 8-34 18-34s18 14 18 34z" fill={robe} opacity={0.82} />
        </>
      ) : (
        <>
          <Circle cx="35" cy="26" r="20" fill="none" stroke={HALO} strokeWidth="4" />
          <Circle cx="35" cy="30" r="13" fill={SKIN} />
          <Path d="M12 88c0-22 10-36 23-36s23 14 23 36z" fill={robe} />
          <Path d="M28 52l7 12 7-12" fill="#FFFFFF" />
          <Path d="M54 40l8 40" stroke="#B07800" strokeWidth="3" strokeLinecap="round" />
          <Path d="M58 36a6 6 0 0 1 6 6" stroke="#B07800" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
