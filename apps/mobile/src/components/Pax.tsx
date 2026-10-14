// Pax, the mascot: a calm white dove in a short liturgical scarf with an olive sprig tucked in.
// Drawn after Ben's approved character sheet (design/pax-redesign/character-sheet.png). Every mood
// is the same bird built from the shared parts below; only the pose, wings and eyes change. The
// scarf is always the day's accent (SPEC: Pax the mascot).
import { tokens } from '@pax/tokens';
import { useTheme } from '@pax/tokens/react';
import type { ReactElement } from 'react';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

export type PaxMood = 'hello' | 'happy' | 'hint' | 'celebrating' | 'encouraging' | 'asleep';

interface Colors {
  scarf: string;
  scarfEdge: string;
  shadow: string;
}

// Plumage: ivory with restrained blue-grey shading and a soft blue-grey line (design/tokens.json,
// color.pax). His colors don't change with the theme; only the scarf does.
const P = tokens.pax;
const IVORY = P.body;
const SHADE = P.shade;
const WING = P.wing;
const FEATHER = P.feather;
const LINE = P.line;
const DETAIL = P.detail;
const EYE = P.eye;
const BEAK = P.beak;
const BEAK_SHADE = P.beakDeep;
const FEET = P.feet;
const LEAF = P.olive;
const LEAF_DARK = P.oliveDeep;
const LEAF_LIGHT = P.oliveLight;
const OLIVE = P.oliveFruit;

const outline = { stroke: LINE, strokeWidth: 1.6, strokeLinejoin: 'round' as const };

/** The long tapered tail, two layered feathers sweeping down to the left. */
const Tail = () => (
  <>
    <Path d="M76 156 C58 164 36 172 12 179 C26 185 54 183 74 175 C80 171 84 165 84 160 Z" fill={FEATHER} {...outline} />
    <Path d="M78 147 C60 153 40 162 20 170 C36 176 60 172 78 164 Z" fill={WING} {...outline} />
  </>
);

/** Small orange feet, three toes each. */
const Feet = () => (
  <Path
    d="M102 178 L102 184 M102 184 L96 188 M102 184 L102 189 M102 184 L108 188 M127 178 L127 184 M127 184 L121 188 M127 184 L127 189 M127 184 L133 188"
    stroke={FEET}
    strokeWidth={3}
    strokeLinecap="round"
    fill="none"
  />
);

/** The pear-shaped body, narrow under the head and full at the base, shaded along the back. */
const Body = () => (
  <>
    <Path
      d="M114 98 C145 98 165 118 165 145 C165 171 142 185 113 185 C84 185 60 171 60 147 C60 121 82 98 114 98 Z"
      fill={IVORY}
      {...outline}
    />
    <Path d="M63 136 C60 160 80 182 110 184 C84 185 60 171 60 148 C60 144 61 140 63 136 Z" fill={SHADE} />
    <Path d="M151 112 C161 124 165 143 160 163 C163 145 159 127 151 112 Z" fill={SHADE} />
  </>
);

/** The near wing folded along the side, its long feathers layered down over the tail. */
const FoldedWing = () => (
  <>
    <Path d="M94 154 C76 168 52 177 24 181 C46 186 76 181 94 168 Z" fill={FEATHER} {...outline} />
    <Path
      d="M101 106 C78 106 60 122 53 145 C49 159 41 169 28 176 C52 180 78 173 96 160 C112 149 120 131 116 117 C113 110 107 106 101 106 Z"
      fill={WING}
      {...outline}
    />
    <Path d="M59 151 C74 147 89 139 102 124 M48 166 C66 164 83 157 96 146 M72 124 C83 119 97 119 108 124" stroke={DETAIL} strokeWidth={1.4} fill="none" strokeLinecap="round" />
  </>
);

/**
 * The near wing opened up and out from the shoulder, its primaries fanned in soft scallops. The
 * pose decides how far: `angle` 0 is the welcoming lift; negative lowers it out to the side.
 */
