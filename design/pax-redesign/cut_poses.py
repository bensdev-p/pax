"""Cuts Pax's poses out of Ben's approved character sheet for the app.

    python3 design/pax-redesign/cut_poses.py

For each pose on character-sheet.png this writes four layers to apps/mobile/assets/images/pax/,
all the same size and alignment, so the app can stack them:

  <pose>.png        the dove, background and ground shadow removed (the app draws its own shadow)
  <pose>-scarf.png  where the scarf is, as a white mask the app tints with the day's accent color
  <pose>-shade.png  the scarf's folds and shadows, tinted with the accent's edge color
  <pose>-light.png  the scarf's highlights, shown in white

so the scarf keeps the sheet's own shading in every liturgical color. Every pose is scaled so the
dove stands the same height, feet on the same line, centered in a square.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SHEET = Path(__file__).with_name("character-sheet.png")
OUT = ROOT / "apps/mobile/assets/images/pax"

# Where each pose sits on the sheet (left, top, right, bottom), in sheet pixels.
POSES = {
    "standing": (55, 25, 445, 465),  # the large three-quarter figure
    "welcome": (95, 478, 375, 748),
    "curious": (415, 478, 720, 748),  # the book beside him is dropped as a separate shape
    "peaceful": (835, 478, 1065, 748),
    "encouraging": (1165, 478, 1435, 748),
}

# Things beside a pose that aren't Pax, as polygons in sheet pixels: the book beside the curious
# pose, traced just outside his belly's outline and right foot.
ERASE = {
    "curious": [
        [(720, 640), (634, 640), (634, 662), (631, 668), (628, 674), (625, 678), (621, 682),
         (617, 686), (612, 690), (607, 694), (601, 698), (595, 702), (586, 705), (586, 708),
         (586, 748), (720, 748)],
    ]
}

CANVAS = 600  # px; Pax shows at most 200 pt, so this is 3x
GROUND = 0.94  # where the feet stand, as a share of the canvas height


def dilate(mask: np.ndarray, steps: int = 1) -> np.ndarray:
    out = mask.copy()
    for _ in range(steps):
        grown = out.copy()
        grown[1:, :] |= out[:-1, :]
        grown[:-1, :] |= out[1:, :]
        grown[:, 1:] |= out[:, :-1]
        grown[:, :-1] |= out[:, 1:]
        out = grown
    return out


def change(rgb: np.ndarray) -> np.ndarray:
    """How much each pixel's color differs from its neighbors' (0 on the flat paper)."""
    rgb = rgb.astype(int)
    out = np.zeros(rgb.shape[:2], dtype=int)
    across = np.abs(np.diff(rgb, axis=1)).max(-1)
    down = np.abs(np.diff(rgb, axis=0)).max(-1)
    out[:, :-1] = np.maximum(out[:, :-1], across)
    out[:, 1:] = np.maximum(out[:, 1:], across)
    out[:-1, :] = np.maximum(out[:-1, :], down)
    out[1:, :] = np.maximum(out[1:, :], down)
    return out


def fill(passable: np.ndarray, seeds: np.ndarray) -> np.ndarray:
    """Everything reachable from the seeds through passable pixels (4-connected)."""
    h, w = passable.shape
    seen = seeds & passable
    queue: deque[tuple[int, int]] = deque(zip(*np.nonzero(seen)))
    while queue:
        y, x = queue.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and passable[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    return seen


def background_mask(rgb: np.ndarray) -> np.ndarray:
    """The sheet's paper and the painted ground shadow.

    The dove's whites are painted on the same cream paper, so color alone can't tell them apart.
    The paper is perfectly flat, though, and even his faintest outline changes color from one
    pixel to the next: the fill from the crop's edges crosses only unchanging pixels.
    """
    edges = np.zeros(rgb.shape[:2], dtype=bool)
    edges[0, :] = edges[-1, :] = edges[:, 0] = edges[:, -1] = True
    flat = ~dilate(change(rgb) > 3, 1)
    # The painted ground shadow: warm beige (red well above blue, unlike his cool grey shading),
    # from the top of his feet down. The app draws its own shadow.
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    feet = (r - b > 100) & (r > 180)
    feet[: rgb.shape[0] * 3 // 4] = False  # his feet, not his beak
    top = int(np.nonzero(feet.any(axis=1))[0].min()) if feet.any() else rgb.shape[0]
    beige = (r - b >= 8) & (r - b <= 40) & (r >= g) & (g >= b) & (lum >= 190) & (lum <= 252)
    beige[:top] = False
    # Only beige that reaches the paper, never a warm pixel inside his body; and the paper beyond
    # it, like the pocket between his tail and belly that the shadow closes off.
    background = fill(flat | beige, edges)
    return background | dilate(background, 1) & (change(rgb) <= 3)


def largest_component(mask: np.ndarray) -> np.ndarray:
    """The dove itself: the biggest connected shape (drops the book and the little motion ticks)."""
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=int)
    best, best_size, label = 0, 0, 0
    for sy in range(h):
        for sx in range(w):
            if not mask[sy, sx] or labels[sy, sx]:
                continue
            label += 1
            labels[sy, sx] = label
            queue = deque([(sy, sx)])
            size = 0
            while queue:
                y, x = queue.popleft()
                size += 1
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not labels[ny, nx]:
                            labels[ny, nx] = label
                            queue.append((ny, nx))
            if size > best_size:
                best, best_size = label, size
    return labels == best


def cut(rgb: np.ndarray) -> np.ndarray:
    """RGBA of the dove alone, with soft edges and the paper color taken out of them."""
    paper = np.array([252, 249, 241], dtype=float)
    bg = background_mask(rgb)
    bird = largest_component(~bg)
    # Peel off any paper-colored fringe left along the cut (his own edge has a blue-grey line).
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    creamy = (np.linalg.norm(rgb.astype(float) - paper, axis=-1) < 24) & (r - b >= 4)
    for _ in range(2):
        outside = ~bird
        touching = dilate(outside, 1) & bird
        bird &= ~(touching & creamy)
    bird = largest_component(bird)
    # Smooth the cut's stair steps a little.
    soft = np.array(Image.fromarray((bird * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))) / 255.0
    alpha = np.where(bird, np.clip(soft * 1.3, 0, 1), 0.0)
    # Edge pixels are part paper: estimate how much from their distance to the paper color.
    edge = bird & ~np.pad(bird, 1)[2:, 1:-1] | bird & ~np.pad(bird, 1)[:-2, 1:-1] | bird & ~np.pad(bird, 1)[1:-1, 2:] | bird & ~np.pad(bird, 1)[1:-1, :-2]
    dist = np.linalg.norm(rgb.astype(float) - paper, axis=-1)
    alpha[edge] = np.minimum(alpha[edge], np.clip(dist[edge] / 48.0, 0.15, 1.0))
    colour = rgb.astype(float)
    a = alpha[..., None]
    colour = np.where(a > 0, (colour - (1 - a) * paper) / np.maximum(a, 1e-3), 0)
    return np.dstack([np.clip(colour, 0, 255), alpha * 255]).astype(np.uint8)


def scarf_layers(rgba: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Splits the green scarf off: (dove with the scarf whitened, mask, folds, highlights)."""
    r, g, b = (rgba[..., i].astype(float) for i in range(3))
    alpha = rgba[..., 3].astype(float) / 255
    # The scarf is a blue-green; the olive leaves are yellow-green (red above blue), so they stay.
    green = g - np.maximum(r, b)
    member = np.clip((green - 8) / 28, 0, 1) * ((b >= r - 8) & (g - r >= 22))
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    core = member > 0.8
    mid = float(np.median(lum[core])) if core.any() else 110.0
    shade = np.clip((mid - lum) / mid * 2.2, 0, 1) * member
    light = np.clip((lum - mid) / (255 - mid) * 1.6, 0, 1) * member
    base = rgba.astype(float)
    m = member[..., None]
    base[..., :3] = base[..., :3] * (1 - m) + np.array([247, 249, 252]) * m

    def white(a: np.ndarray) -> np.ndarray:
        out = np.zeros(rgba.shape, dtype=np.uint8)
        out[..., :3] = 255
        out[..., 3] = np.clip(a * alpha * 255, 0, 255).astype(np.uint8)
        return out

    return base.astype(np.uint8), white(member), white(shade), white(light)


