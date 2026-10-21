# The home page's terminal

The terminal on the home page is Firenook's own screen, recorded from the
published package on `demo-shop/`, a project with four functions. Record it
again for a new release so the screen shows what people will see.

```sh
python3 -m venv .venv && .venv/bin/pip install pyte fonttools brotli
(cd demo-shop && npm install && cd functions && npm install)

# Set the release in demo-shop/package.json and src/lib/site.ts first.
.venv/bin/python3 record.py 108 34 /tmp/wide.json     # desktop
.venv/bin/python3 record.py 66 44 /tmp/narrow.json    # phones
.venv/bin/python3 build.py /tmp/wide.json ../../src/data/terminal-wide.json
.venv/bin/python3 build.py /tmp/narrow.json ../../src/data/terminal-narrow.json
rm -rf demo-shop/.firenook
```

`record.py` starts `npx firenook emulators:start` in a pseudo-terminal, sends
two checkouts and a webhook without a signature (which fails on purpose),
then presses `q`. `build.py` replays the bytes in a terminal emulator, keeps a
frame at the end of each of Firenook's screen updates, shortens long pauses,
and stores only the rows that change.

`symbols.py` draws the small font the terminal takes its box drawing,
blocks, ticks and spinner from, on IBM Plex Mono's grid. Run it again only if
the terminal's line height changes:

```sh
.venv/bin/python3 symbols.py ../../src/assets/fonts/terminal-symbols.woff2
```
