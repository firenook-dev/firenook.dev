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
| Cobalt | `#1c53cf` | Everything that can be pressed; links are `#86adff` on night. The first screen's command takes a cobalt edge and glow beside the button |
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
tool output. Sentence case, tight tracking on headings (−0.035 to −0.045 em),
no eyebrows, no all-caps labels, no single accented word. Prose stays under
68 characters a line.

Seven sizes, each with one job (`--text-*` in `global.css`); nothing on the
marketing pages sets a size outside them:

| Token | Size | Job |
| --- | --- | --- |
| `h1` | 56 | The page's one headline (780) |
| `h2` | 40 | A section (720) |
| `num` | 32 | A measured number, in the flame (780) |
| `lg` | 19 | The sentence under a heading; card titles |
| `md` | 17 | Body, list titles, buttons |
| `sm` | 15 | Secondary text: cards, menus |
| `xs` | 13 | Small print: the note or caption under an artefact, labels, code in panels |

The terminal's screen is the one exception: its text is sized to fit its 108
columns, at most 13 px.

## Layout

75 rem wide at most, left aligned, 1.25 rem gutters on a phone. The first screen
is centred: the words over the terminal, and the measured numbers in a row
exactly as wide as the terminal window (58 rem), so all three share one
axis. Below it, sections are left aligned with the header, compact (about
5 rem of space above and below on a desktop), and each has the layout its
content needs, from three patterns:

- **Heading**: the heading, its sentence directly under it, then the
  artefact across the full width (the emulators, the measures, the console,
  the questions). Read down one left edge; never a heading and its sentence
  side by side, which sends the eye across the page and back. The sentence
  stays short (two or three lines); detail goes in the note under the
  artefact. The note is small print, like a figure's caption: smaller than
  the text inside the artefact, as wide as the artefact it describes, and
  two lines long at most. Words that belong
  to a control, such as what the selected console tab shows, sit under the
  control.
- **Split**: words and one command on one side, the artefact on the other,
  alternating sides (your data, the tests, the agent).
- **Bands**: every other section after the emulators sits on a slightly
  raised ground with hairlines, so the page reads as a sequence of rooms.

```
 [mark firenook]   Product ▾  Docs  Benchmarks  Blog          GitHub (Get started)

              (0.2.0-next.7  What’s new)
                 A drop-in replacement for the
                 Firebase Local Emulator Suite              (centred, 56)
                 Keep your firebase.json, SDKs…              (19)
              [$ npm install … ⧉]  (Get started)
        ┌─ 38× faster writes ─┬─ 9× less memory ─┬─ 0.56 s restart ─┐
        ├──────────── the terminal, recorded, 108 columns ──────────┤
        └──────────────────── on a bed of embers ────────────────────┘

 Change one word        heading; the diff | what stays
 Eight emulators        heading; cards of their weight, real output
 Measured               band; six measures, two rows of blocks each
 Your data stays        split; a stop and a start on one time scale
 Run your tests         band, split flipped; a timed emulators:exec run
 The console            heading; one tab bar, the console full width
 Agents                 band, split; the agent's tool calls, then the tools
 Questions              heading; two columns
 Switch in three steps  the flame, three numbered cards, the guide
```

The order follows a developer's questions: what it is, how hard switching
is, whether it covers their services, how much faster, what happens to their
data, whether their tests and CI run on it, and then the tools around it.
Every section ends in a command or a link that acts on it.

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