const OpenWing = ({ angle = 0, scale = 1 }: { angle?: number; scale?: number }) => (
  <G transform={`rotate(${angle} 92 120) translate(92 120) scale(${scale}) translate(-92 -120)`}>
    <Path
      d="M96 110 C80 88 56 66 34 58 C22 54 12 58 12 66 C16 72 24 76 32 78 C18 82 10 90 14 100 C22 102 32 102 40 100 C28 106 22 116 28 124 C40 124 52 120 60 116 C54 124 54 132 60 138 C72 138 86 136 98 130 Z"
      fill={WING}
      {...outline}
    />
    <Path d="M90 116 C72 98 52 84 32 78 M88 122 C70 110 54 104 40 100 M88 128 C76 122 68 118 60 116" stroke={DETAIL} strokeWidth={1.4} fill="none" strokeLinecap="round" />
  </G>
);

/** The far wing's tip, lifted behind the right shoulder when Pax celebrates. */
const FarWing = () => (
  <G transform="translate(202 50) scale(-0.56 0.56)">
    <Path
      d="M96 110 C80 88 56 66 34 58 C22 54 12 58 12 66 C16 72 24 76 32 78 C18 82 10 90 14 100 C22 102 32 102 40 100 C28 106 22 116 28 124 C40 124 52 120 60 116 C54 124 54 132 60 138 C72 138 86 136 98 130 Z"
      fill={FEATHER}
      stroke={LINE}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </G>
);

type Eyes = 'open' | 'soft' | 'closed';

/** The head, a little small for the body: crest, shaded cheek, simple eyes and a small beak. */
const Head = ({ eyes }: { eyes: Eyes }) => (
  <>
    {/* Two-feather crest: one swept back, one curling forward. */}
    <Path d="M116 28 C109 20 99 17 91 19 C98 23 105 27 110 31 Z" fill={DETAIL} {...outline} strokeWidth={1.2} />
    <Path d="M117 29 C113 18 119 8 129 6 C124 13 123 21 125 29 Z" fill={IVORY} {...outline} strokeWidth={1.4} />
    <Ellipse cx="121" cy="62" rx="38.5" ry="37" fill={IVORY} {...outline} />
    <Path d="M93 35 C80 47 76 71 89 87 C96 94 106 98 114 99 C95 93 84 78 85 60 C86 50 89 41 93 35 Z" fill={SHADE} />
    {eyes === 'open' ? (
      <>
        <Ellipse cx="107" cy="60" rx="4.8" ry="6.3" fill={EYE} />
        <Ellipse cx="142" cy="59" rx="4.8" ry="6.3" fill={EYE} />
        <Ellipse cx="108.6" cy="57.1" rx="1.4" ry="1.7" fill="#FFFFFF" />
        <Ellipse cx="143.6" cy="56.1" rx="1.4" ry="1.7" fill="#FFFFFF" />
      </>
    ) : (
      <Path
        d={
          eyes === 'soft'
            ? // Gently smiling eyes: low arches.
              'M101.5 61 Q107 55 112.5 61 M136.5 60 Q142 54 147.5 60'
            : // Closed in rest: lids curving down.
              'M101.5 59 Q107 64.5 112.5 59 M136.5 58 Q142 63.5 147.5 58'
        }
        stroke={EYE}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    )}
    <Path d="M122 69 C127 65 136 66 140 70 C136 75 130 78 126 78 C123.5 75 122 72 122 69 Z" fill={BEAK} />
    <Path d="M123 73 C128 74 133 73.6 139.4 70.8 C135.5 75 130 78 126 78 C124.6 76.6 123.6 74.8 123 73 Z" fill={BEAK_SHADE} />
  </>
);

/** The short scarf around the neck, its end hanging down the front, in the day's color. */
const Scarf = ({ scarf, scarfEdge }: Colors) => (
  <>
    <Path d="M102 104 L100 140 C100 143 102 145 105 145 L114 145 C117 145 119 143 119 140 L118 106 Z" fill={scarf} />
    <Path d="M102 104 L100 140 C100 143 102 145 104.5 145 L106 106 Z" fill={scarfEdge} opacity={0.55} />
    <Path d="M86 93 C104 102 140 102 158 91 C161 96 161 101 158 105 C140 115 104 115 86 106 C83 102 83 97 86 93 Z" fill={scarf} />
    <Path d="M86 104 C104 112 140 112 158 103 C158.2 103.7 158.3 104.4 158 105 C140 115 104 115 86 106 C85.7 105.4 85.7 104.7 86 104 Z" fill={scarfEdge} />
  </>
);

