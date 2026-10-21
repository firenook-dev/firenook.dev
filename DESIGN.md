# firenook.dev design

Who it is for: developers who run the Firebase emulators every day and have
waited on Java, watched the heap grow, or lost their data at a restart. What
the site has to do: show them that one word changes, prove the numbers, and
then be the documentation they keep open.

## The idea

Firenook's terminal draws its flame out of square blocks. The site is built
from the same blocks: the flame is the mark, the measured bars are rows of
blocks, the eight services have block icons, and the light behind the
terminal is a bed of embers. A nook is a small warm corner; the page is a dark
room, and the only warm light is the fire.

Everything shown is real. The terminal is Firenook's own screen, recorded
(`scripts/terminal/`). The orders, users, files, function calls and the
agent's tool calls are a run of the demo project, kept as Firenook answered
(`scripts/capture/`). The console pictures are the console. Every number
links to the run that measured it.

## Colour

| Name | Value | Job |
| --- | --- | --- |
| Night | `#141416` | The marketing pages' ground (the brand kit's night) |
| Cinder | `#0f0f11` | Insets: the terminal, code, the agent's session |
| Hearth | `#1b1b1f` | Raised surfaces: cards, panels |
| Ink | `#f4f2ee` | Text on night, a little warm |
| Smoke | `#a9a7ae` | Secondary text (7.6:1 on night) |
| Ash | `#8c8a92` | Small print only (5.4:1) |
| Cobalt | `#1c53cf` | Everything that can be pressed; links are `#86adff` on night |
| Flame to amber | `#f23818` to `#ff9800` | Light: the mark, lit blocks, the measured numbers, the glow. Never a button, never body text, never a state |

Vermilion alone marks where you are (the current page, the selected tab), as
in the console. Red and green appear only in terminal and agent output, where
they mean failed and succeeded. The docs follow the reader's light or dark
setting and use the same cobalt; the marketing pages are dark only.

## Blocks

One cell is a square with a gap of a fifth of its size between cells. Pixel
art (`src/lib/pixels.ts`) is drawn on that grid: the flame as Firenook's
terminal draws it, and a 12 by 12 icon for each service, in ink with the one
detail that matters lit. Measured bars are rows of cells on one scale: the
official emulator's in grey, Firenook's lit. Blocks are never decoration
without a meaning: a lit cell is the fire, or a measured amount.

## Type

Figtree (the wordmark's face, SIL OFL), variable weight, for everything; IBM
Plex Mono (the console's) only for code: commands, ports, paths, terminal and
tool output. The hero is set at 780, headings at 720, all tight (−0.035 to
−0.045 em), sentence case. The measured numbers are Figtree 760 in the flame
gradient, with the comparison beside them in words. No eyebrows, no all-caps
labels, no single accented word. Prose stays under 68 characters a line.

## Layout

72 rem wide at most, left aligned, 1.25 rem gutters on a phone. Each section
has the layout its content needs, not a shared template:

```
 [mark firenook]   Product ▾  Docs  Benchmarks  Blog          GitHub (Get started)

 A drop-in replacement for the
 Firebase Local Emulator Suite                     (two lines, 780)
 Keep your firebase.json…            38×    faster writes
 [$ npm install … ⧉] (Get started)   9×     less memory
                                     0.56 s to restart with your data
 ┌──────────────────── the terminal, recorded ─────────────────────┐
 └────────────────────── on a bed of embers ───────────────────────┘

 Change one word        the script's diff, large; what stays, four columns
 Eight services         cards of their weight, each with real output
 Measured               six measures, two bars of blocks each
 Your data stays        a stop and a start drawn on one time scale
 The console            tabs at the side of the picture
 Agents                 the agent's tool calls, as Firenook answered them
 Switch in three steps  three numbered columns
 Questions, then the flame and the install command once more
```

## Motion

One moment: the terminal plays once when the page opens: the word `firebase`
gives way to `firenook`, and the recorded start-up and calls follow at their
real speed. With reduced motion, or without JavaScript, the last frame shows
at once. Nothing else moves on its own. Menus, tabs and questions respond to
the person.

## What we avoid

Identical cards in a grid, soft grey shadows, decorative gradient washes,
eyebrow labels, `→` on links, meta strings joined with middle dots, monospace
for anything that is not code, logos of Google's products, entrance
animations, and any number or output that did not come from Firenook.
