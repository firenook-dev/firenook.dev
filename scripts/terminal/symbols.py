"""Draws the small font the home page's terminal takes its symbols from.

Firenook's screen draws boxes, its flame in half blocks, ticks, crosses and a
braille spinner. Monospace web fonts leave most of those out, and each
system's fallback draws them to its own size, so lines break and blocks
gap. This font has exactly those characters, on IBM Plex Mono's grid: 600
units wide, and as tall as the terminal's line (1.22 em), so every line and
block meets the cell's edges and joins its neighbours.

    python3 symbols.py ../../src/assets/fonts/terminal-symbols.woff2

Change LINE_HEIGHT together with the terminal's line-height in
src/components/Terminal.astro.
"""

import math
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
ADVANCE = 600
ASCENT, DESCENT = 1025, 275  # IBM Plex Mono's, so lines are laid out alike
LINE_HEIGHT = 1.22
HALF_LEADING = (LINE_HEIGHT * UPM - (ASCENT + DESCENT)) / 2
TOP = ASCENT + HALF_LEADING  # the cell's top edge, above the baseline
BOTTOM = -DESCENT - HALF_LEADING  # its bottom edge
MIDDLE = (TOP + BOTTOM) / 2
CENTRE = ADVANCE / 2
THIN = 70
THICK = 150
OVER = 6  # lines run a little past the edge, so neighbours overlap


def rect(pen, x0, y0, x1, y1):
    pen.moveTo((x0, y0))
    pen.lineTo((x0, y1))
    pen.lineTo((x1, y1))
    pen.lineTo((x1, y0))
    pen.closePath()


def polygon(pen, points):
    pen.moveTo(points[0])
    for point in points[1:]:
        pen.lineTo(point)
    pen.closePath()


def circle(pen, cx, cy, r, steps=24):
    polygon(pen, [(cx + r * math.cos(-2 * math.pi * i / steps), cy + r * math.sin(-2 * math.pi * i / steps)) for i in range(steps)])


def horizontal(pen, x0, x1, width=THIN):
    rect(pen, x0, MIDDLE - width / 2, x1, MIDDLE + width / 2)


def vertical(pen, y0, y1, width=THIN):
    rect(pen, CENTRE - width / 2, y0, CENTRE + width / 2, y1)


def corner(pen, towards_right, towards_up):
    """A rounded corner: a line from the cell's side meets one from its top or bottom."""
    r = 240
    side_x = ADVANCE + OVER if towards_right else -OVER
    edge_y = TOP + OVER if towards_up else BOTTOM - OVER
    sx = 1 if towards_right else -1
    sy = 1 if towards_up else -1
    cx, cy = CENTRE + sx * r, MIDDLE + sy * r
    steps = 14
    # The arc runs, the short way round, from where it meets the horizontal
    # line (straight above or below its centre) to where it meets the
    # vertical one (straight beside it).
    start = math.atan2(-sy, 0)
    turn = (math.atan2(0, -sx) - start + math.pi) % (2 * math.pi) - math.pi
    outer, inner = [], []
    for i in range(steps + 1):
        a = start + turn * i / steps
        outer.append((cx + (r + THIN / 2) * math.cos(a), cy + (r + THIN / 2) * math.sin(a)))
        inner.append((cx + (r - THIN / 2) * math.cos(a), cy + (r - THIN / 2) * math.sin(a)))
    polygon(pen, outer + inner[::-1])
    horizontal(pen, min(cx, side_x), max(cx, side_x))
    vertical(pen, min(cy, edge_y), max(cy, edge_y))


def tick(pen):
    w = 78
    a, b, c = (95, MIDDLE + 10), (240, MIDDLE - 150), (505, MIDDLE + 250)
    def bar(p, q):
        dx, dy = q[0] - p[0], q[1] - p[1]
        length = math.hypot(dx, dy)
        nx, ny = -dy / length * w / 2, dx / length * w / 2
        polygon(pen, [(p[0] + nx, p[1] + ny), (q[0] + nx, q[1] + ny), (q[0] - nx, q[1] - ny), (p[0] - nx, p[1] - ny)])
    bar(a, b)
    bar((b[0] - 22, b[1] - 18), c)