/** The olive sprig tucked into the scarf on his right: a few leaves and one olive. */
const Sprig = () => (
  <>
    <Path d="M153 101 C159 97 166 92 173 86" stroke={LEAF_DARK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    <Ellipse cx="160" cy="90" rx="8" ry="3.4" fill={LEAF} transform="rotate(-55 160 90)" />
    <Ellipse cx="167" cy="96" rx="8" ry="3.4" fill={LEAF_DARK} transform="rotate(18 167 96)" />
    <Ellipse cx="174" cy="83" rx="7" ry="3" fill={LEAF_LIGHT} transform="rotate(-28 174 83)" />
    <Ellipse cx="160" cy="103" rx="7" ry="3" fill={LEAF} transform="rotate(48 160 103)" />
    <Ellipse cx="154" cy="107" rx="3" ry="3.8" fill={OLIVE} />
  </>
);

interface Pose {
  /** Which way the near wing is held. */
  wing: 'folded' | 'lifted' | 'open' | 'raised';
  eyes: Eyes;
  /** Degrees the head tilts about the neck (positive leans toward his beak). */
  tilt?: number;
  /** Lifted off the ground a little, for joy. */
  hop?: number;
  /** Degrees the whole bird leans forward from the feet, for curiosity. */
  lean?: number;
  /** The far wing peeks up behind his right shoulder. */
  farWing?: boolean;
}

function Dove({ pose, colors }: { pose: Pose; colors: Colors }): ReactElement {
  const hop = pose.hop ?? 0;
  return (
    <>
      <Ellipse cx="110" cy="188" rx={hop ? 48 : 60} ry={hop ? 4 : 5} fill={colors.shadow} />
      <G transform={`translate(0 ${-hop}) rotate(${pose.lean ?? 0} 114 186)`}>
        {pose.farWing ? <FarWing /> : null}
        <Tail />
        {pose.wing === 'lifted' ? <OpenWing /> : null}
        {pose.wing === 'raised' ? <OpenWing angle={10} /> : null}
        {pose.wing === 'open' ? <OpenWing angle={-34} scale={0.86} /> : null}
        <Feet />
        <Body />
        {pose.wing === 'folded' ? <FoldedWing /> : null}
        <G transform={pose.tilt ? `rotate(${pose.tilt} 121 98)` : undefined}>
          <Head eyes={pose.eyes} />
        </G>
        <Scarf {...colors} />
        <Sprig />
      </G>
    </>
  );
}

const POSES: Record<PaxMood, Pose> = {
  // The welcoming pose: the near wing lifted in a modest wave.
  hello: { wing: 'lifted', eyes: 'open', tilt: -3 },
  // Relaxed and gently joyful: wing at rest, smiling eyes.
  happy: { wing: 'folded', eyes: 'soft', tilt: 4 },
  // Curious: the head tilted forward to look closer.
  hint: { wing: 'folded', eyes: 'open', tilt: 12, lean: 6 },
  // Quiet joy: both wings up a little and a small hop, no confetti.
  celebrating: { wing: 'raised', eyes: 'soft', farWing: true, hop: 5 },
  // Attentive and kind: the wing held out, as if to say "you can do this".
  encouraging: { wing: 'open', eyes: 'open', tilt: 6 },
  // At rest: wings folded, eyes closed, the head settled a little.
  asleep: { wing: 'folded', eyes: 'closed', tilt: -6 },
};

const LABELS: Record<PaxMood, string> = {
  hello: 'Pax the dove waving hello',
  happy: 'Pax the dove, happy',
  hint: 'Pax the dove, looking curious',
  celebrating: 'Pax the dove celebrating',
  encouraging: 'Pax the dove encouraging you',
  asleep: 'Pax the dove asleep',
};

/** Full-body Pax in one of six expressions. */
export function Pax({
  mood = 'hello',
  size = 180,
  shadow = true,
}: {
  mood?: PaxMood;
  size?: number;
  shadow?: boolean;
}) {
  const t = useTheme();
  const colors = {
    scarf: t.accent.accent,
    scarfEdge: t.accent.edge,
    shadow: shadow ? t.neutral.paxShadow : 'transparent',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityLabel={LABELS[mood]}>
      <Dove pose={POSES[mood]} colors={colors} />
    </Svg>
  );
}
