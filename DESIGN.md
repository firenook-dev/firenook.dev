# firenook.dev design

Who it is for: developers who run the Firebase emulators every day and have
waited on Java, watched the heap grow, or lost their data at a restart. What
the site has to do: show them that one word changes, prove the numbers, and
then be the documentation they keep open.

## The idea

A nook is a small warm corner; the fire is the light in it. The page is a dark
room, and the only warm light comes from behind the terminal, the thing a
developer actually looks at. Everything shown is real: the terminal is
Firenook's own screen, recorded (`scripts/terminal/`); the console pictures
are the console; every number links to the run that measured it.

## Colour

| Name | Value | Job |
| --- | --- | --- |
| Night | `#141416` | The marketing pages' ground (the brand kit's night) |
| Hearth | `#1b1b1f` | Raised surfaces: the terminal, code, tables |
| Ink | `#f4f2ee` | Text on night, a little warm |
| Smoke | `#a9a7ae` | Secondary text (7.6:1 on night) |
| Cobalt | `#1c53cf` | Everything that can be pressed; links are `#86adff` on night |
| Flame and amber | `#f23818`, `#ff9800` | The logo, and light: the glow behind the terminal. Never a button, never text, never a state |

Vermilion marks only where you are (the current page in a navigation), as in
the console. Red and green appear only inside the terminal, where they mean
failed and succeeded. The docs follow the reader's light or dark setting and
use the same cobalt; the marketing pages are dark only.

## Type

Figtree (the wordmark's face, SIL OFL) for everything, variable weight; IBM
Plex Mono (the console's) only for things that are code: commands, ports,
paths, terminal output. A 1.25 scale on a 17 px body: 13.6 / 17 / 21.25 /
26.5 / 33 / 41.5 / 52 / 65. Headings are set tight (−0.03 em) at 620–660,
sentence case, no eyebrows above them, no all-caps labels, no single accented
word. Prose stays under 68 characters a line.

## Layout

One column, left aligned, 72 rem wide at most, 1.25 rem gutters on a phone.
Sections are separated by space and the occasional hairline, not boxes. A
section with an artefact puts the words on the left and the artefact on the
right on wide screens, stacked on a phone. Tables are tables. Numbered
markers appear only where the content is a sequence (Get started).

```
 [logo]                    Docs  Benchmarks  Compatibility  Blog  GitHub  (Get started)

 A drop-in replacement for the
 Firebase Local Emulator Suite            (headline, left, two lines)
 Keep your firebase.json, SDKs and ports…
 [$ npm install -D firenook  copy]   Read the docs

 ┌──────────────── terminal: firenook emulators:start, recorded ───────────────┐
 │  start-up card · ready · checkout 201 · sendReceipt · stripeWebhook 500     │
 └─────────────────────────────── warm light behind ───────────────────────────┘
```

## Motion

One moment: the terminal plays once when the page opens: the word `firebase`
gives way to `firenook`, and the recorded start-up and calls follow at their
real speed. With reduced motion, or without JavaScript, the last frame shows
at once. Nothing else moves on its own. Tabs and menus respond to the person.

## What we avoid

Big gradient numbers with small labels (the numbers are bars with their
units, beside the official emulator's), identical rounded cards with soft
shadows, eyebrow labels, `→` on links, meta strings joined with middle dots,
monospace for anything that is not code, decorative gradient washes, and
entrance animations on every section.
