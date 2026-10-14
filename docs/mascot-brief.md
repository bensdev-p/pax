# Pax mascot brief (for an image generator)

October 2026. Ben wants a simpler dove than the current Pax, but not the style of the first
mockup (canvas option A). The art is made in ChatGPT from the prompt below; Claude then brings
it into the app.

**How it comes into the app.** Each pose is a transparent PNG. The scarf is drawn in flat magenta
(#FF00FF) so a build script can cut it into a separate mask, which the app tints with the day's
liturgical color (the technique of commit b85745d). The app icon is a separate square image.

## Step 1: the style (paste into ChatGPT)

```
I'm designing the mascot for "Pax", a calm daily Catholic prayer app (Scripture, the Rosary, the
saints, the liturgical year). The mascot is Pax, a small white dove: a quiet companion who
appears briefly (a greeting, a short line of encouragement, a gentle celebration after
prayer), not a loud game mascot.

Please draw a character sheet with FOUR different style directions for Pax, side by side, each
showing the dove standing, front three-quarter view, on a plain white background.

Pax in every direction:
- A small, round, friendly dove: round head, soft pear-shaped body, short tail, small orange
  beak, simple dark eyes (a dot with a tiny highlight, not big anime eyes).
- White and very pale blue-grey feathers, a little shading only.
- A short scarf around the neck in flat solid magenta #FF00FF (exactly that color, no shading
  on the scarf: we recolor it in the app to the color of the day's feast).
- Simple, clean flat vector illustration: solid fills, smooth shapes, no texture, no gradients,
  no 3D, no realistic feathers, no text, no halo.
- Must still read clearly at 40 pixels tall and look good at 300 pixels.
- Warm and gentle, peaceful rather than goofy. Not like the Twitter bird, Duolingo's owl or
  Angry Birds.

Make the four directions clearly different, for example: (1) very minimal geometric, almost a
logo; (2) soft rounded children's-book flat style; (3) a slightly more elegant, graceful dove
with longer wings and tail; (4) your own best idea for a calm, premium-feeling app mascot.
Label them 1 to 4.
```

Ben picks a direction (or asks for a mix), then:

## Step 2: the poses (same chat, after picking)

```
Great, let's go with direction [N]. Now draw Pax in that exact style in these seven poses. Make
each one a SEPARATE square image, 1024 x 1024, transparent background, the dove centered and the
same size and scale in every image, same light direction, same colors, and the scarf always
flat magenta #FF00FF:

1. hello: standing, one wing raised in a small wave, eyes open, gentle smile.
2. happy: standing, eyes closed in contented crescents, small smile.
3. hint: standing, head slightly tilted as if offering a thought, one wing lifted a little.
4. praying: standing quietly, eyes closed, wings folded, peaceful.
5. encouraging: standing, leaning forward a little, both wings slightly open, warm smile.
6. celebrating: both wings raised high in joy, eyes closed happily (no confetti, no text).
7. asleep: sitting tucked in, eyes closed, head lowered, peaceful (no "Zzz").

No shadows on the ground, no background, no text, no frames.
```

## Step 3: the app icon

```
Now make the app icon: Pax in direction [N], flying, carrying a small green olive sprig in the
beak, on a solid background of #24913C (green). Square 1024 x 1024, no transparency, no rounded
corners (iOS rounds them), the dove filling about 70% of the square. Here the scarf can be
white or left off. No text.
```

## What to send back

Download each image as PNG (transparent where asked) and send them to Claude, named by pose
(`hello.png`, `happy.png`, `hint.png`, `praying.png`, `encouraging.png`, `celebrating.png`,
`asleep.png`, `icon.png`). Claude cuts the magenta scarf into tintable masks and replaces
`components/Pax.tsx`. The moods in use today are hello, happy, hint, celebrating, encouraging and
asleep; "praying" is new, for prayer screens.
