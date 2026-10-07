// Pax, the mascot. Paths are taken verbatim from the "Pax expressions" board of the Next
// Screens canvas (design/). The scarf is always the day's accent (SPEC: Mascot).
import { useTheme } from '@pax/tokens/react';
import type { ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

export type PaxMood = 'hello' | 'happy' | 'hint' | 'celebrating' | 'encouraging' | 'asleep';

interface Colors {
  scarf: string;
  scarfEdge: string;
  shadow: string;
}

const MOODS: Record<PaxMood, (c: Colors) => ReactElement> = {
  hello: ({ scarf, scarfEdge, shadow }: Colors) => (
    <>
      <Ellipse cx="110" cy="190" rx="46" ry="6" fill={shadow} />
      <Path d="M72 150 C56 152 38 160 28 172 C42 176 58 172 74 162 Z" fill="#C5D3E3" />
      <Path d="M74 158 C60 166 48 178 46 190 C60 186 72 178 80 166 Z" fill="#DCE6F1" />
      <Path
        d="M100 178 l-6 9 M100 178 l0 10 M100 178 l6 9 M122 178 l-6 9 M122 178 l0 10 M122 178 l6 9"
        stroke="#F28C28"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M66 132 C66 104 86 92 110 92 C138 92 156 112 156 138 C156 166 136 184 110 184 C84 184 66 164 66 140 Z"
        fill="#F5F8FC"
      />
      <Path
        d="M66 136 C66 160 82 182 108 184 C90 176 78 158 78 136 C78 118 84 104 96 96 C78 100 66 114 66 136 Z"
        fill="#E4ECF5"
      />
      <Path
        d="M98 140 C98 122 110 114 124 116 C140 118 148 132 146 150 C144 168 130 178 118 176 C104 174 98 158 98 140 Z"
        fill="#FFFFFF"
      />
      <Path
        d="M76 124 C64 132 60 154 70 170 C74 174 80 172 84 166 C92 152 94 136 90 126 C86 120 80 120 76 124 Z"
        fill="#DCE6F1"
      />
      <Path
        d="M73 150 C77 156 81 158 86 156 M71 160 C75 165 79 166 83 164"
        stroke="#C5D3E3"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M76 104 C94 116 130 116 150 102 C152 108 152 112 150 116 C130 128 94 128 76 116 C74 112 74 108 76 104 Z"
        fill={scarf}
      />
      <Path d="M92 120 L86 144 C90 146 96 145 99 142 L103 122 Z" fill={scarfEdge} />
      <Circle cx="112" cy="70" r="44" fill="#F5F8FC" />
      <Path
        d="M70 82 C74 104 94 116 116 114 C96 108 82 94 80 74 C79 60 84 46 94 36 C78 44 68 62 70 82 Z"
        fill="#E4ECF5"
      />
      <Path d="M106 30 C99 16 106 3 121 5 C112 10 111 18 117 28 Z" fill="#F5F8FC" />
      <Path d="M116 28 C116 18 123 11 133 13 C126 17 124 23 126 30 Z" fill="#E4ECF5" />
      <Ellipse cx="97" cy="68" rx="8" ry="10.5" fill="#1E2633" />
      <Circle cx="100" cy="63.5" r="3.4" fill="#FFFFFF" />
      <Circle cx="94.5" cy="72.5" r="1.6" fill="#FFFFFF" />
      <Ellipse cx="131" cy="68" rx="8" ry="10.5" fill="#1E2633" />
      <Circle cx="134" cy="63.5" r="3.4" fill="#FFFFFF" />
      <Circle cx="128.5" cy="72.5" r="1.6" fill="#FFFFFF" />
      <Path
        d="M106 82 C110 77 120 77 124 82 C121 88 116 91 115 91 C114 91 109 88 106 82 Z"
        fill="#FFB347"
      />
      <Path
        d="M108 85 C111 88 114 91 115 91 C116 91 119 88 122 85 C118 87 112 87 108 85 Z"
        fill="#F28C28"
      />
      <Ellipse cx="85" cy="84" rx="7" ry="4.5" fill="#FFB9C6" />
      <Ellipse cx="143" cy="84" rx="7" ry="4.5" fill="#FFB9C6" />
      <Path
        d="M138 110 C146 103 154 97 164 93"
        stroke="#5E8A3A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="149" cy="99" rx="7" ry="3" fill="#7FA650" transform="rotate(-55 149 99)" />
      <Ellipse cx="156" cy="101" rx="7" ry="3" fill="#5E8A3A" transform="rotate(15 156 101)" />
      <Ellipse cx="163" cy="90" rx="6" ry="2.6" fill="#7FA650" transform="rotate(-25 163 90)" />
      <Ellipse cx="143" cy="109" rx="3" ry="3.6" fill="#3F5F27" />
    </>
  ),
  happy: ({ scarf, scarfEdge, shadow }: Colors) => (
    <>
      <Ellipse cx="110" cy="190" rx="46" ry="6" fill={shadow} />
      <Path d="M72 150 C56 152 38 160 28 172 C42 176 58 172 74 162 Z" fill="#C5D3E3" />
      <Path d="M74 158 C60 166 48 178 46 190 C60 186 72 178 80 166 Z" fill="#DCE6F1" />
      <Path
        d="M100 178 l-6 9 M100 178 l0 10 M100 178 l6 9 M122 178 l-6 9 M122 178 l0 10 M122 178 l6 9"
        stroke="#F28C28"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M66 132 C66 104 86 92 110 92 C138 92 156 112 156 138 C156 166 136 184 110 184 C84 184 66 164 66 140 Z"
        fill="#F5F8FC"
      />
      <Path
        d="M66 136 C66 160 82 182 108 184 C90 176 78 158 78 136 C78 118 84 104 96 96 C78 100 66 114 66 136 Z"
        fill="#E4ECF5"
      />
      <Path
        d="M98 140 C98 122 110 114 124 116 C140 118 148 132 146 150 C144 168 130 178 118 176 C104 174 98 158 98 140 Z"
        fill="#FFFFFF"
      />
      <Path
        d="M72 120 C58 112 44 94 45 78 C51 75 59 81 63 89 C69 99 75 111 72 120 Z"
        fill="#DCE6F1"
      />
      <Path
        d="M58 92 C54 94 52 98 53 102"
        stroke="#C5D3E3"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M76 104 C94 116 130 116 150 102 C152 108 152 112 150 116 C130 128 94 128 76 116 C74 112 74 108 76 104 Z"
        fill={scarf}
      />
      <Path d="M92 120 L86 144 C90 146 96 145 99 142 L103 122 Z" fill={scarfEdge} />
      <Circle cx="112" cy="70" r="44" fill="#F5F8FC" />
      <Path
        d="M70 82 C74 104 94 116 116 114 C96 108 82 94 80 74 C79 60 84 46 94 36 C78 44 68 62 70 82 Z"
        fill="#E4ECF5"
      />
      <Path d="M106 30 C99 14 106 0 122 2 C112 8 111 17 117 28 Z" fill="#F5F8FC" />
      <Path d="M116 28 C116 16 124 8 135 10 C127 15 124 22 126 30 Z" fill="#E4ECF5" />
      <Path
        d="M89 70 Q97 59 105 70"
        stroke="#1E2633"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M123 70 Q131 59 139 70"
        stroke="#1E2633"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M108 86 C110 97 120 97 122 86 Z" fill="#E0701B" />
      <Ellipse cx="115" cy="91" rx="4" ry="2.4" fill="#FF7A8A" />
      <Path d="M106 82 C110 77 120 77 124 82 C121 87 109 87 106 82 Z" fill="#FFB347" />
      <Ellipse cx="85" cy="82" rx="8" ry="5" fill="#FFA3B5" />
      <Ellipse cx="143" cy="82" rx="8" ry="5" fill="#FFA3B5" />
      <Path
        d="M138 110 C146 103 154 97 164 93"
        stroke="#5E8A3A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="149" cy="99" rx="7" ry="3" fill="#7FA650" transform="rotate(-55 149 99)" />
      <Ellipse cx="156" cy="101" rx="7" ry="3" fill="#5E8A3A" transform="rotate(15 156 101)" />
      <Ellipse cx="163" cy="90" rx="6" ry="2.6" fill="#7FA650" transform="rotate(-25 163 90)" />
      <Ellipse cx="143" cy="109" rx="3" ry="3.6" fill="#3F5F27" />
    </>
  ),
  hint: ({ scarf, scarfEdge, shadow }: Colors) => (
    <>
      <Ellipse cx="110" cy="190" rx="46" ry="6" fill={shadow} />
      <Path d="M72 150 C56 152 38 160 28 172 C42 176 58 172 74 162 Z" fill="#C5D3E3" />
      <Path d="M74 158 C60 166 48 178 46 190 C60 186 72 178 80 166 Z" fill="#DCE6F1" />
      <Path
        d="M100 178 l-6 9 M100 178 l0 10 M100 178 l6 9 M122 178 l-6 9 M122 178 l0 10 M122 178 l6 9"
        stroke="#F28C28"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M66 132 C66 104 86 92 110 92 C138 92 156 112 156 138 C156 166 136 184 110 184 C84 184 66 164 66 140 Z"
        fill="#F5F8FC"
      />
      <Path
        d="M66 136 C66 160 82 182 108 184 C90 176 78 158 78 136 C78 118 84 104 96 96 C78 100 66 114 66 136 Z"
        fill="#E4ECF5"
      />
      <Path
        d="M98 140 C98 122 110 114 124 116 C140 118 148 132 146 150 C144 168 130 178 118 176 C104 174 98 158 98 140 Z"
        fill="#FFFFFF"
      />
      <Path
        d="M76 104 C94 116 130 116 150 102 C152 108 152 112 150 116 C130 128 94 128 76 116 C74 112 74 108 76 104 Z"
        fill={scarf}
      />
      <Path d="M92 120 L86 144 C90 146 96 145 99 142 L103 122 Z" fill={scarfEdge} />
      <Circle cx="112" cy="70" r="44" fill="#F5F8FC" />
      <Path
        d="M70 82 C74 104 94 116 116 114 C96 108 82 94 80 74 C79 60 84 46 94 36 C78 44 68 62 70 82 Z"
        fill="#E4ECF5"
      />
      <Path d="M106 30 C99 16 106 3 121 5 C112 10 111 18 117 28 Z" fill="#F5F8FC" />
      <Path d="M116 28 C116 18 123 11 133 13 C126 17 124 23 126 30 Z" fill="#E4ECF5" />
      <Path
        d="M89 54 L105 54"
        stroke="#1E2633"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M124 50 Q132 42 141 48"
        stroke="#1E2633"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="99" cy="67" rx="7.5" ry="9" fill="#1E2633" />
      <Circle cx="102" cy="63" r="3.2" fill="#FFFFFF" />
      <Ellipse cx="134" cy="66" rx="8" ry="10.5" fill="#1E2633" />
      <Circle cx="137" cy="61.5" r="3.4" fill="#FFFFFF" />
      <Path
        d="M106 82 C110 77 120 77 124 82 C121 88 116 91 115 91 C114 91 109 88 106 82 Z"
        fill="#FFB347"
      />
      <Path
        d="M108 85 C111 88 114 91 115 91 C116 91 119 88 122 85 C118 87 112 87 108 85 Z"
        fill="#F28C28"
      />
      <Ellipse cx="85" cy="84" rx="7" ry="4.5" fill="#FFB9C6" />
      <Ellipse cx="143" cy="84" rx="7" ry="4.5" fill="#FFB9C6" />
      <Path
        d="M80 126 C86 112 98 100 106 96 C111 97 112 103 108 108 C100 116 92 128 86 134 Z"
        fill="#DCE6F1"
      />
      <Path
        d="M138 110 C146 103 154 97 164 93"
        stroke="#5E8A3A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="149" cy="99" rx="7" ry="3" fill="#7FA650" transform="rotate(-55 149 99)" />
      <Ellipse cx="156" cy="101" rx="7" ry="3" fill="#5E8A3A" transform="rotate(15 156 101)" />
      <Ellipse cx="163" cy="90" rx="6" ry="2.6" fill="#7FA650" transform="rotate(-25 163 90)" />
      <Ellipse cx="143" cy="109" rx="3" ry="3.6" fill="#3F5F27" />
      <Path d="M172 26 l3.5 9 9 3.5 -9 3.5 -3.5 9 -3.5 -9 -9 -3.5 9 -3.5 Z" fill="#FFC107" />
      <Path d="M158 12 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#FFD25E" />
    </>
  ),
  celebrating: ({ scarf, scarfEdge, shadow }: Colors) => (
    <>
      <Ellipse cx="110" cy="192" rx="32" ry="4.5" fill={shadow} />
      <Rect
        x="24"
        y="30"
        width="8"
        height="13"
        rx="2.5"
        fill="#2FA4E7"
        transform="rotate(25 28 36)"
      />
      <Rect
        x="178"
        y="46"
        width="8"
        height="13"
        rx="2.5"
        fill="#FF9F1C"
        transform="rotate(-20 182 52)"
      />
      <Circle cx="40" cy="140" r="4.5" fill="#FF6B6B" />
      <Circle cx="182" cy="130" r="4.5" fill="#58A700" />
      <Rect
        x="160"
        y="160"
        width="7"
        height="12"
        rx="2.5"
        fill="#8E5CF6"
        transform="rotate(35 163 166)"
      />
      <Circle cx="30" cy="96" r="3.5" fill="#FFC107" />
      <G transform="translate(0 -10)">
        <Path d="M72 150 C56 152 38 160 28 172 C42 176 58 172 74 162 Z" fill="#C5D3E3" />
        <Path d="M74 158 C60 166 48 178 46 190 C60 186 72 178 80 166 Z" fill="#DCE6F1" />
        <Path
          d="M100 180 l-5 7 M100 180 l0 9 M100 180 l5 7 M122 180 l-5 7 M122 180 l0 9 M122 180 l5 7"
          stroke="#F28C28"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M66 132 C66 104 86 92 110 92 C138 92 156 112 156 138 C156 166 136 184 110 184 C84 184 66 164 66 140 Z"
          fill="#F5F8FC"
        />
        <Path
          d="M66 136 C66 160 82 182 108 184 C90 176 78 158 78 136 C78 118 84 104 96 96 C78 100 66 114 66 136 Z"
          fill="#E4ECF5"
        />
        <Path
          d="M98 140 C98 122 110 114 124 116 C140 118 148 132 146 150 C144 168 130 178 118 176 C104 174 98 158 98 140 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M72 120 C58 112 44 94 45 78 C51 75 59 81 63 89 C69 99 75 111 72 120 Z"
          fill="#DCE6F1"
        />
        <Path
          d="M150 120 C164 112 178 94 177 78 C171 75 163 81 159 89 C153 99 147 111 150 120 Z"
          fill="#DCE6F1"
        />
        <Path
          d="M76 104 C94 116 130 116 150 102 C152 108 152 112 150 116 C130 128 94 128 76 116 C74 112 74 108 76 104 Z"
          fill={scarf}
        />
        <Path
          d="M92 120 L84 146 C88 148 94 147 97 144 L103 122 Z"
          fill={scarfEdge}
          transform="rotate(-12 96 122)"
        />
        <Circle cx="112" cy="70" r="44" fill="#F5F8FC" />
        <Path
          d="M70 82 C74 104 94 116 116 114 C96 108 82 94 80 74 C79 60 84 46 94 36 C78 44 68 62 70 82 Z"
          fill="#E4ECF5"
        />
        <Path d="M106 30 C99 14 106 0 122 2 C112 8 111 17 117 28 Z" fill="#F5F8FC" />
        <Path d="M116 28 C116 16 124 8 135 10 C127 15 124 22 126 30 Z" fill="#E4ECF5" />
        <Path
          d="M89 70 Q97 59 105 70"
          stroke="#1E2633"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M123 70 Q131 59 139 70"
          stroke="#1E2633"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
        <Path d="M107 86 C108 101 122 101 123 86 Z" fill="#E0701B" />
        <Ellipse cx="115" cy="93" rx="4.5" ry="3" fill="#FF7A8A" />
        <Path d="M106 82 C110 77 120 77 124 82 C121 87 109 87 106 82 Z" fill="#FFB347" />
        <Ellipse cx="85" cy="82" rx="8" ry="5" fill="#FFA3B5" />
        <Ellipse cx="143" cy="82" rx="8" ry="5" fill="#FFA3B5" />
      </G>
    </>
  ),
  encouraging: ({ scarf, scarfEdge, shadow }: Colors) => (
    <>
      <Ellipse cx="110" cy="190" rx="46" ry="6" fill={shadow} />
      <Path d="M72 150 C56 152 38 160 28 172 C42 176 58 172 74 162 Z" fill="#C5D3E3" />
      <Path d="M74 158 C60 166 48 178 46 190 C60 186 72 178 80 166 Z" fill="#DCE6F1" />
      <Path
        d="M100 178 l-6 9 M100 178 l0 10 M100 178 l6 9 M122 178 l-6 9 M122 178 l0 10 M122 178 l6 9"
        stroke="#F28C28"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M66 132 C66 104 86 92 110 92 C138 92 156 112 156 138 C156 166 136 184 110 184 C84 184 66 164 66 140 Z"
        fill="#F5F8FC"
      />
      <Path
        d="M66 136 C66 160 82 182 108 184 C90 176 78 158 78 136 C78 118 84 104 96 96 C78 100 66 114 66 136 Z"
        fill="#E4ECF5"
      />
      <Path
        d="M98 140 C98 122 110 114 124 116 C140 118 148 132 146 150 C144 168 130 178 118 176 C104 174 98 158 98 140 Z"
        fill="#FFFFFF"
      />
      <Path
        d="M76 104 C94 116 130 116 150 102 C152 108 152 112 150 116 C130 128 94 128 76 116 C74 112 74 108 76 104 Z"
        fill={scarf}
      />
      <Path d="M92 120 L86 144 C90 146 96 145 99 142 L103 122 Z" fill={scarfEdge} />
      <Path
        d="M78 130 C88 122 104 126 114 136 C110 144 98 146 90 142 C82 139 76 134 78 130 Z"
        fill="#DCE6F1"
      />
      <Circle cx="112" cy="70" r="44" fill="#F5F8FC" />
      <Path
        d="M70 82 C74 104 94 116 116 114 C96 108 82 94 80 74 C79 60 84 46 94 36 C78 44 68 62 70 82 Z"
        fill="#E4ECF5"
      />
      <Path d="M108 30 C104 18 110 8 122 8 C114 13 113 20 117 29 Z" fill="#F5F8FC" />
      <Path
        d="M89 58 L104 53"
        stroke="#1E2633"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M124 53 L139 58"
        stroke="#1E2633"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="97" cy="70" rx="7.5" ry="9.5" fill="#1E2633" />
      <Circle cx="100" cy="66" r="3.4" fill="#FFFFFF" />
      <Circle cx="94.5" cy="74" r="1.6" fill="#FFFFFF" />
      <Ellipse cx="131" cy="70" rx="7.5" ry="9.5" fill="#1E2633" />
      <Circle cx="134" cy="66" r="3.4" fill="#FFFFFF" />
      <Circle cx="128.5" cy="74" r="1.6" fill="#FFFFFF" />
      <Path
        d="M106 84 C110 79 120 79 124 84 C121 90 116 93 115 93 C114 93 109 90 106 84 Z"
        fill="#FFB347"
      />
      <Path
        d="M108 87 C111 90 114 93 115 93 C116 93 119 90 122 87 C118 89 112 89 108 87 Z"
        fill="#F28C28"
      />
      <Ellipse cx="85" cy="86" rx="7" ry="4.5" fill="#FFB9C6" />
      <Ellipse cx="143" cy="86" rx="7" ry="4.5" fill="#FFB9C6" />
      <Path
        d="M138 110 C146 103 154 97 164 93"
        stroke="#5E8A3A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <Ellipse cx="149" cy="99" rx="7" ry="3" fill="#7FA650" transform="rotate(-55 149 99)" />
      <Ellipse cx="156" cy="101" rx="7" ry="3" fill="#5E8A3A" transform="rotate(15 156 101)" />
      <Ellipse cx="163" cy="90" rx="6" ry="2.6" fill="#7FA650" transform="rotate(-25 163 90)" />
      <Ellipse cx="143" cy="109" rx="3" ry="3.6" fill="#3F5F27" />
      <Path
        d="M168 44 c-3 -5 -11 -3 -9 3 c1 4 9 9 9 9 s8 -5 9 -9 c2 -6 -6 -8 -9 -3 Z"
        fill="#FF8FA3"
      />
    </>
  ),
  asleep: ({ scarf, scarfEdge, shadow }: Colors) => (
    <>
      <Ellipse cx="110" cy="190" rx="46" ry="6" fill={shadow} />
      <Path d="M72 150 C56 152 38 160 28 172 C42 176 58 172 74 162 Z" fill="#C5D3E3" />
      <Path d="M74 158 C60 166 48 178 46 190 C60 186 72 178 80 166 Z" fill="#DCE6F1" />
      <Path
        d="M100 178 l-6 9 M100 178 l0 10 M100 178 l6 9 M122 178 l-6 9 M122 178 l0 10 M122 178 l6 9"
        stroke="#F28C28"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M66 132 C66 104 86 92 110 92 C138 92 156 112 156 138 C156 166 136 184 110 184 C84 184 66 164 66 140 Z"
        fill="#F5F8FC"
      />
      <Path
        d="M66 136 C66 160 82 182 108 184 C90 176 78 158 78 136 C78 118 84 104 96 96 C78 100 66 114 66 136 Z"
        fill="#E4ECF5"
      />
      <Path
        d="M98 140 C98 122 110 114 124 116 C140 118 148 132 146 150 C144 168 130 178 118 176 C104 174 98 158 98 140 Z"
        fill="#FFFFFF"
      />
      <Path
        d="M76 124 C64 132 60 154 70 170 C74 174 80 172 84 166 C92 152 94 136 90 126 C86 120 80 120 76 124 Z"
        fill="#DCE6F1"
      />
      <Path
        d="M76 104 C94 116 130 116 150 102 C152 108 152 112 150 116 C130 128 94 128 76 116 C74 112 74 108 76 104 Z"
        fill={scarf}
      />
      <Path d="M92 120 L86 144 C90 146 96 145 99 142 L103 122 Z" fill={scarfEdge} />
      <G transform="rotate(10 112 100)">
        <Circle cx="112" cy="70" r="44" fill="#F5F8FC" />
        <Path
          d="M70 82 C74 104 94 116 116 114 C96 108 82 94 80 74 C79 60 84 46 94 36 C78 44 68 62 70 82 Z"
          fill="#E4ECF5"
        />
        <Path d="M108 30 C112 18 126 14 138 22 C128 22 120 26 116 32 Z" fill="#F5F8FC" />
        <Path
          d="M89 70 Q97 77 105 70"
          stroke="#1E2633"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M123 70 Q131 77 139 70"
          stroke="#1E2633"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M106 82 C110 77 120 77 124 82 C121 88 116 91 115 91 C114 91 109 88 106 82 Z"
          fill="#FFB347"
        />
        <Ellipse cx="85" cy="84" rx="7" ry="4.5" fill="#FFB9C6" />
        <Ellipse cx="143" cy="84" rx="7" ry="4.5" fill="#FFB9C6" />
      </G>
      <SvgText x="156" y="40" fontFamily="Nunito_900Black" fontSize="22" fill="#8E9BB0">
        z
      </SvgText>
      <SvgText x="172" y="22" fontFamily="Nunito_900Black" fontSize="15" fill="#AEB8C8">
        z
      </SvgText>
    </>
  ),
};

const LABELS: Record<PaxMood, string> = {
  hello: 'Pax saying hello',
  happy: 'Pax happy and waving',
  hint: 'Pax thinking up a hint',
  celebrating: 'Pax celebrating',
  encouraging: 'Pax encouraging you',
  asleep: 'Pax asleep',
};

/** Full-body Pax in one of the six character-sheet expressions. */
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
      {MOODS[mood](colors)}
    </Svg>
  );
}

