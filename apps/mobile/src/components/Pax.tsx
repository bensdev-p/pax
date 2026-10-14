// Pax, the mascot: the dove from Ben's approved character sheet
// (design/pax-redesign/character-sheet.png), used as drawn. design/pax-redesign/cut_poses.py cuts
// each pose out of the sheet into four aligned layers: the dove, and his scarf as a mask, its
// folds and its highlights. The app tints the scarf with the day's accent and edge colors, so it
// keeps the sheet's shading in every liturgical color (SPEC: Pax the mascot).
import { useTheme } from '@pax/tokens/react';
import { useId } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

export type PaxMood = 'hello' | 'happy' | 'hint' | 'celebrating' | 'encouraging' | 'asleep';

interface Layers {
  dove: ImageSourcePropType;
  scarf: ImageSourcePropType;
  shade: ImageSourcePropType;
  light: ImageSourcePropType;
}

/** The sheet's poses. */
const POSES = {
  standing: {
    dove: require('../../assets/images/pax/standing.png'),
    scarf: require('../../assets/images/pax/standing-scarf.png'),
    shade: require('../../assets/images/pax/standing-shade.png'),
    light: require('../../assets/images/pax/standing-light.png'),
  },
  welcome: {
    dove: require('../../assets/images/pax/welcome.png'),
    scarf: require('../../assets/images/pax/welcome-scarf.png'),
    shade: require('../../assets/images/pax/welcome-shade.png'),
    light: require('../../assets/images/pax/welcome-light.png'),
  },
  curious: {
    dove: require('../../assets/images/pax/curious.png'),
    scarf: require('../../assets/images/pax/curious-scarf.png'),
    shade: require('../../assets/images/pax/curious-shade.png'),
    light: require('../../assets/images/pax/curious-light.png'),
  },
  peaceful: {
    dove: require('../../assets/images/pax/peaceful.png'),
    scarf: require('../../assets/images/pax/peaceful-scarf.png'),
    shade: require('../../assets/images/pax/peaceful-shade.png'),
    light: require('../../assets/images/pax/peaceful-light.png'),
  },
  encouraging: {
    dove: require('../../assets/images/pax/encouraging.png'),
    scarf: require('../../assets/images/pax/encouraging-scarf.png'),
    shade: require('../../assets/images/pax/encouraging-shade.png'),
    light: require('../../assets/images/pax/encouraging-light.png'),
  },
} satisfies Record<string, Layers>;

/** Which pose each mood shows. The sheet has five poses for six moods: hello and celebrating share the welcome. */
const POSE_FOR: Record<PaxMood, keyof typeof POSES> = {
  hello: 'welcome',
  happy: 'standing',
  hint: 'curious',
  celebrating: 'welcome',
  encouraging: 'encouraging',
  asleep: 'peaceful',
};

const LABELS: Record<PaxMood, string> = {
  hello: 'Pax the dove waving hello',
  happy: 'Pax the dove, happy',
  hint: 'Pax the dove, looking curious',
  celebrating: 'Pax the dove celebrating',
  encouraging: 'Pax the dove encouraging you',
  asleep: 'Pax the dove asleep',
};

/** Full-body Pax in one of six expressions, standing on his shadow. */
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
  const art: Layers = POSES[POSE_FOR[mood]];
  const layer = { position: 'absolute', left: 0, top: 0, width: size, height: size } as const;
  // A soft ground shadow like the sheet's; each Pax needs his own gradient id.
  const shade = `paxShadow${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={LABELS[mood]} style={{ width: size, height: size }}>
      {shadow ? (
        <Svg style={layer} width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id={shade} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0.55" stopColor={t.neutral.paxShadow} stopOpacity={1} />
              <Stop offset="1" stopColor={t.neutral.paxShadow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="100" cy="187" rx="62" ry="7" fill={`url(#${shade})`} />
        </Svg>
      ) : null}
      <Image source={art.dove} style={layer} />
      <Image source={art.scarf} style={[layer, { tintColor: t.accent.accent }]} />
      <Image source={art.shade} style={[layer, { tintColor: t.accent.edge }]} />
      <Image source={art.light} style={[layer, { opacity: 0.7 }]} />
    </View>
  );
}