def bounds(rgba: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.nonzero(rgba[..., 3] > 24)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def place(layer: np.ndarray, box: tuple[int, int, int, int], scale: float) -> Image.Image:
    """The layer scaled about its dove and set on the canvas, feet on the ground line."""
    left, top, right, bottom = box
    img = Image.fromarray(layer[top:bottom, left:right], "RGBA").convert("RGBa")
    w, h = round((right - left) * scale), round((bottom - top) * scale)
    img = img.resize((w, h), Image.LANCZOS).convert("RGBA")
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(img, ((CANVAS - w) // 2, round(CANVAS * GROUND) - h), img)
    return canvas


def main() -> None:
    sheet = np.array(Image.open(SHEET).convert("RGB"))
    cuts = {}
    for name, (l, t, r, b) in POSES.items():
        crop = sheet[t:b, l:r].copy()
        for polygon in ERASE.get(name, []):
            mask = Image.new("1", (r - l, b - t))
            ImageDraw.Draw(mask).polygon([(x - l, y - t) for x, y in polygon], fill=1)
            crop[np.array(mask)] = (252, 249, 241)
        rgba = cut(crop)
        cuts[name] = (rgba, bounds(rgba))
    # One scale per pose so every dove stands the same height, as tall as the widest pose allows.
    height = min(
        min(CANVAS * 0.86, CANVAS * 0.98 * (bb[3] - bb[1]) / (bb[2] - bb[0]))
        for _, bb in cuts.values()
    )
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (rgba, bb) in cuts.items():
        scale = height / (bb[3] - bb[1])
        layers = scarf_layers(rgba)
        for suffix, layer in zip(("", "-scarf", "-shade", "-light"), layers):
            place(layer, bb, scale).save(OUT / f"{name}{suffix}.png", optimize=True)
        print(f"{name}: dove {bb[2] - bb[0]}x{bb[3] - bb[1]} px on the sheet, scaled {scale:.2f}x")


if __name__ == "__main__":
    main()