/** The small side-view Pax used beside speech bubbles on Today and Readings. */
export function PaxMini({ size = 72 }: { size?: number }) {
  const t = useTheme();
  const scarf = t.accent.accent;
  const scarfEdge = t.accent.edge;
  const shadow = t.neutral.paxShadow;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityLabel="Pax the dove in a scarf">
      <Ellipse cx="50" cy="92" rx="30" ry="5" fill={shadow} />
      <Path d="M14 62l-12 6 14 4z" fill="#CFE0F2" />
      <Ellipse cx="44" cy="62" rx="32" ry="24" fill="#EAF3FC" />
      <Circle cx="64" cy="36" r="19" fill="#EAF3FC" />
      <Path d="M30 56c10-14 30-14 34 2-12-4-22 2-34-2z" fill="#CFE0F2" />
      <Circle cx="69" cy="33" r="5" fill="#3C3C3C" />
      <Circle cx="71" cy="31" r="1.8" fill="#FFFFFF" />
      <Path d="M81 37l13 4-13 5z" fill="#FF9F1C" />
      <Path d="M48 50c8 6 22 6 30-2l2 6c-8 8-24 8-34 2z" fill={scarf} />
      <Path d="M54 56l-4 14 6-2 2-12z" fill={scarfEdge} />
      <Path d="M40 84v6M50 84v6" stroke="#FF9F1C" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}