def cross(pen):
    w, d = 78, 190
    for sign in (1, -1):
        p, q = (CENTRE - d, MIDDLE - sign * d), (CENTRE + d, MIDDLE + sign * d)
        dx, dy = q[0] - p[0], q[1] - p[1]
        length = math.hypot(dx, dy)
        nx, ny = -dy / length * w / 2, dx / length * w / 2
        polygon(pen, [(p[0] + nx, p[1] + ny), (q[0] + nx, q[1] + ny), (q[0] - nx, q[1] - ny), (p[0] - nx, p[1] - ny)])


def braille(pen, bits):
    columns = (CENTRE - 120, CENTRE + 120)
    row_height = (TOP - BOTTOM) / 4
    rows = [TOP - row_height * (k + 0.5) for k in range(4)]
    dots = {0: (0, 0), 1: (0, 1), 2: (0, 2), 3: (1, 0), 4: (1, 1), 5: (1, 2), 6: (0, 3), 7: (1, 3)}
    for bit, (column, row) in dots.items():
        if bits & (1 << bit):
            circle(pen, columns[column], rows[row], 62, steps=16)


DRAW = {
    0x2500: lambda pen: horizontal(pen, -OVER, ADVANCE + OVER),
    0x2501: lambda pen: horizontal(pen, -OVER, ADVANCE + OVER, THICK),
    0x2502: lambda pen: vertical(pen, BOTTOM - OVER, TOP + OVER),
    0x251C: lambda pen: (vertical(pen, BOTTOM - OVER, TOP + OVER), horizontal(pen, CENTRE, ADVANCE + OVER)),
    0x2524: lambda pen: (vertical(pen, BOTTOM - OVER, TOP + OVER), horizontal(pen, -OVER, CENTRE)),
    0x256D: lambda pen: corner(pen, towards_right=True, towards_up=False),
    0x256E: lambda pen: corner(pen, towards_right=False, towards_up=False),
    0x256F: lambda pen: corner(pen, towards_right=False, towards_up=True),
    0x2570: lambda pen: corner(pen, towards_right=True, towards_up=True),
    0x2580: lambda pen: rect(pen, -2, MIDDLE, ADVANCE + 2, TOP + OVER),
    0x2584: lambda pen: rect(pen, -2, BOTTOM - OVER, ADVANCE + 2, MIDDLE),
    0x2588: lambda pen: rect(pen, -2, BOTTOM - OVER, ADVANCE + 2, TOP + OVER),
    0x25CF: lambda pen: circle(pen, CENTRE, MIDDLE, 175),
    0x2713: tick,
    0x2715: cross,
}
for code in range(0x2800, 0x2900):
    DRAW[code] = (lambda bits: lambda pen: braille(pen, bits))(code - 0x2800)


def main():
    names = [".notdef"] + [f"uni{code:04X}" for code in sorted(DRAW)]
    builder = FontBuilder(UPM, isTTF=True)
    builder.setupGlyphOrder(names)
    builder.setupCharacterMap({code: f"uni{code:04X}" for code in DRAW})
    glyphs = {}
    empty = TTGlyphPen(None)
    glyphs[".notdef"] = empty.glyph()
    for code, draw in DRAW.items():
        pen = TTGlyphPen(None)
        draw(pen)
        glyphs[f"uni{code:04X}"] = pen.glyph()
    builder.setupGlyf(glyphs)
    # A glyph's left side bearing must be its leftmost point, or renderers
    # move the outline over to meet it.
    bearings = {}
    for name, glyph in glyphs.items():
        xs = [x for x, _ in glyph.coordinates] if glyph.numberOfContours > 0 else [0]
        bearings[name] = round(min(xs))
    builder.setupHorizontalMetrics({name: (ADVANCE, bearings[name]) for name in names})
    builder.setupHorizontalHeader(ascent=ASCENT, descent=-DESCENT, lineGap=0)
    builder.setupNameTable({"familyName": "Firenook Terminal Symbols", "styleName": "Regular"})
    builder.setupOS2(version=4, sTypoAscender=ASCENT, sTypoDescender=-DESCENT, sTypoLineGap=0, usWinAscent=ASCENT, usWinDescent=DESCENT, fsSelection=0x80)
    builder.setupPost(isFixedPitch=1)
    builder.font.flavor = "woff2"
    builder.save(sys.argv[1])
    print(f"{len(DRAW)} glyphs, cell {BOTTOM:.0f} to {TOP:.0f}")


if __name__ == "__main__":
    main()
