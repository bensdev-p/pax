"""Cuts Pax's poses (Ben's art, made in ChatGPT from docs/mascot-brief.md) for the app.

    python3 design/pax/cut_pax.py

Each pose in design/pax/source/<pose>.png is a transparent PNG with the scarf in flat magenta
(#FF00FF). For each, this writes two aligned layers to apps/mobile/assets/images/pax/:

  <pose>.png        the dove, with the scarf taken out
  <pose>-scarf.png  the scarf as a white mask, which the app tints with the day's accent color

and, from source/icon.png (Pax with a book and a rosary on green), the app's icons in
apps/mobile/assets/images/: icon.png (iOS), the Android adaptive icon's foreground, background and
monochrome layers, the splash image, the notification icon and the web favicon.

The scarf's soft edge is un-mixed: where a pixel is part magenta and part feather, the dove layer
gets the feather color back and the mask gets the magenta share as its alpha, so the tinted scarf
blends in without a pink fringe. Every pose keeps the source's scale (the art is drawn to one
scale) and is moved so the feet stand on the same line, centered, in a square canvas.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).with_name("source")
OUT = ROOT / "apps/mobile/assets/images/pax"

POSES = ["hello", "happy", "hint", "praying", "encouraging", "celebrating", "asleep"]

CANVAS = 600  # px; Pax shows at most 200 pt, so this is 3x
SCALE = 0.5  # source px to canvas px: the widest pose (about 1,000 px) fills 500 of 600
GROUND = 0.95  # where the feet stand, as a share of the canvas height
MAGENTA = np.array([255.0, 0.0, 255.0])


def magenta_share(rgb: np.ndarray) -> np.ndarray:
    """How much of each pixel is the scarf's magenta (0 to 1). Pax's whites, greys, blues,
    orange and black all have more green than red or blue, and magenta has none."""
    return np.clip((np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]) / 255.0, 0.0, 1.0)


def cut(path: Path) -> tuple[Image.Image, Image.Image]:
    rgba = np.asarray(Image.open(path).convert("RGBA")).astype(float)
    rgb, alpha = rgba[..., :3], rgba[..., 3] / 255.0
    # The art's opaque parts are saved at 254, and a faint haze floats around the edges.
    alpha = np.where(alpha >= 250 / 255, 1.0, np.where(alpha < 12 / 255, 0.0, alpha))

    share = magenta_share(rgb) * (alpha > 0)
    share = np.where(share > 0.97, 1.0, np.where(share < 0.04, 0.0, share))

    # Un-mix: pixel = share * magenta + (1 - share) * feather, so feather = (pixel - share * magenta) / (1 - share).
    rest = np.clip(1.0 - share, 1e-6, 1.0)[..., None]
    feather = np.clip((rgb - share[..., None] * MAGENTA) / rest, 0, 255)

    dove = np.dstack([feather, alpha * (1.0 - share) * 255])
    scarf = np.dstack([np.full_like(rgb, 255.0), alpha * share * 255])
    return (
        Image.fromarray(dove.round().astype(np.uint8), "RGBA"),
        Image.fromarray(scarf.round().astype(np.uint8), "RGBA"),
    )


def place(layer: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    """Scales a layer and moves it so the dove's feet stand on the ground line, centered."""
    left, _, right, bottom = box
    scaled = layer.resize((round(layer.width * SCALE), round(layer.height * SCALE)), Image.LANCZOS)
    x = round(CANVAS / 2 - (left + right) / 2 * SCALE)
    y = round(CANVAS * GROUND - bottom * SCALE)
    if x + left * SCALE < 0 or y + box[1] * SCALE < 0 or x + right * SCALE > CANVAS:
        raise SystemExit("a pose doesn't fit the canvas; lower SCALE")
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(scaled, (x, y))  # a plain copy: the canvas is empty, so no blending is wanted
    return canvas


def key_out(icon: np.ndarray) -> np.ndarray:
    """The icon's dove (with his book and rosary) lifted off its flat green, as RGBA. Edge pixels
    are part green: alpha is how far a pixel is from the green, and its color is un-mixed."""
    rgb = icon[..., :3].astype(float)
    green = np.median(np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3)]), axis=0)
    alpha = np.clip(np.linalg.norm(rgb - green, axis=-1) / 90.0, 0.0, 1.0)
    alpha = np.where(alpha < 0.08, 0.0, alpha)
    color = np.clip((rgb - (1 - alpha[..., None]) * green) / np.clip(alpha, 1e-6, 1)[..., None], 0, 255)
    return np.dstack([color, alpha * 255])


def fit(rgba: np.ndarray, size: int, height_share: float) -> Image.Image:
    """Centers the figure in a square so it is `height_share` of the side tall."""
    im = Image.fromarray(rgba.round().astype(np.uint8), "RGBA")
    im = im.crop(im.getbbox())
    scale = size * height_share / im.height
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2))
    return canvas


def silhouette(im: Image.Image) -> Image.Image:
    alpha = np.asarray(im)[..., 3]
    return Image.fromarray(np.dstack([np.full(alpha.shape + (3,), 255, np.uint8), alpha]), "RGBA")


def icons() -> None:
    path = SOURCE / "icon.png"
    if not path.exists():
        print("icon: no source yet, skipped")
        return
    images = ROOT / "apps/mobile/assets/images"
    icon = Image.open(path).convert("RGB")
    icon.resize((1024, 1024), Image.LANCZOS).save(images / "icon.png", optimize=True)
    icon.resize((48, 48), Image.LANCZOS).save(images / "favicon.png", optimize=True)
    dove = key_out(np.asarray(icon))
    green = tuple(int(c) for c in np.median(np.asarray(icon)[:8].reshape(-1, 3), axis=0))
    # Android crops the adaptive icon to a shape: keep him inside the middle two-thirds.
    foreground = fit(dove, 1024, 0.6)
    foreground.save(images / "android-icon-foreground.png", optimize=True)
    Image.new("RGB", (1024, 1024), green).save(images / "android-icon-background.png", optimize=True)
    silhouette(foreground).save(images / "android-icon-monochrome.png", optimize=True)
    silhouette(fit(dove, 96, 0.8)).save(images / "notification-icon.png", optimize=True)
    print(f"icon: written (green #{green[0]:02X}{green[1]:02X}{green[2]:02X})")


def splash() -> None:
    """The splash image: Pax saying hello, his scarf in Ordinary Time's green."""
    dove = Image.open(OUT / "hello.png")
    scarf = np.asarray(Image.open(OUT / "hello-scarf.png")).astype(float)
    scarf[..., :3] = (0x24, 0x91, 0x3C)
    dove.alpha_composite(Image.fromarray(scarf.astype(np.uint8), "RGBA"))
    fit(np.asarray(dove).astype(float), 512, 0.9).save(ROOT / "apps/mobile/assets/images/splash-icon.png", optimize=True)
    print("splash: written")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for pose in POSES:
        path = SOURCE / f"{pose}.png"
        if not path.exists():
            print(f"{pose}: no source yet, skipped")
            continue
        dove, scarf = cut(path)
        bbox = Image.fromarray((np.asarray(dove)[..., 3] + np.asarray(scarf)[..., 3] > 0).astype(np.uint8) * 255).getbbox()
        if bbox is None:
            raise SystemExit(f"{pose}: the image is empty")
        for name, layer in ((pose, dove), (f"{pose}-scarf", scarf)):
            place(layer, bbox).save(OUT / f"{name}.png", optimize=True)
        print(f"{pose}: dove and scarf written")
    icons()
    splash()


if __name__ == "__main__":
    main()
