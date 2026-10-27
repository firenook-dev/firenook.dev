# The home page's terminal

The terminal on the home page is Firenook's own screen, recorded from the
published package on `demo-shop/`, a project with four functions and a shop's
data: 1,207,800 Firestore documents, 64,000 Auth users and 5,400 Storage
files, kept with `--keep-data`. Record it again for a new release so the
screen shows what people will see.

```sh
python3 -m venv .venv && .venv/bin/pip install pyte fonttools brotli
(cd demo-shop && npm install && cd functions && npm install)

# Set the release in demo-shop/package.json and src/lib/site.ts first.
node seed.mjs                                         # the data, 1.5 GB, 80 s
.venv/bin/python3 record.py 108 39 /tmp/wide.json     # desktop
.venv/bin/python3 record.py 66 44 /tmp/narrow.json    # phones
.venv/bin/python3 build.py /tmp/wide.json ../../src/data/terminal-wide.json
.venv/bin/python3 build.py /tmp/narrow.json ../../src/data/terminal-narrow.json
rm -rf demo-shop/.firenook
```

The heights matter: below about 39 rows at 108 columns, Firenook drops the
blank lines between the parts of its screen to fit, and the page would show
a squeezed screen no one sees in a real terminal.

`seed.mjs` starts Firestore, Auth and Storage with `--keep-data`, writes the
shop through the Admin SDK (the same data every time) and stops, which saves
it. `record.py` then starts `npx firenook emulators:start --keep-data` in a
pseudo-terminal, so the screen picks the data up as on any later day, sends
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

## The README's GIFs

The [repository's README](https://github.com/firenook-dev/firenook) shows
two GIFs in a window like this page's: `emulators:start`, made from the wide
recording above with the official command changed first, and `firenook init`
making a new project. `gif.py` draws each frame with Chrome; it needs
Playwright in the same `.venv`, ImageMagick and gifsicle. Make them again for
each release, with the Node the screen should show first on `PATH`:

```sh
.venv/bin/pip install playwright    # uses Google Chrome, or: .venv/bin/playwright install chromium

.venv/bin/python3 gif.py ../../src/data/terminal-wide.json /tmp/terminal.gif --title demo-shop \
  --command "npx firebase emulators:start" --swap firebase=firenook --append " --keep-data"

# init needs a folder that does not exist yet; shop becomes the project demo-shop.
.venv/bin/python3 record-init.py 108 39 ~/shop 0.2.0 /tmp/init.json
.venv/bin/python3 build.py /tmp/init.json /tmp/init-frames.json 2
.venv/bin/python3 gif.py /tmp/init-frames.json /tmp/init.gif --title "~/shop" \
  --command "npx firenook init" --longest-wait 2.5
rm -rf ~/shop
```

`build.py`'s third argument keeps pauses up to 2 seconds, so the screen of
choices can be read; `--longest-wait` plays the package install faster while
its timer still shows the real time. In the Firenook repository, copy
`terminal.gif` to `docs/assets/` and `support/`, and `init.gif` to
`docs/assets/`. The npm README loads `terminal.gif` from GitHub, so it
changes without a publish.
