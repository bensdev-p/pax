// Pax, the mascot: Ben's art (made in ChatGPT from docs/mascot-brief.md, October 2026). Each pose
// is two aligned layers cut by design/pax/cut_pax.py: the dove, and his scarf as a white mask the
// app tints with the day's liturgical color (SPEC: Pax the mascot).
import { useTheme } from '@pax/tokens/react';
import { useId } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

export type PaxMood = 'hello' | 'happy' | 'hint' | 'praying' | 'celebrating' | 'encouraging' | 'asleep';

interface Layers {
  dove: ImageSourcePropType;
  scarf: ImageSourcePropType;
}

const POSES = {
  hello: { dove: require('../../assets/images/pax/hello.png'), scarf: require('../../assets/images/pax/hello-scarf.png') },
  happy: { dove: require('../../assets/images/pax/happy.png'), scarf: require('../../assets/images/pax/happy-scarf.png') },
  hint: { dove: require('../../assets/images/pax/hint.png'), scarf: require('../../assets/images/pax/hint-scarf.png') },
  praying: { dove: require('../../assets/images/pax/praying.png'), scarf: require('../../assets/images/pax/praying-scarf.png') },
  encouraging: {
    dove: require('../../assets/images/pax/encouraging.png'),
    scarf: require('../../assets/images/pax/encouraging-scarf.png'),
  },
} satisfies Record<string, Layers>;

/** Which pose each mood shows. Celebrating and asleep borrow a pose until their own art is in. */
const POSE_FOR: Record<PaxMood, keyof typeof POSES> = {
  hello: 'hello',
  happy: 'happy',
  hint: 'hint',
  praying: 'praying',
  celebrating: 'encouraging',
  encouraging: 'encouraging',
  asleep: 'praying',
};

const LABELS: Record<PaxMood, string> = {
  hello: 'Pax the dove waving hello',
  happy: 'Pax the dove, happy',
  hint: 'Pax the dove with a thought',
  praying: 'Pax the dove praying',
  celebrating: 'Pax the dove celebrating',
  encouraging: 'Pax the dove encouraging you',
  asleep: 'Pax the dove asleep',
};

/** Full-body Pax in one of his poses, standing on a soft shadow. */
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
  // Each Pax needs his own gradient id.
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
          {/* Under the feet: the art stands on 95% of its height. */}
          <Ellipse cx="100" cy="190" rx="58" ry="6" fill={`url(#${shade})`} />
        </Svg>
      ) : null}
      <Image source={art.dove} style={layer} />
      <Image source={art.scarf} style={[layer, { tintColor: t.accent.accent }]} />
    </View>
  );
}
